// Define driver pins
#define EN_PIN1     4
#define DIR_PIN1    2
#define STEP_PIN1   3
#define EN_PIN2     7
#define DIR_PIN2    5
#define STEP_PIN2   6

// Define joystick pins
#define JOY_X A0
#define JOY_Y A1

// Define constants
#define STEPS_PER_REV 400     // Full steps per revolution
#define MICROSTEPS 16         // Microstepping setting
#define TOTAL_MICROSTEPS_PER_REV (STEPS_PER_REV * MICROSTEPS)

#define FIXED_STEPS 5         // Fixed steps per movement
#define MIN_SPEED 25          // Minimum delay between steps in microseconds
#define MAX_SPEED 150        // Maximum delay

void setup() {

  // Set pin modes for drivers
  pinMode(EN_PIN1, OUTPUT);
  pinMode(DIR_PIN1, OUTPUT);
  pinMode(STEP_PIN1, OUTPUT);
  pinMode(EN_PIN2, OUTPUT);
  pinMode(DIR_PIN2, OUTPUT);
  pinMode(STEP_PIN2, OUTPUT);

  pinMode(8, INPUT_PULLUP);

  // Set pin modes for joystick
  pinMode(JOY_X, INPUT);
  pinMode(JOY_Y, INPUT);
  
  // Enable driver
  digitalWrite(EN_PIN1, LOW);
  digitalWrite(EN_PIN2, LOW);
}

// Move both motors at the same speed
void moveMotors(int dir1, int dir2, int steps, int delayMicros) {
  digitalWrite(DIR_PIN1, dir1);
  digitalWrite(DIR_PIN2, dir2);
  
  for (int i = 0; i < steps; i++) {
    digitalWrite(STEP_PIN1, HIGH);
    digitalWrite(STEP_PIN2, HIGH);
    delayMicroseconds(5);
    digitalWrite(STEP_PIN1, LOW);
    digitalWrite(STEP_PIN2, LOW);
    delayMicroseconds(delayMicros);
  }
}

// Move at 45 degree angle
void moveLeftMotor(int dir, int steps, int delayMicros) {
  digitalWrite(DIR_PIN1, dir);
  for (int i = 0; i < steps; i++) {
    digitalWrite(STEP_PIN1, HIGH);
    delayMicroseconds(5);
    digitalWrite(STEP_PIN1, LOW);
    delayMicroseconds(delayMicros);
  }
}

// Move in the other 45 degree angle
void moveRightMotor(int dir, int steps, int delayMicros) {
  digitalWrite(DIR_PIN2, dir);
  for (int i = 0; i < steps; i++) {
    digitalWrite(STEP_PIN2, HIGH);
    delayMicroseconds(5);
    digitalWrite(STEP_PIN2, LOW);
    delayMicroseconds(delayMicros);
  }
}

void moveX(int speed) {
  moveMotors(HIGH, HIGH, FIXED_STEPS, speed);
}

void moveNegX(int speed) {
  moveMotors(LOW, LOW, FIXED_STEPS, speed);
}

void moveY(int speed) {
  moveMotors(LOW, HIGH, FIXED_STEPS, speed);
}

void moveNegY(int speed) {
  moveMotors(HIGH, LOW, FIXED_STEPS, speed);
}

void moveXY(int speed) {
  moveRightMotor(HIGH, FIXED_STEPS, speed);
}

void moveNegXY(int speed) {
  moveRightMotor(LOW, FIXED_STEPS, speed);
}

void moveXNegY(int speed) {
  moveLeftMotor(HIGH, FIXED_STEPS, speed);
}

void moveNegXNegY(int speed) {
  moveLeftMotor(LOW, FIXED_STEPS, speed);
}

void loop() {
  
  // For other arduino to disable movement of machine by pulling pin low
  if (digitalRead(8) == LOW) {
    return;
  }
  int joyX = analogRead(JOY_X);
  int joyY = analogRead(JOY_Y);

  int absJoy = max(abs(joyX - 512), abs(joyY - 512));

  int speed = map(absJoy, 0, 512, MAX_SPEED, MIN_SPEED);

  // Determine direction and move
  if (joyX > 600 && joyY > 600) {
    moveNegXY(speed); // Down-right
  } else if (joyX > 600 && joyY < 400) {
    moveNegXNegY(speed); // Up-right
  } else if (joyX < 400 && joyY > 600) {
    moveXNegY(speed); // Down-left
  } else if (joyX < 400 && joyY < 400) {
    moveXY(speed); // Up-left
  } else if (joyX > 600) {
    moveNegX(speed); // Right
  } else if (joyX < 400) {
    moveX(speed); // Left
  } else if (joyY > 600) {
    moveNegY(speed); // Down
  } else if (joyY < 400) {
    moveY(speed); // Up
  }
}
