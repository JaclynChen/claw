// Final Project Draft - Spring 2024

// Inspired and using code from:
// https://makeabilitylab.github.io/physcomp/communication/p5js-serial
// https://makeabilitylab.github.io/physcomp/communication/ml5js-serial.html#building-our-first-ml5js--arduino-app-nosetracker
// By Jon E. Froehlich
// @jonfroehlich
// http://makeabilitylab.io/
// 

// This code was also iterated on, inspired by, and partially sourced using
// ChatGPT 3.5 https://chatgpt.com

let iframe = null;
let scoreDisplay = null;
let task = null;

let screenWidth = window.screen.width;

// Game state
const scoreStub = "Current funds: $";
let score;
let lastPoseUp;

// Web serial options
let pHtmlMsg;
let serialOptions = { baudRate: 115200 };
let serial;

// Webcamera input options
const videoWidth = 640;
const videoHeight = 480;

let video;
let constraints = {
  video: {
    mandatory: {
      minWidth: 640,
      minHeight: 480
    },
    optional: [{ maxFrameRate: 5 }]
  },
  audio: false
};

// PoseNet variables
let poseNet;
let currentPoses;
let poseNetModelReady = false;
const poseNetOptions = {
  architecture: 'MobileNetV1',
  imageScaleFactor: 0.3,
  outputStride: 16,
  flipHorizontal: false,
  minConfidence: 0.5,
  maxPoseDetections: 5,
  scoreThreshold: 0.8,
  nmsRadius: 20,
  detectionType: 'single',
  inputResolution: 513,
  multiplier: 0.75,
  quantBytes: 2,
};

function setup() {
  // Create the iframe element
  iframe = document.createElement("iframe");
  // Set the source of the iframe
  iframe.src = "https://jaclynchen.github.io/claw/index.html";
  // Set other attributes of the iframe
  let siteWidth = screenWidth - videoWidth;
  let frameWidth = (siteWidth - 20) + "px";  // subtract 20 to account for any iframe scroll bar
  iframe.style.width = frameWidth;
  // iframe.style.width = "800px";
  iframe.style.height = "95vh";
  iframe.style.border = "none";
  // Append the iframe to the container
  // document.body.appendChild(iframe);
  document.getElementById("infosite").appendChild(iframe);

  // Create webcam canvas
  let canvas = createCanvas(videoWidth, videoHeight);
  canvas.position(siteWidth - 20, 0);

  // Add score counter
  task = document.createElement("p");
  task.textContent = "Task: Do jumping jacks";
  // document.body.appendChild(task);
  document.getElementById("text").appendChild(task);

  scoreDisplay = document.createElement("p");
  scoreDisplay.textContent = "Score: 0";
  // document.body.appendChild(scoreDisplay);
  document.getElementById("text").appendChild(scoreDisplay);

  // Setup Web Serial using serial.js
  serial = new Serial();
  serial.on(SerialEvents.CONNECTION_OPENED, onSerialConnectionOpened);
  serial.on(SerialEvents.CONNECTION_CLOSED, onSerialConnectionClosed);
  serial.on(SerialEvents.DATA_RECEIVED, onSerialDataReceived);
  serial.on(SerialEvents.ERROR_OCCURRED, onSerialErrorOccurred);

  // If we have previously approved ports, attempt to connect with them
  serial.autoConnectAndOpenPreviouslyApprovedPort(serialOptions);

  // Add in a lil <p> element to provide messages. This is optional
  // pHtmlMsg = createP("Hullo");

  // Create webcam image and put on page
  video = createCapture(constraints);
  video.hide();

  // PoseNet init
  poseNet = ml5.poseNet(video, poseNetOptions, onPoseNetModelReady);
  poseNet.on('pose', onPoseDetected);

  // Game state init
  score = 0;
  lastPoseUp = false;

  // funds checking for serial
  var intervalID = window.setInterval(sendSerial, 30000);
}

function sendSerial() {
  if(score > 0) {
    if(serial.isOpen()) {
      serial.writeLine(1);
      score -= 1;
    }
  }
}

