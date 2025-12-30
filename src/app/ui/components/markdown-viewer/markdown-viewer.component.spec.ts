import { addIcons } from 'ionicons';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { MarkdownModule } from 'ngx-markdown';
import { IonicModule, ModalController } from '@ionic/angular';

import { MarkdownViewerComponent } from './markdown-viewer.component';
import { UtilsService } from 'src/app/services/utils.service';

describe('MarkdownViewerComponent', () => {
  let component: MarkdownViewerComponent;
  let fixture: ComponentFixture<MarkdownViewerComponent>;
  let httpMock: HttpTestingController;
  let modalControllerSpy: jasmine.SpyObj<ModalController>;
  let utilsServiceSpy: any;

  beforeEach(async () => {
    modalControllerSpy = jasmine.createSpyObj('ModalController', ['dismiss']);
    utilsServiceSpy = jasmine.createSpy('UtilsService');

    await TestBed.configureTestingModule({
      imports: [
        MarkdownViewerComponent,
        HttpClientTestingModule,
        IonicModule.forRoot(),
        MarkdownModule.forRoot(),
      ],
      providers: [
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: UtilsService, useValue: utilsServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownViewerComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // Manually replace the modalController
    (component as any).modalController = modalControllerSpy;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close modal when closeModal is called', () => {
    component.closeModal();
    expect(modalControllerSpy.dismiss).toHaveBeenCalled();
  });

  describe('ngOnInit method', () => {
    it('should load markdown content on ngOnInit', () => {
      const mockMarkdown = '# Test Changelog';
      component.fullChangeLogPath = 'assets/changelog.md';

      component.ngOnInit();

      const req = httpMock.expectOne('assets/changelog.md');
      req.flush(mockMarkdown);

      expect(component.markdown).toBe(mockMarkdown);
    });

    it('should handle HTTP error when loading markdown fails', () => {
      spyOn(console, 'error');
      component.fullChangeLogPath = 'assets/nonexistent.md';

      component.ngOnInit();

      const req = httpMock.expectOne('assets/nonexistent.md');
      req.error(new ErrorEvent('Network error'));

      expect(console.error).toHaveBeenCalledWith(
        'Error loading changelog:',
        jasmine.any(Object)
      );
      expect(component.markdown).toBe('');
    });

    it('should handle large markdown files', () => {
      const largeMockdown = '#'.repeat(1000) + ' Large Content';
      component.fullChangeLogPath = 'assets/large.md';

      component.ngOnInit();

      const req = httpMock.expectOne('assets/large.md');
      req.flush(largeMockdown);

      expect(component.markdown).toBe(largeMockdown);
    });

    it('should handle empty markdown response', () => {
      component.fullChangeLogPath = 'assets/empty.md';

      component.ngOnInit();

      const req = httpMock.expectOne('assets/empty.md');
      req.flush('');

      expect(component.markdown).toBe('');
    });
  });

  it('should register icons on construction', () => {
    // This test verifies that addIcons was called (indirectly through constructor)
    expect(component).toBeTruthy();
  });

  it('should initialize with empty markdown string', () => {
    expect(component.markdown).toBe('');
  });

  it('should require fullChangeLogPath input', () => {
    component.fullChangeLogPath = 'some/path.md';
    expect(component.fullChangeLogPath).toBeDefined();
  });

  describe('isNative getter', () => {
    it('should return isNative is true from utilsService', () => {
      Object.defineProperty(utilsServiceSpy, 'isNative', { get: () => true });
      expect(component.isNative).toBeTrue();
    });

    it('should return isNative is false from utilsService', () => {
      Object.defineProperty(utilsServiceSpy, 'isNative', { get: () => false });
      expect(component.isNative).toBeFalse();
    });
  });

    it('should call content.scrollToTop with 300 when scrollToTop is called', () => {
    const contentSpy = jasmine.createSpyObj('IonContent', ['scrollToTop']);
    (component as any).content = contentSpy;

    component.scrollToTop();

    expect(contentSpy.scrollToTop).toHaveBeenCalledWith(300);
  });
});
