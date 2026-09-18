import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-form-actions',
  imports: [MatButtonModule],
  templateUrl: './form-actions.html',
  styleUrl: './form-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormActions {
  readonly submitLabel = input('Kaydet');
  readonly pendingLabel = input('Kaydediliyor…');
  readonly cancelLabel = input('Vazgeç');
  readonly pending = input(false);
  readonly submitDisabled = input(false);
  readonly showCancel = input(true);
  readonly cancelRequested = output<void>();
}
