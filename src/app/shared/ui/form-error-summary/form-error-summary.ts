import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-form-error-summary',
  templateUrl: './form-error-summary.html',
  styleUrl: './form-error-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormErrorSummary {
  readonly title = input('Bilgileri kontrol edin');
  readonly messages = input<readonly string[]>([]);
  readonly requestId = input<string | null>(null);
}
