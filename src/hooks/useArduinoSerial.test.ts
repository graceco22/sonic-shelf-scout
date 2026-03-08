import { describe, expect, it } from "vitest";
import { createAckTracker, parseArduinoLine } from "@/hooks/useArduinoSerial";

describe("parseArduinoLine", () => {
  it("parses ACK and state lines", () => {
    expect(parseArduinoLine("ACK START")).toEqual({ type: "ack", command: "START" });
    expect(parseArduinoLine("ACK STOP")).toEqual({ type: "ack", command: "STOP" });
    expect(parseArduinoLine("STATE RUNNING")).toEqual({ type: "state", value: "RUNNING" });
    expect(parseArduinoLine("STATE IDLE")).toEqual({ type: "state", value: "IDLE" });
  });

  it("parses obstacle and pong lines", () => {
    expect(parseArduinoLine("EVENT OBSTACLE 18")).toEqual({ type: "obstacle", distanceCm: 18 });
    expect(parseArduinoLine("PONG")).toEqual({ type: "pong" });
  });

  it("falls back to unknown for unsupported lines", () => {
    expect(parseArduinoLine("EVENT UNKNOWN")).toEqual({ type: "unknown", raw: "EVENT UNKNOWN" });
  });
});

describe("createAckTracker command flow", () => {
  it("does not resolve START before ACK START", async () => {
    const tracker = createAckTracker();
    const startPromise = tracker.waitForAck("START");

    let settled = false;
    startPromise.then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    tracker.resolveFromMessage(parseArduinoLine("ACK START"));
    await expect(startPromise).resolves.toBe(true);
  });

  it("does not resolve STOP before ACK STOP", async () => {
    const tracker = createAckTracker();
    const stopPromise = tracker.waitForAck("STOP");

    let settled = false;
    stopPromise.then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    tracker.resolveFromMessage(parseArduinoLine("ACK STOP"));
    await expect(stopPromise).resolves.toBe(true);
  });
});
