
// dynamic progress indicator for pillbug
// it's a bug running across the screen

import { DateTime } from "luxon";

// frame rate
const targetFrameRate = 60;
const interval = 1000/targetFrameRate;
const physSecondSteps = 1/(targetFrameRate * 1000);
let scaleFactor = 2;
let yOffset = 8 * scaleFactor;

// begin spritesheet data
const spritesheetData = {
 "frames": {
   "pillbug 0.aseprite": {
    "frame": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 100
   },
   "pillbug 1.aseprite": {
    "frame": { "x": 32, "y": 0, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 100
   },
   "pillbug 2.aseprite": {
    "frame": { "x": 64, "y": 0, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 100
   },
   "pillbug 3.aseprite": {
    "frame": { "x": 96, "y": 0, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 100
   },
   "pillbug 4.aseprite": {
    "frame": { "x": 0, "y": 32, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 100
   },
   "pillbug 5.aseprite": {
    "frame": { "x": 32, "y": 32, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 100
   },
   "pillbug 6.aseprite": {
    "frame": { "x": 32, "y": 32, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 100
   },
   "pillbug 7.aseprite": {
    "frame": { "x": 64, "y": 32, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 69
   },
   "pillbug 8.aseprite": {
    "frame": { "x": 96, "y": 32, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 69
   },
   "pillbug 9.aseprite": {
    "frame": { "x": 0, "y": 64, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 69
   },
   "pillbug 10.aseprite": {
    "frame": { "x": 32, "y": 64, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 69
   },
   "pillbug 11.aseprite": {
    "frame": { "x": 64, "y": 64, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 42
   },
   "pillbug 12.aseprite": {
    "frame": { "x": 96, "y": 64, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 42
   },
   "pillbug 13.aseprite": {
    "frame": { "x": 0, "y": 96, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 42
   },
   "pillbug 14.aseprite": {
    "frame": { "x": 32, "y": 96, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 42
   },
   "pillbug 15.aseprite": {
    "frame": { "x": 64, "y": 96, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 42
   },
   "pillbug 16.aseprite": {
    "frame": { "x": 96, "y": 96, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 42
   },
   "pillbug 17.aseprite": {
    "frame": { "x": 32, "y": 32, "w": 32, "h": 32 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "sourceSize": { "w": 32, "h": 32 },
    "duration": 100
   }
 },
 "meta": {
  "app": "http://www.aseprite.org/",
  "version": "1.x-dev",
  "image": "pillbug.png",
  "format": "I8",
  "size": { "w": 128, "h": 128 },
  "scale": "1",
  "frameTags": [
   { "name": "Running", "from": 0, "to": 5, "direction": "forward", "color": "#000000ff" },
   { "name": "Curl", "from": 8, "to": 16, "direction": "forward", "color": "#000000ff" },
   { "name": "Curl Loop", "from": 11, "to": 16, "direction": "forward", "color": "#000000ff" }
  ],
  "layers": [
   { "name": "legges", "opacity": 255, "blendMode": "normal" },
   { "name": "legges Copy", "opacity": 255, "blendMode": "normal" },
   { "name": "Group 1" },
   { "name": "s5", "group": "Group 1", "opacity": 255, "blendMode": "normal" },
   { "name": "s4", "group": "Group 1", "opacity": 255, "blendMode": "normal" },
   { "name": "s3", "group": "Group 1", "opacity": 255, "blendMode": "normal" },
   { "name": "s2", "group": "Group 1", "opacity": 255, "blendMode": "normal" },
   { "name": "s1", "group": "Group 1", "opacity": 255, "blendMode": "normal" },
   { "name": "head", "group": "Group 1", "opacity": 255, "blendMode": "normal" }
  ],
  "slices": [
  ]
 }
};
// end spritesheet data
// Frame tags are used as state names.
function getFrameTagData(name: string) {
 for (const frameTag of Object.values(spritesheetData["meta"]["frameTags"])){
  if (name === frameTag["name"]){
   return frameTag;
  }
 }
 throw new Error(`Failed to find frame tag ${name}`);
}

class PillbugAnimationStateMachine{
 constructor() {
  this.frameTagQueue = [];
  this.frame = 0;
  this._frameTag = null;
  this.newImpulse = null; // yuck, if this is not falsy the physics will pick it up and add it to the list of impulses... the dangers of not thinking through your abstractions before writing it

  this.runSpeed = new Vec2(400, 0);
  this.ballSpeed = new Vec2(3600, 0);
 }
 get frameTag() { return this._frameTag; }
 set frameTag(t) {
  let changed = this._frameTag !== t && this._frameTag;
  this._frameTag = t;
  if (changed){
   this.onFrameTagChange(t);
  }
 }

 nextFrameTag(prev: string){
  const queued = this.frameTagQueue.pop();
  if (queued) {
   return queued;
  }
  if (prev === "Running") {
   return "Running";
  }
  if (prev === "Curl" || prev === "Curl Loop") {
   return "Curl Loop";
  }
  return "Running";
 }
 onFrameTagChange(tag: string, last: undefined){
  if (tag === "Curl"){
   // pop into the air when curling
   this.newImpulse = new FixedImpulse(0, -6000, 50);
  }
  else if (tag === "Running"){
   // pop into the air when curling
   this.newImpulse = new FixedImpulse(0, -3000, 50);
  }
 }
 speed(tag: string) {
  if (tag === "Running") {
   return 1;
  }
  if (tag === "Curl") {
   return 2;
  }
  return 3;
 }
 forceStep(dt: any, physics: { pos: { y: number; }; }){
  if (physics.pos.y < 0){
   return new Vec2(0, 0); // no speed contribution when off the ground
  }
  if (this.frameTag === "Running") {
   return this.runSpeed;
  }
  if (this.frameTag === "Curl") {
   return this.ballSpeed;
  }
   return this.ballSpeed;
 }
}
class Vec2 {
 constructor(x: number, y: number){
  this.x=x;
  this.y=y;
 }
 add(otherVec: { x: any; y: any; }){
  return new Vec2(this.x + otherVec.x, this.y + otherVec.y);
 }
 multScalar(m: number){
  return new Vec2(this.x * m, this.y * m);
 }
}

class Impulse {
 constructor(x: any, y: any, durationMs: any){
  this.x = x;
  this.y = y;
  this.durationMs = durationMs;
 }
 step(stepMs: any){ // return a delta to apply directly to velocity, or null to discard the impulse.
  return 1; // todo: this is nothing atm
 }
}

class FixedImpulse {
 constructor(x: number, y: number, durationMs: number){
  // x and y are units per sec
  this.x = x;
  this.y = y;
  this.durationMs = durationMs;
  this.remainingTimeMs = durationMs;
 }
 forceStep(dt: number, physics: any){ // return a delta to apply directly to velocity, or null to discard the impulse.
  if (this.remainingTimeMs <= 0){
   return null;
  }
  if (dt > this.remainingTimeMs){
   const f = this.remainingTimeMs / dt;
   this.remainingTimeMs = 0;
   return new Vec2(this.x * f, this.y * f)
  }
  this.remainingTimeMs = this.remainingTimeMs - dt;
  return new Vec2(this.x, this.y);
 }
}

class Gravity {
 constructor(g: number){
  this.g = g;
  this.gravityForce = new Vec2(0, g);

 }
 forceStep(dt: any, physics: { pos: { y: number; }; }){ // return a delta to apply directly to velocity, or null to discard the impulse.
  if (physics.pos.y >= 0){
   return new Vec2(0, 0);
  }
  return this.gravityForce;
 }
}
class SimplePhysics {
 // this is not a good or correct physics engine lol.
 // acceptance criteria: the bug walks nice
 constructor(x: any, y: any, animationStateMachine: any) {
  this.pos = new Vec2(x, y);
  this.animationStateMachine = animationStateMachine;
  this.velocity = new Vec2(20000.0, 0.0);
  this.xDamping = 0.3;
  this.forces = [
//    new FixedImpulse(500.0, 0.0, 500),
//    new FixedImpulse(500.0, 0.0, 200),
   new FixedImpulse(500.0, 0.0, 100),
   new Gravity(1300)
  ]; // classes with a step method which accept a stepMs and return a delta to velocity, or return null to be removed from the list.
 }
 step (stepMs: number){
  if (this.animationStateMachine.newImpulse){ // yucky handoff between poorly thought out components
   this.forces.push(this.animationStateMachine.newImpulse);
   this.animationStateMachine.newImpulse = null;
  }
  // console.log(`phys step: ${JSON.stringify(this)}`)
  // this.velocity.x = this.velocity.x * (stepMs * physSecondSteps * this.xDamping)
  this.velocity.x = this.velocity.x * 0.95;
  
   
  const forcesToRemove = [];
  if (this.pos.y > 0){
   this.pos.y = 0;
   this.velocity.y = 0.0;
  }

  for (let i = 0; i < this.forces.length; i++){
   const force = this.forces[i];
   const forceRet = force.forceStep(stepMs, this);
   if (forceRet === null){
    forcesToRemove.push(i);
   }
   // only apply non-falsy values. i haven't decided if i'll do anything with undefined yet but will just leave some wiggle room
   if (forceRet){
    this.velocity = this.velocity.add(forceRet);
   }
  }
  while (forcesToRemove.length > 0){
   const i = forcesToRemove.pop();
   this.forces.splice(i, 1);
  }
  this.pos = this.pos.add(this.velocity.multScalar(stepMs * physSecondSteps))
 }
}

class Sprite {
 constructor(x: number, y: number, animationStateMachine: PillbugAnimationStateMachine, spritesheetImg: HTMLElement | null, canvas: HTMLElement | null){
  this.x = x;
  this.y = y;
  this.remove = false;
  this.physics = new SimplePhysics(x, y, animationStateMachine);
  this.scale = scaleFactor;
  // inclusive
  this.frameMin = 0;
  // inclusive
  this.frameMax = 0;
  this.frameData = undefined;
  this.timeInFrameMs = 0;
  this.animationStateMachine = animationStateMachine;
  this.physics.forces.push(animationStateMachine);
  this.switchToFrameTag(this.animationStateMachine.nextFrameTag(undefined)); // initializes frametag and switches to frame, updating several fields
  this.initialWidth = (this.frameData.frame.w) * this.scale;
  this.xOffset = -this.initialWidth;
  this.loopXPos = canvas.width + this.initialWidth;
  this.spritesheetImg = spritesheetImg;
 }
 get frame() {
  return this.animationStateMachine.frame;
 }
 set frame(f) {
  this.animationStateMachine.frame=f;
 }
 get frameTag() {
  return this.animationStateMachine.frameTag;
 }
 set frameTag(f) {
  this.animationStateMachine.frameTag=f;
 }

 switchToFrameTag(newFrameTag: any){
  const frameTagData = getFrameTagData(newFrameTag);
  this.frameTag = newFrameTag;
  this.frameMin = frameTagData["from"]
  this.frameMax = frameTagData["to"]
  this.switchToFrame(this.frameMin);
 }
 switchToFrame(newFrameIndex: string | number){
  this.frame = newFrameIndex;
  this.frameData = frameData[newFrameIndex];
  this.timeInFrameMs = 0;
 }
 step(stepMs: any){
  this.physics.step(stepMs);
  // this.x = (this.x + (this.animationStateMachine.speed(this.frameTag) * this.scale)) % (this.loopXPos); // todo ... something better
  this.x = Math.round(this.physics.pos.x);
  this.y = Math.round(this.physics.pos.y) + yOffset;

  // tight coupling which i don't really feel like thinking much harder about atm
  if (this.x >= this.loopXPos){
    this.x = 0;
    if (this.frameTag === "Curl Loop"){
        this.remove = true;
    }
  }

  if (this.timeInFrameMs < this.frameData["duration"]){
   // Don't advance to the next frame yet.
   this.timeInFrameMs += stepMs;
   return;
  }

  // We are going to advance frames. If at the end of a tag, we need to figure out what the next tag is.
  if (this.frame === this.frameMax || this.frameTag === undefined){
   const nextFrameTag = this.animationStateMachine.nextFrameTag(this.frameTag);
   // This will update the current frame for us
   this.switchToFrameTag(nextFrameTag);
   return;
  }
  // If we're not at the end of a tag, just add 1 :)
  this.switchToFrame(this.frame + 1);
 }
 draw(ctx: { drawImage: (arg0: any, arg1: any, arg2: any, arg3: any, arg4: any, arg5: any, arg6: any, arg7: number, arg8: number) => void; }, stepMs: any){
  this.step(stepMs);
  const f = this.frameData;
  // This works when the frames are uniform size and drawn in the same spot :/
  // ctx.clearRect(f.frame.x, f.frame.y, f.frame.w, f.frame.h);
  // ctx.clearRect(0,0,400,200);// assumes there is only one sprite.
  ctx.drawImage(this.spritesheetImg, /*sx*/ f.frame.x, /*sy*/ f.frame.y, /*sWidth*/ f.frame.w, /*sHeight*/ f.frame.h, /*dx*/this.x + this.xOffset, /*dy*/this.y, /*dWidth*/f.frame.w * this.scale, /*dHeight*/f.frame.h * this.scale);
  
 }
}

var spritesheetImg = document.getElementById("progressSheet");
var spritesheetImgLoaded = new Promise((resolve) => spritesheetImg.addEventListener("load", resolve));
var frameData = Object.values(spritesheetData.frames)

var currentFrame = 0;
var firstFrame = 0;
var xOffset = 0;
var canvas = document.getElementById("progressCanvas") as HTMLCanvasElement;
const updateWidth = () => {
    const windowWidth = window.innerWidth;
    const canvasWidth = canvas.width;
    if (windowWidth != canvasWidth){
        canvas.width = windowWidth;
    }
}
let windowResizeDebounceTimeout = undefined;
const windowResizeDebounceDelay = 500;
addEventListener("resize", (ev) => {
    clearTimeout(windowResizeDebounceTimeout);
    windowResizeDebounceTimeout = setTimeout(updateWidth, windowResizeDebounceDelay);
})
updateWidth();


yOffset = canvas.height - (32 * scaleFactor);

const sprites: Sprite[] = [];
var lastSpriteAdded: DateTime<true> | null = null;

function drawFrame() {
  const ctx = canvas.getContext("2d")
  if (ctx === null) {
    console.log("no context")
    return false;
  }
  if (sprites.length === 0){
   ctx.clearRect(0,0,canvas.width,canvas.height);
   return false;
  } 
  ctx.imageSmoothingEnabled = false;
  const f = frameData[currentFrame];
  // This works when the frames are uniform size and drawn in the same spot :/
  // ctx.clearRect(f.frame.x, f.frame.y, f.frame.w, f.frame.h);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const removable = [];
  for (let i = 0; i < sprites.length; i++){
    const s = sprites[i];
    s.draw(ctx, interval);
    if (s.remove){
        removable.push(i);
    }
  }
  while (removable.length > 0){
   const i = removable.pop();
   sprites.splice(i, 1);
  }
  return true;
}

class PausableLoop {
    _active: boolean;
    cancelled: boolean;
    loopInterval: number | undefined;
    func: () => boolean;
 constructor(loopInterval: number, func: () => boolean){
  this._active = false;
  this.active = false;
  this.cancelled = false;
  this.loopInterval = loopInterval;
  this.func = func;
  
 }

 get active() { return this._active; }
 set active(x) {
    if (this._active !== x){
        this._active = x;
        if (x) {
            canvas.classList.add("activeProgressAnimation");
        }
        else {
            canvas.classList.remove("activeProgressAnimation");
        }
    }
 }
 exec(){
  if (this.cancelled){
   this.active = false;
   return;
  }
  this.active = true;

  if (this.func()){
   setTimeout(() => this.exec(), this.loopInterval);
  }
  else {
   this.active = false;
  }
 }
 activate(){
  if (this.active){return;}
  this.cancelled = false;
  this.active = true;
  this.exec();
 }
 cancel(){
  this.cancelled = true;
 }
}

const drawLoop = new PausableLoop(interval, drawFrame);

const addPillbugSprite = () => {
 const pillbugSprite = new Sprite(0, 0, new PillbugAnimationStateMachine(), spritesheetImg, canvas)
 sprites.push(pillbugSprite);
 drawLoop.activate();
}

// addPillbugSprite();

async function start() {
  console.log("entered start");
  await spritesheetImgLoaded;
  console.log("spritesheet img loaded");
  drawLoop.activate();
}

const queueFrameTagForAll = (ft: any) => {
 for (const s of sprites){
  s.animationStateMachine.frameTagQueue.push(ft);
 }
}
const nudgeBug = (imp: any) => {
 for (const s of sprites){
  s.physics.forces.push(imp);
 }
}
const deBug = () => {
 sprites.pop();
}


const activeHandles = [];

export class ProgressAnimationHandle {
    constructor(kind: string){
        this.kind = kind;
        if (!kind){
            return;
        }
        if (!document.documentElement.classList.contains("setting-progressAnimation")){
            // Feature is off.
            return;
        }
        console.log("new progress handle created");
        activeHandles.push(this);
        const diff = lastSpriteAdded?.diffNow();
        // only create the sprite if it isn't too soon
        const waitTime = -15;
        if (diff === undefined || diff.as('milliseconds') <= waitTime){
            lastSpriteAdded = DateTime.now();
            this.animationStateMachine = new PillbugAnimationStateMachine();
            this.sprite = new Sprite(0, 0, this.animationStateMachine, spritesheetImg, canvas)
            sprites.push(this.sprite);
            drawLoop.activate();
        }
        else {
            console.log(`but it was too soon ${diff}`);
        }
    }
    finish(){
        // Upon finishing a request, curl up and roll away.
        this.animationStateMachine?.frameTagQueue.push("Curl");
    }
    [Symbol.dispose](){
        this.finish();
    }
}

/*
var curlButton= document.getElementById("curlButton")
curlButton.addEventListener('click', () => queueFrameTagForAll("Curl"));
var runButton= document.getElementById("runButton")
runButton.addEventListener('click', () => queueFrameTagForAll("Running"));
var runButton= document.getElementById("bugButton")
runButton.addEventListener('click', () => addPillbugSprite());
var runButton= document.getElementById("nudgeButton")
runButton.addEventListener('click', () => nudgeBug(new FixedImpulse(0, -2000.0, 100)));
var runButton= document.getElementById("deBugButton")
runButton.addEventListener('click', () => deBug());

start()

*/
