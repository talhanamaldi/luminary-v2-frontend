import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type AppNotificationTone = 'info' | 'success' | 'warning' | 'error';

export interface AppNotificationData {
  readonly message: string;
  readonly tone: AppNotificationTone;
  readonly requestId?: string | null;
}

const TONE_LABELS: Readonly<Record<AppNotificationTone, string>> = {
  info: 'Bilgi',
  success: 'Başarılı',
  warning: 'Uyarı',
  error: 'Hata',
};

@Component({
  selector: 'app-notification',
  templateUrl: './app-notification.html',
  styleUrl: './app-notification.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNotification {
  private readonly snackBarRef = inject(MatSnackBarRef<AppNotification>);

  protected readonly data = inject<AppNotificationData>(MAT_SNACK_BAR_DATA);
  protected readonly toneLabel = TONE_LABELS[this.data.tone];

  protected dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
