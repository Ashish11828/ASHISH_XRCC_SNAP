import WorldCameraFinderProvider from "../SpectaclesInteractionKit/Providers/CameraProvider/WorldCameraFinderProvider"
import { Interactable } from '../SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable';
import { InteractorEvent } from '../SpectaclesInteractionKit/Core/Interactor/InteractorEvent';
import { SIK } from '../SpectaclesInteractionKit/SIK';
@component
export class NewScript extends BaseScriptComponent {
    @input
    camera!: Camera;

    @input
    currentScreenText!: Text;

    @input
    note1!: SceneObject;

    @input
    beepAudioComponent!: AudioComponent

    @input
    beepSFX!: AudioTrackAsset

    
    @input
    bodyIndicator!: SceneObject;

    @input
    cprTarget!: SceneObject;

    

    @input
    hands!: SceneObject;

    
    @input
    smoothingFactor: number = 0.05; 

    @input
    goodIndicator!: SceneObject;

    @input
    neutralIndicator!: SceneObject;

    @input
    badIndicator!: SceneObject;

    @input
    okayIndicator!: SceneObject;

    @input
    test!: Text;

    @input
    speedText!: Text;
    @input
    visibilityTimeout: number = 2
    @input
    window: number = 2

    @input
    countText!: Text;

    private smoothedPosition: vec3 = new vec3(0, 0, 0);
   
    private timeSinceLastTrigger: number = 0;
    private interval: number = 0.50;
    private startPos!: vec3;
    private endPos!: vec3;
    private elapsed = 0;
    private isMoving = true;
    private startTime = 0;
    private targetLocator: TargetLocator;
    private lineOfMovement: vec3;
    private initDistance: number;
    private lastInView = 0
    private inRange: boolean = false;
    private rangeMin: number = 0;
    private rangeMax: number = 0;
    
    private peaks: number[]
    private timestamps: number[]
    private prev_count: number

    private prevDistance:number;
    private forceDiff:number;

    private distances: number[]

    private tempo: number;
    private speed: number;
    
    

    private distanceRecordFrequency: Array<number> = [];
    

    // Variables for the movement
    private amplitude = 3;  // Maximum distance it will move up and down (compression depth)
    private currentTime = 0;  

    onAwake() {
        this.createEvent("OnStartEvent").bind(() => {
          this.onStart();
        });
        
        this.createEvent("UpdateEvent").bind(() => this.onUpdate());
        // Get starting position
        this.startPos = this.note1.getTransform().getLocalPosition();
    
        // Move 22 units left on the X axis (from right to left)
        this.endPos = this.startPos.add(new vec3(-18, 0, 0));
        this.targetLocator = new TargetLocator(this.cprTarget)
    }

    onStart(){
      this.distances = []
      this.timestamps = []
      this.peaks = []
      this.prev_count = 0
      this.lineOfMovement = this.targetLocator.getCameraToTargetVector().normalize();
      this.initDistance = this.targetLocator.getDistanceToTarget();
    }

