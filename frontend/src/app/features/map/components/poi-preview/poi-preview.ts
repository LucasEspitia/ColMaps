import { Component, input, output } from '@angular/core';
import { PoiSelection } from '../../models/poi-selection';
import { TuiButtonX } from '@taiga-ui/core';
@Component({
  selector: 'app-poi-preview',
  imports: [TuiButtonX],
  templateUrl: './poi-preview.html',
})
export class PoiPreview {
  readonly poi = input.required<PoiSelection>();
  readonly closed = output<void>();
}
