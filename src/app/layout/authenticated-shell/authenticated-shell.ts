import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { apiErrorCode, apiRequestId } from '../../core/api/api-error';
import { apiErrorMessageForCode } from '../../core/api/api-error-messages';
import {
  MembershipRole,
  membershipRoleLabel,
  PendingInvitation,
  Workspace,
} from '../../core/auth/auth.models';
import { AuthStore } from '../../core/auth/auth.store';
import { APP_PATHS } from '../../core/config/app-config';
import { NotificationStore } from '../../core/notifications/notification.store';
import { AppActivityStore } from '../../core/ui/app-activity.store';
import { InvitationDialogService } from '../../features/notifications/invitation-dialog/invitation-dialog.service';
import { AppNotificationService } from '../../shared/ui/notification/app-notification.service';

const EXPIRY_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

@Component({
  selector: 'app-authenticated-shell',
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSidenavModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './authenticated-shell.html',
  styleUrl: './authenticated-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthenticatedShell implements OnInit {
  @ViewChild(MatSidenav) private navigation?: MatSidenav;

  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly notification = inject(AppNotificationService);
  private readonly router = inject(Router);
  private readonly invitationDialog = inject(InvitationDialogService);

  protected readonly auth = inject(AuthStore);
  protected readonly activity = inject(AppActivityStore);
  protected readonly notifications = inject(NotificationStore);
  protected readonly dashboardUrl = `/${APP_PATHS.dashboard}`;
  protected readonly busy = signal(false);
  protected readonly compact = toSignal(
    this.breakpointObserver.observe('(max-width: 56.25rem)').pipe(map(({ matches }) => matches)),
    { initialValue: false },
  );
  protected readonly showWorkspaceNavigation = computed(
    () => this.auth.activeWorkspace()?.status === 'ACTIVE',
  );
  protected readonly displayName = computed(() => {
    const user = this.auth.user();
    return user?.displayName?.trim() || user?.email || 'Luminary kullanıcısı';
  });
  protected readonly initials = computed(() =>
    this.displayName()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase('tr-TR'))
      .join(''),
  );
  protected readonly activeRoleLabel = computed(() =>
    membershipRoleLabel(this.auth.activeWorkspace()?.role ?? null),
  );

  ngOnInit(): void {
    void this.notifications.load();
  }

  protected refreshNotifications(): void {
    void this.notifications.load();
  }

  protected openInvitation(invitation: PendingInvitation): void {
    this.invitationDialog.open(invitation);
  }

  protected roleLabel(role: MembershipRole | null): string | null {
    return membershipRoleLabel(role);
  }

  protected expiryLabel(iso: string): string | null {
    const value = new Date(iso);
    return Number.isNaN(value.getTime()) ? null : EXPIRY_FORMATTER.format(value);
  }

  protected toggleNavigation(): void {
    void this.navigation?.toggle();
  }

  protected async closeCompactNavigation(): Promise<void> {
    if (this.compact()) {
      await this.navigation?.close();
    }
  }

  protected async selectWorkspace(workspace: Workspace): Promise<void> {
    if (
      workspace.tenantId === this.auth.activeWorkspace()?.tenantId ||
      this.busy() ||
      this.activity.pending()
    ) {
      return;
    }

    this.busy.set(true);

    try {
      await this.auth.switchWorkspace(workspace.tenantId);
    } catch (error: unknown) {
      this.notification.error(
        apiErrorMessageForCode(
          apiErrorCode(error),
          'Çalışma alanı değiştirilemedi. Lütfen tekrar deneyin.',
        ),
        { requestId: apiRequestId(error) },
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected async logout(): Promise<void> {
    if (this.busy() || this.activity.pending()) {
      return;
    }

    this.busy.set(true);
    try {
      await this.auth.logout();
      await this.router.navigateByUrl(`/${APP_PATHS.login}`);
    } finally {
      this.busy.set(false);
    }
  }
}
