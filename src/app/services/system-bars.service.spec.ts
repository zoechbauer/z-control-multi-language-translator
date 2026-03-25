import { TestBed } from '@angular/core/testing';

import { SystemBarsService } from './system-bars.service';

describe('SystemBarsService', () => {
  let service: SystemBarsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
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
    let setBackgroundColorSpy: jasmine.Spy;
    let setStyleSpy: jasmine.Spy;
    let setNavigationBarColorSpy: jasmine.Spy;

    beforeEach(() => {
      setBackgroundColorSpy = jasmine
        .createSpy('setBackgroundColor')
        .and.returnValue(Promise.resolve());

      setStyleSpy = jasmine
        .createSpy('setStyle')
        .and.returnValue(Promise.resolve());

      setNavigationBarColorSpy = jasmine
        .createSpy('setNavigationBarColor')
        .and.returnValue(Promise.resolve());

      spyOn<any>(service, 'getStatusBar').and.returnValue({
        setBackgroundColor: setBackgroundColorSpy,
        setStyle: setStyleSpy,
      });

      spyOn<any>(service, 'getNavigationBar').and.returnValue({
        setNavigationBarColor: setNavigationBarColorSpy,
      });
    });

    it('sets dark mode bars', async () => {
      await service.setBars(true);

      expect(setBackgroundColorSpy).toHaveBeenCalledWith({ color: '#000000' });
      expect(setStyleSpy).toHaveBeenCalledWith({ style: jasmine.anything() });
      expect(setNavigationBarColorSpy).toHaveBeenCalledWith({
        color: jasmine.anything(),
        darkButtons: false,
      });
    });

    it('sets light mode bars', async () => {
      await service.setBars(false);

      expect(setBackgroundColorSpy).toHaveBeenCalledWith({ color: '#3880ff' });
      expect(setStyleSpy).toHaveBeenCalledWith({ style: jasmine.anything() });
      expect(setNavigationBarColorSpy).toHaveBeenCalledWith({
        color: jasmine.anything(),
        darkButtons: true,
      });
    });

    it('uses dark style override for Samsung SM-A models', async () => {
      spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('SM-A336B');

      await service.setBars(false);

      expect(setStyleSpy).toHaveBeenCalledWith({ style: jasmine.anything() });
    });

    it('rejects when status bar call fails', async () => {
      setStyleSpy.and.returnValue(Promise.reject(new Error('status fail')));

      await expectAsync(service.setBars(true)).toBeRejectedWithError(
        'status fail'
      );
    });
  });
});
