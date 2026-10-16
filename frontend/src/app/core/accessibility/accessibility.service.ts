import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Service, inject, signal, afterNextRender, PLATFORM_ID, Injector } from '@angular/core';
import { AccessibilityStorage } from './accessibility-storage';
import {
  AccessibilityPreferences,
  ColorVisionMode,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  TextScale,
  TextSpacing,
} from './accessibility.model';

@Service()
export class Accessibility {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(AccessibilityStorage);
  private readonly injector = inject(Injector);

  private previouslyFocusedElement: HTMLElement | null = null;
  private fallbackFocusedElement: HTMLElement | null = null;

  private readonly preferencesState = signal<AccessibilityPreferences>(
    this.validatePreferences(this.storage.load()),
  );

  private readonly panelOpenState = signal(false);

  readonly preferences = this.preferencesState.asReadonly();
  readonly panelOpen = this.panelOpenState.asReadonly();

  constructor() {
    // Apply before the first render on both the server and the client.
    this.applyPreferencesToDocument();
  }

  openPanel(fallback?: HTMLElement): void {
    if (this.panelOpenState()) return;

    if (this.isBrowser) {
      const activeElement = this.document.activeElement;
      this.previouslyFocusedElement =
        activeElement instanceof HTMLElement ? activeElement : null;

      this.fallbackFocusedElement = fallback ?? null;
    }
    this.panelOpenState.set(true);
  }

  closePanel(): void {
    if (!this.panelOpenState()) return;

    this.panelOpenState.set(false);

    if (!this.isBrowser) return;

    const previousElement = this.previouslyFocusedElement;
    const fallbackElement = this.fallbackFocusedElement;

    this.previouslyFocusedElement = null;
    this.fallbackFocusedElement = null;

    afterNextRender(
      {
        mixedReadWrite: () => {
          if (this.panelOpenState()) return;

          const target = this.canRestoreFocus(previousElement)
            ? previousElement
            : this.canRestoreFocus(fallbackElement)
              ? fallbackElement
              : null;

          target?.focus({ preventScroll: true });
        },
      },
      { injector: this.injector },
    );
  }

  private canRestoreFocus(element: HTMLElement | null): element is HTMLElement {
    return (
      element !== null &&
      element.isConnected &&
      element.getClientRects().length > 0 &&
      !element.closest('[inert], [aria-hidden="true"]')
    );
  }

  setTextScale(value: TextScale): void {
    this.updatePreference('textScale', value);
  }

  setTextSpacing(value: TextSpacing): void {
    this.updatePreference('textSpacing', value);
  }

  setHighContrast(value: boolean): void {
    this.updatePreference('highContrast', value);
  }

  setReducedMotion(value: boolean): void {
    this.updatePreference('reducedMotion', value);
  }

  setUnderlineLinks(value: boolean): void {
    this.updatePreference('underlineLinks', value);
  }

  setColorVisionMode(value: ColorVisionMode): void {
    this.updatePreference('colorVisionMode', value);
  }

  resetPreferences(): void {
    this.setPreferences({
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
    });
  }

  private updatePreference<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K],
  ): void {
    this.setPreferences({
      ...this.preferencesState(),
      [key]: value,
    });
  }

  private setPreferences(preferences: AccessibilityPreferences): void {
    this.preferencesState.set(preferences);

    this.storage.save(preferences);
    this.applyPreferencesToDocument();
  }

  applyPreferencesToDocument(): void {
    const root = this.document.documentElement;
    const preferences = this.preferencesState();

    root.style.setProperty('--cm-font-scale', String(preferences.textScale / 100));

    if (preferences.highContrast) {
      root.setAttribute('data-theme', 'high-contrast');
    } else {
      root.removeAttribute('data-theme');
    }

    root.setAttribute('data-reduced-motion', String(preferences.reducedMotion));

    root.setAttribute('data-text-spacing', preferences.textSpacing);

    root.setAttribute('data-underline-links', String(preferences.underlineLinks));

    root.setAttribute('data-color-vision', preferences.colorVisionMode);
  }

  private validatePreferences(value: unknown): AccessibilityPreferences {
    const defaults = DEFAULT_ACCESSIBILITY_PREFERENCES;

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { ...defaults };
    }

    const stored = value as Record<string, unknown>;

    const textScale = stored['textScale'];

    const textSpacing = stored['textSpacing'];

    const colorVisionMode = stored['colorVisionMode'];

    return {
      textScale:
        textScale === 100 || textScale === 110 || textScale === 120 || textScale === 130
          ? textScale
          : defaults.textScale,

      textSpacing:
        textSpacing === 'normal' || textSpacing === 'increased'
          ? textSpacing
          : defaults.textSpacing,

      highContrast:
        typeof stored['highContrast'] === 'boolean'
          ? stored['highContrast']
          : defaults.highContrast,

      reducedMotion:
        typeof stored['reducedMotion'] === 'boolean'
          ? stored['reducedMotion']
          : defaults.reducedMotion,

      underlineLinks:
        typeof stored['underlineLinks'] === 'boolean'
          ? stored['underlineLinks']
          : defaults.underlineLinks,

      colorVisionMode:
        colorVisionMode === 'default' ||
        colorVisionMode === 'red-green' ||
        colorVisionMode === 'blue-yellow' ||
        colorVisionMode === 'monochrome'
          ? colorVisionMode
          : defaults.colorVisionMode,
    };
  }
}
