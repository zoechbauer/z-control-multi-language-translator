import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { SpinnerComponent } from './spinner.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

describe('SpinnerComponent', () => {
  let component: SpinnerComponent;
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), SpinnerComponent],
      providers: [
        { provide: TranslateService, useValue: createTranslateServiceMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('template rendering', () => {
    it('should display loading text when showText is true', () => {
      component.showText = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p')?.textContent).toContain(
        'APP.LOADING_DATA'
      );
    });

    it('should not display loading text when showText is false', () => {
      component.showText = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p')).toBeNull();
    });
  });
});
