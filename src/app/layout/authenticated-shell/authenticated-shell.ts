import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
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
import { membershipRoleLabel, Workspace } from '../../core/auth/auth.models';
import { AuthStore } from '../../core/auth/auth.store';
import { APP_PATHS } from '../../core/config/app-config';
import { AppActivityStore } from '../../core/ui/app-activity.store';
import { AppNotificationService } from '../../shared/ui/notification/app-notification.service';

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
export class AuthenticatedShell {
  @ViewChild(MatSidenav) private navigation?: MatSidenav;

  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly notification = inject(AppNotificationService);
  private readonly router = inject(Router);

  protected readonly auth = inject(AuthStore);
  protected readonly activity = inject(AppActivityStore);
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
