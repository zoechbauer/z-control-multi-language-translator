import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Auth } from '@angular/fire/auth';
import { ModalController } from '@ionic/angular';
import { Subject } from 'rxjs';

import { GetStatisticsAccordionComponent } from './get-statistics-accordion.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';
import { FirebaseFirestoreService } from 'src/app/services/firebase-firestore.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';

describe('GetStatisticsAccordionComponent', () => {
  let component: GetStatisticsAccordionComponent;
  let fixture: ComponentFixture<GetStatisticsAccordionComponent>;

  const firestoreServiceMock = {
    programmerDeviceRefresh$: new Subject<void>(),
  };
  const localStorageServiceMock = {
    statisticsDisplayMode$: new Subject<void>(),
    statisticsSelectedMonth$: new Subject<void>(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GetStatisticsAccordionComponent],
      providers: [
        { provide: Auth, useValue: {} },
        { provide: FirebaseFirestoreService, useValue: firestoreServiceMock },
        { provide: ModalController, useValue: {} },
        { provide: LocalStorageService, useValue: localStorageServiceMock },
        { provide: Storage, useValue: {} },
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GetStatisticsAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
