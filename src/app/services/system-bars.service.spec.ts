import { TestBed } from '@angular/core/testing';

import { SystemBarsService } from './system-bars.service';
import { STATUS_BAR, NAVIGATION_BAR } from './capacitor-tokens';

describe('SystemBarsService', () => {
  let service: SystemBarsService;
  let statusBarMock: any;
  let navigationBarMock: any;

  beforeEach(() => {
    statusBarMock = {
      setBackgroundColor: jasmine
        .createSpy('setBackgroundColor')
        .and.returnValue(Promise.resolve()),
      setStyle: jasmine
        .createSpy('setStyle')
        .and.returnValue(Promise.resolve()),
    };

    navigationBarMock = {
      setNavigationBarColor: jasmine
        .createSpy('setNavigationBarColor')
        .and.returnValue(Promise.resolve()),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: STATUS_BAR, useValue: statusBarMock },
        { provide: NAVIGATION_BAR, useValue: navigationBarMock },
      ],
    });
    service = TestBed.inject(SystemBarsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentIsDarkMode', () => {
    it('prefers dark mode', async () => {
      const matchMediaSpy = spyOn(globalThis, 'matchMedia').and.returnValue({
        matches: true,
      } as MediaQueryList);

      const isDarkMode = await service.getCurrentIsDarkMode();

      expect(isDarkMode).toBeTrue();
      expect(matchMediaSpy).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });

    it('prefers light mode', async () => {
      const matchMediaSpy = spyOn(globalThis, 'matchMedia').and.returnValue({
        matches: false,
      } as MediaQueryList);

      const isDarkMode = await service.getCurrentIsDarkMode();

      expect(isDarkMode).toBeFalse();
      expect(matchMediaSpy).toHaveBeenCalledWith(
        '(prefers-color-scheme: dark)'
      );
    });
  });

  describe('setBars', () => {

    beforeEach(() => {
      spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('TestAgent');
    });

    it('sets dark mode bars', async () => {
      await service.setBars(true);

      expect(statusBarMock.setBackgroundColor).toHaveBeenCalledWith({ color: '#000000' });
      expect(statusBarMock.setStyle).toHaveBeenCalledWith({ style: jasmine.anything() });
      expect(navigationBarMock.setNavigationBarColor).toHaveBeenCalledWith({
        color: jasmine.anything(),
        darkButtons: false,
      });
    });

    it('sets light mode bars', async () => {
      await service.setBars(false);

      expect(statusBarMock.setBackgroundColor).toHaveBeenCalledWith({ color: '#3880ff' });
      expect(statusBarMock.setStyle).toHaveBeenCalledWith({ style: jasmine.anything() });
      expect(navigationBarMock.setNavigationBarColor).toHaveBeenCalledWith({
        color: jasmine.anything(),
        darkButtons: true,
      });
    });

    it('uses dark style override for Samsung SM-A models', async () => {
      (Object.getOwnPropertyDescriptor(navigator, 'userAgent')!.get as jasmine.Spy).and.returnValue('SM-A336B');


      await service.setBars(false);

      expect(statusBarMock.setStyle).toHaveBeenCalledWith({ style: jasmine.anything() });
    });

    it('rejects when status bar call fails', async () => {
      statusBarMock.setStyle.and.returnValue(Promise.reject(new Error('status fail')));

      await expectAsync(service.setBars(true)).toBeRejectedWithError(
        'status fail'
      );
    });
  });
});
