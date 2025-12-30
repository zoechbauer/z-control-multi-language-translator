import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { GetMobileAppComponent } from './get-mobile-app.component';

describe('GetMobileAppComponent', () => {
  let component: GetMobileAppComponent;
  let fixture: ComponentFixture<GetMobileAppComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ],
      imports: [IonicModule.forRoot(), GetMobileAppComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GetMobileAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
