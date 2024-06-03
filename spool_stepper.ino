// Clawing Catastrophe Final Project - CSE493f
// With stepper motor code inspired by https://docs.arduino.cc/tutorials/generic/unipolar-stepper-motor/
// June 2024

#define BUTTON_PIN 2

// pin 1 to 4
int motorPins[] = {8, 9, 10, 11};
int count = 0;
int count2 = 0;
int delayTime = 2;
int val = 0;

// arcade button input
int last_button_state = HIGH;  // Use HIGH to match INPUT_PULLUP
int button_state;
unsigned long lastDebounceTime = 0;  // the last time the output pin was toggled
unsigned long debounceDelay = 50;    // the debounce time; increase if the output

// timing variables
unsigned long lastActivationTime = 0;
unsigned long activationInterval = 11500;
bool motorActive = false;
unsigned long motorStartTime = 0;

void setup() {
  for (count = 0; count < 4; count++) {
    pinMode(motorPins[count], OUTPUT);
  }
  Serial.begin(9600);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void moveForward() {
  if ((count2 == 0) || (count2 == 1)) {
    count2 = 16;
  }
  count2 >>= 1;
  for (count = 3; count >= 0; count--) {
    digitalWrite(motorPins[count], count2 >> count & 0x01);
  }
  delay(delayTime);
}

void moveBackward() {
  if ((count2 == 0) || (count2 == 1)) {
    count2 = 16;
  }
  count2 >>= 1;
  for (count = 3; count >= 0; count--) {
    digitalWrite(motorPins[3 - count], count2 >> count & 0x01);
  }
  delay(delayTime);
}

void loop() {
  // poll button
  int button_reading = digitalRead(BUTTON_PIN);
  if (button_reading != last_button_state) {
    // reset the debouncing timer
    lastDebounceTime = millis();
  }
  if ((millis() - lastDebounceTime) > debounceDelay) {
    // whatever the reading is at, it's been there for longer than the debounce
    // delay, so take it as the actual current state:

    // if the button state has changed:
    if (button_reading != button_state) {
      button_state = button_reading;

      // if the button state is LOW and 15 seconds have passed since the last activation
      if (button_state == LOW && (millis() - lastActivationTime) >= activationInterval) {
        motorActive = true;
        motorStartTime = millis();
        lastActivationTime = millis();
        Serial.println("Motor activated");
      }
    }
  }

  last_button_state = button_reading;

  if (motorActive) {
    unsigned long elapsedTime = millis() - motorStartTime;

    if (elapsedTime <= 5000) {
      moveForward();
    } else if (elapsedTime <= 5500) {
      // Pause for 1 second
      delay(500);
    } else if (elapsedTime <= 11500) {
      moveBackward();
    } else {
      motorActive = false;
      Serial.println("Motor deactivated");
    }
  }

  Serial.print("Button state: ");
  Serial.println(button_state);
  Serial.print("Motor active: ");
  Serial.println(motorActive);
}
