import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';

import { HeaderComponent } from './header.component';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from 'src/app/services/utils.service';
import { Tab } from 'src/app/enums';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
    'instant',
    'get',
  ]);
  const modalControllerSpy = jasmine.createSpyObj('ModalController', [
    'create',
  ]);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [IonicModule.forRoot(), HeaderComponent],
      providers: [
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: ModalController, useValue: modalControllerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call utilsService.openHelpModal', async () => {
    const utilsService = TestBed.inject(UtilsService);
    spyOn(utilsService, 'openHelpModal').and.returnValue(Promise.resolve());

    await component.openHelpModal();

    expect(utilsService.openHelpModal).toHaveBeenCalled();
  });

  it('should call utilsService.navigateToTab with Tab.Translate and Tab.Settings', () => {
    const utilsService = TestBed.inject(UtilsService);
    spyOn(utilsService, 'navigateToTab');

    component.goToTranslate();
    expect(utilsService.navigateToTab).toHaveBeenCalledWith(Tab.Translate);

    component.goToSettings();
    expect(utilsService.navigateToTab).toHaveBeenCalledWith(Tab.Settings);
  });

  it('should return correct values for onQrTab and onSettingsTab', () => {
    component.currentTab = Tab.Translate;

    expect(component.onTranslateTab).toBeTrue();
    expect(component.onSettingsTab).toBeFalse();
  });

  it('should navigate to Tab.Settings with params and emit logoClickedSub after 500ms', (done) => {
    const utilsService = TestBed.inject(UtilsService);
    spyOn(utilsService, 'navigateToTabWithParams');
    spyOn(utilsService.logoClickedSub, 'next');

    component.goToSettingsAndOpenFeedback();

    expect(utilsService.navigateToTabWithParams).toHaveBeenCalledWith(
      Tab.Settings,
      { open: 'z-control' }
    );

    setTimeout(() => {
      expect(utilsService.logoClickedSub.next).toHaveBeenCalledWith(true);
      done();
    }, 510);
  });

  it('should return true for isLargeScreen if utilsService.isSmallScreen is false', () => {
    const utilsService = TestBed.inject(UtilsService);
    spyOnProperty(utilsService, 'isSmallScreen', 'get').and.returnValue(false);
    expect(component.isLargeScreen).toBeTrue();
  });

  it('should return false for isLargeScreen if utilsService.isSmallScreen is true', () => {
    const utilsService = TestBed.inject(UtilsService);
    spyOnProperty(utilsService, 'isSmallScreen', 'get').and.returnValue(true);
    expect(component.isLargeScreen).toBeFalse();
  });
});
