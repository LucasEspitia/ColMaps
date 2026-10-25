import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QualityHistoryChart } from './quality-history-chart';

describe('QualityHistoryChart', () => {
  let component: QualityHistoryChart;
  let fixture: ComponentFixture<QualityHistoryChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualityHistoryChart],
    }).compileComponents();

    fixture = TestBed.createComponent(QualityHistoryChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
