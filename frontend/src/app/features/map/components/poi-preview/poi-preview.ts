import { Component, input, output } from '@angular/core';
import { TuiButtonX } from '@taiga-ui/core';

import { PoiSelection } from '../../models/poi-selection';
import type { PoiDetailState } from '../../models/poi-detail-state';
@Component({
  selector: 'app-poi-preview',
  imports: [TuiButtonX],
  templateUrl: './poi-preview.html',
})
export class PoiPreview {
  readonly poi = input.required<PoiSelection>();
  readonly detailState = input.required<PoiDetailState>();
  readonly closed = output<void>();
}
