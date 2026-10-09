import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalCtaComponent } from './final-cta';

describe('FinalCtaComponent', () => {
  let component: FinalCtaComponent;
  let fixture: ComponentFixture<FinalCtaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalCtaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinalCtaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
