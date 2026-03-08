#include <Stepper.h>

// ---- Motor setup (28BYJ-48: 2048 steps = 1 full revolution) ----
const int STEPS_PER_REV = 2048;

Stepper frontMotor(STEPS_PER_REV, 4, 5, 6, 7); // pins reordered for proper sequencing
Stepper backMotor(STEPS_PER_REV, 9, 8, 10, 12);

// Ultrasonic sensor pins
const int trigPin = 2;
const int echoPin = 3;

// Stop distance in cm
const int stopDistance = 20;

bool isRunning = false;
unsigned long lastObstacleReportMs = 0;
String serialBuffer = "";

long getDistanceCm() {
  // Clear trig
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  // Send 10 microsecond pulse
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Read echo time
  long duration = pulseIn(echoPin, HIGH, 30000);

  // If no echo
  if (duration == 0) {
    return 999;
  }

  // Convert to cm
  long distance = duration * 0.034 / 2;
  return distance;
}

void processCommand(String command) {
  command.trim();
  command.toUpperCase();

  if (command == "START") {
    isRunning = true;
    Serial.println("ACK START");
    Serial.println("STATE RUNNING");
    return;
  }

  if (command == "STOP") {
    isRunning = false;
    Serial.println("ACK STOP");
    Serial.println("STATE IDLE");
    return;
  }

  if (command == "PING") {
    Serial.println("PONG");
  }
}

void handleSerialInput() {
  while (Serial.available() > 0) {
    char input = (char)Serial.read();

    if (input == '\n' || input == '\r') {
      if (serialBuffer.length() > 0) {
        processCommand(serialBuffer);
        serialBuffer = "";
      }
      continue;
    }

    serialBuffer += input;
  }
}

void setup() {
  frontMotor.setSpeed(10);
  backMotor.setSpeed(10);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.begin(9600);
  Serial.println("STATE IDLE");
}

void loop() {
  handleSerialInput();

  if (!isRunning) {
    delay(20);
    return;
  }

  long distance = getDistanceCm();

  if (distance <= stopDistance) {
    unsigned long now = millis();
    if (now - lastObstacleReportMs >= 250) {
      Serial.print("EVENT OBSTACLE ");
      Serial.println(distance);
      lastObstacleReportMs = now;
    }

    delay(50);
    return;
  }

  // Move forward while no obstacle is detected.
  frontMotor.step(5);
  backMotor.step(-5);
}
