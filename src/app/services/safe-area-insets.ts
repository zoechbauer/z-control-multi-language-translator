import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SafeAreaInsets {
  constructor() {}

  setSafeAreaInsetsFix() {
    const insets = this.getSafeAreaInsets();
    document.documentElement.style.setProperty(
      '--safe-area-bottom-fix',
      `${insets.bottom}px`
    );
    document.documentElement.style.setProperty(
      '--safe-area-right-fix',
      `${insets.right}px`
    );
  }

  private getSafeAreaInsets(): { bottom: number; right: number } {
    const bottomStr = getComputedStyle(
      document.documentElement
    ).getPropertyValue('env(safe-area-inset-bottom)');
    const rightStr = getComputedStyle(
      document.documentElement
    ).getPropertyValue('env(safe-area-inset-right)');
    const bottom = parseInt(bottomStr, 10);
    const right = parseInt(rightStr, 10);

    // console.log(`Raw insets from env - bottom: ${bottomStr}, right: ${rightStr}`);

    if (isNaN(bottom) || bottom === 0 || isNaN(right) || right === 0) {
      // set default values for screen sizes
      let fallbackBottom;
      let fallbackRight;

      const screenWidth = window.innerWidth;
      if (screenWidth <= 650) {
        fallbackBottom = 50;
        fallbackRight = 30;
      } else if (screenWidth <= 768) {
        fallbackBottom = 50;
        fallbackRight = 45;
      } else if (screenWidth <= 1080) {
        fallbackBottom = 64;
        fallbackRight = 45;
      } else {
        fallbackBottom = 80;
        fallbackRight = 45;
      }

      // use values from user agent detection or default values
      const userAgent = navigator.userAgent || navigator.vendor;

      // Galaxy A33 specific
      if (/SM-A336/i.test(userAgent)) {
        fallbackBottom = 50;
        fallbackRight = 45;
      }

      // Galaxy A55 specific
      if (/SM-A556/i.test(userAgent)) {
        fallbackBottom = 50;
        fallbackRight = 65;
      }

      // Galaxy J5 specific
      if (/SM-J530F/i.test(userAgent)) {
        fallbackBottom = 0;
        fallbackRight = 0;
      }
      // console.log(`Fixed device insets - screenWidth: ${screenWidth}px, user agent: ${userAgent}, bottom: ${fallbackBottom}px, right: ${fallbackRight}px`);
      return { bottom: fallbackBottom, right: fallbackRight };
    }
    // console.log(`Detected insets from env - bottom: ${bottom}px, right: ${right}px`);
    return { bottom, right };
  }
}
