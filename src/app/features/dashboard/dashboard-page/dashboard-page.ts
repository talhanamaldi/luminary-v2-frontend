import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';

import { apiErrorCode, apiFieldErrors, apiRequestId } from '../../../core/api/api-error';
import { apiErrorMessageForCode } from '../../../core/api/api-error-messages';
import { AuthApi } from '../../../core/auth/auth-api';
import {
  InvitationCreated,
  membershipRoleLabel,
  membershipStatusLabel,
  tenantTypeLabel,
} from '../../../core/auth/auth.models';
import { AuthStore } from '../../../core/auth/auth.store';
import { AppActivityStore } from '../../../core/ui/app-activity.store';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

type InvitationState = 'idle' | 'creating' | 'resending' | 'success' | 'error';
type InvitationAction = 'create' | 'resend';

const EXPIRY_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

@Component({
  selector: 'app-dashboard-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    PageHeader,
    ReactiveFormsModule,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly api = inject(AuthApi);
  private readonly activity = inject(AppActivityStore);

  protected readonly auth = inject(AuthStore);
  protected readonly invitationForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)],
    }),
  });
  protected readonly invitationState = signal<InvitationState>('idle');
  protected readonly invitationFeedback = signal<string | null>(null);
  protected readonly invitationFieldError = signal<string | null>(null);
  protected readonly invitationRequestId = signal<string | null>(null);
  protected readonly invitationExpiresAt = signal<string | null>(null);
  protected readonly invitationBusy = computed(() => {
    const state = this.invitationState();
    return state === 'creating' || state === 'resending';
  });
  protected readonly canInviteStudents = computed(() => {
    const workspace = this.auth.activeWorkspace();
    return (
      workspace?.tenantType === 'INSTITUTION' &&
      workspace.role === 'INSTITUTION_ADMIN' &&
      workspace.status === 'ACTIVE'
    );
  });
  protected readonly invitationExpiryLabel = computed(() => {
    const value = this.invitationExpiresAt();
    if (!value) {
      return null;
    }

    const expiry = new Date(value);
    return Number.isNaN(expiry.getTime()) ? null : EXPIRY_FORMATTER.format(expiry);
  });
  protected readonly displayName = computed(() => {
    const user = this.auth.user();
    return user?.displayName?.trim() || user?.email || 'Luminary kullanıcısı';
  });
  protected readonly roleLabel = computed(() =>
    membershipRoleLabel(this.auth.activeWorkspace()?.role ?? null),
  );
  protected readonly workspaceTypeLabel = computed(() =>
    tenantTypeLabel(this.auth.activeWorkspace()?.tenantType ?? null),
  );
  protected readonly workspaceStatusLabel = computed(() =>
    membershipStatusLabel(this.auth.activeWorkspace()?.status ?? null),
  );

  constructor() {
    let previousWorkspaceId = this.auth.activeWorkspace()?.tenantId ?? null;
    effect(() => {
      const currentWorkspaceId = this.auth.activeWorkspace()?.tenantId ?? null;
      if (currentWorkspaceId !== previousWorkspaceId) {
        previousWorkspaceId = currentWorkspaceId;
        this.resetInvitation();
      }
    });
  }

  protected sendStudentInvitation(): void {
    void this.submitInvitation('create');
  }

  protected resendStudentInvitation(): void {
    void this.submitInvitation('resend');
  }

  protected clearInvitationFeedback(): void {
    if (this.invitationBusy()) {
      return;
    }

    this.invitationState.set('idle');
    this.invitationFeedback.set(null);
    this.invitationFieldError.set(null);
    this.invitationRequestId.set(null);
    this.invitationExpiresAt.set(null);
  }

  private async submitInvitation(action: InvitationAction): Promise<void> {
    if (!this.canInviteStudents() || this.invitationBusy()) {
      return;
    }

    if (this.invitationForm.invalid) {
      this.invitationForm.markAllAsTouched();
      return;
    }

    const email = this.invitationForm.controls.email.value.trim().toLowerCase();
    this.invitationForm.controls.email.setValue(email);
    this.invitationState.set(action === 'create' ? 'creating' : 'resending');
    this.invitationFeedback.set(null);
    this.invitationFieldError.set(null);
    this.invitationRequestId.set(null);
    this.invitationExpiresAt.set(null);

    try {
      const invitation = await this.activity.track(() =>
        firstValueFrom(
          action === 'create'
            ? this.api.createStudentInvitation(email)
            : this.api.resendStudentInvitation(email),
        ),
      );
      this.handleInvitationSuccess(action, invitation);
    } catch (error: unknown) {
      const fallback =
        action === 'create'
          ? 'Davet şu anda oluşturulamadı. Lütfen tekrar deneyin.'
          : 'Davet şu anda yeniden gönderilemedi. Lütfen tekrar deneyin.';
      this.invitationFeedback.set(apiErrorMessageForCode(apiErrorCode(error), fallback));
      this.invitationFieldError.set(
        apiFieldErrors(error)['email'] ? 'Geçerli bir e-posta adresi girin.' : null,
      );
      this.invitationRequestId.set(apiRequestId(error));
      this.invitationState.set('error');
    }
  }

  private handleInvitationSuccess(action: InvitationAction, invitation: InvitationCreated): void {
    this.invitationFeedback.set(
      action === 'create'
        ? `${invitation.email} adresi için öğrenci daveti oluşturuldu ve gönderim için işlendi.`
        : `${invitation.email} adresi için yeni davet bağlantısı oluşturuldu ve gönderim için işlendi. Önceki bağlantı artık geçersiz.`,
    );
    this.invitationExpiresAt.set(invitation.expiresAt);
    this.invitationState.set('success');
  }

  private resetInvitation(): void {
    this.invitationForm.reset();
    this.clearInvitationFeedback();
  }
}
