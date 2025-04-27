@component
export class FollowCameraUI extends BaseScriptComponent {
  @input
  camera!: Camera;

  @input
  screen1!: SceneObject;

  @input
  screen2!: SceneObject;

  @input
  screen3!: SceneObject;

  @input
  screen4!: SceneObject;

  @input
  screen5: SceneObject;

  @input
  screen6: SceneObject;

  @input
  currentScreenText!: Text;
  oldScreenText: String = "0";

  @input
  rotateText!: Text;

  distance: number = -65;

  currentScreen: SceneObject = this.screen1;

  @input
  duration: number = 0.5; // seconds to complete the rotation

  private startTime: number = 0;
  private animating: boolean = false;
  private screenToRotateOut: SceneObject = this.screen1;
  private screens: Array<SceneObject> = [];
  private verticalOffset: number = 15;

  onAwake(): void {
    // Bind update event inside the class
    this.screens = [this.screen1, this.screen2, this.screen3, this.screen4, this.screen5, this.screen6];
    this.createEvent("UpdateEvent").bind(() => this.onUpdate());
    
  }

  onUpdate(): void {
    if (!this.currentScreen) {
      return;
    }
    if (this.oldScreenText != this.currentScreenText.text) {
      this.animating = true;
      this.screenToRotateOut = this.currentScreen;
      this.currentScreen = this.screenFromLabel();
      this.startTime = getTime();
      this.oldScreenText = this.currentScreenText.text;
      return;
    }

    //-------------------------------------------------------
    const camTransform = this.camera.getTransform();
    const camPos = camTransform.getWorldPosition();
    const camForward = camTransform.forward.normalize();
    //-------------------------------------------------------


    if (this.animating) {
      const elapsed = getTime() - this.startTime;
      const rawT = Math.min(elapsed / this.duration, 1);
      const t = this.easeInOutCubic(rawT);
      this.rotateIn(t, camPos, camForward);
      this.rotateOut(t, camPos, camForward);

      if (t >= 1) {
        print("done");
        this.animating = false; // animation complete
      }
    } else {
      this.updatePosition(camPos, camTransform);
    }
  }

  easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  screenFromLabel(): SceneObject {
    if (this.currentScreenText.text == "0") { //main screen
      return this.screen1;
    }
    if (this.currentScreenText.text == "1") { //cpr intro screen
      return this.screen2;
    }
    if (this.currentScreenText.text == "2") { //aed intro screen
      return this.screen3;
    } if (this.currentScreenText.text == "3") { //cpr precheck screen
      return this.screen4;
    }if (this.currentScreenText.text == "4") { //cpr precheck screen
      return this.screen5;
    }else{
      return this.screen6; //cpr initiate screen
    }
  }

  rotateIn(t, camPos, camForward): void {
    this.currentScreen.enabled = true;
    const initialForward = camForward.uniformScale(this.distance);

    // Animate angle from 180° → 0°
    const angle = Math.PI * (1 - t);
    const currentRot = quat.angleAxis(
      angle,
      this.rotateText.text == "left" ? vec3.down() : vec3.up()
    ); // clockwise
    const currentOffset = currentRot.multiplyVec3(initialForward);

    const newPos = camPos.add(currentOffset);
    this.currentScreen.getTransform().setWorldPosition(newPos);
  }

  rotateOut(t, camPos, camForward): void {
    // Initial offset in front of the camera
    const startOffset = camForward.uniformScale(this.distance);

    // Interpolate offset by rotating a little more each frame
    const angle = Math.PI * t; // 0 to 180 degrees
    const currentRot = quat.angleAxis(
      angle,
      this.rotateText.text == "left" ? vec3.up() : vec3.down()
    );
    const currentOffset = currentRot.multiplyVec3(startOffset);

    const newPos = camPos.add(currentOffset);

    this.screenToRotateOut.getTransform().setWorldPosition(newPos);
  }

  updatePosition(camPos, camTransform): void {
    for (let i = 0; i < this.screens.length; i++) {
      if (Number(this.currentScreenText.text) == i) {
        if(i==3 || i==4){
          return;
        }
        const forward = camTransform.forward;
        const offset = forward.uniformScale(this.distance);
        const targetPos = camPos.add(offset);

        this.screens[i].getTransform().setWorldPosition(targetPos);
      } else {
        const forward = camTransform.forward;

        const offset = forward.uniformScale(-1 * this.distance);
        const targetPos = camPos.add(offset);

        this.screens[i].getTransform().setWorldPosition(targetPos);
        this.screens[i].enabled = false;
      }
    }
  }
}
