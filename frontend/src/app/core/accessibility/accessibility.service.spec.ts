import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { Accessibility } from './accessibility.service';
import { AccessibilityStorage } from './accessibility-storage';
import { AccessibilityPreferences, DEFAULT_ACCESSIBILITY_PREFERENCES } from './accessibility.model';

describe('Accessibility', () => {
  const customPreferences: AccessibilityPreferences = {
    textScale: 130,
    textSpacing: 'increased',
    highContrast: true,
    reducedMotion: true,
    underlineLinks: true,
    colorVisionMode: 'monochrome',
  };
  let root: HTMLElement;
  let storage: { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };

  function createService(stored: unknown = null) {
    storage.load.mockReturnValue(stored);
    return TestBed.inject(Accessibility);
  }

  function expectApplied(preferences: AccessibilityPreferences) {
    expect(root.style.getPropertyValue('--cm-font-scale')).toBe(
      String(preferences.textScale / 100),
    );
    expect(root.getAttribute('data-theme')).toBe(preferences.highContrast ? 'high-contrast' : null);
    expect(root.getAttribute('data-reduced-motion')).toBe(String(preferences.reducedMotion));
    expect(root.getAttribute('data-text-spacing')).toBe(preferences.textSpacing);
    expect(root.getAttribute('data-underline-links')).toBe(String(preferences.underlineLinks));
    expect(root.getAttribute('data-color-vision')).toBe(preferences.colorVisionMode);
  }

  beforeEach(() => {
    root = document.createElement('html');
    storage = { load: vi.fn(), save: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        Accessibility,
        { provide: AccessibilityStorage, useValue: storage },
        { provide: DOCUMENT, useValue: { documentElement: root } },
      ],
    });
  });

  it.each([null, undefined, false, 42, 'invalid', []])(
    'uses defaults for invalid stored preferences: %s',
    (stored) => {
      expect(createService(stored).preferences()).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
      expect(storage.save).not.toHaveBeenCalled();
    },
  );

  it('loads valid preferences and applies them after rendering', () => {
    const service = createService(customPreferences);
    expect(service.preferences()).toEqual(customPreferences);
    TestBed.tick();
    expectApplied(customPreferences);
    expect(storage.load).toHaveBeenCalledTimes(1);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('fills missing preferences with defaults', () => {
    expect(createService({ highContrast: true }).preferences()).toEqual({
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      highContrast: true,
    });
  });

  it('replaces invalid fields with defaults while retaining valid fields', () => {
    expect(
      createService({
        textScale: '130',
        textSpacing: 'wide',
        highContrast: 'true',
        reducedMotion: 1,
        underlineLinks: true,
        colorVisionMode: 'unknown',
        extra: true,
      }).preferences(),
    ).toEqual({ ...DEFAULT_ACCESSIBILITY_PREFERENCES, underlineLinks: true });
  });

  it.each([100, 110, 120, 130] as const)('accepts text scale %s', (textScale) => {
    expect(createService({ textScale }).preferences().textScale).toBe(textScale);
  });

  it.each(['default', 'red-green', 'blue-yellow', 'monochrome'] as const)(
    'accepts color vision mode %s',
    (colorVisionMode) => {
      expect(createService({ colorVisionMode }).preferences().colorVisionMode).toBe(
        colorVisionMode,
      );
    },
  );

  it('opens and closes the panel without persisting preferences', () => {
    const service = createService();
    expect(service.panelOpen()).toBe(false);
    service.openPanel();
    expect(service.panelOpen()).toBe(true);
    service.closePanel();
    expect(service.panelOpen()).toBe(false);
    expect(storage.save).not.toHaveBeenCalled();
  });

  const updates: [keyof AccessibilityPreferences, (service: Accessibility) => void][] = [
    ['textScale', (service) => service.setTextScale(130)],
    ['textSpacing', (service) => service.setTextSpacing('increased')],
    ['highContrast', (service) => service.setHighContrast(true)],
    ['reducedMotion', (service) => service.setReducedMotion(true)],
    ['underlineLinks', (service) => service.setUnderlineLinks(true)],
    ['colorVisionMode', (service) => service.setColorVisionMode('monochrome')],
  ];

  it.each(updates)(
    'updates, persists and applies %s while preserving other fields',
    (key, update) => {
      const service = createService();
      const previous = service.preferences();
      update(service);
      const expected = { ...DEFAULT_ACCESSIBILITY_PREFERENCES, [key]: customPreferences[key] };
      expect(service.preferences()).toEqual(expected);
      expect(previous).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
      expect(storage.save).toHaveBeenCalledExactlyOnceWith(expected);
      expectApplied(expected);
    },
  );

  it('removes the high contrast theme when disabled', () => {
    const service = createService(customPreferences);
    service.setHighContrast(true);
    service.setHighContrast(false);
    expectApplied({ ...customPreferences, highContrast: false });
  });

  it('resets, persists and applies defaults while keeping the panel open', () => {
    const service = createService(customPreferences);
    service.setHighContrast(true);
    storage.save.mockClear();
    service.openPanel();
    service.resetPreferences();
    expect(service.preferences()).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expect(service.panelOpen()).toBe(true);
    expect(storage.save).toHaveBeenCalledExactlyOnceWith(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expectApplied(DEFAULT_ACCESSIBILITY_PREFERENCES);
  });
});
