import { TestBed } from '@angular/core/testing';

import { SafeAreaInsetsService } from './safe-area-insets.service';

describe('SafeAreaInsetsService', () => {
  let service: SafeAreaInsetsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SafeAreaInsetsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setSafeAreaInsetsFix', () => {
    let setPropertySpy: jasmine.Spy;

    beforeEach(() => {
      setPropertySpy = spyOn(document.documentElement.style, 'setProperty');
    });

    it('should set CSS variables for matched Samsung A33 device', () => {
      spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
        'Mozilla/5.0 (Linux; Android 16; SM-A336B Build/BP2A.250605.031.A3; wv)'
      );

      service.setSafeAreaInsetsFix();

      expect(setPropertySpy).toHaveBeenCalledWith(
        '--safe-area-top-fix',
        '24px'
      );
      expect(setPropertySpy).toHaveBeenCalledWith(
        '--safe-area-bottom-fix',
        '50px'
      );
      expect(setPropertySpy).toHaveBeenCalledWith(
        '--safe-area-right-fix',
        '45px'
      );
    });

    it('should not set a left inset variable', () => {
      spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
        'Mozilla/5.0 (Linux; Android 16; SM-A336B)'
      );

      service.setSafeAreaInsetsFix();

      expect(setPropertySpy).not.toHaveBeenCalledWith(
        '--safe-area-left-fix',
        jasmine.any(String)
      );
    });

    it('should use default insets for unknown device on small width', () => {
      spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
        'UnknownDevice'
      );

      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(600);

      service.setSafeAreaInsetsFix();

      expect(setPropertySpy).toHaveBeenCalledWith('--safe-area-top-fix', '0px');
      expect(setPropertySpy).toHaveBeenCalledWith(
        '--safe-area-bottom-fix',
        '50px'
      );
      expect(setPropertySpy).toHaveBeenCalledWith(
        '--safe-area-right-fix',
        '30px'
      );
    });

    it('should use default insets for tablet width', () => {
      spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(
        'UnknownDevice'
      );

      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(700);

      service.setSafeAreaInsetsFix();

      expect(setPropertySpy).toHaveBeenCalledWith('--safe-area-top-fix', '0px');
      expect(setPropertySpy).toHaveBeenCalledWith(
        '--safe-area-bottom-fix',
        '50px'
      );
      expect(setPropertySpy).toHaveBeenCalledWith(
        '--safe-area-right-fix',
        '45px'
      );
    });

    it('should use first matching config when multiple patterns could match', () => {
      // SM-A336B matches both specific A336 and generic SM-A\d{3}; first match should win.
      spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('SM-A336B');
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1200);

      service.setSafeAreaInsetsFix();

      expect(setPropertySpy).toHaveBeenCalledWith(
        '--safe-area-top-fix',
        '24px'
      );
      expect(setPropertySpy).toHaveBeenCalledWith(
        '--safe-area-bottom-fix',
        '50px'
      );
      expect(setPropertySpy).toHaveBeenCalledWith(
        '--safe-area-right-fix',
        '45px'
      );
    });
  });

  describe('internal inset computation', () => {
    describe('getDefaultInsets', () => {
      it('returns phone defaults for width <= 650', () => {
        const result = (service as any).getDefaultInsets(650);
        expect(result).toEqual({ top: 0, bottom: 50, right: 30 });
      });

      it('returns small-tablet defaults for width <= 768', () => {
        const result = (service as any).getDefaultInsets(700);
        expect(result).toEqual({ top: 0, bottom: 50, right: 45 });
      });

      it('returns medium-screen defaults for width <= 1080', () => {
        const result = (service as any).getDefaultInsets(900);
        expect(result).toEqual({ top: 0, bottom: 64, right: 45 });
      });

      it('returns large-screen defaults for width > 1080', () => {
        const result = (service as any).getDefaultInsets(1200);
        expect(result).toEqual({ top: 0, bottom: 80, right: 45 });
      });
    });

    describe('computeInsets', () => {
      it('returns matched device insets when user agent matches a specific config', () => {
        const result = (service as any).computeInsets(500, 'SM-A336B');
        expect(result).toEqual({ top: 24, bottom: 50, right: 45 });
      });

      it('falls back to defaults when user agent is empty', () => {
        const result = (service as any).computeInsets(600, '');
        expect(result).toEqual({ top: 0, bottom: 50, right: 30 });
      });

      it('falls back to defaults when user agent does not match any pattern', () => {
        const result = (service as any).computeInsets(900, 'UnknownDevice');
        expect(result).toEqual({ top: 0, bottom: 64, right: 45 });
      });

      it('uses first-match-wins for overlapping patterns', () => {
        // SM-A336B matches both specific A336 and generic SM-A\\d{3}; specific appears first.
        const result = (service as any).computeInsets(1200, 'SM-A336B');
        expect(result).toEqual({ top: 24, bottom: 50, right: 45 });
      });

      it('matches case-insensitively', () => {
        const result = (service as any).computeInsets(500, 'sm-a336b');
        expect(result).toEqual({ top: 24, bottom: 50, right: 45 });
      });
    });
  });
});
