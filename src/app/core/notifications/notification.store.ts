import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthApi } from '../auth/auth-api';
import { PendingInvitation } from '../auth/auth.models';
import { AuthStore } from '../auth/auth.store';
import { InstitutionApi } from '../institution/institution-api';
import { SchoolNotification } from '../institution/institution.models';

export type NotificationItem =
  | { readonly kind: 'invitation'; readonly invitation: PendingInvitation }
  | { readonly kind: 'school'; readonly notification: SchoolNotification };

/**
 * In-app notification center state. Students see pending invitations
 * addressed to them; institution admins additionally see school
 * notifications about students accepting or rejecting invite links. The
 * store is kept separate from {@link AuthStore} so the session stays
 * focused on identity and workspaces.
 */
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly api = inject(AuthApi);
  private readonly institutionApi = inject(InstitutionApi);
  private readonly auth = inject(AuthStore);

  private readonly pendingInvitationsState = signal<readonly PendingInvitation[]>([]);
  private readonly schoolNotificationsState = signal<readonly SchoolNotification[]>([]);
  private readonly loadingState = signal(false);

  readonly pendingInvitations = this.pendingInvitationsState.asReadonly();
  readonly schoolNotifications = this.schoolNotificationsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  readonly unreadSchoolNotifications = computed(() =>
    this.schoolNotificationsState().filter((notification) => notification.readAt === null),
  );
  readonly isSchoolView = computed(() => {
    const workspace = this.auth.activeWorkspace();
    return (
      workspace?.tenantType === 'INSTITUTION' &&
      workspace.role === 'INSTITUTION_ADMIN' &&
      workspace.status === 'ACTIVE'
    );
  });
  readonly count = computed(
    () => this.pendingInvitationsState().length + this.unreadSchoolNotifications().length,
  );
  readonly items = computed<readonly NotificationItem[]>(() => {
    const schoolItems: NotificationItem[] = this.schoolNotificationsState().map((notification) => ({
      kind: 'school',
      notification,
    }));
    const invitationItems: NotificationItem[] = this.pendingInvitationsState().map(
      (invitation) => ({ kind: 'invitation', invitation }),
    );
    return [...schoolItems, ...invitationItems];
  });

  async load(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      this.pendingInvitationsState.set([]);
      this.schoolNotificationsState.set([]);
      return;
    }
    if (this.loadingState()) {
      return;
    }

    this.loadingState.set(true);
    try {
      const [invitations, schoolNotifications] = await Promise.all([
        firstValueFrom(this.api.pendingInvitations()),
        this.isSchoolView()
          ? firstValueFrom(this.institutionApi.schoolNotifications())
          : Promise.resolve([]),
      ]);
      this.pendingInvitationsState.set(invitations);
      this.schoolNotificationsState.set(schoolNotifications);
    } catch {
      this.pendingInvitationsState.set([]);
      this.schoolNotificationsState.set([]);
    } finally {
      this.loadingState.set(false);
    }
  }

  clear(): void {
    this.pendingInvitationsState.set([]);
    this.schoolNotificationsState.set([]);
  }

  /**
   * Declines a pending invitation and drops it from the in-app list. The
   * accepting institution can re-issue a fresh invite afterwards.
   */
  async reject(invitationId: string): Promise<void> {
    await firstValueFrom(this.api.rejectInvitation(invitationId));
    this.pendingInvitationsState.set(
      this.pendingInvitationsState().filter(
        (invitation) => invitation.invitationId !== invitationId,
      ),
    );
  }

  /**
   * Marks every currently-unread school notification as read for the active
   * institution workspace.
   */
  async markAllSchoolNotificationsRead(): Promise<void> {
    const unread = this.unreadSchoolNotifications();
    if (unread.length === 0) {
      return;
    }

    await Promise.all(
      unread.map((notification) =>
        firstValueFrom(this.institutionApi.markSchoolNotificationRead(notification.notificationId)),
      ),
    );

    const now = new Date().toISOString();
    this.schoolNotificationsState.set(
      this.schoolNotificationsState().map((notification) =>
        notification.readAt === null ? { ...notification, readAt: now } : notification,
      ),
    );
  }
}
