import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon, TuiInput, TuiTextfield } from '@taiga-ui/core';

import { CATEGORY_OPTIONS } from '../../shared/poi/category-options';
import type { FeatureCategory } from '../../shared/poi/feature-category';

@Component({
  selector: 'app-search',
  imports: [RouterLink, TuiButton, TuiIcon, TuiInput, TuiTextfield],
  templateUrl: './search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Search {
  protected readonly categories = CATEGORY_OPTIONS;

  protected readonly selectedCategories = signal<FeatureCategory[]>([]);

  protected readonly mapQueryParams = computed(() => {
    const categories = this.selectedCategories();

    return categories.length ? { categories: categories.join(',') } : {};
  });

  protected isSelected(category: FeatureCategory): boolean {
    return this.selectedCategories().includes(category);
  }

  protected toggleCategory(category: FeatureCategory): void {
    this.selectedCategories.update((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  protected clearCategories(): void {
    this.selectedCategories.set([]);
  }
}