function draw() {
  background(100);

  // Center the video on the canvas
  let imgX = (width - videoWidth) / 2;
  let imgY = (height - videoHeight) / 2;
  image(video, imgX, imgY, videoWidth, videoHeight);
  // console.log(video);

  if (!poseNetModelReady) {
    background(100);
    push();
    textSize(32);
    textAlign(CENTER);
    fill(255);
    noStroke();
    text("Waiting for PoseNet model to load...", width / 2, height / 2);
    pop();
    return;
  }

  if (currentPoses) {
    let currentTime = millis();
    for (let i = 0; i < currentPoses.length; i++) {
      let pose = currentPoses[i];
      drawPose(pose, i);

      // Check hand positions
      if (lastPoseUp) {
        if (isPoseDown(pose.pose) && currentTime - lastStateChangeTime > minStateChangeInterval) {
          lastPoseUp = false;
          score++;
          lastStateChangeTime = currentTime;
          console.log("Jumping jack detected. Score: " + score);
          // If serial is open, transmit score
          if(serial.isOpen()){
            serial.writeLine(1); 
            console.log("sent serial 1")
          }
        }
      } else {
        if (isPoseUp(pose.pose) && currentTime - lastStateChangeTime > minStateChangeInterval) {
          lastPoseUp = true;
          lastStateChangeTime = currentTime;
          console.log("Pose up detected");
        }
      }
    }
  }

  // Task information
  task.innerText = "Do jumping jacks to raise funds! 1 jumping jack is equivalent to $10k of fundraising (15 seconds of claw time). Funds will be subtracted as they get used by the clean-up crew (the claw).";

  // Funding information
  scoreDisplay.innerText = scoreStub + (score * 10000);

  // let imageData = video.get(0,0,videoWidth, videoHeight);
  // let imageData = video.pixels;
  // let image=video.get();
  video.loadPixels();
  let imageData = video.pixels;
  // console.log(imageData);
  const code = jsQR(imageData, width, height,);

  if (code) {
    console.log("Found QR code", code);
    if(code.data.includes("jaclynchen")) {
      iframe.src=code.data;
    }
  }
}


function onPoseNetModelReady() {
  poseNetModelReady = true;
}

function onPoseDetected(poses) {
  currentPoses = poses;
}

function drawPose(pose, poseIndex) {
  // Draw skeleton
  const skeletonColor = color(255, 255, 255, 128);
  stroke(skeletonColor); 
  strokeWeight(2);
  const skeleton = pose.skeleton;
  for (let j = 0; j < skeleton.length; j += 1) {
    const partA = skeleton[j][0];
    const partB = skeleton[j][1];
    line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
  }
  // Color configurations
  const kpFillColor = color(255, 255, 255, 200);
  const textColor = color(255, 255, 255, 230);
  const kpOutlineColor = color(0, 0, 0, 150);
  strokeWeight(1);

  // Keypoint configurations
  const keypoints = pose.pose.keypoints;
  const kpSize = 10;
  const kpTextMargin = 2;

  for (let j = 0; j < keypoints.length; j += 1) {
    const kp = keypoints[j];
      // draw keypoint
      fill(kpFillColor); 
      noStroke();
      circle(kp.position.x, kp.position.y, kpSize);
  
      // draw keypoint outline
      noFill();
      stroke(kpOutlineColor);
      circle(kp.position.x, kp.position.y, kpSize);

      // KEYPOINT DEBUG LABELS
      fill(textColor);
      textAlign(LEFT);
      let xText = kp.position.x + kpSize + kpTextMargin;
      let yText = kp.position.y;
      if(kp.part.startsWith("right")){
        textAlign(RIGHT);
        xText = kp.position.x - (kpSize + kpTextMargin);
      }
      textStyle(BOLD);
      text(kp.part, xText, yText);
      // textStyle(NORMAL);
      // yText += textSize();
      // text(int(kp.position.x) + ", " + int(kp.position.y), xText, yText);
    }
    noStroke();
    fill(textColor);
    textStyle(BOLD);
    textAlign(LEFT, BOTTOM);
    textStyle(NORMAL);
    // pHtmlMsg.html("Confidence: " + nf(pose.pose.score, 0, 1));
}

// Variables to store smoothed positions
let smoothedKeypoints = {};

function smoothKeypoint(part, currentPos, smoothingFactor = 0.2) {
  if (!smoothedKeypoints[part]) {
    smoothedKeypoints[part] = currentPos;
  }
  smoothedKeypoints[part].x = smoothingFactor * currentPos.x + (1 - smoothingFactor) * smoothedKeypoints[part].x;
  smoothedKeypoints[part].y = smoothingFactor * currentPos.y + (1 - smoothingFactor) * smoothedKeypoints[part].y;
  return smoothedKeypoints[part];
}

