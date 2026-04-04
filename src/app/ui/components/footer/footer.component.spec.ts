import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { FooterComponent } from './footer.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct mailto link', () => {
    const expectedLink =
      'mailto:zcontrol.app.qr@gmail.com?subject=z-control%20Multi%20Translator%20App%20Feedback';

    expect((component as any).mailtoLink).toBe(expectedLink);
  });
});
