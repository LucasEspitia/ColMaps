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
    fixture.componentRef.setInput('detailState', { status: 'loading' });
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.detectChanges();

    const preview = fixture.nativeElement as HTMLElement;
    expect(preview.querySelector('h2')?.textContent?.trim()).toBe('Museo');
    expect(preview.querySelector('[tuiChip]')?.textContent?.trim()).toBe('museums culture');
    expect(preview.querySelector('[role="status"]')?.textContent).toContain(
      'Loading place details',
    );

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
    fixture.componentRef.setInput('detailState', { status: 'idle' });
    fixture.detectChanges();

    const preview = fixture.nativeElement as HTMLElement;
    expect(preview.querySelector('h2')?.textContent?.trim()).toBe('Unnamed place');
  });

  it('should display loaded details and expose only HTTP contact links', () => {
    TestBed.configureTestingModule({ imports: [PoiPreview] });
    const fixture = TestBed.createComponent(PoiPreview);
    fixture.componentRef.setInput('poi', { id: 'N/123', name: null, category: 'accommodation' });
    fixture.componentRef.setInput('detailState', {
      status: 'success',
      data: {
        id: 'N/123',
        name: null,
        category: 'accommodation',
        categories: ['accommodation'],
        subcategory: 'guest_house',
        coordinates: [-74, 4],
        address: 'Calle 1',
        description: 'A quiet place',
        rooms: null,
        stars: null,
        internetAccess: 'wlan',
        internetAccessFee: 'no',
        website: 'https://example.com',
        facebook: 'javascript:alert(1)',
      },
    });
    fixture.detectChanges();

    const preview = fixture.nativeElement as HTMLElement;
    expect(preview.querySelector('h2')?.textContent?.trim()).toBe('guest house');
    expect(preview.textContent).toContain('Calle 1');
    expect(preview.textContent).toContain('A quiet place');
    expect(preview.textContent).toContain('Free Wi-Fi');
    expect(
      preview
        .querySelector('a[aria-label="Visit website (opens in new tab)"]')
        ?.getAttribute('href'),
    ).toBe('https://example.com/');
    expect(preview.querySelector('a[aria-label="Visit Facebook (opens in new tab)"]')).toBeNull();
  });
});
