import { InteractivityChecker } from '@angular/cdk/a11y';
import { Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTaiga, TuiRoot } from '@taiga-ui/core';
import { vi } from 'vitest';

import { AccessibilityPanel } from './accessibility-panel';
import { Accessibility } from '../../accessibility/accessibility.service';
import { AccessibilityStorage } from '../../accessibility/accessibility-storage';
import { DEFAULT_ACCESSIBILITY_PREFERENCES } from '../../accessibility/accessibility.model';

@Component({
  imports: [AccessibilityPanel, TuiRoot],
  template: `
    <tui-root>
      <button id="accessibility-opener" type="button" (click)="accessibility.openPanel()">
        Open settings
      </button>

      <app-accessibility-panel />
    </tui-root>
  `,
})
class TestHost {
  readonly accessibility = inject(Accessibility);
}

describe('AccessibilityPanel', () => {
  let fixture: ComponentFixture<TestHost>;
  let service: Accessibility;
  let element: HTMLElement;
  let save: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }));
    save = vi.fn();
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        provideTaiga(),
        { provide: AccessibilityStorage, useValue: { load: () => null, save } },
      ],
    }).compileComponents();
    // jsdom does not calculate element dimensions.
    vi.spyOn(TestBed.inject(InteractivityChecker), 'isVisible').mockReturnValue(true);
    fixture = TestBed.createComponent(TestHost);
    element = fixture.nativeElement;
    service = TestBed.inject(Accessibility);
    await fixture.whenStable();
  });

  afterEach(() => {
    service.resetPreferences();
    vi.unstubAllGlobals();
  });

  async function openPanel() {
    service.openPanel();
    await fixture.whenStable();
  }

  it.each(['Close button', 'Escape'])(
    'opens an accessible dialog and restores focus after closing with %s',
    async (method) => {
      expect(element.querySelector('tui-drawer')).toBeNull();
      const opener = element.querySelector<HTMLButtonElement>('#accessibility-opener')!;

      // JSDOM does not calculate real element geometry.
      vi.spyOn(opener, 'getClientRects').mockReturnValue({
        length: 1,
      } as DOMRectList);

      opener.focus();
      expect(document.activeElement).toBe(opener);

      opener.click();
      await fixture.whenStable();

      const drawer = element.querySelector<HTMLElement>('tui-drawer')!;
      const close = drawer.querySelector<HTMLButtonElement>('#accessibility-close')!;

      expect(drawer.getAttribute('role')).toBe('dialog');
      expect(drawer.getAttribute('aria-modal')).toBe('true');
      expect(drawer.getAttribute('aria-labelledby')).toBe('accessibility-title');
      expect(drawer.getAttribute('aria-describedby')).toBe('accessibility-description');
      expect(drawer.querySelector('#accessibility-title')?.textContent?.trim()).toBe(
        'Accessibility',
      );

      expect(document.activeElement).toBe(close);

      if (method === 'Close button') {
        close.click();
      } else {
        close.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }

      fixture.detectChanges();
      await fixture.whenStable();

      expect(service.panelOpen()).toBe(false);
      expect(element.querySelector('tui-drawer')).toBeNull();
      expect(document.activeElement).toBe(opener);
    },
  );

  it.each([
    ['accessibility-high-contrast', 'highContrast'],
    ['accessibility-underline-links', 'underlineLinks'],
    ['accessibility-reduced-motion', 'reducedMotion'],
  ] as const)('updates and persists %s', async (id, key) => {
    await openPanel();

    const input = element.querySelector<HTMLInputElement>(`#${id}`)!;

    input.click();
    await fixture.whenStable();

    expect(service.preferences()).toEqual({
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      [key]: true,
    });

    expect(save).toHaveBeenCalledExactlyOnceWith(service.preferences());
  });

  it.each([
    ['accessibility-text-scale', '130%', 'textScale', 130],
    ['accessibility-text-spacing', 'Increased', 'textSpacing', 'increased'],
    ['accessibility-color-mode', 'Monochrome', 'colorVisionMode', 'monochrome'],
  ] as const)('updates and persists preferences through %s', async (id, label, key, value) => {
    await openPanel();

    const select = element.querySelector<HTMLInputElement>(`#${id}`);

    expect(select).not.toBeNull();

    select!.click();
    await fixture.whenStable();

    // Dropdown options may be rendered outside the fixture.
    const option = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (item) => item.textContent?.trim() === label,
    );

    expect(option).toBeDefined();

    option!.click();
    await fixture.whenStable();

    expect(service.preferences()).toEqual({
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      [key]: value,
    });

    expect(save).toHaveBeenCalledExactlyOnceWith(service.preferences());

    expect(service.panelOpen()).toBe(true);
  });

  it('resets preferences and refreshes controls without closing the panel', async () => {
    service.setTextScale(130);
    service.setHighContrast(true);
    service.setUnderlineLinks(true);
    service.setReducedMotion(true);
    service.setTextSpacing('increased');
    service.setColorVisionMode('monochrome');

    await openPanel();
    save.mockClear();

    element.querySelector<HTMLButtonElement>('#accessibility-reset')!.click();

    await fixture.whenStable();

    expect(service.preferences()).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);

    expect(save).toHaveBeenCalledExactlyOnceWith(DEFAULT_ACCESSIBILITY_PREFERENCES);

    expect(service.panelOpen()).toBe(true);

    // Taiga UI Select inputs
    expect(element.querySelector<HTMLInputElement>('#accessibility-text-scale')!.value).toBe(
      '100%',
    );

    expect(element.querySelector<HTMLInputElement>('#accessibility-text-spacing')!.value).toBe(
      'Normal',
    );

    expect(element.querySelector<HTMLInputElement>('#accessibility-color-mode')!.value).toBe(
      'Default colors',
    );

    // Switches
    expect(
      [
        'accessibility-high-contrast',
        'accessibility-underline-links',
        'accessibility-reduced-motion',
      ].map((id) => element.querySelector<HTMLInputElement>(`#${id}`)!.checked),
    ).toEqual([false, false, false]);
  });
});
