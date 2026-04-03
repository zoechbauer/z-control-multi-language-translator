import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular';

import { UtilsService } from './utils.service';
import { DisplayMode, Tab } from '../shared/enums';
import { environment } from 'src/environments/environment';
import { HelpModalComponent } from '../ui/components/get-help/get-help.component';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';
import { UserDetailComponent } from '../ui/components/user-detail/user-detail.component';
import {
  DisplayedUserStatistics,
  UserType,
} from '../shared/firebase-firestore.interfaces';

describe('UtilsService', () => {
  let service: UtilsService;
  let modalControllerSpy: jasmine.SpyObj<ModalController>;
  let routerSpy: jasmine.SpyObj<Router>;

  const originalShowTabsBar = environment.app.showTabsBar;

  beforeEach(() => {
    modalControllerSpy = jasmine.createSpyObj('ModalController', ['create']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        UtilsService,
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(UtilsService);
  });

  afterEach(() => {
    environment.app.showTabsBar = originalShowTabsBar;
    document.querySelectorAll('ion-tab-bar').forEach((el) => el.remove());
  });

  const createModalMock = (component: unknown): HTMLIonModalElement => {
    const modal = document.createElement(
      'div'
    ) as unknown as HTMLIonModalElement;
    Object.defineProperty(modal, 'component', {
      value: component,
      configurable: true,
      writable: true,
    });
    (modal as any).present = jasmine
      .createSpy('present')
      .and.resolveTo(undefined);
    return modal;
  };

  describe('Navigation methods', () => {
    it('should navigate to tab', () => {
      service.navigateToTab(Tab.Translate);
      expect(routerSpy.navigate).toHaveBeenCalledWith([
        '/tabs/tab-translation',
      ]);
    });

    it('should navigate to tab with query params', () => {
      service.navigateToTabWithParams(Tab.Settings, { section: 'faq' });
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/tabs/tab-settings'], {
        queryParams: { section: 'faq' },
      });
    });
  });

  describe('Platform/device detection', () => {
    it('should return true for isDesktop when native platform is false', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      expect(service.isDesktop).toBeTrue();
      expect(service.isNative).toBeFalse();
    });

    it('should return true for isNative when native platform is true', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      expect(service.isDesktop).toBeFalse();
      expect(service.isNative).toBeTrue();
    });

    it('should return true for isSmallScreen on portrait and small width', () => {
      spyOnProperty(globalThis, 'innerWidth', 'get').and.returnValue(700);
      spyOnProperty(service, 'isPortrait', 'get').and.returnValue(true);
      expect(service.isSmallScreen).toBeTrue();
    });

    it('should return false for isSmallDevice on landscape and large width', () => {
      spyOnProperty(globalThis, 'innerHeight', 'get').and.returnValue(600);
      spyOnProperty(globalThis, 'innerWidth', 'get').and.returnValue(800);
      spyOnProperty(service, 'isPortrait', 'get').and.returnValue(false);
      expect(service.isSmallDevice).toBeFalse();
    });

    it('should return false for isSmallDevice on portrait and large height', () => {
      spyOnProperty(globalThis, 'innerHeight', 'get').and.returnValue(800);
      spyOnProperty(globalThis, 'innerWidth', 'get').and.returnValue(700);
      spyOnProperty(service, 'isPortrait', 'get').and.returnValue(true);
      expect(service.isSmallDevice).toBeFalse();
    });

    it('should return true for isSmallDevice on portrait', () => {
      spyOnProperty(globalThis, 'innerHeight', 'get').and.returnValue(640);
      spyOnProperty(globalThis, 'innerWidth', 'get').and.returnValue(768);
      spyOnProperty(service, 'isPortrait', 'get').and.returnValue(true);
      expect(service.isSmallDevice).toBeTrue();
    });
  });

  describe('Tab bar visibility and manipulation', () => {
    it('should return false for isShowIonTabBar when tabs are disabled in environment', () => {
      environment.app.showTabsBar = false;
      expect(service.isShowIonTabBar).toBeFalse();
    });

    it('should return true for isShowIonTabBar when tabs are enabled and small screen', () => {
      environment.app.showTabsBar = true;
      spyOnProperty(service, 'isSmallScreen', 'get').and.returnValue(true);
      expect(service.isShowIonTabBar).toBeTrue();
    });

    it('should show tab bar when enabled', () => {
      const tabBar = document.createElement('ion-tab-bar');
      tabBar.classList.add('hide-ion-tab-bar');
      document.body.appendChild(tabBar);
      spyOnProperty(service, 'isShowIonTabBar', 'get').and.returnValue(true);
      service.showOrHideIonTabBar();
      expect(tabBar.classList.contains('hide-ion-tab-bar')).toBeFalse();
    });

    it('should hide tab bar when disabled', () => {
      const tabBar = document.createElement('ion-tab-bar');
      document.body.appendChild(tabBar);
      spyOnProperty(service, 'isShowIonTabBar', 'get').and.returnValue(false);
      service.showOrHideIonTabBar();
      expect(tabBar.classList.contains('hide-ion-tab-bar')).toBeTrue();
    });
  });

  describe('Modal handling', () => {
    it('should open help modal and present it', async () => {
      const modal = createModalMock(HelpModalComponent);
      modalControllerSpy.create.and.resolveTo(modal);
      const classSpy = spyOn(
        service,
        'setModalLandscapeClasses'
      ).and.callThrough();
      await service.openHelpModal();
      expect(modalControllerSpy.create).toHaveBeenCalledWith({
        component: HelpModalComponent,
      });
      expect(classSpy).toHaveBeenCalledWith(modal);
      expect((modal as any).present).toHaveBeenCalled();
    });

    it('should react to orientation change when a modal is open', async () => {
      const modal = createModalMock(HelpModalComponent);
      modalControllerSpy.create.and.resolveTo(modal);
      const classSpy = spyOn(
        service,
        'setModalLandscapeClasses'
      ).and.callThrough();
      await service.openHelpModal();
      globalThis.dispatchEvent(new Event('orientationchange'));
      expect(classSpy).toHaveBeenCalledTimes(2);
    });

    it('should open changelog modal and pass markdown path', async () => {
      const modal = createModalMock(MarkdownViewerComponent);
      modalControllerSpy.create.and.resolveTo(modal);
      await service.openChangelog();
      expect(modalControllerSpy.create).toHaveBeenCalledWith({
        component: MarkdownViewerComponent,
        componentProps: {
          fullChangeLogPath: 'assets/logs/CHANGELOG.md',
        },
      });
      expect((modal as any).present).toHaveBeenCalled();
    });

    it('should open user detail modal and pass component props', async () => {
      const modal = createModalMock(UserDetailComponent);
      modalControllerSpy.create.and.resolveTo(modal);
      const userStatistic = {} as DisplayedUserStatistics;
      await service.openUserDetail('en', userStatistic, DisplayMode.User);
      expect(modalControllerSpy.create).toHaveBeenCalledWith({
        component: UserDetailComponent,
        componentProps: {
          lang: 'en',
          userStatistic,
          displayMode: DisplayMode.User,
        },
      });
      expect((modal as any).present).toHaveBeenCalled();
    });

    it('should apply change-log, desktop and landscape classes for markdown modal', fakeAsync(() => {
      const modal = createModalMock(MarkdownViewerComponent);
      modal.classList.add('manual-instructions-modal', 'desktop', 'landscape');
      spyOnProperty(service, 'isDesktop', 'get').and.returnValue(true);
      spyOnProperty(service, 'isPortrait', 'get').and.returnValue(false);
      service.setModalLandscapeClasses(modal);
      tick(11);
      expect(modal.classList.contains('manual-instructions-modal')).toBeFalse();
      expect(modal.classList.contains('change-log-modal')).toBeTrue();
      expect(modal.classList.contains('desktop')).toBeTrue();
      expect(modal.classList.contains('landscape')).toBeTrue();
    }));

    it('should log error for unknown modal component', fakeAsync(() => {
      const modal = createModalMock({});
      const consoleErrorSpy = spyOn(console, 'error');
      service.setModalLandscapeClasses(modal);
      tick(11);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unknown modal component for setting landscape class'
      );
    }));
  });

  describe('Scrolling utilities', () => {
    it('should scroll to element and prevent default on scrollTo', () => {
      const scrollIntoView = jasmine.createSpy('scrollIntoView');
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as Event;
      spyOn(document, 'getElementById').and.returnValue({
        scrollIntoView,
      } as unknown as HTMLElement);
      service.scrollTo('target', event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should warn when target element does not exist in scrollTo', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as Event;
      spyOn(document, 'getElementById').and.returnValue(null);
      const warnSpy = spyOn(console, 'warn');
      service.scrollTo('missing-id', event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "Element with id 'missing-id' not found"
      );
    });

    it('should scroll to element start in scrollToElement', () => {
      const scrollIntoView = jasmine.createSpy('scrollIntoView');
      spyOn(document, 'getElementById').and.returnValue({
        scrollIntoView,
      } as unknown as HTMLElement);
      service.scrollToElement('target');
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });

    it('should calculate offset and call scrollTo in scrollToElementUsingTabBar', () => {
      const scrollTo = jasmine.createSpy('scrollTo');
      spyOnProperty(globalThis, 'pageYOffset', 'get').and.returnValue(200);
      spyOn(document, 'getElementById').and.returnValue({
        getBoundingClientRect: () => ({ top: 100 }),
        scrollTo,
      } as unknown as HTMLElement);
      service.scrollToElementUsingTabBar('target');
      expect(scrollTo).toHaveBeenCalledWith({
        top: 196,
        behavior: 'smooth',
      });
    });
  });

  describe('Date formatting', () => {
    it('should format date to ISO date string', () => {
      const result = service.formatDateISO(new Date(2024, 0, 5));
      expect(result).toBe('2024-01-05');
    });

    it('should format date to ISO date time string', () => {
      const result = service.formatDateTimeISO(new Date(2024, 0, 5, 9, 7));
      expect(result).toBe('2024-01-05 09:07');
    });
  });

  describe('Device info and model/platform utilities', () => {
    it('should return device info with environment app version', () => {
      const result = service.getDeviceInfo();
      expect(result).toEqual(
        jasmine.objectContaining({
          userAgent: navigator.userAgent,
          language: navigator.language,
          appVersion: environment.version,
        })
      );
    });

    it('should return native platform string in normal mode for native users', () => {
      const userInfo = { isNative: true } as UserType;
      const result = service.getPlatform(userInfo);
      expect(result).toBe('native');
    });

    it('should return native platform string for native users', () => {
      const userInfo = { isNative: true } as UserType;
      const result = service.getPlatform(userInfo);
      expect(result).toBe('native');
    });

    it('should return web-mobile for mobile user agents', () => {
      const userInfo = {
        deviceInfo: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' },
      } as UserType;
      const result = service.getPlatform(userInfo);
      expect(result).toBe('web-mobile');
    });

    it('should return web-desktop for desktop user agents', () => {
      const userInfo = {
        deviceInfo: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      } as UserType;
      const result = service.getPlatform(userInfo);
      expect(result).toBe('web-desktop');
    });

    it('should normalize android model to uppercase without leading/trailing spaces', () => {
      const userInfo = {
        deviceInfo: {
          userAgent:
            'Mozilla/5.0 (Linux; Android 14; sm-a556b Build/UP1A.231005.007)',
        },
      } as UserType;
      const result = service.getModel(userInfo);
      expect(result).toBe('SM-A556B');
      expect(result.startsWith(' ')).toBeFalse();
      expect(result.endsWith(' ')).toBeFalse();
    });

    it('should keep model comparison-friendly formatting for longer android models', () => {
      const userInfo = {
        deviceInfo: {
          userAgent:
            'Mozilla/5.0 (Linux; Android 14; samsung a53 5g Build/UP1A.231005.007)',
        },
      } as UserType;
      const result = service.getModel(userInfo);
      expect(result).toBe('SAMSUNG  A53 5G');
      expect(result.startsWith(' ')).toBeFalse();
      expect(result.endsWith(' ')).toBeFalse();
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
