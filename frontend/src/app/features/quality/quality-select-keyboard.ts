import { Directive, inject } from '@angular/core';
import { TuiDropdownOpen } from '@taiga-ui/core';

@Directive({
  selector: 'input[appQualitySelectKeyboard]',
  host: { '(keydown.enter)': 'openDropdown($event)' },
})
export class QualitySelectKeyboard {
  private readonly select = inject(TuiDropdownOpen);

  protected openDropdown(event: Event): void {
    if (!this.select.open()) {
      event.preventDefault();
      this.select.open.set(true);
    }
  }
}
