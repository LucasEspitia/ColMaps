import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTaiga, TuiRoot } from '@taiga-ui/core';

import { MapToolbar } from './map-toolbar';
import { CATEGORY_OPTIONS } from '../../../../shared/poi/category-options';
import type { FeatureCategory } from '../../../../shared/poi/feature-category';

@Component({
  imports: [MapToolbar, TuiRoot],
  template: `
    <tui-root>
      <app-map-toolbar
        [selectedCategories]="selected()"
        (categoriesChanged)="selected.set($event)"
      />
      <button id="outside" type="button">Outside the selector</button>
    </tui-root>
  `,
})
class TestHost {
  readonly selected = signal<FeatureCategory[]>([]);
}

describe('MapToolbar', () => {
  let fixture: ComponentFixture<TestHost>;
  let element: HTMLElement;
  let trigger: HTMLButtonElement;

  beforeEach(async () => {
    vi.stubGlobal('matchMedia', (media: string) => ({
      media,
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));
    TestBed.configureTestingModule({ imports: [TestHost], providers: [provideTaiga()] });
    fixture = TestBed.createComponent(TestHost);
    element = fixture.nativeElement;
    await fixture.whenStable();
    trigger = element.querySelector<HTMLButtonElement>('app-map-toolbar button')!;
  });

  afterEach(() => vi.unstubAllGlobals());

  async function open(): Promise<HTMLElement> {
    trigger.focus();
    trigger.click();
    await fixture.whenStable();
    return element.querySelector<HTMLElement>('#poi-category-panel')!;
  }

  function button(root: HTMLElement, label: string): HTMLButtonElement {
    return [...root.querySelectorAll('button')].find((item) => item.textContent?.trim() === label)!;
  }

  describe('Panel and focus', () => {
    it('should toggle the inline panel from the trigger', async () => {
      expect(element.querySelector('app-map-toolbar [tabindex="0"]')).toBeNull();
      expect(trigger.getAttribute('aria-controls')).toBeNull();
      expect(element.querySelector('#poi-category-panel')).toBeNull();
      await open();
      trigger.click();
      await fixture.whenStable();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-controls')).toBeNull();
      expect(element.querySelector('#poi-category-panel')).toBeNull();
    });

    it.each(['Done', 'Escape'])(
      'should restore trigger focus when closed with %s',
      async (action) => {
        const panel = await open();
        const done = button(panel, 'Done');
        done.focus();
        if (action === 'Done') {
          done.click();
        } else {
          document.activeElement?.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
          );
        }
        await fixture.whenStable();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(trigger);
      },
    );

    it('should allow focus to leave the panel without reclaiming it', async () => {
      await open();
      const outside = element.querySelector<HTMLButtonElement>('#outside')!;
      outside.focus();
      outside.click();
      await fixture.whenStable();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(outside);
    });
  });

  describe('Category selection', () => {
    it('should keep focus on the trigger and expose independent toggle buttons', async () => {
      const panel = await open();
      const options = panel.querySelectorAll<HTMLButtonElement>('button[aria-pressed]');
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(trigger.getAttribute('aria-label')).toContain('Categories');
      expect(options).toHaveLength(12);
      expect(document.activeElement).toBe(trigger);
      expect(options[0].getAttribute('aria-pressed')).toBe('false');
      options[0].focus();
      options[0].click();
      await fixture.whenStable();
      expect(fixture.componentInstance.selected()).toEqual([CATEGORY_OPTIONS[0].id]);
      expect(options[0].getAttribute('aria-pressed')).toBe('true');
      expect(document.activeElement).toBe(options[0]);
      options[0].click();
      await fixture.whenStable();
      expect(fixture.componentInstance.selected()).toEqual([]);
      expect(options[0].getAttribute('aria-pressed')).toBe('false');
      expect(document.activeElement).toBe(options[0]);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(panel.getAttribute('role')).toBe('region');
      expect(panel.getAttribute('aria-labelledby')).toBe('poi-category-heading');
      expect(panel.querySelector('#poi-category-heading')?.textContent).toContain(
        'Explore by category',
      );
      expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toBe(panel);
      expect(panel.hasAttribute('aria-modal')).toBe(false);
      expect(panel.querySelector('[role="listbox"]')).toBeNull();
    });

    it('should disable clear-all after clearing all selections', async () => {
      fixture.componentInstance.selected.set(CATEGORY_OPTIONS.map((category) => category.id));
      await fixture.whenStable();
      const panel = await open();
      expect(panel.querySelectorAll('[aria-pressed="true"]')).toHaveLength(12);
      const clear = button(panel, 'Clear all');
      clear.focus();
      clear.click();
      await fixture.whenStable();
      expect(fixture.componentInstance.selected()).toEqual([]);
      expect(clear.disabled).toBe(true);
      expect(panel.querySelectorAll('[aria-pressed="false"]')).toHaveLength(12);
    });
  });

  describe('Active filters', () => {
    it('should expose all selections and reopen from the overflow control', async () => {
      fixture.componentInstance.selected.set(CATEGORY_OPTIONS.map((category) => category.id));
      await fixture.whenStable();
      expect(trigger.getAttribute('aria-label')).toContain('12 selected');
      const more = element.querySelector<HTMLButtonElement>(
        'button[aria-label="Show all 12 selected categories"]',
      )!;
      expect(element.querySelectorAll('[tuiChip]')).toHaveLength(3);
      expect(more.textContent).toContain('+9 more');
      more.focus();
      more.click();
      await fixture.whenStable();
      const panel = element.querySelector<HTMLElement>('#poi-category-panel')!;
      expect(panel.querySelectorAll('[aria-pressed="true"]')).toHaveLength(12);
      expect(document.activeElement).toBe(trigger);
      button(panel, 'Done').click();
      await fixture.whenStable();
      expect(document.activeElement).toBe(trigger);
    });

    it('should move focus to the persistent trigger before removing a chip', async () => {
      fixture.componentInstance.selected.set(['attractions']);
      await fixture.whenStable();
      const remove = element.querySelector<HTMLButtonElement>(
        'button[aria-label="Remove Attractions filter"]',
      )!;
      remove.focus();
      remove.click();
      await fixture.whenStable();
      expect(fixture.componentInstance.selected()).toEqual([]);
      expect(remove.isConnected).toBe(false);
      expect(document.activeElement).toBe(trigger);
      expect(element.querySelector('[role="status"]')?.textContent).toContain(
        '0 category filters selected',
      );
    });
  });
});
