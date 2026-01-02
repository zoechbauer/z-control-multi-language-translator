import { environment } from 'src/environments/environment';

export class AppConstants {
  private static readonly _maxInputLength = 100;
  private static readonly _maxTargetLanguages = 5;
  private static readonly _maxFreeTranslateCharsPerMonth = 500000;

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
}
