import WorldCameraFinderProvider from "../SpectaclesInteractionKit/Providers/CameraProvider/WorldCameraFinderProvider"
import { Interactable } from '../SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable';
import { InteractorEvent } from '../SpectaclesInteractionKit/Core/Interactor/InteractorEvent';
import { SIK } from '../SpectaclesInteractionKit/SIK';



@component
export class ChestMarker extends BaseScriptComponent {
    private targetLocator: TargetLocator
    private lineOfMovement: vec3
    private initDistance: number
    private lastInView = 0

    private distances: number[]
    private peaks: number[]
    private timestamps: number[]
    private prev_count: number
    
    @input
    scaleFactor: number
    @input
    minDeltaDistance: number = 4
    @input
    maxDeltaDistance: number = 6
    @input
    warningBox: SceneObject
    @input
    warningText: Text
    @input
    visibilityTimeout: number = 2
    @input
    window: number = 2

    // run this at every period
    public initPeriod(): void{
        this.lineOfMovement = this.targetLocator.getCameraToTargetVector().normalize()
        this.initDistance = this.targetLocator.getDistanceToTarget()
    }


    /*
    // Determines if sequence of distance fall in valid threshold
    private validateDelta(values: number[]): boolean {
        const isAboveMin = (element) => element >= this.minDeltaDistance
        const isAboveMax = (element) => element >= this.maxDeltaDistance
        var passed = values.filter(isAboveMin)
        if (passed.some(isAboveMax)) {
            print("pressed too hard")
            return false
        }
        else if (passed.length < (this.aboveMinWidth / getDeltaTime())) {
            print("press harder")
            return false
        }
        return true
    }
    */
    onAwake() {
        this.targetLocator = new TargetLocator(this.getSceneObject())
        this.createEvent('OnStartEvent').bind(() => {
          this.onStart();
        });
      }

    onStart(): void {
        this.distances = []
        this.timestamps = []
        this.peaks = []
        this.prev_count = 0

        this.initPeriod();
        let interactionManager = SIK.InteractionManager
        let interactable = interactionManager.getInteractableBySceneObject(
            this.sceneObject
        )

        let onTriggerStartCallback = (event: InteractorEvent) => {
            // this.initPeriod();
            /*
            print(
                `input type: ${event.interactor.inputType} at position: ${event.interactor.targetHitInfo.hit.position}`
            );
            */
        };
    
        interactable.onInteractorTriggerStart(onTriggerStartCallback);

        this.createEvent("UpdateEvent").bind(() => {
            this.onUpdate();
        })
    }

    onUpdate() {
        // make sure user to looking at the target as much as possible
        if(this.targetLocator.targetIsVisible()) {
            this.lastInView = 0
            this.warningBox.enabled = false
        }
        else {
            if (this.lastInView == 0) {
                this.lastInView = getTime()
            }
            else {
                if (getTime() - this.lastInView > this.visibilityTimeout) {
                    this.initPeriod()
                    this.warningText.text = "Look at the target"
                    this.warningBox.enabled = true
                }
            }
        }

        var projDist = this.targetLocator.getCameraToTargetVector().dot(this.lineOfMovement)
        var delta = this.initDistance - projDist

        // this.distances.push(Math.sin(4 * Math.PI * getTime()) + 1)
        this.distances.push(delta)
        this.timestamps.push(getTime())
        if (this.timestamps[0] < getTime() - this.window) {
            this.distances.shift()
            this.timestamps.shift()
            for(let j = 0; j < this.peaks.length; j++)
                this.peaks[j] -= 1
        }

        if(this.peaks[0] <= 0)
            this.peaks.shift()
        
        for (let i = Math.max(1, this.distances.length-3); i < this.distances.length - 1; i++) {
            var j = this.peaks.indexOf(i)
            if(this.distances[i-1] < this.distances[i] && this.distances[i] > this.distances[i+1]) {
                if(j === -1)
                    this.peaks.push(i)
            }
            else {
                if(j !== -1)
                    this.peaks.splice(i, 1)
            }
        }

        var pushCount = this.peaks.length
        if(Math.abs(pushCount - this.window * 2) === 1) {
            if(this.prev_count === this.window * 2) {
                print("good")
            }
            else if (pushCount > this.window * 2)
                print("too fast")
            else   
                print("too slow")
            
        } 
        else if(pushCount - this.window * 2 === 0) {
            print("good")
        }
        else {
            if (pushCount > this.window * 2)
                print("too fast")
            else   
                print("too slow")
        }
        this.prev_count = pushCount
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
