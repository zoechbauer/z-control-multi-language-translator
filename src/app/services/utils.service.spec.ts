import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular';

import { UtilsService } from './utils.service';
import { DisplayMode, Tab } from '../shared/enums';
import { environment } from '@env/environment';
import { HelpModalComponent } from '../ui/components/get-help/get-help.component';
import { MarkdownViewerComponent } from '../ui/components/markdown-viewer/markdown-viewer.component';
import { UserDetailComponent } from '../ui/components/user-detail/user-detail.component';
import { DisplayedUserStatistics } from '../shared/firebase-firestore.interfaces';
import { createTranslateServiceMock } from '../testing/translate-service.mock';
import { TranslateService } from '@ngx-translate/core';

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
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
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

    it('should return isPortrait=true when orientation is portrait', () => {
      spyOn(globalThis, 'matchMedia').and.returnValue({
        matches: true,
      } as MediaQueryList);

      expect(service.isPortrait).toBeTrue();
      expect(globalThis.matchMedia).toHaveBeenCalledWith(
        '(orientation: portrait)'
      );
    });

    it('should return isPortrait=false when orientation is landscape', () => {
      spyOn(globalThis, 'matchMedia').and.returnValue({
        matches: false,
      } as MediaQueryList);

      expect(service.isPortrait).toBeFalse();
      expect(globalThis.matchMedia).toHaveBeenCalledWith(
        '(orientation: portrait)'
      );
    });

    it('should return true when system prefers dark mode', () => {
      spyOn(globalThis, 'matchMedia').and.returnValue({
        matches: true,
      } as MediaQueryList);

      expect(service.isDarkMode).toBeTrue();
      expect(globalThis.matchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });

    it('should return false when system does not prefer dark mode', () => {
      spyOn(globalThis, 'matchMedia').and.returnValue({
        matches: false,
      } as MediaQueryList);

      expect(service.isDarkMode).toBeFalse();
      expect(globalThis.matchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });

    it('should throw when matchMedia is unavailable for isDarkMode', () => {
      spyOn(globalThis, 'matchMedia').and.returnValue(
        undefined as unknown as MediaQueryList
      );

      expect(() => service.isDarkMode).toThrow();
      expect(globalThis.matchMedia).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
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

    it('should return empty string and log error if date is invalid in formatDateISO', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const result = service.formatDateISO(new Date('invalid date'));

      expect(result).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid date provided for formatting:',
        jasmine.any(Date)
      );
    });

    it('should return empty string and log error if date is incomplete in formatDateISO', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const result = service.formatDateISO('2024-01' as unknown as Date);

      expect(result).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid date provided for formatting:',
        '2024-01'
      );
    });

    it('should return empty string but do not log error if date is null in formatDateISO', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const result = service.formatDateISO(null as unknown as Date);

      expect(result).toBe('');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('DateTime formatting', () => {
    it('should format date to ISO date time string', () => {
      const result = service.formatDateTimeISO(new Date(2024, 0, 5, 9, 7));
      expect(result).toBe('2024-01-05 09:07');
    });

    it('should return empty string and log error if date is invalid in formatDateTimeISO', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const result = service.formatDateTimeISO(new Date('invalid date'));

      expect(result).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid date provided for formatting:',
        jasmine.any(Date)
      );
    });

    it('should return empty string and log error if date is incomplete in formatDateTimeISO', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const result = service.formatDateTimeISO('2024-01' as unknown as Date);

      expect(result).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid date provided for formatting:',
        '2024-01'
      );
    });

    it('should return empty string but do not log error if date is null in formatDateTimeISO', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const result = service.formatDateTimeISO(null as unknown as Date);

      expect(result).toBe('');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('DateTime formatting for Firestore Search string', () => {
    it('should format date to YYYY-MM string', () => {
      const result = service.formatDateTimeFirestoreSearchString(
        new Date(2024, 0, 5, 9, 7)
      );
      expect(result).toBe('2024-01');
    });

    it('should return empty string and log error if date is invalid', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const result = service.formatDateTimeFirestoreSearchString(
        new Date('invalid date')
      );

      expect(result).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid date provided for formatting:',
        jasmine.any(Date)
      );
    });

    it('should return empty string and log error if date is incomplete in formatDateTimeISO', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const result = service.formatDateTimeFirestoreSearchString(
        '2024-01' as unknown as Date
      );

      expect(result).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid date provided for formatting:',
        '2024-01'
      );
    });

    it('should return empty string but do not log error if date is null in formatDateTimeISO', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const result = service.formatDateTimeFirestoreSearchString(
        null as unknown as Date
      );

      expect(result).toBe('');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('getAllFirestoreSearchStringsForMonth', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should return array of month strings for current month is 2026-04', () => {
      jasmine.clock().mockDate(new Date(2026, 3, 15));

      const result: string[] = service.getAllFirestoreSearchStringsForMonth();
      expect(result.length).toBe(4);
      expect(result[0]).toBe('2026-02');
      expect(result[1]).toBe('2026-03');
      expect(result[2]).toBe('2026-04');
      expect(result[3]).toBe(
        'SETTINGS.STATISTICS.FILTER.LABEL.FILTER_MONTH_DATA_ALL'
      );
    });

    it('should return array of month strings for current month is 2027-02', () => {
      jasmine.clock().mockDate(new Date(2027, 1, 15));

      const result: string[] = service.getAllFirestoreSearchStringsForMonth();
      expect(result.length).toBe(14);
      expect(result[0]).toBe('2026-02');
      expect(result[12]).toBe('2027-02');
      expect(result[13]).toBe(
        'SETTINGS.STATISTICS.FILTER.LABEL.FILTER_MONTH_DATA_ALL'
      );
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });
});
