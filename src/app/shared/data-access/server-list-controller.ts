import { DestroyRef, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import {
  Observable,
  Subject,
  catchError,
  debounceTime,
  map,
  merge,
  of,
  scan,
  switchMap,
  takeUntil,
} from 'rxjs';

import { apiErrorCode, apiRequestId } from '../../core/api/api-error';
import { apiErrorMessageForCode } from '../../core/api/api-error-messages';
import {
  DEFAULT_PAGE_SIZE,
  FilterCriterion,
  MAX_FILTER_COUNT,
  MAX_PAGE_SIZE,
  MAX_SORT_COUNT,
  PageResponse,
  SearchRequest,
  SortCriterion,
} from '../../core/api/list-query';

export interface ServerListError {
  readonly code: string | null;
  readonly message: string;
  readonly requestId: string | null;
}

export interface ServerListSearch<TFilterField extends string> {
  readonly field: TFilterField;
  readonly operator?: 'CONTAINS' | 'STARTS_WITH';
  readonly debounceMs?: number;
}

export interface ServerListControllerOptions<
  TItem,
  TFilterField extends string,
  TSortField extends string,
> {
  readonly load: (
    request: SearchRequest<TFilterField, TSortField>,
  ) => Observable<PageResponse<TItem>>;
  readonly search?: ServerListSearch<TFilterField>;
  readonly initialTake?: number;
  readonly initialFilters?: readonly FilterCriterion<TFilterField>[];
  readonly initialSorts?: readonly SortCriterion<TSortField>[];
  readonly errorFallback?: string;
}

export interface ServerListQueryState<TFilterField extends string, TSortField extends string> {
  readonly skip: number;
  readonly take: number;
  readonly search: string;
  readonly filters: readonly FilterCriterion<TFilterField>[];
  readonly sorts: readonly SortCriterion<TSortField>[];
}

type ListAction<TFilterField extends string, TSortField extends string> =
  | { readonly type: 'reload' }
  | { readonly type: 'search'; readonly value: string }
  | { readonly type: 'page'; readonly skip: number; readonly take: number }
  | { readonly type: 'filters'; readonly filters: readonly FilterCriterion<TFilterField>[] }
  | { readonly type: 'sorts'; readonly sorts: readonly SortCriterion<TSortField>[] };

type LoadResult<TItem> =
  | { readonly status: 'success'; readonly page: PageResponse<TItem> }
  | { readonly status: 'error'; readonly error: unknown };

export class ServerListController<
  TItem,
  TFilterField extends string = string,
  TSortField extends string = TFilterField,
> {
  private readonly action = new Subject<ListAction<TFilterField, TSortField>>();
  private readonly searchAction = new Subject<string>();
  private readonly cancelRequest = new Subject<void>();
  private readonly destroyed = new Subject<void>();
  private readonly itemsState = signal<readonly TItem[]>([]);
  private readonly loadingState = signal(true);
  private readonly errorState = signal<ServerListError | null>(null);
  private readonly totalItemsState = signal(0);
  private readonly hasNextState = signal(false);
  private readonly searchTermState = signal('');
  private readonly queryState: WritableSignal<ServerListQueryState<TFilterField, TSortField>>;

  readonly items: Signal<readonly TItem[]> = this.itemsState.asReadonly();
  readonly loading: Signal<boolean> = this.loadingState.asReadonly();
  readonly error: Signal<ServerListError | null> = this.errorState.asReadonly();
  readonly totalItems: Signal<number> = this.totalItemsState.asReadonly();
  readonly hasNext: Signal<boolean> = this.hasNextState.asReadonly();
  readonly searchTerm: Signal<string> = this.searchTermState.asReadonly();
  readonly empty = computed(() => !this.loading() && !this.error() && this.items().length === 0);
  readonly searchEnabled: boolean;

  constructor(
    private readonly options: ServerListControllerOptions<TItem, TFilterField, TSortField>,
    destroyRef: DestroyRef,
  ) {
    const initialState: ServerListQueryState<TFilterField, TSortField> = {
      skip: 0,
      take: options.initialTake ?? DEFAULT_PAGE_SIZE,
      search: '',
      filters: options.initialFilters ?? [],
      sorts: options.initialSorts ?? [],
    };
    validateState(initialState, options.search ? 1 : 0);
    this.queryState = signal(initialState);
    this.searchEnabled = Boolean(options.search);

    const actions = merge(
      of<ListAction<TFilterField, TSortField>>({ type: 'reload' }),
      this.action,
      this.searchAction.pipe(
        debounceTime(options.search?.debounceMs ?? 300),
        map((value): ListAction<TFilterField, TSortField> => ({ type: 'search', value })),
      ),
    );

    actions
      .pipe(
        scan(reduceQueryState, initialState),
        switchMap((state) => {
          this.queryState.set(state);
          this.loadingState.set(true);
          this.errorState.set(null);

          return options.load(this.toRequest(state)).pipe(
            takeUntil(this.cancelRequest),
            map((page): LoadResult<TItem> => ({ status: 'success', page })),
            catchError((error: unknown) => of<LoadResult<TItem>>({ status: 'error', error })),
          );
        }),
        takeUntil(this.destroyed),
      )
      .subscribe((result) => this.applyResult(result));

    destroyRef.onDestroy(() => {
      this.destroyed.next();
      this.destroyed.complete();
      this.cancelRequest.complete();
      this.searchAction.complete();
      this.action.complete();
    });
  }

  readonly query = (): ServerListQueryState<TFilterField, TSortField> => this.queryState();

  setSearch(value: string): void {
    if (!this.options.search) {
      return;
    }

    const normalized = value.trim();
    if (normalized === this.searchTermState()) {
      return;
    }

    this.searchTermState.set(normalized);
    this.loadingState.set(true);
    this.cancelRequest.next();
    this.searchAction.next(normalized);
  }

  setPage(skip: number, take: number): void {
    validatePage(skip, take);
    this.action.next({ type: 'page', skip, take });
  }

  setFilters(filters: readonly FilterCriterion<TFilterField>[]): void {
    validateFilters(filters, this.options.search ? 1 : 0);
    this.action.next({ type: 'filters', filters });
  }

  setSorts(sorts: readonly SortCriterion<TSortField>[]): void {
    validateSorts(sorts);
    this.action.next({ type: 'sorts', sorts });
  }

  reload(): void {
    this.action.next({ type: 'reload' });
  }

  private toRequest(
    state: ServerListQueryState<TFilterField, TSortField>,
  ): SearchRequest<TFilterField, TSortField> {
    const searchFilter: readonly FilterCriterion<TFilterField>[] =
      state.search && this.options.search
        ? [
            {
              field: this.options.search.field,
              operator: this.options.search.operator ?? 'CONTAINS',
              value: state.search,
            },
          ]
        : [];

    return {
      skip: state.skip,
      take: state.take,
      filters: [...state.filters, ...searchFilter],
      sorts: state.sorts,
    };
  }

  private applyResult(result: LoadResult<TItem>): void {
    this.loadingState.set(false);

    if (result.status === 'success') {
      this.itemsState.set(result.page.items);
      this.totalItemsState.set(result.page.totalItems);
      this.hasNextState.set(result.page.hasNext);
      return;
    }

    const code = apiErrorCode(result.error);
    this.errorState.set({
      code,
      message: apiErrorMessageForCode(
        code,
        this.options.errorFallback ?? 'Liste şu anda yüklenemedi. Lütfen tekrar deneyin.',
      ),
      requestId: apiRequestId(result.error),
    });
  }
}

export function createServerListController<
  TItem,
  TFilterField extends string = string,
  TSortField extends string = TFilterField,
>(
  options: ServerListControllerOptions<TItem, TFilterField, TSortField>,
): ServerListController<TItem, TFilterField, TSortField> {
  return new ServerListController(options, inject(DestroyRef));
}

function reduceQueryState<TFilterField extends string, TSortField extends string>(
  state: ServerListQueryState<TFilterField, TSortField>,
  action: ListAction<TFilterField, TSortField>,
): ServerListQueryState<TFilterField, TSortField> {
  switch (action.type) {
    case 'search':
      return { ...state, skip: 0, search: action.value };
    case 'page':
      return { ...state, skip: action.skip, take: action.take };
    case 'filters':
      return { ...state, skip: 0, filters: action.filters };
    case 'sorts':
      return { ...state, skip: 0, sorts: action.sorts };
    case 'reload':
      return { ...state };
  }
}

function validateState<TFilterField extends string, TSortField extends string>(
  state: ServerListQueryState<TFilterField, TSortField>,
  reservedFilterCount: number,
): void {
  validatePage(state.skip, state.take);
  validateFilters(state.filters, reservedFilterCount);
  validateSorts(state.sorts);
}

function validatePage(skip: number, take: number): void {
  if (!Number.isInteger(skip) || skip < 0) {
    throw new RangeError('skip must be a non-negative integer.');
  }
  if (!Number.isInteger(take) || take < 1 || take > MAX_PAGE_SIZE) {
    throw new RangeError(`take must be between 1 and ${MAX_PAGE_SIZE}.`);
  }
}

function validateFilters<TField extends string>(
  filters: readonly FilterCriterion<TField>[],
  reservedFilterCount = 0,
): void {
  const availableFilterCount = MAX_FILTER_COUNT - reservedFilterCount;
  if (filters.length > availableFilterCount) {
    throw new RangeError(`A maximum of ${availableFilterCount} base filters is supported.`);
  }
}

function validateSorts<TField extends string>(sorts: readonly SortCriterion<TField>[]): void {
  if (sorts.length > MAX_SORT_COUNT) {
    throw new RangeError(`A maximum of ${MAX_SORT_COUNT} sorts is supported.`);
  }
}
