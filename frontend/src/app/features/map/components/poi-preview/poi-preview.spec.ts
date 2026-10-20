import { TestBed } from '@angular/core/testing';

import { PoiPreview } from './poi-preview';

describe('PoiPreview', () => {
  it('should display the selected POI and emit when the close button is clicked', () => {
    TestBed.configureTestingModule({ imports: [PoiPreview] });
    const fixture = TestBed.createComponent(PoiPreview);
    fixture.componentRef.setInput('poi', {
      id: 'N/123',
      name: 'Museo',
      category: 'museums_culture',
    });
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.detectChanges();

    const preview = fixture.nativeElement as HTMLElement;
    expect(preview.querySelector('h2')?.textContent?.trim()).toBe('Museo');
    expect(preview.querySelector('p')?.textContent?.trim()).toBe('museums_culture');

    preview.querySelector<HTMLButtonElement>('button[aria-label="Close place details"]')!.click();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('should show a fallback for an unnamed POI', () => {
    TestBed.configureTestingModule({ imports: [PoiPreview] });
    const fixture = TestBed.createComponent(PoiPreview);
    fixture.componentRef.setInput('poi', {
      id: 'N/123',
      name: null,
      category: 'museums_culture',
    });
    fixture.detectChanges();

    const preview = fixture.nativeElement as HTMLElement;
    expect(preview.querySelector('h2')?.textContent?.trim()).toBe('Unnamed place');
  });
});
