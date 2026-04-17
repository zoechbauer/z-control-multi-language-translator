import { environment } from 'src/environments/environment';
import { DeviceUtils } from './device-utils.service';
import { UserType } from '../shared/firebase-firestore.interfaces';
import { AppleDeviceTypeEnum, WebPlatformTypeEnum } from '../shared/enums';

// mock for navigator.userAgent
interface MockUserAgent {
  userAgent: string;
  platform: string;
}

function createMockUserAgent(ua: string, platform = ''): MockUserAgent {
  return { userAgent: ua, platform };
}

describe('DeviceUtils', () => {
  // test data from real IOS devices
  const iPhoneUa =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.47 Mobile/15E148 Safari/604.1';

  const iPadSafariWebUa1 =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.5 Safari/605.1.15';

  const iPadSafariWebUa2 =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6.2 Safari/605.1.15';

  // test data from real Android devices
  const SamsungGalaxyA33NativeUa =
    'Mozilla/5.0 (Linux; Android 16; SM-A336B Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.177 Mobile Safari/537.36';

  const SamsungGalaxyA33WebUa =
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36';

  const SamsungGalaxyTabA7NativeUa =
    'Mozilla/5.0 (Linux; Android 11; SM-T505 Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.177 Safari/537.36';

  const SamsungGalaxyTabA7WebUa =
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

  describe('isIPhone - from user agent', () => {
    it('should detect iPhone from iPhone UA', () => {
      const ctx = createMockUserAgent(iPhoneUa, '');

      const result = DeviceUtils.isIPhone(ctx.userAgent, ctx.platform);

      expect(result).toBe(true);
    });

    it('should not detect iPhone from iPad Safari Web UA', () => {
      const result1 = DeviceUtils.isIPhone(iPadSafariWebUa1, '');
      const result2 = DeviceUtils.isIPhone(iPadSafariWebUa2, '');

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('isIPad - from user agent', () => {
    it('should detect iPad from iPad UA (classical)', () => {
      const ua =
        'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile Safari/604.1';
      const result = DeviceUtils.isIPad(ua, '');
      expect(result).toBe(true);
    });

    it('should detect iPad from iPad Safari Desktop UA (1)', () => {
      const result = DeviceUtils.isIPad(iPadSafariWebUa1, '');
      expect(result).toBe(true);
    });

    it('should detect iPad from iPad Safari Desktop UA (2)', () => {
      const result = DeviceUtils.isIPad(iPadSafariWebUa2, '');
      expect(result).toBe(true);
    });

    it('should not detect iPad from Chrome Mac UA', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = DeviceUtils.isIPad(ua, '');
      expect(result).toBe(false);
    });

    it('should not detect iPad from Firefox Mac UA', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0';
      const result = DeviceUtils.isIPad(ua, '');
      expect(result).toBe(false);
    });

    it('should not detect iPad from Electron UA', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) MyApp Electron/1.0.0 Safari/537.36';
      const result = DeviceUtils.isIPad(ua, '');
      expect(result).toBe(false);
    });

    it('should classify Safari Macintosh UA as iPad (intentional heuristic)', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.5 Safari/605.1.15';
      const result = DeviceUtils.isIPad(ua, 'MacIntel');
      expect(result).toBe(true);
    });
  });

  describe('isAndroidPhone - from user agent', () => {
    it('should detect Android phone from native app UA', () => {
      const result = DeviceUtils.isAndroidPhone(SamsungGalaxyA33NativeUa);
      expect(result).toBe(true);
    });

    it('should detect Android phone from web browser UA', () => {
      const result = DeviceUtils.isAndroidPhone(SamsungGalaxyA33WebUa);
      expect(result).toBe(true);
    });

    it('should not detect Android tablet from web browser UA', () => {
      const result = DeviceUtils.isAndroidPhone(SamsungGalaxyTabA7WebUa);
      expect(result).toBe(false);
    });
  });

  describe('isAndroidTablet - from user agent', () => {
    it('should detect Android tablet from native app UA', () => {
      const result = DeviceUtils.isAndroidTablet(SamsungGalaxyTabA7NativeUa);
      expect(result).toBe(true);
    });

    it('should detect Android tablet from web browser UA', () => {
      const result = DeviceUtils.isAndroidTablet(SamsungGalaxyTabA7WebUa);
      expect(result).toBe(true);
    });

    it('should not detect Android phone from web browser UA', () => {
      const result = DeviceUtils.isAndroidTablet(SamsungGalaxyA33WebUa);
      expect(result).toBe(false);
    });
  });

  describe('detectAppleDevice - from user agent', () => {
    it('should detect iPhone', () => {
      const result = DeviceUtils.detectAppleDevice(iPhoneUa, '');
      expect(result).toBe(AppleDeviceTypeEnum.iPhone);
    });

    it('should detect iPad (Safari Desktop UA)', () => {
      const result1 = DeviceUtils.detectAppleDevice(iPadSafariWebUa1, '');
      const result2 = DeviceUtils.detectAppleDevice(iPadSafariWebUa2, '');

      expect(result1).toBe(AppleDeviceTypeEnum.iPad);
      expect(result2).toBe(AppleDeviceTypeEnum.iPad);
    });

    it('should detect iPad (classic iPad UA)', () => {
      const ua =
        'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile Safari/604.1';
      const result = DeviceUtils.detectAppleDevice(ua, '');
      expect(result).toBe(AppleDeviceTypeEnum.iPad);
    });

    it('should classify Safari Macintosh UA as iPad (iPad-first behavior)', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.5 Safari/605.1.15';
      const result = DeviceUtils.detectAppleDevice(ua, 'MacIntel'); // nur für Test; dein UA ist ja dasselbe
      expect(result).toBe(AppleDeviceTypeEnum.iPad);
    });

    it('should return Mac for non‑Apple browser on Mac', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0';
      const result = DeviceUtils.detectAppleDevice(ua, 'MacIntel');
      expect(result).toBe(AppleDeviceTypeEnum.Mac);
    });
  });

  describe('isPhoneOrTabletWeb - from user agent', () => {
    const isPhoneOrTabletWebFromUserAgent = (ua: string): boolean =>
      DeviceUtils.isPhoneOrTabletWeb(ua, '');

    it('should treat iPhone UA as mobile web', () => {
      const result = isPhoneOrTabletWebFromUserAgent(iPhoneUa);
      expect(result).toBe(true);
    });

    it('should treat iPad Safari Desktop UA1 as mobile web', () => {
      const result = isPhoneOrTabletWebFromUserAgent(iPadSafariWebUa1);
      expect(result).toBe(true);
    });

    it('should treat iPad Safari Desktop UA2 as mobile web', () => {
      const result = isPhoneOrTabletWebFromUserAgent(iPadSafariWebUa2);
      expect(result).toBe(true);
    });

    it('should treat Android phone (no native) as mobile web', () => {
      const result = isPhoneOrTabletWebFromUserAgent(SamsungGalaxyA33WebUa);
      expect(result).toBe(true);
    });

    it('should treat Android tablet (no native) as mobile web', () => {
      const result = isPhoneOrTabletWebFromUserAgent(SamsungGalaxyTabA7WebUa);
      expect(result).toBe(true);
    });

    it('should treat regular Mac Firefox as desktop web', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0';
      const result = DeviceUtils.isPhoneOrTabletWeb(ua, 'MacIntel');
      expect(result).toBe(false);
    });

    it('should treat Windows Chrome as desktop web', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = DeviceUtils.isPhoneOrTabletWeb(ua, 'Win32');
      expect(result).toBe(false);
    });
  });

  describe('Device info and model/platform utilities', () => {
    it('should return device info with environment app version', () => {
      const result = DeviceUtils.getDeviceInfo();
      expect(result).toEqual(
        jasmine.objectContaining({
          userAgent: navigator.userAgent,
          language: navigator.language,
          appVersion: environment.version,
        })
      );
    });

    it('should return native platform string for native users', () => {
      const userInfo = { isNative: true } as UserType;
      const result = DeviceUtils.getWebPlatform(userInfo);
      expect(result).toBe(WebPlatformTypeEnum.Native);
    });

    it('should return web-mobile for mobile user agents', () => {
      const userInfo = {
        deviceInfo: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' },
      } as UserType;
      const result = DeviceUtils.getWebPlatform(userInfo);
      expect(result).toBe(WebPlatformTypeEnum.WebMobile);
    });

    it('should return web-desktop for desktop user agents', () => {
      const userInfo = {
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      } as UserType;
      const result = DeviceUtils.getWebPlatform(userInfo);
      expect(result).toBe(WebPlatformTypeEnum.WebDesktop);
    });

    it('should normalize android model to uppercase without leading/trailing spaces', () => {
      const userInfo = {
        deviceInfo: {
          userAgent:
            'Mozilla/5.0 (Linux; Android 14; sm-a556b Build/UP1A.231005.007)',
        },
      } as UserType;

      const result = DeviceUtils.getModel(userInfo);

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

      const result = DeviceUtils.getModel(userInfo);

      expect(result).toBe('SAMSUNG  A53 5G');
      expect(result.startsWith(' ')).toBeFalse();
      expect(result.endsWith(' ')).toBeFalse();
    });
  });

  describe('getWebPlatform', () => {
    const createMockUserInfo = (
      userAgent: string,
      platform = '',
      isNative?: boolean
    ): any => ({
      isNative,
      deviceInfo: {
        userAgent,
        platform,
        language: 'en',
        appVersion: '1.0.0',
      },
    });

    it('should return native for isNative = true', () => {
      const userInfo = createMockUserInfo('', '', true);
      const result = DeviceUtils.getWebPlatform(userInfo);
      expect(result).toBe('native');
    });

    it('should return web-mobile for iPhone', () => {
      const userInfo = createMockUserInfo(iPhoneUa, 'iPhone');
      const result = DeviceUtils.getWebPlatform(userInfo);
      expect(result).toBe('web-mobile');
    });

    it('should return web-mobile for iPad Safari Web UA1', () => {
      const userInfo = createMockUserInfo(iPadSafariWebUa1, 'MacIntel');
      const result = DeviceUtils.getWebPlatform(userInfo);
      expect(result).toBe('web-mobile');
    });

    it('should return web-mobile for iPad Safari Web UA2', () => {
      const userInfo = createMockUserInfo(iPadSafariWebUa2, 'MacIntel');
      const result = DeviceUtils.getWebPlatform(userInfo);
      expect(result).toBe('web-mobile');
    });

    it('should return web-desktop for Windows Chrome', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const userInfo = createMockUserInfo(ua, 'Win32');
      const result = DeviceUtils.getWebPlatform(userInfo);
      expect(result).toBe('web-desktop');
    });
  });
});
