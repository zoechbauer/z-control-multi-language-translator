import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

import { TextToSpeechAccordionComponent } from './text-to-speech-accordion.component';
import { createTranslateServiceMock } from '@testing/translate-service.mock';

describe('TextToSpeechAccordionComponent', () => {
  let component: TextToSpeechAccordionComponent;
  let fixture: ComponentFixture<TextToSpeechAccordionComponent>;
  let localStorageServiceSpy: jasmine.SpyObj<LocalStorageService>;

  beforeEach(async () => {
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', [
      'getDefaultTextToSpeechValues',
    ]);

    await TestBed.configureTestingModule({
      imports: [TextToSpeechAccordionComponent],
      providers: [
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: TranslateService, useValue: createTranslateServiceMock() },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TextToSpeechAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    describe('getTtsRateLabel', () => {
      it('should return label with rate when rate is set', () => {
        component.ngModel = { rate: 1.5, pitch: 1 };
        const label = component.getTtsRateLabel();
        expect(label).toBe(
          'SETTINGS.TEXT_TO_SPEECH.LABEL.TTS_RATE' + ' : ' + '1.5'
        );
      });

      it('should return label without rate when rate is not set', () => {
        (<any>component).ngModel = undefined;
        const label = component.getTtsRateLabel();
        expect(label).toBe('SETTINGS.TEXT_TO_SPEECH.LABEL.TTS_RATE');
      });
    });

    describe('getTtsPitchLabel', () => {
      it('should return label with pitch when pitch is set', () => {
        component.ngModel = { rate: 1.5, pitch: 1 };
        const label = component.getTtsPitchLabel();
        expect(label).toBe(
          'SETTINGS.TEXT_TO_SPEECH.LABEL.TTS_PITCH' + ' : ' + '1'
        );
      });

      it('should return label without pitch when pitch is not set', () => {
        (<any>component).ngModel = undefined;
        const label = component.getTtsPitchLabel();
        expect(label).toBe('SETTINGS.TEXT_TO_SPEECH.LABEL.TTS_PITCH');
      });
    });

    describe('change events', () => {
      it('should update ngModel rate and emit ngModelChange', () => {
        spyOn(component.ngModelChange, 'emit');
        component.ngModel = { rate: 1, pitch: 1 };

        component.onChangeTtsRate({ detail: { value: 2 } } as any);

        expect(component.ngModel.rate).toBe(2);
        expect(component.ngModelChange.emit).toHaveBeenCalledWith({
          rate: 2,
          pitch: 1,
        });
      });

      it('should update ngModel pitch and emit ngModelChange', () => {
        spyOn(component.ngModelChange, 'emit');
        component.ngModel = { rate: 1, pitch: 1 };

        component.onChangeTtsPitch({ detail: { value: 0.5 } } as any);

        expect(component.ngModel.pitch).toBe(0.5);
        expect(component.ngModelChange.emit).toHaveBeenCalledWith({
          rate: 1,
          pitch: 0.5,
        });
      });
    });

    describe('resetTtsSettings', () => {
      it('should reset ngModel to default values and emit ngModelChange', () => {
        spyOn(component.ngModelChange, 'emit');
        localStorageServiceSpy.getDefaultTextToSpeechValues.and.returnValue({
          rate: 1,
          pitch: 1,
        });
        component.ngModel = { rate: 2, pitch: 0.5 };

        component.resetTtsSettings();

        expect(component.ngModel).toEqual({ rate: 1, pitch: 1 });
        expect(component.ngModelChange.emit).toHaveBeenCalledWith({
          rate: 1,
          pitch: 1,
        });
      });
    });
  });

  describe('template rendering', () => {
    describe('disable reset button', () => {
      it('should disable the reset button if isNative is false', () => {
        component.isNative = false;
        component.ngModel = { rate: 1, pitch: 1 };
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('ion-button'));
        expect(button.nativeElement.disabled).toBeTrue();
      });

      it('should enable the reset button if isNative is true', () => {
        component.isNative = true;
        component.ngModel = { rate: 1, pitch: 1 };
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('ion-button'));
        expect(button.nativeElement.disabled).toBeFalse();
      });
    });
  });
});
