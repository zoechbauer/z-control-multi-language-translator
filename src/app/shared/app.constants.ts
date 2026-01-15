import { environment } from 'src/environments/environment';

export class AppConstants {
  private static readonly _maxInputLength = 100;
  private static readonly _maxTargetLanguages = 5;
  private static readonly _maxFreeTranslateCharsPerMonth = 500000;
  // TODO change range slider min/max values - setting default to 1 then
  private static readonly _ttsDefault = 50;  // range 0-100
  private static readonly _ttsMin = 0.5;
  private static readonly _ttsMax = 2.0;

  static get maxInputLength(): number {
    return environment.app.maxInputLength ?? this._maxInputLength;
  }

  static get maxTargetLanguages(): number {
    return environment.app.maxTargetLanguages ?? this._maxTargetLanguages;
  }

  static get maxFreeTranslateCharsPerMonth(): number {
    return (
      environment.app.maxFreeTranslateCharsPerMonth ??
      this._maxFreeTranslateCharsPerMonth
    );
  }

  static get textToSpeechMinValue(): number {
    return environment.app.textToSpeechMinValue ?? this._ttsMin;
  }
  static get textToSpeechMaxValue(): number {
    return environment.app.textToSpeechMaxValue ?? this._ttsMax;
  }
  static get textToSpeechDefaultValue(): number {
    return  this._ttsDefault;
  }
}
