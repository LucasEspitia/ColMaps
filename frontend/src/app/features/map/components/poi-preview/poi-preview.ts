import { Component, input, output, computed } from '@angular/core';
import { TuiButtonX, TuiIcon, TuiLoader, TuiScrollbar } from '@taiga-ui/core';
import { TuiChip } from '@taiga-ui/kit';

import { PoiSelection } from '../../models/poi-selection';
import type { PoiDetailState } from '../../models/poi-detail-state';

interface PoiChip {
  label: string;
  icon: string;
}

function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);

    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
@Component({
  selector: 'app-poi-preview',
  imports: [TuiButtonX, TuiIcon, TuiLoader, TuiScrollbar, TuiChip],
  templateUrl: './poi-preview.html',
  host: {
    class: 'block',
  },
})
export class PoiPreview {
  readonly poi = input.required<PoiSelection>();
  readonly detailState = input.required<PoiDetailState>();
  readonly closed = output<void>();

  protected readonly detail = computed(() => {
    const state = this.detailState();
    return state.status === 'success' ? state.data : null;
  });
  protected readonly displayName = computed(
    () =>
      this.poi().name?.trim() || this.detail()?.subcategory.replaceAll('_', ' ') || 'Unnamed place',
  );

  protected readonly displayCategory = computed(() => this.poi().category.replaceAll('_', ' '));

  protected readonly displaySubcategory = computed(
    () => this.detail()?.subcategory.replaceAll('_', ' ') ?? null,
  );

  protected readonly websiteUrl = computed(() => safeHttpUrl(this.detail()?.website ?? null));

  protected readonly facebookUrl = computed(() => safeHttpUrl(this.detail()?.facebook ?? null));

  protected readonly chips = computed<PoiChip[]>(() => {
    const poi = this.detail();
    if (!poi) return [];

    const chips: PoiChip[] = [];

    if (poi.rooms !== null) {
      chips.push({
        label: `${poi.rooms} rooms`,
        icon: '@tui.bed-double',
      });
    }

    if (poi.internetAccess === 'wlan') {
      chips.push({
        label: poi.internetAccessFee === 'no' ? 'Free Wi-Fi' : 'Wi-Fi',
        icon: '@tui.wifi',
      });
    }

    if (poi.wheelchair === 'yes') {
      chips.push({
        label: 'Wheelchair accessible',
        icon: '@tui.accessibility',
      });
    } else if (poi.wheelchair === 'limited') {
      chips.push({
        label: 'Limited accessibility',
        icon: '@tui.accessibility',
      });
    } else if (poi.wheelchair === 'no') {
      chips.push({
        label: 'Not wheelchair accessible',
        icon: '@tui.accessibility',
      });
    }

    if (poi.airConditioning === true) {
      chips.push({
        label: 'Air conditioning',
        icon: '@tui.wind',
      });
    }

    if (poi.bar === true) {
      chips.push({
        label: 'Bar',
        icon: '@tui.wine',
      });
    }

    if (poi.reservation === 'yes') {
      chips.push({
        label: 'Reservations',
        icon: '@tui.calendar-check',
      });
    }

    if (poi.acceptsCreditCards === true) {
      chips.push({
        label: 'Credit cards',
        icon: '@tui.credit-card',
      });
    }

    return chips;
  });

  protected readonly hasContact = computed(() => {
    const poi = this.detail();

    return Boolean(poi?.phone || poi?.email || this.websiteUrl() || this.facebookUrl());
  });
}