// functions to detect jumping jacks
const shouldersAndHands = ["leftShoulder", "rightShoulder", "leftWrist", "rightWrist"];
const poseChangeThreshold = 20; // Adjust this value as needed
let lastStateChangeTime = 0;
const minStateChangeInterval = 500; // Minimum time between state changes in milliseconds

function isPoseUp(pose) {
  let keypoints = pose.keypoints;
  let lShoulder = keypoints.find(k => k.part === "leftShoulder");
  let rShoulder = keypoints.find(k => k.part === "rightShoulder");
  let lHand = keypoints.find(k => k.part === "leftWrist");
  let rHand = keypoints.find(k => k.part === "rightWrist");

  if (!lHand || !rHand || !lShoulder || !rShoulder) return false;

  lShoulder = smoothKeypoint("leftShoulder", lShoulder.position);
  rShoulder = smoothKeypoint("rightShoulder", rShoulder.position);
  lHand = smoothKeypoint("leftWrist", lHand.position);
  rHand = smoothKeypoint("rightWrist", rHand.position);

  let lHandDelta = lHand.y - lShoulder.y;
  let rHandDelta = rHand.y - rShoulder.y;

  // console.log(`isPoseUp - lHandDelta: ${lHandDelta}, rHandDelta: ${rHandDelta}`);

  return (lHandDelta < -poseChangeThreshold || rHandDelta < -poseChangeThreshold);
}

function isPoseDown(pose) {
  let keypoints = pose.keypoints;
  let lShoulder = keypoints.find(k => k.part === "leftShoulder");
  let rShoulder = keypoints.find(k => k.part === "rightShoulder");
  let lHand = keypoints.find(k => k.part === "leftWrist");
  let rHand = keypoints.find(k => k.part === "rightWrist");

  if (!lHand || !rHand || !lShoulder || !rShoulder) return false;

  lShoulder = smoothKeypoint("leftShoulder", lShoulder.position);
  rShoulder = smoothKeypoint("rightShoulder", rShoulder.position);
  lHand = smoothKeypoint("leftWrist", lHand.position);
  rHand = smoothKeypoint("rightWrist", rHand.position);

  let lHandDelta = lHand.y - lShoulder.y;
  let rHandDelta = rHand.y - rShoulder.y;

  // console.log(`isPoseDown - lHandDelta: ${lHandDelta}, rHandDelta: ${rHandDelta}`);

  return (lHandDelta > poseChangeThreshold && rHandDelta > poseChangeThreshold);
}

// see if the pose containts the parts in array keypointsToCheck
function hasKeypoints(pose, keypointsToCheck) {
  if (!pose || !pose.keypoints) {
    return false;
  }
  return keypointsToCheck.every(keypoint => 
      pose.keypoints.some(k => k.part === keypoint)
  );
}


/**
 * Callback function by serial.js when there is an error on web serial
 * 
 * @param {} eventSender 
 */
 function onSerialErrorOccurred(eventSender, error) {
  console.log("onSerialErrorOccurred", error);
  // pHtmlMsg.html(error);
}

/**
 * Callback function by serial.js when web serial connection is opened
 * 
 * @param {} eventSender 
 */
function onSerialConnectionOpened(eventSender) {
  console.log("onSerialConnectionOpened");
  // pHtmlMsg.html("Serial connection opened successfully");
}

/**
 * Callback function by serial.js when web serial connection is closed
 * 
 * @param {} eventSender 
 */
function onSerialConnectionClosed(eventSender) {
  console.log("onSerialConnectionClosed");
  // pHtmlMsg.html("onSerialConnectionClosed");
}

/**
 * Callback function serial.js when new web serial data is received
 * 
 * @param {*} eventSender 
 * @param {String} newData new data received over serial
 */
function onSerialDataReceived(eventSender, newData) {
  console.log("onSerialDataReceived", newData);
  // pHtmlMsg.html("onSerialDataReceived: " + newData);
}

/**
 * Called automatically by the browser through p5.js when mouse clicked
 */
function mouseClicked() {
  if (!serial.isOpen()) {
    serial.connectAndOpen(null, serialOptions);
  }
}