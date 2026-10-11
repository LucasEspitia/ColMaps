import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';

@Component({
  selector: 'app-about',
  imports: [TuiButton, TuiIcon, TuiCardLarge],
  templateUrl: './about.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {}
