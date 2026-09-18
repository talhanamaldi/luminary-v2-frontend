export type ApiProblemSeverity = 'ERROR' | 'WARNING';

export interface ApiProblem {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly timestamp?: string;
  readonly code?: string;
  readonly severity?: ApiProblemSeverity;
  readonly traceId?: string;
  readonly fields?: Readonly<Record<string, string>>;
}
