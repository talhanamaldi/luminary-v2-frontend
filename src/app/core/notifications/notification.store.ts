import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthApi } from '../auth/auth-api';
import { PendingInvitation } from '../auth/auth.models';
import { AuthStore } from '../auth/auth.store';

/**
 * In-app notification center state. Today it only surfaces pending
 * invitations addressed to the signed-in user; it is kept separate from
 * {@link AuthStore} so the session stays focused on identity and workspaces.
 */
@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly api = inject(AuthApi);
  private readonly auth = inject(AuthStore);

  private readonly pendingInvitationsState = signal<readonly PendingInvitation[]>([]);
  private readonly loadingState = signal(false);

  readonly pendingInvitations = this.pendingInvitationsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly count = computed(() => this.pendingInvitationsState().length);

  async load(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      this.pendingInvitationsState.set([]);
      return;
    }
    if (this.loadingState()) {
      return;
    }

    this.loadingState.set(true);
    try {
      const invitations = await firstValueFrom(this.api.pendingInvitations());
      this.pendingInvitationsState.set(invitations);
    } catch {
      this.pendingInvitationsState.set([]);
    } finally {
      this.loadingState.set(false);
    }
  }

  clear(): void {
    this.pendingInvitationsState.set([]);
  }
}
