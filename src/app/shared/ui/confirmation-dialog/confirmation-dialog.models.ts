export type ConfirmationTone = 'primary' | 'danger';

export interface ConfirmationDialogOptions {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly tone?: ConfirmationTone;
}

export interface ConfirmationDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly tone: ConfirmationTone;
}
