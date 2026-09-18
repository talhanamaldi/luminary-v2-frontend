import { AbstractControl } from '@angular/forms';

import { apiFieldErrors } from '../../core/api/api-error';

export interface AppliedValidationErrors {
  readonly appliedFields: readonly string[];
  readonly unhandledFields: Readonly<Record<string, string>>;
}

export function applyApiValidationErrors(
  form: AbstractControl,
  error: unknown,
): AppliedValidationErrors {
  const appliedFields: string[] = [];
  const unhandledFields: Record<string, string> = {};

  for (const [field, message] of Object.entries(apiFieldErrors(error))) {
    const control = form.get(toAngularControlPath(field));
    if (!control) {
      unhandledFields[field] = message;
      continue;
    }

    control.setErrors({ ...control.errors, server: message });
    control.markAsTouched();
    appliedFields.push(field);
  }

  return { appliedFields, unhandledFields };
}

export function clearApiValidationError(control: AbstractControl): void {
  const errors = control.errors;
  if (!errors || !('server' in errors)) {
    return;
  }

  const remainingErrors = { ...errors };
  delete remainingErrors['server'];
  control.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
}

function toAngularControlPath(field: string): string {
  return field.replace(/\[(\d+)]/g, '.$1');
}
