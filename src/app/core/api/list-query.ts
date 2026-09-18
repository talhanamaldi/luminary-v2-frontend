export type FilterOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'STARTS_WITH'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'IN'
  | 'BETWEEN'
  | 'IS_NULL'
  | 'IS_NOT_NULL';

export type SortDirection = 'ASC' | 'DESC';

type ScalarFilterOperator = Exclude<FilterOperator, 'IN' | 'BETWEEN' | 'IS_NULL' | 'IS_NOT_NULL'>;

export type FilterCriterion<TField extends string = string> =
  | {
      readonly field: TField;
      readonly operator: ScalarFilterOperator;
      readonly value: unknown;
    }
  | {
      readonly field: TField;
      readonly operator: 'IN';
      readonly values: readonly [unknown, ...unknown[]];
    }
  | {
      readonly field: TField;
      readonly operator: 'BETWEEN';
      readonly values: readonly [unknown, unknown];
    }
  | {
      readonly field: TField;
      readonly operator: 'IS_NULL' | 'IS_NOT_NULL';
    };

export interface SortCriterion<TField extends string = string> {
  readonly field: TField;
  readonly direction: SortDirection;
}

export interface SearchRequest<
  TFilterField extends string = string,
  TSortField extends string = TFilterField,
> {
  readonly skip?: number;
  readonly take?: number;
  readonly filters?: readonly FilterCriterion<TFilterField>[];
  readonly sorts?: readonly SortCriterion<TSortField>[];
}

export interface PageResponse<T> {
  readonly items: readonly T[];
  readonly skip: number;
  readonly take: number;
  readonly totalItems: number;
  readonly hasNext: boolean;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_FILTER_COUNT = 10;
export const MAX_SORT_COUNT = 3;

export function nextPageSkip<T>(page: PageResponse<T>): number {
  return page.skip + page.take;
}

export function previousPageSkip<T>(page: PageResponse<T>): number {
  return Math.max(0, page.skip - page.take);
}
