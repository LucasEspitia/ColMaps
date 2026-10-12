import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID, REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AccessibilityStorage } from './accessibility-storage';
import {
  ACCESSIBILITY_STORAGE_KEY,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
} from './accessibility.model';

describe('AccessibilityStorage', () => {
  const preferences = {
    ...DEFAULT_ACCESSIBILITY_PREFERENCES,
    highContrast: true,
  };

  const encoded = encodeURIComponent(JSON.stringify(preferences));

  let documentStub: {
    cookie: string;
    location: { protocol: string };
  };

  function createStorage(
    platform = 'browser',
    request: Request | null = null,
  ): AccessibilityStorage {
    TestBed.configureTestingModule({
      providers: [
        AccessibilityStorage,
        { provide: DOCUMENT, useValue: documentStub },
        { provide: PLATFORM_ID, useValue: platform },
        { provide: REQUEST, useValue: request },
      ],
    });

    return TestBed.inject(AccessibilityStorage);
  }

  beforeEach(() => {
    documentStub = {
      cookie: '',
      location: { protocol: 'http:' },
    };
  });

  describe('Cookie reading', () => {
    it('returns null when the cookie is absent', () => {
      documentStub.cookie = 'other=value';

      expect(createStorage().load()).toBeNull();
    });

    it('returns null when the cookie string is empty', () => {
      expect(createStorage().load()).toBeNull();
    });

    it('decodes the matching cookie among other cookies', () => {
      documentStub.cookie =
        `${ACCESSIBILITY_STORAGE_KEY}_other=invalid; ` +
        `${ACCESSIBILITY_STORAGE_KEY}=${encoded}; other=value`;

      expect(createStorage().load()).toEqual(preferences);
    });

    it('loads default accessibility preferences', () => {
      documentStub.cookie =
        `${ACCESSIBILITY_STORAGE_KEY}=` +
        encodeURIComponent(JSON.stringify(DEFAULT_ACCESSIBILITY_PREFERENCES));

      expect(createStorage().load()).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
    });

    it.each(['%E0%A4%A', encodeURIComponent('{invalid json}')])(
      'returns null for a malformed cookie: %s',
      (value) => {
        documentStub.cookie = `${ACCESSIBILITY_STORAGE_KEY}=${value}`;

        expect(createStorage().load()).toBeNull();
      },
    );
  });

  describe('Server-side rendering', () => {
    it('loads cookies from the HTTP request during SSR', () => {
      documentStub.cookie = `${ACCESSIBILITY_STORAGE_KEY}=invalid`;

      const request = new Request('https://colmaps.test', {
        headers: {
          cookie: `other=value; ${ACCESSIBILITY_STORAGE_KEY}=${encoded}`,
        },
      });

      expect(createStorage('server', request).load()).toEqual(preferences);
    });

    it('returns null during SSR without a request', () => {
      expect(createStorage('server').load()).toBeNull();
    });

    it('returns null during SSR without a cookie header', () => {
      const request = new Request('https://colmaps.test');

      expect(createStorage('server', request).load()).toBeNull();
    });

    it('works when the REQUEST provider is unavailable', () => {
      TestBed.configureTestingModule({
        providers: [
          AccessibilityStorage,
          { provide: DOCUMENT, useValue: documentStub },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });

      const storage = TestBed.inject(AccessibilityStorage);

      expect(storage.load()).toBeNull();
    });

    it('reads preferences independently for different SSR requests', () => {
      const firstPreferences = {
        ...DEFAULT_ACCESSIBILITY_PREFERENCES,
        highContrast: true,
      };

      const secondPreferences = {
        ...DEFAULT_ACCESSIBILITY_PREFERENCES,
        textScale: 130 as const,
        colorVisionMode: 'monochrome' as const,
      };

      const firstRequest = new Request('https://colmaps.test', {
        headers: {
          cookie:
            `${ACCESSIBILITY_STORAGE_KEY}=` + encodeURIComponent(JSON.stringify(firstPreferences)),
        },
      });

      const secondRequest = new Request('https://colmaps.test', {
        headers: {
          cookie:
            `${ACCESSIBILITY_STORAGE_KEY}=` + encodeURIComponent(JSON.stringify(secondPreferences)),
        },
      });

      const firstStorage = createStorage('server', firstRequest);

      expect(firstStorage.load()).toEqual(firstPreferences);

      TestBed.resetTestingModule();

      const secondStorage = createStorage('server', secondRequest);

      expect(secondStorage.load()).toEqual(secondPreferences);
    });

    it('does not write cookies during SSR', () => {
      documentStub.cookie = 'other=value';

      createStorage('server').save(preferences);

      expect(documentStub.cookie).toBe('other=value');
    });
  });

  describe('Cookie writing', () => {
    it.each(['http:', 'https:'])('saves a cookie with the proper attributes on %s', (protocol) => {
      documentStub.location.protocol = protocol;

      createStorage().save(preferences);

      expect(documentStub.cookie).toBe(
        `${ACCESSIBILITY_STORAGE_KEY}=${encoded}; ` +
          'Path=/; Max-Age=31536000; SameSite=Lax' +
          (protocol === 'https:' ? '; Secure' : ''),
      );
    });

    it('serializes all accessibility preferences', () => {
      const customPreferences = {
        ...DEFAULT_ACCESSIBILITY_PREFERENCES,
        textScale: 120 as const,
        textSpacing: 'increased' as const,
        highContrast: true,
        reducedMotion: true,
        underlineLinks: true,
        colorVisionMode: 'red-green' as const,
      };

      createStorage().save(customPreferences);

      const cookieValue = documentStub.cookie
        .split(';')[0]
        .slice(ACCESSIBILITY_STORAGE_KEY.length + 1);

      expect(JSON.parse(decodeURIComponent(cookieValue))).toEqual(customPreferences);
    });
  });
});
