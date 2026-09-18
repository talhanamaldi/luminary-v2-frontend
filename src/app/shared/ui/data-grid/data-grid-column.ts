import { Directive, TemplateRef, inject, input } from '@angular/core';

export type DataGridColumnAlign = 'start' | 'center' | 'end';

export interface DataGridCellContext<TItem> {
  readonly $implicit: TItem;
  readonly index: number;
}

@Directive({ selector: 'ng-template[appDataGridColumn]' })
export class DataGridColumn<TItem = unknown> {
  readonly key = input.required<string>({ alias: 'appDataGridColumn' });
  readonly header = input.required<string>();
  readonly sortField = input<string | null>(null);
  readonly align = input<DataGridColumnAlign>('start');
  readonly width = input<string | null>(null);
  readonly template = inject<TemplateRef<DataGridCellContext<TItem>>>(TemplateRef);

  static ngTemplateContextGuard<TItem>(
    _directive: DataGridColumn<TItem>,
    _context: unknown,
  ): _context is DataGridCellContext<TItem> {
    void _context;
    return true;
  }
}
