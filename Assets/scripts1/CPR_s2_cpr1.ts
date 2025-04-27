import { Interactable } from "../SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable";
import { validate } from "../SpectaclesInteractionKit/Utils/validate";
@component
export class NewScript extends BaseScriptComponent {
  @input
  animationReturnButton!: SceneObject;

  @input
  animationBeginButton!: SceneObject;
  //   @input
  //   rocketAudioComponent!: AudioComponent;

  @input
  camera!: Camera;

  @input
  screenLabel!: Text;

  @input
  rotateText!: Text;

  private animationReturnButton_interactable: Interactable | null = null;
  private animationBeginButton_interactable: Interactable | null = null;

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => {
      this.onStart();
    });
    this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));

    const interactableTypeName = Interactable.getTypeName();

    this.animationReturnButton_interactable =
      this.animationReturnButton.getComponent(interactableTypeName);
    if (isNull(this.animationReturnButton_interactable)) {
      throw new Error("Interactable component not found.");
    }

    this.animationBeginButton_interactable =
      this.animationBeginButton.getComponent(interactableTypeName);
    if (isNull(this.animationBeginButton_interactable)) {
      throw new Error("Interactable component not found.");
    }
  }

  onUpdate(): void {
    if (!this.camera) {
      return;
    }
  }

  onStart() {
    this.setupanimationReturnButtonCallbacks();
    this.setupanimationBeginButtonCallbacks();
  }

  private setupanimationReturnButtonCallbacks = (): void => {
    validate(this.animationReturnButton_interactable);
    this.animationReturnButton_interactable.onTriggerEnd.add(
      this.onanimationReturnButton
    );
  };

  private setupanimationBeginButtonCallbacks = (): void => {
    validate(this.animationBeginButton_interactable);
    this.animationBeginButton_interactable.onTriggerEnd.add(
      this.onanimationBeginButton
    );
  };

  private onanimationReturnButton = (): void => {
    this.rotateText.text = "right";
    this.screenLabel.text = "0";
  };
  private onanimationBeginButton = (): void => {
    this.rotateText.text = "left";
    this.screenLabel.text = "3";
  };
}
