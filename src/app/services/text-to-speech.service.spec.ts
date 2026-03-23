import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { TextSpeechService } from './text-to-speech.service';
import { LocalStorageService } from './local-storage.service';

describe('TextSpeechService', () => {
  let service: TextSpeechService;
  let textToSpeechValues$: BehaviorSubject<{ rate: number; pitch: number }>;

  beforeEach(() => {
    textToSpeechValues$ = new BehaviorSubject({ rate: 50, pitch: 50 });

    const localStorageServiceMock = {
      textToSpeechValues$,
    };

    TestBed.configureTestingModule({
      providers: [
        TextSpeechService,
        { provide: LocalStorageService, useValue: localStorageServiceMock },
      ],
    });

    service = TestBed.inject(TextSpeechService);
  });

  it('should create an instance', () => {
    expect(service).toBeTruthy();
  });
});
