import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Service, PLATFORM_ID, REQUEST, inject } from '@angular/core';

import { ACCESSIBILITY_STORAGE_KEY, AccessibilityPreferences } from './accessibility.model';

@Service()
export class AccessibilityStorage {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject(REQUEST, { optional: true });

  private readonly isBrowser = isPlatformBrowser(this.platformId);

  load(): unknown {
    const cookieHeader = this.isBrowser
      ? this.document.cookie
      : (this.request?.headers.get('cookie') ?? '');

    const cookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${ACCESSIBILITY_STORAGE_KEY}=`));

    if (!cookie) {
      return null;
    }

    try {
      const encoded = cookie.slice(ACCESSIBILITY_STORAGE_KEY.length + 1);

      return JSON.parse(decodeURIComponent(encoded));
    } catch {
      return null;
    }
  }

  save(preferences: AccessibilityPreferences): void {
    if (!this.isBrowser) {
      return;
    }

    const value = encodeURIComponent(JSON.stringify(preferences));
    const maxAge = 60 * 60 * 24 * 365;

    const secure = this.document.location?.protocol === 'https:' ? '; Secure' : '';

    this.document.cookie = `${ACCESSIBILITY_STORAGE_KEY}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }
}
