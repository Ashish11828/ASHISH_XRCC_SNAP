import { Interactable } from "../SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable";
import { validate } from "../SpectaclesInteractionKit/Utils/validate";
@component
export class NewScript extends BaseScriptComponent {

  @input
  camera!: Camera;

  @input
  bodyIndicator!: SceneObject;

  @input
  cprTarget!: SceneObject;

  @input
  shoulderTargetLeft!: SceneObject;

  @input
  shoulderTargetRight!: SceneObject;

  @input
  shoulderLeft!: SceneObject;

  @input
  shoulderRight!: SceneObject;

  @input
  marker!: SceneObject;

  @input
  line!: SceneObject;

  @input
  reminderText!: SceneObject;

  @input
  reminderCheckButton!: SceneObject;


  @input
  nextButton!: SceneObject;

  @input
  smoothingFactor: number = 0.05; // Lower = smoother, Higher = more responsive

  @input
  currentScreen!: Text;

  @input
  rotateText!: Text;

  

  



  private smoothedPosition: vec3 = new vec3(0, 0, 0);
  private smoothedPositionLS: vec3 = new vec3(0, 0, 0);
  private smoothedPositionRS: vec3 = new vec3(0, 0, 0);
  private reminderCheckButton_interactable: Interactable | null = null;
  private nextButton_interactable: Interactable | null = null;
  private currentState: number = 0;
  
  

  

  onAwake() {
    
    this.createEvent("UpdateEvent").bind(() => this.onUpdate());
        // Get starting position
    this.createEvent("OnStartEvent").bind(() => {
      this.onStart();
    });

    const interactableTypeName = Interactable.getTypeName();

    this.reminderCheckButton_interactable =
      this.reminderCheckButton.getComponent(interactableTypeName);
    if (isNull(this.reminderCheckButton_interactable)) {
      throw new Error("Interactable component not found.");
    }

    this.nextButton_interactable =
      this.nextButton.getComponent(interactableTypeName);
    if (isNull(this.nextButton_interactable)) {
      throw new Error("Interactable component not found.");
    }
    
  }

  onUpdate() {


    this.filter();
    if(this.currentState==0){
      //tap shoulder and ask
      var B = this.shoulderTargetRight.getTransform().getWorldPosition();
      this.moveCylinderBottomToPoint(this.line, B, new vec3(50,0,50), new vec3(0,0,0), 28)
    }
    else if(this.currentState==1){
      this.reminderText.getComponent("Text").text = "2. Signs of arrhythmic or no breathing";
      this.reminderPosition(-25); //Check breathing
    }
    else if(this.currentState==2){
      this.reminderText.getComponent("Text").text = "3. No pulse felt over 10 second interval";
      this.reminderPosition(-20); //Check pulse

    }
    else{
      this.reminderText.getComponent("Text").text = "3. No pulse felt over 10 second interval";
      this.reminderPosition(-20); //Check pulse
      if(this.nextButton.enabled==false){
        const camTransform = this.camera.getTransform();

        

        // this.nextButton.getTransform().setWorldPosition(this.reminderText.getTransform().getWorldPosition().add(new vec3(1,1,1)));
        this.nextButton.getTransform().setLocalPosition(new vec3(0,-5,1));
      }
      this.nextButton.enabled = true;
    }
    
    
  }

  onStart() {
    this.currentState = 0;
    this.setupReminderCheckButtonCallbacks();
    this.setupNextButtonCallbacks();

    this.nextButton.enabled = false;
  }

  private onReminderCheckButton = (): void => {
   this.currentState += 1;
   
  };

  private onNextButton = (): void => {
    this.rotateText.text = "left";
    this.currentScreen.text = "4";
    
   };

  private setupReminderCheckButtonCallbacks = (): void => {
      validate(this.reminderCheckButton_interactable);
      this.reminderCheckButton_interactable.onTriggerEnd.add(
        this.onReminderCheckButton
      );
    };

    private setupNextButtonCallbacks = (): void => {
      validate(this.nextButton_interactable);
      this.nextButton_interactable.onTriggerEnd.add(
        this.onNextButton
      );
    };


  filter(): void{
    
    const followPos = this.bodyIndicator.getTransform().getWorldPosition();

    // Linear interpolation between old smoothed position and new follow position
    this.smoothedPosition = vec3.lerp(this.smoothedPosition, followPos, this.smoothingFactor);
    this.cprTarget.getTransform().setWorldPosition(this.smoothedPosition);

    //-------------------------------------------------------------------------
    const followPosLS = this.shoulderLeft.getTransform().getWorldPosition();

    // Linear interpolation between old smoothed position and new follow position
    this.smoothedPositionLS = vec3.lerp(this.smoothedPositionLS, followPosLS, this.smoothingFactor);
    this.shoulderTargetLeft.getTransform().setWorldPosition(this.smoothedPositionLS);

    //-------------------------------------------------------------------------
    const followPosRS = this.shoulderRight.getTransform().getWorldPosition();
    
    // Linear interpolation between old smoothed position and new follow position
    this.smoothedPositionRS = vec3.lerp(this.smoothedPositionRS, followPosRS, this.smoothingFactor);
    this.shoulderTargetRight.getTransform().setWorldPosition(this.smoothedPositionRS);
  }

  