    onUpdate(){

        if (Number(this.currentScreenText.text) != 4) return;

        if(Number(this.countText.text) > 30){
          return;
        }


        if(!this.hands.enabled && this.startTime <= 8){
          this.hands.enabled = true;
        }
        this.filter();
        if(this.startTime==0){
          this.prevDistance = this.getDistance3D(this.camera.getTransform().getWorldPosition(), this.cprTarget.getTransform().getWorldPosition());
        }
        else{
          var current = this.getDistance3D(this.camera.getTransform().getWorldPosition(), this.cprTarget.getTransform().getWorldPosition());
          this.forceDiff = current-this.prevDistance;
        }

        
        if(this.targetLocator.targetIsVisible()) {
          this.lastInView = 0;
      }
        
        //ball tempo
        if (!this.isMoving) {
            this.beepAudioComponent.play(1)
            this.note1.getTransform().setLocalPosition(this.startPos);
            this.isMoving = true;
            return;
          }
          
          this.elapsed += getDeltaTime();
      
          let t = this.elapsed / this.interval;
          if (t >= 1) {
            t = 1;

            this.isMoving = false;
            this.elapsed = 0;
            if(this.startTime > 10){
              this.countText.text = (Number(this.countText.text)+1).toString();
            }
            
          }
          
          
          if(this.isWithinMultiple(this.startTime, this.interval, 0.125)){
            if(!this.inRange && this.startTime  > 0){
              this.rangeMax = this.rangeMin = this.forceDiff;
              this.inRange = true;
            }
            else{
              this.rangeMax = Math.max(this.rangeMax, this.forceDiff);
              this.rangeMin = Math.min(this.rangeMin, this.forceDiff);
            }
            
          }
          else{
            
            this.inRange = false;
            var sub = this.rangeMax - this.rangeMin;
            this.test.text = sub.toString();
            if(this.startTime>7){if( sub <=6.5 && sub >=3.5){
              this.test.text = "";
            }
            else if(sub < 3.5){
              this.test.text = "Too little force"
            }
            else{
              this.test.text = "Too much force"
            }
            // print(sub);}
          }

          
          
            
          }

          this.distances.concat(this.forceDiff);


          if(this.tempo > 4){
            var prior = 0
            var switchCount = 0;
            for(let i=0; i<this.distances.length-1; i++){
              var diff = this.distances[i]-this.distances[i+1];
              if(i==0){
                prior = diff;
              }
              else{
                if(prior * diff < 0 && diff > 0.5){
                  switchCount += 0;
                }
              }
            }
            this.tempo = 0;
            this.distances = [];
            
          }
          this.tempo += getDeltaTime();

          if(this.startTime > 8 && this.startTime <12 ){
            this.speedText.text = "Too slow";
          }
          else{
            this.speedText.text = ""
          }



          // var delta = this.initDistance - projDist
          // this.distances.push(delta)
          // this.timestamps.push(getTime())
          // if (this.timestamps[0] < getTime() - this.window) {
          //     this.distances.shift()
          //     this.timestamps.shift()
          //     for(let j = 0; j < this.peaks.length; j++)
          //         this.peaks[j] -= 1
          // }

          // if(this.peaks.length > 0 && this.peaks[0] <= 0)
          //     this.peaks.shift()
          
          

          // for (let i = Math.max(1, this.distances.length-3); i < this.distances.length - 1; i++) {
          //     var j = this.peaks.length > 0 ? this.peaks.indexOf(i) : -1
          //     if((this.distances[i-1] < this.distances[i] && (Math.abs(this.distances[i-1]-this.distances[i]) > 0.5)) && (this.distances[i] > this.distances[i+1]) && Math.abs(this.distances[i+1]-this.distances[i]) > 0.5) {
          //         if(j === -1)
          //             this.peaks.push(i)
          //     }
              
          // }

          // var pushCount = this.peaks.length
          // if(this.currentTime > 7){
          //   if(Math.abs(pushCount - this.window * 2) === 1) {
          //     if(this.prev_count === this.window * 2) {
          //         this.speedText.text = ""
          //     }
          //     else if (pushCount > this.window * 2)
          //       this.speedText.text = "Too fast"
          //         else
          //       this.speedText.text = "Too slow"
              
          // } 
          // else if(pushCount - this.window * 2 === 0) {
          //   this.speedText.text = ""

          // }
          // else {
          //     if (pushCount > this.window * 2)
          //       this.speedText.text = "Too fast"

          //     else   
          //     this.speedText.text = "Too slow"

          // }
          // }
          // this.prev_count = pushCount
          //   // Optional: ease with smoothstep
      
          const currentPos = vec3.lerp(this.startPos, this.endPos, t);
          this.note1.getTransform().setLocalPosition(currentPos);

          if(this.startTime > 6){ 
            if(this.speedText.text=="" && this.test.text==""){
              this.goodIndicator.enabled = true;
              this.neutralIndicator.enabled = false;
              this.badIndicator.enabled = false;
              this.okayIndicator.enabled = false;
            }else if(this.speedText.text=="" || this.test.text==""){
              this.goodIndicator.enabled = false;
              this.neutralIndicator.enabled = false;
              this.badIndicator.enabled = false;
              this.okayIndicator.enabled = true;
            }else if(this.speedText.text!="" && this.test.text!=""){
              this.goodIndicator.enabled = false;
              this.neutralIndicator.enabled = false;
              this.badIndicator.enabled = true;
              this.okayIndicator.enabled = false;
            }
            else{
              this.goodIndicator.enabled = false;
              this.neutralIndicator.enabled = true;
              this.badIndicator.enabled = false;
              this.okayIndicator.enabled = false;
            }
          }
          
          this.startTime += getDeltaTime();
          

          
    }

