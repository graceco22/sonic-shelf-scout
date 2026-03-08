import { useCallback, useEffect, useRef, useState } from "react";

export type ArduinoAckCommand = "START" | "STOP" | "PING";

export type ParsedArduinoMessage =
  | { type: "ack"; command: "START" | "STOP" }
  | { type: "state"; value: "RUNNING" | "IDLE" }
  | { type: "obstacle"; distanceCm: number }
  | { type: "pong" }
  | { type: "unknown"; raw: string };

type PendingWaiter = {
  command: ArduinoAckCommand;
  resolve: (value: boolean) => void;
  reject: (reason?: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

type ArduinoSerialPort = {
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
};

type ArduinoSerial = {
  requestPort: () => Promise<ArduinoSerialPort>;
};

export const parseArduinoLine = (rawLine: string): ParsedArduinoMessage => {
  const line = rawLine.trim();

  if (line === "ACK START") return { type: "ack", command: "START" };
  if (line === "ACK STOP") return { type: "ack", command: "STOP" };
  if (line === "PONG") return { type: "pong" };
  if (line === "STATE RUNNING") return { type: "state", value: "RUNNING" };
  if (line === "STATE IDLE") return { type: "state", value: "IDLE" };

  const obstacleMatch = line.match(/^EVENT\s+OBSTACLE\s+(\d+)$/);
  if (obstacleMatch) {
    return { type: "obstacle", distanceCm: Number(obstacleMatch[1]) };
  }

  return { type: "unknown", raw: line };
};

const messageMatchesCommand = (message: ParsedArduinoMessage, command: ArduinoAckCommand) => {
  if (command === "PING") {
    return message.type === "pong";
  }

  if (command === "START") {
    return (
      (message.type === "ack" && message.command === "START") ||
      (message.type === "state" && message.value === "RUNNING")
    );
  }

  return (
    (message.type === "ack" && message.command === "STOP") ||
    (message.type === "state" && message.value === "IDLE")
  );
};

export const createAckTracker = () => {
  const pending: PendingWaiter[] = [];

  const clearWaiter = (waiter: PendingWaiter) => {
    clearTimeout(waiter.timeoutId);
  };

  return {
    waitForAck(command: ArduinoAckCommand, timeoutMs = 1500) {
      return new Promise<boolean>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          const index = pending.findIndex((item) => item.timeoutId === timeoutId);
          if (index >= 0) {
            pending.splice(index, 1);
          }
          reject(new Error(`${command} acknowledgement timeout`));
        }, timeoutMs);

        pending.push({ command, resolve, reject, timeoutId });
      });
    },

    resolveFromMessage(message: ParsedArduinoMessage) {
      const index = pending.findIndex((item) => messageMatchesCommand(message, item.command));
      if (index < 0) {
        return false;
      }

      const waiter = pending[index];
      pending.splice(index, 1);
      clearWaiter(waiter);
      waiter.resolve(true);
      return true;
    },

    rejectForCommand(command: ArduinoAckCommand, reason: unknown) {
      const index = pending.findIndex((item) => item.command === command);
      if (index < 0) {
        return false;
      }

      const waiter = pending[index];
      pending.splice(index, 1);
      clearWaiter(waiter);
      waiter.reject(reason);
      return true;
    },

    rejectAll(reason: unknown) {
      while (pending.length) {
        const waiter = pending.shift();
        if (!waiter) continue;
        clearWaiter(waiter);
        waiter.reject(reason);
      }
    },

    pendingCount() {
      return pending.length;
    },
  };
};

type UseArduinoSerialResult = {
  isSupported: boolean;
  isConnected: boolean;
  isRunning: boolean;
  isObstacleBlocked: boolean;
  lastDistanceCm: number | null;
  error: string | null;
  isCommandPending: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  sendStart: () => Promise<boolean>;
  sendStop: () => Promise<boolean>;
  ping: () => Promise<boolean>;
};

const OBSTACLE_BLOCK_TTL_MS = 750;

