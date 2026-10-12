import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiPopup, TuiClose } from '@taiga-ui/core';
import { TuiDrawer, TuiSwitch } from '@taiga-ui/kit';

import { Accessibility } from '../../accessibility/accessibility.service';
import { ColorVisionMode, TextScale, TextSpacing } from '../../accessibility/accessibility.model';

@Component({
  selector: 'app-accessibility-panel',
  imports: [CdkTrapFocus, FormsModule, TuiButton, TuiPopup, TuiClose, TuiDrawer, TuiSwitch],
  templateUrl: './accessibility-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibilityPanel {
  readonly accessibility = inject(Accessibility);

  readonly textScales: readonly TextScale[] = [100, 110, 120, 130];

  readonly colorModes: readonly {
    value: ColorVisionMode;
    label: string;
  }[] = [
    { value: 'default', label: 'Default colors' },
    { value: 'red-green', label: 'Red-green differentiation' },
    { value: 'blue-yellow', label: 'Blue-yellow differentiation' },
    { value: 'monochrome', label: 'Monochrome' },
  ];

  setTextScale(value: TextScale): void {
    this.accessibility.setTextScale(value);
  }

  setTextSpacing(value: TextSpacing): void {
    this.accessibility.setTextSpacing(value);
  }

  setColorVisionMode(value: ColorVisionMode): void {
    this.accessibility.setColorVisionMode(value);
  }

  close(): void {
    this.accessibility.closePanel();
  }

  reset(): void {
    this.accessibility.resetPreferences();
  }
}
