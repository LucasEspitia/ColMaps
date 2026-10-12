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
  template:
    '<tui-root><button type="button" (click)="accessibility.openPanel()">Open settings</button><app-accessibility-panel /></tui-root>',
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

  it('renders only when opened and closes using the Close button', async () => {
    expect(element.querySelector('tui-drawer')).toBeNull();
    await openPanel();
    expect(element.querySelector('#accessibility-title')?.textContent?.trim()).toBe(
      'Accessibility',
    );
    element.querySelector<HTMLButtonElement>('header button')!.click();
    await fixture.whenStable();
    expect(service.panelOpen()).toBe(false);
    expect(element.querySelector('tui-drawer')).toBeNull();
  });

  it('focuses Close and restores focus to the opener when dismissed', async () => {
    const opener = element.querySelector<HTMLButtonElement>('button')!;
    opener.focus();
    opener.click();
    await fixture.whenStable();
    const drawer = element.querySelector<HTMLElement>('tui-drawer')!;
    expect(drawer.getAttribute('role')).toBe('dialog');
    expect(drawer.getAttribute('aria-modal')).toBe('true');
    expect(
      element.querySelector(`#${drawer.getAttribute('aria-labelledby')}`)?.textContent?.trim(),
    ).toBe('Accessibility');
    const close = drawer.querySelector<HTMLButtonElement>('button[cdkFocusInitial]')!;
    expect(document.activeElement).toBe(close);
    close.click();
    await fixture.whenStable();
    expect(document.activeElement).toBe(opener);
  });

  it.each([
    ['accessibility-text-scale', '130%', 'textScale', 130],
    ['accessibility-text-spacing', 'Increased', 'textSpacing', 'increased'],
    ['accessibility-color-mode', 'Monochrome', 'colorVisionMode', 'monochrome'],
  ] as const)('updates and persists preferences through %s', async (id, label, key, value) => {
    await openPanel();
    const select = element.querySelector<HTMLSelectElement>(`#${id}`)!;
    const option = Array.from(select.options).find((item) => item.textContent?.trim() === label)!;
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(service.preferences()).toEqual({ ...DEFAULT_ACCESSIBILITY_PREFERENCES, [key]: value });
    expect(save).toHaveBeenCalledExactlyOnceWith(service.preferences());
    expect(service.panelOpen()).toBe(true);
  });

  it.each([
    [0, 'highContrast'],
    [1, 'underlineLinks'],
    [2, 'reducedMotion'],
  ] as const)('updates and persists switch %s', async (index, key) => {
    await openPanel();
    element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[index].click();
    await fixture.whenStable();
    expect(service.preferences()).toEqual({ ...DEFAULT_ACCESSIBILITY_PREFERENCES, [key]: true });
    expect(save).toHaveBeenCalledExactlyOnceWith(service.preferences());
  });

  it('resets preferences and refreshes the controls without closing the panel', async () => {
    service.setTextScale(130);
    service.setHighContrast(true);
    service.setTextSpacing('increased');
    service.setColorVisionMode('monochrome');
    await openPanel();
    save.mockClear();
    Array.from(element.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === 'Reset preferences')!
      .click();
    await fixture.whenStable();
    expect(service.preferences()).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expect(save).toHaveBeenCalledExactlyOnceWith(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expect(service.panelOpen()).toBe(true);
    expect(
      element
        .querySelector<HTMLSelectElement>('#accessibility-text-scale')!
        .selectedOptions[0].textContent?.trim(),
    ).toBe('100%');
    expect(element.querySelector<HTMLSelectElement>('#accessibility-text-spacing')!.value).toBe(
      'normal',
    );
    expect(element.querySelector<HTMLSelectElement>('#accessibility-color-mode')!.value).toBe(
      'default',
    );
    expect(
      Array.from(
        element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
        (input) => input.checked,
      ),
    ).toEqual([false, false, false]);
  });
});