export const useArduinoSerial = (): UseArduinoSerialResult => {
  const isSupported = typeof navigator !== "undefined" && "serial" in navigator;

  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isObstacleBlocked, setIsObstacleBlocked] = useState(false);
  const [lastDistanceCm, setLastDistanceCm] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCommandPending, setIsCommandPending] = useState(false);

  const portRef = useRef<ArduinoSerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const readLoopActiveRef = useRef(false);
  const mountedRef = useRef(true);
  const obstacleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ackTrackerRef = useRef(createAckTracker());

  const safeSet = useCallback((setter: () => void) => {
    if (!mountedRef.current) return;
    setter();
  }, []);

  const clearObstacleTimer = useCallback(() => {
    if (obstacleTimerRef.current) {
      clearTimeout(obstacleTimerRef.current);
      obstacleTimerRef.current = null;
    }
  }, []);

  const scheduleObstacleClear = useCallback(() => {
    clearObstacleTimer();
    obstacleTimerRef.current = setTimeout(() => {
      safeSet(() => setIsObstacleBlocked(false));
    }, OBSTACLE_BLOCK_TTL_MS);
  }, [clearObstacleTimer, safeSet]);

  const writeCommand = useCallback(async (command: ArduinoAckCommand) => {
    const port = portRef.current;
    if (!port?.writable) {
      throw new Error("Arduino serial port is not writable");
    }

    const writer = port.writable.getWriter();
    try {
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(`${command}\n`));
    } finally {
      writer.releaseLock();
    }
  }, []);

  const applyMessage = useCallback(
    (message: ParsedArduinoMessage) => {
      ackTrackerRef.current.resolveFromMessage(message);

      if (message.type === "ack") {
        safeSet(() => {
          if (message.command === "START") {
            setIsRunning(true);
            setIsObstacleBlocked(false);
          } else {
            setIsRunning(false);
            setIsObstacleBlocked(false);
          }
        });
        clearObstacleTimer();
        return;
      }

      if (message.type === "state") {
        if (message.value === "RUNNING") {
          safeSet(() => setIsRunning(true));
          return;
        }

        safeSet(() => {
          setIsRunning(false);
          setIsObstacleBlocked(false);
        });
        clearObstacleTimer();
        return;
      }

      if (message.type === "obstacle") {
        safeSet(() => {
          setIsObstacleBlocked(true);
          setLastDistanceCm(message.distanceCm);
        });
        scheduleObstacleClear();
      }
    },
    [clearObstacleTimer, safeSet, scheduleObstacleClear]
  );

  const runReadLoop = useCallback(
    async (port: ArduinoSerialPort) => {
      if (!port.readable) {
        safeSet(() => setError("Arduino serial port is not readable"));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      readLoopActiveRef.current = true;

      const reader = port.readable.getReader();
      readerRef.current = reader;

      try {
        while (readLoopActiveRef.current) {
          const { value, done } = await reader.read();
          if (done) break;

          if (!value) continue;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            applyMessage(parseArduinoLine(line));
          }
        }
      } catch (loopError) {
        if (readLoopActiveRef.current) {
          const message = loopError instanceof Error ? loopError.message : "Serial read error";
          safeSet(() => setError(message));
        }
      } finally {
        reader.releaseLock();
        readerRef.current = null;
      }
    },
    [applyMessage, safeSet]
  );

  const sendCommandAndWait = useCallback(
    async (command: ArduinoAckCommand, timeoutMs = 1500) => {
      if (!portRef.current) {
        safeSet(() => setError("Connect to Arduino first"));
        return false;
      }

      safeSet(() => {
        setError(null);
        setIsCommandPending(true);
      });

      const pendingAck = ackTrackerRef.current.waitForAck(command, timeoutMs);

      try {
        await writeCommand(command);
      } catch (writeError) {
        ackTrackerRef.current.rejectForCommand(command, writeError);
        const message = writeError instanceof Error ? writeError.message : "Failed to send command";
        safeSet(() => {
          setError(message);
          setIsCommandPending(false);
        });
        return false;
      }

      try {
        await pendingAck;
        safeSet(() => {
          setError(null);
          setIsCommandPending(false);
        });
        return true;
      } catch (ackError) {
        const message = ackError instanceof Error ? ackError.message : "Acknowledgement failed";
        safeSet(() => {
          setError(message);
          setIsCommandPending(false);
        });
        return false;
      }
    },
    [safeSet, writeCommand]
  );

  const connect = useCallback(async () => {
    if (!isSupported) {
      safeSet(() => setError("Web Serial is not supported in this browser"));
      return false;
    }

    if (portRef.current) {
      return true;
    }

    try {
      const serial = (navigator as Navigator & { serial?: ArduinoSerial }).serial;
      if (!serial) {
        safeSet(() => setError("Web Serial is unavailable"));
        return false;
      }

      const port = await serial.requestPort();
      await port.open({ baudRate: 9600 });

      portRef.current = port;
      safeSet(() => {
        setIsConnected(true);
        setError(null);
      });

      void runReadLoop(port);
      return true;
    } catch (connectionError) {
      const message = connectionError instanceof Error ? connectionError.message : "Failed to connect";
      safeSet(() => {
        setError(message);
        setIsConnected(false);
      });
      portRef.current = null;
      return false;
    }
  }, [isSupported, runReadLoop, safeSet]);

  const disconnect = useCallback(async () => {
    const port = portRef.current;

    if (!port) {
      safeSet(() => {
        setIsConnected(false);
        setIsRunning(false);
        setIsObstacleBlocked(false);
      });
      return;
    }

    try {
      if (isRunning) {
        try {
          await writeCommand("STOP");
        } catch {
          // Ignore best-effort stop failures during disconnect.
        }
      }

      readLoopActiveRef.current = false;
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch {
          // Ignore cancel failures on disconnect.
        }
      }

      await port.close();
    } catch (disconnectError) {
      const message = disconnectError instanceof Error ? disconnectError.message : "Failed to disconnect";
      safeSet(() => setError(message));
    } finally {
      portRef.current = null;
      ackTrackerRef.current.rejectAll(new Error("Serial connection closed"));
      clearObstacleTimer();
      safeSet(() => {
        setIsConnected(false);
        setIsRunning(false);
        setIsObstacleBlocked(false);
        setIsCommandPending(false);
      });
    }
  }, [clearObstacleTimer, isRunning, safeSet, writeCommand]);

  const sendStart = useCallback(() => sendCommandAndWait("START"), [sendCommandAndWait]);
  const sendStop = useCallback(() => sendCommandAndWait("STOP"), [sendCommandAndWait]);
  const ping = useCallback(() => sendCommandAndWait("PING"), [sendCommandAndWait]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearObstacleTimer();
      ackTrackerRef.current.rejectAll(new Error("Component unmounted"));

      readLoopActiveRef.current = false;
      if (readerRef.current) {
        void readerRef.current.cancel();
      }

      const port = portRef.current;
      portRef.current = null;
      if (port) {
        void port.close();
      }
    };
  }, [clearObstacleTimer]);

  return {
    isSupported,
    isConnected,
    isRunning,
    isObstacleBlocked,
    lastDistanceCm,
    error,
    isCommandPending,
    connect,
    disconnect,
    sendStart,
    sendStop,
    ping,
  };
};

export default useArduinoSerial;
