import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';

import { AppNotification, AppNotificationTone } from './app-notification';

export interface AppNotificationOptions {
  readonly requestId?: string | null;
  readonly duration?: number;
}

const DEFAULT_DURATIONS: Readonly<Record<AppNotificationTone, number>> = {
  info: 5000,
  success: 4000,
  warning: 6000,
  error: 8000,
};

@Injectable({ providedIn: 'root' })
export class AppNotificationService {
  private readonly snackBar = inject(MatSnackBar);

  info(message: string, options?: AppNotificationOptions): MatSnackBarRef<AppNotification> {
    return this.open('info', message, options);
  }

  success(message: string, options?: AppNotificationOptions): MatSnackBarRef<AppNotification> {
    return this.open('success', message, options);
  }

  warning(message: string, options?: AppNotificationOptions): MatSnackBarRef<AppNotification> {
    return this.open('warning', message, options);
  }

  error(message: string, options?: AppNotificationOptions): MatSnackBarRef<AppNotification> {
    return this.open('error', message, options);
  }

  private open(
    tone: AppNotificationTone,
    message: string,
    options?: AppNotificationOptions,
  ): MatSnackBarRef<AppNotification> {
    return this.snackBar.openFromComponent(AppNotification, {
      data: { message, tone, requestId: options?.requestId },
      duration: options?.duration ?? DEFAULT_DURATIONS[tone],
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: 'lm-notification-panel',
      politeness: tone === 'error' ? 'assertive' : 'polite',
    });
  }
}
