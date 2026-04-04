import { TestBed } from '@angular/core/testing';
import { SPLASH_SCREEN, STATUS_BAR } from './capacitor-tokens';
import { CapacitorPlatformService } from './capacitor-platform.service';

describe('CapacitorPlatformService', () => {
  let service: CapacitorPlatformService;
  let splashScreenMock: any;
  let statusBarMock: any;

  beforeEach(() => {
    splashScreenMock = { hide: jasmine.createSpy('hide').and.resolveTo(undefined) };
    statusBarMock = {
      setOverlaysWebView: jasmine.createSpy('setOverlaysWebView').and.resolveTo(undefined),
      show: jasmine.createSpy('show').and.resolveTo(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        CapacitorPlatformService,
        { provide: SPLASH_SCREEN, useValue: splashScreenMock },
        { provide: STATUS_BAR, useValue: statusBarMock },
      ],
    });

    service = TestBed.inject(CapacitorPlatformService);
  });

  it('should call SplashScreen.hide', async () => {
    await service.hideSplashScreen();
    expect(splashScreenMock.hide).toHaveBeenCalled();
  });

  it('should call StatusBar.setOverlaysWebView with correct argument', async () => {
    await service.setStatusBarOverlay(false);
    expect(statusBarMock.setOverlaysWebView).toHaveBeenCalledWith({ overlay: false });
  });

  it('should call StatusBar.show', async () => {
    await service.showStatusBar();
    expect(statusBarMock.show).toHaveBeenCalled();
  });
});