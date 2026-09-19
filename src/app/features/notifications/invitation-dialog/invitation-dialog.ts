import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { apiErrorCode, apiRequestId } from '../../../core/api/api-error';
import { apiErrorMessageForCode } from '../../../core/api/api-error-messages';
import { membershipRoleLabel } from '../../../core/auth/auth.models';
import { APP_PATHS } from '../../../core/config/app-config';
import { NotificationStore } from '../../../core/notifications/notification.store';
import { ConfirmationDialogService } from '../../../shared/ui/confirmation-dialog/confirmation-dialog.service';
import { AppNotificationService } from '../../../shared/ui/notification/app-notification.service';
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
  private readonly confirmations = inject(ConfirmationDialogService);
  private readonly notifications = inject(NotificationStore);
  private readonly notification = inject(AppNotificationService);

  protected readonly data = inject<InvitationDialogData>(MAT_DIALOG_DATA);
  protected readonly roleLabel = membershipRoleLabel(this.data.invitation.role) ?? 'üye';
  protected readonly rejecting = signal(false);
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

  protected reject(): void {
    if (this.rejecting()) {
      return;
    }
    const invitation = this.data.invitation;
    this.confirmations
      .confirm({
        title: 'Daveti reddet',
        message:
          `"${invitation.tenantName}" kurumundan gelen daveti reddetmek ` +
          'istediğinize emin misiniz? Davet, bekleyen bildirimlerden ' +
          'kaldırılır. İleride katılmak isterseniz kurum yeni bir davet ' +
          'gönderebilir.',
        confirmLabel: 'Reddet',
        tone: 'danger',
      })
      .subscribe(async (confirmed) => {
        if (!confirmed || this.rejecting()) {
          return;
        }
        this.rejecting.set(true);
        this.dialogRef.close();
        try {
          await this.notifications.reject(invitation.invitationId);
          this.notification.success(`"${invitation.tenantName}" daveti reddedildi.`);
        } catch (error: unknown) {
          this.notification.error(
            apiErrorMessageForCode(
              apiErrorCode(error),
              'Davet reddedilemedi. Lütfen tekrar deneyin.',
            ),
            { requestId: apiRequestId(error) },
          );
        } finally {
          this.rejecting.set(false);
        }
      });
  }

  private extractToken(acceptUrl: string): string | null {
    try {
      return new URL(acceptUrl).searchParams.get('token');
    } catch {
      return null;
    }
  }
}
