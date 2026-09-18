import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { PendingInvitation } from '../../../core/auth/auth.models';
import { InvitationDialog } from './invitation-dialog';
import { InvitationDialogData } from './invitation-dialog.models';

@Injectable({ providedIn: 'root' })
export class InvitationDialogService {
  private readonly dialog = inject(MatDialog);

  open(invitation: PendingInvitation): void {
    const data: InvitationDialogData = { invitation };
    this.dialog.open<InvitationDialog, InvitationDialogData>(InvitationDialog, {
      data,
      width: 'min(34rem, calc(100vw - 2rem))',
      maxWidth: 'none',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }
}
