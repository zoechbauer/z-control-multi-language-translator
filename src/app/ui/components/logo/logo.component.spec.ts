import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LogoComponent } from './logo.component';
import { LogoType } from 'src/app/enums';

describe('LogoComponent', () => {
  let component: LogoComponent;
  let fixture: ComponentFixture<LogoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [IonicModule.forRoot(), LogoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('setLogoText method', () => {
    it('should set logo text for Copyright type', () => {
      component.type = LogoType.Copyright;

      (component as any).setLogoText();

      expect(component.leftLogoText).toBe('© 2025');
      expect(component.rightLogoText).toBe('z-control');
    });

    it('should set logo text for Company type and Portrait orientation', () => {
      component.type = LogoType.Company;
      spyOnProperty(component as any, 'isPortrait', 'get').and.returnValue(
        true
      );

      (component as any).setLogoText();

      expect(component.leftLogoText).toBe('');
      expect(component.rightLogoText).toBe('');
    });

    it('should set logo text for Company type and Landscape orientation', () => {
      component.type = LogoType.Company;
      spyOnProperty(component as any, 'isPortrait', 'get').and.returnValue(
        false
      );

      (component as any).setLogoText();

      expect(component.leftLogoText).toBe('');
      expect(component.rightLogoText).toBe('z-control');
    });
  });

  describe('constructor, ngOnInit and window resize', () => {
    it('should register a resize listener in the constructor', () => {
      const addSpy = spyOn(window, 'addEventListener');

      const localFixture = TestBed.createComponent(LogoComponent);
      // constructor runs during createComponent

      expect(addSpy).toHaveBeenCalledWith('resize', jasmine.any(Function));

      localFixture.destroy();
    });

    it('should call setLogoText when window is resized', () => {
      fixture.detectChanges();

      const setSpy = spyOn<any>(component, 'setLogoText').and.callFake(
        () => {}
      );
      
      // dispatch resize event - listener added in constructor should call setLogoText
      window.dispatchEvent(new Event('resize'));

      expect(setSpy).toHaveBeenCalled();
    });

    it('should call setLogoText in ngOnInit', () => {
      const setSpy = spyOn<any>(component, 'setLogoText').and.callFake(
        () => {}
      );

      component.ngOnInit();

      expect(setSpy).toHaveBeenCalled();
    });
  });
});
