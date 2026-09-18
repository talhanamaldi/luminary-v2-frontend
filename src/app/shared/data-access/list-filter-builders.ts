import { FilterCriterion } from '../../core/api/list-query';

type ValueFilterOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'STARTS_WITH'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL';

export function valueFilter<TField extends string>(
  field: TField,
  operator: ValueFilterOperator,
  value: unknown,
): FilterCriterion<TField> | null {
  return isEmptyFilterValue(value) ? null : { field, operator, value };
}

export function inFilter<TField extends string>(
  field: TField,
  values: readonly unknown[],
): FilterCriterion<TField> | null {
  const populatedValues = values.filter((value) => !isEmptyFilterValue(value));
  return populatedValues.length > 0
    ? {
        field,
        operator: 'IN',
        values: populatedValues as [unknown, ...unknown[]],
      }
    : null;
}

export function betweenFilter<TField extends string>(
  field: TField,
  start: unknown,
  end: unknown,
): FilterCriterion<TField> | null {
  return isEmptyFilterValue(start) || isEmptyFilterValue(end)
    ? null
    : { field, operator: 'BETWEEN', values: [start, end] };
}

export function nullFilter<TField extends string>(
  field: TField,
  operator: 'IS_NULL' | 'IS_NOT_NULL',
): FilterCriterion<TField> {
  return { field, operator };
}

export function collectFilters<TField extends string>(
  ...filters: readonly (FilterCriterion<TField> | null | undefined | false)[]
): readonly FilterCriterion<TField>[] {
  return filters.filter((filter): filter is FilterCriterion<TField> => Boolean(filter));
}

function isEmptyFilterValue(value: unknown): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '');
}
