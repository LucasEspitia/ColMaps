import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiDropdown, TuiLabel, TuiTextfield, TuiButton, TuiPopup } from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapper, TuiDrawer, TuiSelect, TuiSwitch } from '@taiga-ui/kit';
import { TuiAutoFocus } from '@taiga-ui/cdk';

import { Accessibility } from '../../accessibility/accessibility.service';
import { ColorVisionMode, TextScale, TextSpacing } from '../../accessibility/accessibility.model';

@Component({
  selector: 'app-accessibility-panel',
  imports: [
    TuiAutoFocus,
    FormsModule,
    TuiButton,
    TuiPopup,
    TuiDrawer,
    TuiSwitch,
    TuiDropdown,
    TuiLabel,
    TuiTextfield,
    TuiChevron,
    TuiDataListWrapper,
    TuiSelect,
  ],
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

  readonly textSpacingOptions: readonly TextSpacing[] = ['normal', 'increased'];

  readonly colorModeValues: readonly ColorVisionMode[] = this.colorModes.map((mode) => mode.value);

  readonly formatTextScale = (value: TextScale): string => `${value}%`;

  readonly formatTextSpacing = (value: TextSpacing): string =>
    value === 'normal' ? 'Normal' : 'Increased';

  readonly formatColorMode = (value: ColorVisionMode): string =>
    this.colorModes.find((mode) => mode.value === value)?.label ?? value;

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
