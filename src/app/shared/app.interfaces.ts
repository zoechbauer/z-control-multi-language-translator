export interface TextToSpeechValues {
  rate: number;
  pitch: number;
}

export interface SecureTranslateData {
  text: string;
  baseLang: string;
  selectedLanguages: string[];
}
export interface TranslationResult {
  translations: Record<string, string>;
}