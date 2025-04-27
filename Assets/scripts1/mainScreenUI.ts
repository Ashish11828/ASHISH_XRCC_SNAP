import { Interactable } from "../SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable";
import { validate } from "../SpectaclesInteractionKit/Utils/validate";

@component
export class RocketLaunchControl extends BaseScriptComponent {
  @input
  animationOption1Button!: SceneObject;

  @input
  animationOption2Button!: SceneObject;
  //   @input
  //   rocketAudioComponent!: AudioComponent;

  @input
  camera!: Camera;

  @input
  screenLabel!: Text;

  @input
  rotateText!: Text;

  private animationOption1Button_interactable: Interactable | null = null;
  private animationOption2Button_interactable: Interactable | null = null;

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => {
      this.onStart();
    });
    this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));

    const interactableTypeName = Interactable.getTypeName();

    this.animationOption1Button_interactable =
      this.animationOption1Button.getComponent(interactableTypeName);
    if (isNull(this.animationOption1Button_interactable)) {
      throw new Error("Interactable component not found.");
    }

    this.animationOption2Button_interactable =
      this.animationOption2Button.getComponent(interactableTypeName);
    if (isNull(this.animationOption2Button_interactable)) {
      throw new Error("Interactable component not found.");
    }
  }

  onUpdate(): void {
    if (!this.camera) {
      return;
    }
  }

  onStart() {
    this.setupanimationOption1ButtonCallbacks();
    this.setupanimationOption2ButtonCallbacks();
  }

  private setupanimationOption1ButtonCallbacks = (): void => {
    validate(this.animationOption1Button_interactable);
    this.animationOption1Button_interactable.onTriggerEnd.add(
      this.onanimationOption1Button
    );
  };

  private setupanimationOption2ButtonCallbacks = (): void => {
    validate(this.animationOption2Button_interactable);
    this.animationOption2Button_interactable.onTriggerEnd.add(
      this.onanimationOption2Button
    );
  };

  private onanimationOption1Button = (): void => {
    this.rotateText.text = "left";
    this.screenLabel.text = "1";
  };

  private onanimationOption2Button = (): void => {
    this.rotateText.text = "left";
    this.screenLabel.text = "2";
  };
}
