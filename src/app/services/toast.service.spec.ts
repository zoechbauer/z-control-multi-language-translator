import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, ToastController } from '@ionic/angular';

import { ToastService } from './toast.service';
import { UtilsService } from './utils.service';

describe('ToastService', () => {
  let service: ToastService;
  const toastControllerSpy = jasmine.createSpyObj('ToastController', [
    'create',
  ]);
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
    'instant',
    'get',
  ]);
  translateServiceSpy.onLangChange = of({});
  const utilsService: any = {};
  const modalControllerSpy = jasmine.createSpyObj('ModalController', [
    'dismiss',
    'create',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: UtilsService, useValue: utilsService },
        { provide: ToastController, useValue: toastControllerSpy },
      ],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('toast positioning based on app type', () => {
    let toastController: jasmine.SpyObj<ToastController>;
    let mockToast: jasmine.SpyObj<HTMLIonToastElement>;

    beforeEach(() => {
      Object.defineProperty(utilsService, 'isDesktop', {
        get: () => false,
        configurable: true,
      });

      toastController = TestBed.inject(
        ToastController
      ) as jasmine.SpyObj<ToastController>;

      // Basic toast mock
      mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
      mockToast.present.and.returnValue(Promise.resolve());
      toastController.create.and.returnValue(Promise.resolve(mockToast));
    });

    it('should show toast at bottom on desktop', () => {
      spyOnProperty(utilsService, 'isDesktop', 'get').and.returnValue(true);
      
      service.showToast('Test Message');
      
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          position: 'bottom',
        })
      );
    });

    it('should show toast at top on mobile', () => {
      spyOnProperty(utilsService, 'isDesktop', 'get').and.returnValue(false);
      
      service.showToast('Test Message');
      
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          position: 'top',
        })
      );
    });
  });

  describe('showToast method', () => {
    let toastController: jasmine.SpyObj<ToastController>;
    let mockToast: jasmine.SpyObj<HTMLIonToastElement>;

    beforeEach(() => {
      toastController = TestBed.inject(
        ToastController
      ) as jasmine.SpyObj<ToastController>;

      // Basic toast mock
      mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
      mockToast.present.and.returnValue(Promise.resolve());
      toastController.create.and.returnValue(Promise.resolve(mockToast));
    });

    it('should show toast', () => {
      // Arrange
      const message = 'Test Message';
      const duration = 3000;
      translateServiceSpy.instant.and.returnValue(message);
      // Act
      service.showToast(message);
      // Assert
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message,
          duration,
        })
      );
    });

    it('should handle error when toast presentation fails', async () => {
      // Arrange
      const message = 'Test Message';
      translateServiceSpy.instant.and.returnValue(message);
      spyOn(service, 'showToastMessage').and.returnValue(Promise.reject('Toast creation failed'));
      const consoleErrorSpy = spyOn(console, 'error');
      // Act
      await service.showToast(message);
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error presenting toast:', 'Toast creation failed');
    });
  });

  describe('showDisabledToast method', () => {
    let toastController: jasmine.SpyObj<ToastController>;
    let mockToast: jasmine.SpyObj<HTMLIonToastElement>;

    beforeEach(() => {
      toastController = TestBed.inject(
        ToastController
      ) as jasmine.SpyObj<ToastController>;

      // Basic toast mock
      mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
      mockToast.present.and.returnValue(Promise.resolve());
      toastController.create.and.returnValue(Promise.resolve(mockToast));
    });

    it('should show disabled toast', () => {
      // Arrange
      const message = 'Test Message';
      const duration = 3000;
      translateServiceSpy.instant.and.returnValue(message);
      // Act
      service.showDisabledToast(message);
      // Assert
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message,
          duration,
        })
      );
    });

    it('should handle error when toast presentation fails', async () => {
      // Arrange
      const message = 'Test Message';
      translateServiceSpy.instant.and.returnValue(message);
      spyOn(service, 'showToastMessage').and.returnValue(Promise.reject('Toast creation failed'));
      const consoleErrorSpy = spyOn(console, 'error');
      // Act
      await service.showDisabledToast(message);
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error presenting toast:','Toast creation failed');
    });
  });
});
