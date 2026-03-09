import { Injectable } from '@angular/core';

type Insets = { top: number; bottom: number; right: number };

type InsetConfig = {
  pattern: RegExp;
  top: number;
  bottom: number;
  right: number;
};

@Injectable({
  providedIn: 'root',
})
export class SafeAreaInsetsService {
  DEVICE_INSET_CONFIG: InsetConfig[] = [
    // *** Samsung devices ***
    // Older, smaller devices
    { pattern: /SM-J530F/i, top: 0, bottom: 0, right: 0 }, // Galaxy J5

    // Compact S-Series (S22/S23)
    { pattern: /SM-S901|SM-S911/i, top: 24, bottom: 50, right: 40 },

    // Mid-range S-Series (Plus)
    { pattern: /SM-S906|SM-S916/i, top: 24, bottom: 50, right: 45 },

    // Ultra models
    { pattern: /SM-S908|SM-S918/i, top: 24, bottom: 50, right: 55 },

    // Axx with 6.4–6.6" FHD+ (A33/A34/A54)
    { pattern: /SM-A336|SM-A346|SM-A546/i, top: 24, bottom: 50, right: 45 },

    // A5x mid-range (A52s/A53)
    { pattern: /SM-A528|SM-A536/i, top: 24, bottom: 50, right: 50 },

    // A55 unique value
    { pattern: /SM-A556/i, top: 24, bottom: 50, right: 65 },

    // Entry-level models A14/A15/A25
    { pattern: /SM-A146|SM-A156|SM-A256/i, top: 24, bottom: 50, right: 55 },

    // Additional A-models (Catch-all for A-Series, if not yet captured)
    { pattern: /SM-A\d{3}/i, top: 24, bottom: 50, right: 50 },

    // Fold / Flip
    { pattern: /SM-F94\d/i, top: 24, bottom: 60, right: 60 }, // Z Fold5
    { pattern: /SM-F73\d/i, top: 24, bottom: 50, right: 50 }, // Z Flip5
  ];

  constructor() {}

  /**
   * Calculates safe area insets for the device and applies them as CSS variables.
   * Sets --safe-area-top-fix, --safe-area-bottom-fix, and --safe-area-right-fix
   * based on device detection and screen dimensions.
   */
  setSafeAreaInsetsFix() {
    const insets: Insets = this.computeInsets(
      window.innerWidth,
      navigator.userAgent
    );

    document.documentElement.style.setProperty(
      '--safe-area-top-fix',
      `${insets.top}px`
    );
    document.documentElement.style.setProperty(
      '--safe-area-bottom-fix',
      `${insets.bottom}px`
    );
    document.documentElement.style.setProperty(
      '--safe-area-right-fix',
      `${insets.right}px`
    );
  }

  /**
   * Computes safe area insets by matching the device user agent against known device patterns.
   * Falls back to screen-width-based defaults if no specific device is matched.
   *
   * @param screenWidth - The width of the screen in pixels (window.innerWidth).
   * @param userAgent - The user agent string (navigator.userAgent).
   * @returns Safe area insets { top, bottom, right } in pixels.
   */
  private computeInsets(screenWidth: number, userAgent: string): Insets {
    let insets = this.getDefaultInsets(screenWidth);

    const ua = userAgent || '';

    for (const cfg of this.DEVICE_INSET_CONFIG) {
      if (cfg.pattern.test(ua)) {
        insets = {
          top: cfg.top,
          bottom: cfg.bottom,
          right: cfg.right,
        };
        // console.log(
        //   `Matched device pattern: ${cfg.pattern}, applying insets:`,
        //   insets
        // );
        break; // first match wins
      }
    }

    return insets;
  }

  /**
   * Returns default safe area insets based on screen width breakpoints.
   * Used as fallback for devices without specific configurations.
   *
   * @param screenWidth - The width of the screen in pixels.
   * @returns Safe area insets { top, bottom, right } in pixels for the given screen width.
   */
  private getDefaultInsets(screenWidth: number): Insets {
    if (screenWidth <= 650) {
      return { top: 0, bottom: 50, right: 30 };
    } else if (screenWidth <= 768) {
      return { top: 0, bottom: 50, right: 45 };
    } else if (screenWidth <= 1080) {
      return { top: 0, bottom: 64, right: 45 };
    } else {
      return { top: 0, bottom: 80, right: 45 };
    }
  }
}
