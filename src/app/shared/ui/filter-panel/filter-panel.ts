import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

let nextFilterPanelId = 0;

@Component({
  selector: 'app-filter-panel',
  imports: [MatButtonModule],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanel {
  readonly title = input('Filtreler');
  readonly description = input<string | null>(null);
  readonly activeFilterCount = input(0);
  readonly pending = input(false);
  readonly disabled = input(false);
  readonly applyLabel = input('Filtreleri uygula');
  readonly clearLabel = input('Temizle');
  readonly autoCloseOnApply = input(true);
  readonly open = model(false);
  readonly applyFilters = output<void>();
  readonly clearFilters = output<void>();

  protected readonly panelId = `lm-filter-panel-${nextFilterPanelId++}`;

  protected toggle(): void {
    if (!this.disabled()) {
      this.open.update((open) => !open);
    }
  }

  protected apply(): void {
    if (this.pending() || this.disabled()) {
      return;
    }

    this.applyFilters.emit();
    if (this.autoCloseOnApply()) {
      this.open.set(false);
    }
  }

  protected clear(): void {
    if (!this.pending() && !this.disabled()) {
      this.clearFilters.emit();
    }
  }
}
