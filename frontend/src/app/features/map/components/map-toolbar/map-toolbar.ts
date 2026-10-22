import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { TuiActiveZone } from '@taiga-ui/cdk';
import { TuiButton, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { TuiChip } from '@taiga-ui/kit';

import { CATEGORY_OPTIONS } from '../../../../shared/poi/category-options';
import type { FeatureCategory } from '../../../../shared/poi/feature-category';

@Component({
  selector: 'app-map-toolbar',
  imports: [TuiButton, TuiIcon, TuiChip, TuiActiveZone, TuiScrollbar],
  templateUrl: './map-toolbar.html',
  styleUrl: './map-toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class MapToolbar {
  readonly selectedCategories = input.required<readonly FeatureCategory[]>();
  readonly categoriesChanged = output<FeatureCategory[]>();

  protected readonly categories = CATEGORY_OPTIONS;

  protected isSelected(category: FeatureCategory): boolean {
    return this.selectedCategories().includes(category);
  }

  protected toggleCategory(category: FeatureCategory): void {
    const current = this.selectedCategories();

    const next = current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category];

    this.categoriesChanged.emit(next);
  }

  protected clearFilters(): void {
    this.categoriesChanged.emit([]);
  }

  // Disclosure panel and keyboard navigation.
  protected readonly open = signal(false);
  private readonly categoriesTrigger =
    viewChild<ElementRef<HTMLButtonElement>>('categoriesTrigger');

  protected toggleDropdown(): void {
    this.open.update((open) => !open);
  }

  protected showAllCategories(): void {
    this.categoriesTrigger()?.nativeElement.focus({ preventScroll: true });
    this.open.set(true);
  }

  protected closeDropdown(): void {
    this.open.set(false);
    this.categoriesTrigger()?.nativeElement.focus({ preventScroll: true });
  }

  protected onEscape(event: Event): void {
    if (!this.open()) return;

    event.preventDefault();
    event.stopPropagation();

    this.closeDropdown();
  }

  protected onActiveZoneChange(active: boolean): void {
    if (!active) {
      this.open.set(false);
    }
  }

  // Active filter chips and overflow.
  protected readonly activeCategories = computed(() =>
    this.categories.filter((category) => this.selectedCategories().includes(category.id)),
  );

  protected readonly visibleCategories = computed(() => this.activeCategories().slice(0, 3));

  protected readonly hiddenCategoryCount = computed(
    () => this.activeCategories().length - this.visibleCategories().length,
  );

  protected removeCategory(category: FeatureCategory): void {
    // Move focus before the parent removes this chip from the DOM.
    this.categoriesTrigger()?.nativeElement.focus({ preventScroll: true });
    this.categoriesChanged.emit(this.selectedCategories().filter((item) => item !== category));
  }
}
