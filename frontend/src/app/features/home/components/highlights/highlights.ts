import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

@Component({
  selector: 'app-highlights',
  imports: [RouterLink, TuiButton, TuiIcon],
  templateUrl: './highlights.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightsComponent {
  readonly highlights = [
    {
      title: 'Performance',
      description:
        'Efficient resource loading and modern web technologies for a responsive experience.',
      icon: '@tui.zap',
    },
    {
      title: 'Accessibility',
      description: 'Semantic interfaces and accessible interactions designed for a wider audience.',
      icon: '@tui.accessibility',
    },
    {
      title: 'Open Technology',
      description: 'Built using open-source tools and geographic data to support reproducibility.',
      icon: '@tui.layers',
    },
  ];
}
