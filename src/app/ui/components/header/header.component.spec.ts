import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';

import { HeaderComponent } from './header.component';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from 'src/app/services/utils.service';
import { Tab } from 'src/app/enums';
import { of, Subject } from 'rxjs';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
    'instant',
    'get',
    'transform',
    'stream',
    'getCurrentLang',
    'getFallbackLang',
    'getParsedResult',
  ]);
  translateServiceSpy.stream.and.returnValue(of(''));
  translateServiceSpy.get.and.returnValue(of(''));
  translateServiceSpy.transform.and.returnValue(of(''));
  translateServiceSpy.getCurrentLang.and.returnValue('en');
  translateServiceSpy.getFallbackLang.and.returnValue('en');
  translateServiceSpy.getParsedResult.and.returnValue('');
  Object.defineProperty(translateServiceSpy, 'onTranslationChange', {
    get: () => of({ lang: 'en', translations: {} }),
  });
  Object.defineProperty(translateServiceSpy, 'onLangChange', {
    get: () => of({ lang: 'en', translations: {} }),
  });
  Object.defineProperty(translateServiceSpy, 'onFallbackLangChange', {
    get: () => of({ lang: 'en', translations: {} }),
  });
  const modalControllerSpy = jasmine.createSpyObj('ModalController', [
    'create',
  ]);
  const logoClickedSub = new Subject<boolean>();
  const _isSmallScreen = false;
  const utilsServiceMock = {
    get isSmallScreen() {
      return _isSmallScreen;
    },
    isShowIonTabBar: true,
    navigateToTab: jasmine.createSpy('navigateToTab'),
    openHelpModal: jasmine
      .createSpy('openHelpModal')
      .and.returnValue(Promise.resolve()),
    navigateToTabWithParams: jasmine.createSpy('navigateToTabWithParams'),
    logoClickedSub,
    logoClicked$: logoClickedSub.asObservable(),
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [IonicModule.forRoot(), HeaderComponent],
      providers: [
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: UtilsService, useValue: utilsServiceMock },
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
    await component.openHelpModal();
    expect(utilsService.openHelpModal).toHaveBeenCalled();
  });

  it('should call utilsService.navigateToTab with Tab.Translate and Tab.Settings', () => {
    const utilsService = TestBed.inject(UtilsService);
    component.goToTranslate();
    expect(utilsService.navigateToTab).toHaveBeenCalledWith(Tab.Translate);

    component.goToSettings();
    expect(utilsService.navigateToTab).toHaveBeenCalledWith(Tab.Settings);
  });

  it('should return correct values for onTranslateTab and onSettingsTab', () => {
    component.currentTab = Tab.Translate;

    expect(component.onTranslateTab).toBeTrue();
    expect(component.onSettingsTab).toBeFalse();
  });

  it('should navigate to Tab.Settings with params and emit logoClickedSub after 500ms', (done) => {
    const utilsService = TestBed.inject(UtilsService);
    spyOn(utilsService.logoClickedSub, 'next');
    component.goToSettingsAndOpenFeedback();
    expect(utilsService.navigateToTabWithParams).toHaveBeenCalledWith(
      Tab.Settings,
      { open: 'z-control' },
    );
    setTimeout(() => {
      expect(utilsService.logoClickedSub.next).toHaveBeenCalledWith(true);
      done();
    }, 510);
  });

  it('should return true for isLargeScreen if utilsService.isSmallScreen is false', () => {
    const utilsService = TestBed.inject(UtilsService);
    Object.defineProperty(utilsService, 'isSmallScreen', { get: () => false });
    expect(component.isLargeScreen).toBeTrue();
  });

  it('should return false for isLargeScreen if utilsService.isSmallScreen is true', () => {
    const utilsService = TestBed.inject(UtilsService);
    Object.defineProperty(utilsService, 'isSmallScreen', { get: () => true });
    expect(component.isLargeScreen).toBeFalse();
  });
});
