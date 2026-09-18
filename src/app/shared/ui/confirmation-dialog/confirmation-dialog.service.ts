import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';

import { ConfirmationDialog } from './confirmation-dialog';
import { ConfirmationDialogData, ConfirmationDialogOptions } from './confirmation-dialog.models';

@Injectable({ providedIn: 'root' })
export class ConfirmationDialogService {
  private readonly dialog = inject(MatDialog);

  confirm(options: ConfirmationDialogOptions): Observable<boolean> {
    const data: ConfirmationDialogData = {
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel ?? 'Onayla',
      cancelLabel: options.cancelLabel ?? 'Vazgeç',
      tone: options.tone ?? 'primary',
    };

    return this.dialog
      .open<ConfirmationDialog, ConfirmationDialogData, boolean>(ConfirmationDialog, {
        data,
        width: 'min(28rem, calc(100vw - 2rem))',
        maxWidth: 'none',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      })
      .afterClosed()
      .pipe(map((confirmed) => confirmed === true));
  }
}
