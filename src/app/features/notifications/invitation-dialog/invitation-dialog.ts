import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { membershipRoleLabel } from '../../../core/auth/auth.models';
import { APP_PATHS } from '../../../core/config/app-config';
import { InvitationDialogData } from './invitation-dialog.models';

const EXPIRY_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

@Component({
  selector: 'app-invitation-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './invitation-dialog.html',
  styleUrl: './invitation-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationDialog {
  private readonly dialogRef = inject(MatDialogRef<InvitationDialog>);
  private readonly router = inject(Router);

  protected readonly data = inject<InvitationDialogData>(MAT_DIALOG_DATA);
  protected readonly roleLabel = membershipRoleLabel(this.data.invitation.role) ?? 'üye';
  protected readonly expiryLabel = () => {
    const value = new Date(this.data.invitation.expiresAt);
    return Number.isNaN(value.getTime()) ? null : EXPIRY_FORMATTER.format(value);
  };

  protected accept(): void {
    this.dialogRef.close();
    const token = this.extractToken(this.data.invitation.acceptUrl);
    if (token) {
      void this.router.navigate([`/${APP_PATHS.invitationAccept}`], {
        queryParams: { token },
      });
    } else {
      window.location.assign(this.data.invitation.acceptUrl);
    }
  }

  private extractToken(acceptUrl: string): string | null {
    try {
      return new URL(acceptUrl).searchParams.get('token');
    } catch {
      return null;
    }
  }
}