  getMidpoint(a: vec3, b: vec3): vec3 {
    return a.add(b).uniformScale(0.5);
  }

  extendLineBeyond(b: vec3, a: vec3, distance: number): vec3 {
    const direction = b.sub(a).normalize(); // direction A -> B
    const offset = direction.uniformScale(distance);
    return b.add(offset); // extend beyond B
}
  reminderPosition(distance: number): void{

    var A = this.shoulderTargetLeft.getTransform().getWorldPosition();
    var B = this.shoulderTargetRight.getTransform().getWorldPosition();
    var C = this.cprTarget.getTransform().getWorldPosition();

    var shoulderMid = this.getMidpoint(A, B);
    var breathReminderPosition = this.extendLineBeyond(C, shoulderMid, distance);
    this.marker.getTransform().setWorldPosition(breathReminderPosition); // marker for base of breath marker 
    var x = -50;
    var z = 50;
    var length = 28;

    if(this.currentState == 1){
      x = 50;
    }
    if(this.currentState==2){
      x = -50
    }

    const v1 = A.sub(B); // Vector from p1 to p2
    const v2 = B.sub(C); // Vector from p1 to p3

    const normal = v1.cross(v2); // Cross product to get normal
    // Normalize it
    this.moveCylinderBottomToPoint(this.line, this.marker.getTransform().getWorldPosition(), new vec3(x,0,z),normal.normalize(), length)


  }

  multiplyScalar(v: vec3, scalar: number): vec3 {
    return new vec3(v.x * scalar, v.y * scalar, v.z * scalar);
  }

  moveCylinderBottomToPoint(cylinderObj: SceneObject, bottomPoint: vec3, planeNormal: vec3, rotationDegrees: vec3, height: number) {
    const transform = cylinderObj.getTransform();
    if(this.currentState > 0){
      bottomPoint.add(planeNormal.uniformScale(15));
    }
    // First, rotate
    const rotation = quat.fromEulerVec(rotationDegrees);
    transform.setWorldRotation(rotation);

    // Offset by half height along cylinder's local Y-axis
    const up = transform.up; // local Y direction after rotation
    const offset = up.uniformScale(height / 2);

    // New position = bottom point + offset
    const newPosition = bottomPoint.add(offset);

    transform.setWorldPosition(newPosition);

    this.updateCylinderThickness(this.line, this.camera, 0.3, 0.002)
    this.positionTextAtEndAndScale(this.line,this.reminderText, 28, this.camera)
  }

  updateCylinderThickness(cylinderObj: SceneObject, cameraObj: Camera, baseThickness: number, scaleFactor: number) {
    const cylinderTransform = cylinderObj.getTransform();
    const cameraTransform = cameraObj.getTransform();

    const distance = cameraTransform.getWorldPosition().distance(cylinderTransform.getWorldPosition());

    // Calculate thickness based on distance
    const thickness = baseThickness + distance * scaleFactor;

    // Get current scale
    const currentScale = cylinderTransform.getWorldScale();

    // Set new scale: only scale X and Z (thickness), keep Y (height) the same
    const newScale = new vec3(thickness, currentScale.y, thickness);

    cylinderTransform.setWorldScale(newScale);
  }

  positionTextAtEndAndScale(cylinderObj: SceneObject, textObj: SceneObject, length: number, camera: Camera,baseScale: number = 0.7, scaleFactor: number = 0.01) {
    const cylTransform = cylinderObj.getTransform();
    const textTransform = textObj.getTransform();

    // Get the cylinder's center position
    const cylPos = cylTransform.getWorldPosition();

    // Get the cylinder's forward direction (local Y axis after rotation)
    const up = cylTransform.up.normalize(); // local Y axis is "up" by convention

    // Calculate offset: move by half the length along the up vector
    const offset = up.uniformScale(length / 2);

    // Final position for text
    const finalPos = cylPos.add(offset);

    // Move the text object
    textTransform.setWorldPosition(finalPos.add(new vec3(0,10,0)));

     // Calculate distance from camera to text
     const distance = camera.getTransform().getWorldPosition().distance(finalPos);

     // Calculate new text scale (thickness increases with distance)
     const newScaleVal = baseScale + distance * scaleFactor;
     const newScale = new vec3(newScaleVal, newScaleVal, newScaleVal);
 
     // Set new scale on text
     textTransform.setWorldScale(newScale);
}
}
