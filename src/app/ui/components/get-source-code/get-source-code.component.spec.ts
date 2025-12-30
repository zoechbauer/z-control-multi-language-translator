import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { GetSourceCodeComponent } from './get-source-code.component';

describe('GetSourceCodeComponent', () => {
  let component: GetSourceCodeComponent;
  let fixture: ComponentFixture<GetSourceCodeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ],
      imports: [IonicModule.forRoot(), GetSourceCodeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GetSourceCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
