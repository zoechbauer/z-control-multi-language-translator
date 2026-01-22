import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { GetMobileAppComponent } from './get-mobile-app.component';
import { TranslateService } from '@ngx-translate/core';

describe('GetMobileAppComponent', () => {
  let component: GetMobileAppComponent;
  let fixture: ComponentFixture<GetMobileAppComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ],
      imports: [IonicModule.forRoot(), GetMobileAppComponent],
      providers: [
      { provide: TranslateService, useValue: jasmine.createSpyObj('TranslateService', ['instant', 'get']) }
    ]
    }).compileComponents();

    fixture = TestBed.createComponent(GetMobileAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
