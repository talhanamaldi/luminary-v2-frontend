import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorIntl, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { NgTemplateOutlet } from '@angular/common';

import { SortCriterion } from '../../../core/api/list-query';
import { ServerListController } from '../../data-access/server-list-controller';
import { DataGridColumn } from './data-grid-column';
import { TurkishPaginatorIntl } from './turkish-paginator-intl';

@Component({
  selector: 'app-data-grid',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSortModule,
    MatTableModule,
    NgTemplateOutlet,
    ReactiveFormsModule,
  ],
  templateUrl: './data-grid.html',
  styleUrl: './data-grid.scss',
  providers: [{ provide: MatPaginatorIntl, useClass: TurkishPaginatorIntl }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGrid<
  TItem,
  TFilterField extends string = string,
  TSortField extends string = TFilterField,
> {
  protected readonly columns = contentChildren(DataGridColumn<TItem>);

  readonly controller = input.required<ServerListController<TItem, TFilterField, TSortField>>();
  readonly ariaLabel = input('Veri listesi');
  readonly searchLabel = input('Ara');
  readonly searchPlaceholder = input('Listede ara');
  readonly emptyTitle = input('Sonuç bulunamadı');
  readonly emptyDescription = input('Arama veya filtrelerinizi değiştirerek tekrar deneyin.');
  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50, 100]);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly displayedColumns = computed(() =>
    this.columns().map((column) => column.key()),
  );
  protected readonly activeSortField = computed(
    () => this.controller().query().sorts[0]?.field ?? '',
  );
  protected readonly activeSortDirection = computed(() => {
    const direction = this.controller().query().sorts[0]?.direction;
    return direction === 'ASC' ? 'asc' : direction === 'DESC' ? 'desc' : '';
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.controller().setSearch(value));

    effect(() => {
      const searchTerm = this.controller().searchTerm();
      if (searchTerm !== this.searchControl.value) {
        this.searchControl.setValue(searchTerm, { emitEvent: false });
      }
    });
  }

  protected clearSearch(): void {
    this.searchControl.setValue('');
  }

  protected pageChanged(event: PageEvent): void {
    const pageIndex = event.pageSize === this.controller().query().take ? event.pageIndex : 0;
    this.controller().setPage(pageIndex * event.pageSize, event.pageSize);
  }

  protected sortChanged(sort: Sort): void {
    const sorts: readonly SortCriterion<TSortField>[] = sort.direction
      ? [
          {
            field: sort.active as TSortField,
            direction: sort.direction === 'asc' ? 'ASC' : 'DESC',
          },
        ]
      : [];
    this.controller().setSorts(sorts);
  }
}
