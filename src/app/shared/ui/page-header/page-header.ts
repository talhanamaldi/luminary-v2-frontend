import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PageHeaderAppearance = 'default' | 'hero';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly eyebrow = input<string | null>(null);
  readonly appearance = input<PageHeaderAppearance>('default');
}
