import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthApi } from './auth-api';
import { MeResponse } from './auth.models';

type AuthState =
  | { readonly status: 'loading'; readonly session: null }
  | { readonly status: 'unauthenticated'; readonly session: null }
  | { readonly status: 'error'; readonly session: null }
  | { readonly status: 'authenticated'; readonly session: MeResponse };

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);
  private readonly state = signal<AuthState>({ status: 'loading', session: null });

  readonly status = computed(() => this.state().status);
  readonly session = computed(() => this.state().session);
  readonly isAuthenticated = computed(() => this.state().status === 'authenticated');
  readonly user = computed(() => this.state().session?.user ?? null);
  readonly workspaces = computed(() => this.state().session?.workspaces ?? []);
  readonly activeWorkspace = computed(() => {
    const session = this.state().session;
    return (
      session?.workspaces.find((workspace) => workspace.tenantId === session.activeWorkspace) ??
      null
    );
  });

  async initialize(): Promise<void> {
    await this.loadSession();
  }

  async refresh(): Promise<void> {
    await this.loadSession();
  }

  async switchWorkspace(tenantId: string): Promise<void> {
    await firstValueFrom(this.api.switchWorkspace(tenantId));
    await this.loadSession();
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.logout());
    } finally {
      this.state.set({ status: 'unauthenticated', session: null });
    }
  }

  private async loadSession(): Promise<void> {
    try {
      const session = await firstValueFrom(this.api.me());
      this.state.set({ status: 'authenticated', session });
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.state.set({ status: 'unauthenticated', session: null });
        return;
      }

      this.state.set({ status: 'error', session: null });
    }
  }
}
