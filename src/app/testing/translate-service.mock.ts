import { of } from 'rxjs';

export function createTranslateServiceMock() {
  return {
    instant: jasmine.createSpy('instant').and.callFake((key: any) => key),
    use: jasmine.createSpy('use'),
    setDefaultLang: jasmine.createSpy('setDefaultLang'),
    get: jasmine.createSpy('get').and.callFake((key: any) => of(key)),
    stream: jasmine.createSpy('stream').and.callFake((key: any) => of(key)),
    getParsedResult: jasmine
      .createSpy('getParsedResult')
      .and.callFake((_translations: any, key: any) => key),
    getCurrentLang: jasmine.createSpy('getCurrentLang').and.returnValue('de'),
    getDefaultLang: jasmine.createSpy('getDefaultLang').and.returnValue('de'),
    onLangChange: of({ lang: 'de', translations: {} }),
    onTranslationChange: of({ lang: 'de', translations: {} }),
    onDefaultLangChange: of({ lang: 'de', translations: {} }),
    onFallbackLangChange: of({ lang: 'de', translations: {} }),
  } as any;
}