    public getCameraToTargetVector() {
      return this.cprTarget.getTransform()
      .getWorldPosition()
      .sub(this.camera.getTransform().getWorldPosition())
  }


  isWithinMultiple(n: number, x: number, tolerance: number): boolean {
    var remainder = n % x;
    return (remainder <= tolerance) || (Math.abs(remainder - x) <= tolerance);
}

  getDistance3D(p1: vec3, p2: vec3): number {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    var dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

   getPlaneNormal(p1: vec3, p2: vec3, p3: vec3): vec3 {
    var v1 = p2.sub(p1);
    var v2 = p3.sub(p1);
    var normal = v1.cross(v2);
    return normal.normalize();
}

    

  filter(): void{
  
    const followPos = this.bodyIndicator.getTransform().getWorldPosition();

    // Linear interpolation between old smoothed position and new follow position
    this.smoothedPosition = vec3.lerp(this.smoothedPosition, followPos, this.smoothingFactor);
    this.cprTarget.getTransform().setWorldPosition(this.smoothedPosition);

     //-------------------------------------------------------------------------
    

    // this.hands.getTransform().setWorldPosition(this.cprTarget.getTransform().getWorldPosition().add(new vec3(0, offsetY, 0)));
    // Increment the elapsed time
    if(this.startTime <= 8){this.currentTime += getDeltaTime();

    // Calculate the phase of the sine wave to align with the time interval `t`
    var phase = (this.currentTime % this.interval) / this.interval * Math.PI * 2;  // Loop every `intervalTime` seconds
    
    // Calculate the offset (position change) using the sine wave
    var offsetY = this.amplitude * Math.sin(phase);  // Moves between -amplitude and +amplitude
    
    // Update the position of the object (we move only on the Y-axis)
    this.hands.getTransform().setWorldPosition(this.cprTarget.getTransform().getWorldPosition().add(new vec3(0, offsetY + 18, 0)));  
    }
    else{
      this.hands.enabled = false;
    }
  
  }

    
    
}

export default class TargetLocator {
    private cameraProvider = WorldCameraFinderProvider.getInstance()
    private camera: Camera
    private cameraTransform: Transform
    private targetTransform: Transform

    constructor(target: SceneObject) {
        this.targetTransform = target.getTransform()
        this.camera = this.cameraProvider.getComponent()
        this.cameraTransform = this.cameraProvider.getTransform()
    }
    
    // Returns a unit vector aligned with the line from the target's center to the camera for X/Y-axes rotation.
    public getCameraToTargetVector() {
        return this.targetTransform
        .getWorldPosition()
        .sub(this.cameraTransform.getWorldPosition())
    }

    // Return is camera is looking at target
    public targetIsVisible() {
        var targetPos = this.targetTransform.getWorldPosition()
        return this.camera.isSphereVisible(targetPos, 1)
    }

    public getCameraPos() {
        return this.cameraTransform.getWorldPosition()
    }

    // Return absolute distance from target's center to camera
    public getDistanceToTarget() {
        return this.targetTransform.getWorldPosition().distance(this.cameraTransform.getWorldPosition())
    }
}
