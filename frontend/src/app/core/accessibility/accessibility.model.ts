export type TextScale = 100 | 110 | 120 | 130;
export type TextSpacing = 'normal' | 'increased';
export type ColorVisionMode = 'default' | 'red-green' | 'blue-yellow' | 'monochrome';

export interface AccessibilityPreferences {
  textScale: TextScale;
  textSpacing: TextSpacing;
  highContrast: boolean;
  reducedMotion: boolean;
  underlineLinks: boolean;
  colorVisionMode: ColorVisionMode;
}

export const DEFAULT_ACCESSIBILITY_PREFERENCES: Readonly<AccessibilityPreferences> = {
  textScale: 100,
  highContrast: false,
  reducedMotion: false,
  textSpacing: 'normal',
  underlineLinks: false,
  colorVisionMode: 'default',
};

export const ACCESSIBILITY_STORAGE_KEY = 'colmaps_accessibility_v1';
