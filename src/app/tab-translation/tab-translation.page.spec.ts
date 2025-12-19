import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TabTranslationPage } from './tab-translation.page';

describe('TabTranslationPage', () => {
  let component: TabTranslationPage;
  let fixture: ComponentFixture<TabTranslationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TabTranslationPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(TabTranslationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
