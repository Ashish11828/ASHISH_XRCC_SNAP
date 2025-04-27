const voiceMLModule = require("LensStudio:VoiceMLModule");
import { PinchButton } from "./SpectaclesInteractionKit/Components/UI/PinchButton/PinchButton";
import { ToggleButton } from "./SpectaclesInteractionKit/Components/UI/ToggleButton/ToggleButton";
import { MapComponent } from "./MapComponent/Scripts/MapComponent";

@component
export class VoiceMLEndListener extends BaseScriptComponent {
  private options = VoiceML.ListeningOptions.create();
      
  @input
  private mapComponent: MapComponent;  
  @input
  private spawnPinButton: PinchButton;
  @input
  private clearPinsButton: PinchButton;
  @input
  private centerMapButton: PinchButton;
  @input
  private toggleMiniMapButton: ToggleButton;
  @input
  currentScreen!: Text;
  @input
  rotateDirection!: Text;
  @input
  countText!:Text;
    
  @input
  private showCafeButton: PinchButton;
    
  private lockoutTime: number = 0;
  onAwake() {
    this.initializeVoiceML();
    this.registerVoiceMLEvents();
  }

  initializeVoiceML() {
    this.options.speechRecognizer = VoiceMLModule.SpeechRecognizer.Default;
    this.options.languageCode = 'en_US';
    this.options.shouldReturnAsrTranscription = true;
    this.options.shouldReturnInterimAsrTranscription = true;
 
    const phrases = ['end','locate','clear'];
    const boostValue = 5;
    this.options.addSpeechContext(phrases, boostValue);

    const nlpKeywordModel = VoiceML.NlpKeywordModelOptions.create();
    nlpKeywordModel.addKeywordGroup('end', ['end']);
    this.options.nlpModels = [nlpKeywordModel];
    this.lockoutTime = getRealTimeNanos() / 1e6;
  }

  registerVoiceMLEvents() {
    voiceMLModule.onListeningUpdate.add(this.onUpdateListening.bind(this));
    voiceMLModule.onListeningError.add(this.onListeningError.bind(this));
    voiceMLModule.onListeningEnabled.add(this.onListeningEnabled.bind(this));
    voiceMLModule.onListeningDisabled.add(this.onListeningDisabled.bind(this));
  }
   
  onListeningEnabled() {
    voiceMLModule.startListening(this.options);
  }

  onListeningDisabled() {
    voiceMLModule.stopListening();
  }

  onUpdateListening(eventArgs) {
    print(eventArgs.transcription)
    if (eventArgs.transcription.trim() === '') {
      return;
    }
       
    const transcription = eventArgs.transcription.toLowerCase();
    var currTime = getRealTimeNanos() / 1e6;
    if(currTime - this.lockoutTime < 1500) {
            return;
    }
    
    if(this.currentScreen.text == "0"){
      if (transcription.includes('quick start cpr')) {
        // print("🚀 Voice command 'map' detected!");
        this.rotateDirection.text = "left";
        this.currentScreen.text = "4";
        this.lockoutTime = getRealTimeNanos() / 1e6;
      }
      if (transcription.includes('fast search')) {
        // print("🚀 Voice command 'map' detected!");
        this.rotateDirection.text = "left";
        this.currentScreen.text = "6";
        this.toggleMiniMapButton.toggle();
        this.lockoutTime = getRealTimeNanos() / 1e6;
      }
    }
    if(this.currentScreen.text=="5"){
      if (transcription.includes('map')) {
        // print("🚀 Voice command 'map' detected!");
        this.toggleMiniMapButton.toggle();
        this.lockoutTime = getRealTimeNanos() / 1e6;
      }
      if (transcription.includes('locate')) {
        // print("🚀 Voice command 'locate' detected!");
        this.mapComponent.showNeaybyPlaces(["AED"]);
        this.lockoutTime = getRealTimeNanos() / 1e6;
      }
      if (transcription.includes('clear')) {
        // print("🚀 Voice command 'clear' detected!");
        this.mapComponent.removeMapPins();
        this.lockoutTime = getRealTimeNanos() / 1e6;
      }
    }
    
      if (transcription.includes('continue please')) {
        // print("🚀 Voice command 'clear' detected!");
        this.countText.text = "0";
        this.lockoutTime = getRealTimeNanos() / 1e6;
      }
    
    if (transcription.includes('home')) {
      // print("🚀 Voice command 'map' detected!");
      if(this.currentScreen.text=="0"){
        return;
      }
      this.rotateDirection.text = "left";
      this.currentScreen.text = "0";
      this.lockoutTime = getRealTimeNanos() / 1e6;
    }
    
    
  }

  onListeningError(eventErrorArgs) {
    print("VoiceML Error: " + eventErrorArgs.error + ", Description: " + eventErrorArgs.description);
  }
}