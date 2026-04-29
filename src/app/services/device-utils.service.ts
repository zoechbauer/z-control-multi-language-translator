import { environment } from 'src/environments/environment';
import { DeviceInfo, UserType } from '../shared/firebase-firestore.interfaces';
import { AppleDeviceTypeEnum, WebPlatformTypeEnum } from '../shared/enums';

export class DeviceUtils {
  static isPhoneOrTabletWeb(userAgent = '', platform = ''): boolean {
    const ua = userAgent.toLowerCase();
    const pf = platform.toLowerCase();

    if (DeviceUtils.isAndroidPhone(ua)) return true;
    if (DeviceUtils.isAndroidTablet(ua)) return true;
    
    if (DeviceUtils.isIPhone(ua, pf)) return true;
    if (DeviceUtils.isIPad(ua, pf)) return true;

    return false;
  }

  /**
   * Determines the web platform type for a given user.
   * @param userInfo The user information
   * @returns The web platform type as a string ('native', 'web-mobile', 'web-desktop')
   */
  static getWebPlatform(userInfo: UserType): WebPlatformTypeEnum {
    if (userInfo?.isNative === true) {
      return WebPlatformTypeEnum.Native;
    }

    const ua = userInfo?.deviceInfo?.userAgent || '';
    const pf = userInfo?.deviceInfo?.platform || '';

    return DeviceUtils.isPhoneOrTabletWeb(ua, pf)
      ? WebPlatformTypeEnum.WebMobile
      : WebPlatformTypeEnum.WebDesktop;
  }

  /**
   * Returns device information such as user agent, platform, language, and app version.
   */
  static getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      appVersion: environment.version,
    };
  }

  /**
   * Determines the device model for a given user.
   * @param userInfo The user information
   * @returns The device model as a string
   */
  static getModel(userInfo: UserType): string {
    const userAgent = (userInfo?.deviceInfo?.userAgent || '').toLowerCase();
    const model = DeviceUtils.getModelFromUserAgent(userAgent);
    const normalizedModel = model?.trim().toUpperCase() ?? '';

    if (!normalizedModel) {
      return '';
    }

    // Keep long model names readable without introducing leading/trailing spaces.
    return normalizedModel.length > 8
      ? `${normalizedModel.substring(0, 8)} ${normalizedModel.substring(8)}`
      : normalizedModel;
  }

  private static getModelFromUserAgent(userAgent: string): string | null {
    return (
      DeviceUtils.getAndroidModelFromUserAgent(userAgent) ||
      DeviceUtils.detectAppleDevice(userAgent)
    );
  }

  /**
   * Extracts the Android device model from the user agent string.
   * @param userAgent The user agent string
   * @returns The Android model name or null if not found
   */
  private static getAndroidModelFromUserAgent(
    userAgent: string
  ): string | null {
    const ua = (userAgent || '').toLowerCase();
    const match = /android\s+[\d.]+;\s*([^;]+?)\s+build\//i.exec(ua);
    return match?.[1]?.trim() ?? null;
  }

  static detectAppleDevice(
    userAgent = navigator.userAgent,
    platform = navigator.platform
  ): AppleDeviceTypeEnum | null {
    const ua = userAgent.toLowerCase();
    const pf = platform.toLowerCase();

    if (DeviceUtils.isIPhone(userAgent, platform)) {
      return AppleDeviceTypeEnum.iPhone;
    }
    if (DeviceUtils.isIPad(userAgent, platform)) {
      return AppleDeviceTypeEnum.iPad;
    }

    if (/macintosh|mac os x/.test(ua) || /macintel/.test(pf)) {
      return AppleDeviceTypeEnum.Mac;
    }

    return null;
  }

  static isIPhone(userAgent = '', platform = ''): boolean {
    const ua = userAgent.toLowerCase();
    const pf = platform.toLowerCase();

    return /iphone/.test(ua) || /iphone/.test(pf);
  }

  static isIPad(userAgent = '', platform = ''): boolean {
    const ua = userAgent.toLowerCase();
    const pf = platform.toLowerCase();

    if (/ipad/.test(ua) || /ipad/.test(pf)) {
      return true;
    }

    // Intentional tradeoff:
    // Real iPads in Safari desktop mode can report a Macintosh-style UA.
    // We intentionally classify Safari-on-Macintosh UAs as iPad so iPads are
    // not shown as Mac, accepting possible false positives for real Mac Safari.
    if (
      /macintosh|mac os x/.test(ua) &&
      /safari/.test(ua) &&
      !/(electron|chrome|crios|firefox|edg|opera|opr)/i.test(ua)
    ) {
      return true;
    }

    return false;
  }

  static isAndroidPhone(userAgent = ''): boolean {
    const ua = userAgent.toLowerCase();

    return /android.*mobile|windows phone|iemobile/.test(ua);
  }

  static isAndroidTablet(userAgent = ''): boolean {
    const ua = userAgent.toLowerCase();

    return /android/.test(ua) && !/mobile/.test(ua);
  }
}
