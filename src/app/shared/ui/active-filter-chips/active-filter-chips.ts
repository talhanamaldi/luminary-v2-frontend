import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

export interface ActiveFilterChip {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-active-filter-chips',
  imports: [MatButtonModule, MatChipsModule],
  templateUrl: './active-filter-chips.html',
  styleUrl: './active-filter-chips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveFilterChips {
  readonly filters = input<readonly ActiveFilterChip[]>([]);
  readonly removeFilter = output<string>();
  readonly clearFilters = output<void>();
}
