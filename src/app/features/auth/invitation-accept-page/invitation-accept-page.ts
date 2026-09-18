import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { apiErrorCode, apiRequestId } from '../../../core/api/api-error';
import { apiErrorMessageForCode } from '../../../core/api/api-error-messages';
import { AuthApi } from '../../../core/auth/auth-api';
import { AuthNavigation } from '../../../core/auth/auth-navigation';
import { AuthStore } from '../../../core/auth/auth.store';
import { APP_CONFIG } from '../../../core/config/app-config';

type AcceptState = 'idle' | 'accepting' | 'accepted' | 'error';

@Component({
  selector: 'app-invitation-accept-page',
  imports: [MatButtonModule, MatCardModule, RouterLink],
  templateUrl: './invitation-accept-page.html',
  styleUrl: './invitation-accept-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationAcceptPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AuthApi);
  private readonly navigation = inject(AuthNavigation);
  private readonly config = inject(APP_CONFIG);

  protected readonly auth = inject(AuthStore);
  protected readonly state = signal<AcceptState>('idle');
  protected readonly message = signal('');
  protected readonly traceId = signal<string | null>(null);
  protected readonly workspaceName = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
      this.message.set('Davet bağlantısında geçerli bir token bulunamadı.');
      return;
    }

    if (!this.auth.isAuthenticated()) {
      this.state.set('idle');
      return;
    }

    void this.accept(token);
  }

  protected login(): void {
    this.navigation.beginLogin(this.router.url);
  }

  protected goToDashboard(): void {
    void this.router.navigateByUrl(this.config.defaultAuthenticatedRoute);
  }

  private async accept(token: string): Promise<void> {
    this.state.set('accepting');
    try {
      const workspace = await firstValueFrom(this.api.acceptInvitation(token));
      this.workspaceName.set(workspace.tenantName);
      await this.auth.refresh();
      this.state.set('accepted');
    } catch (error: unknown) {
      this.message.set(
        apiErrorMessageForCode(
          apiErrorCode(error),
          'Davet şu anda kabul edilemedi. Lütfen tekrar deneyin.',
        ),
      );
      this.traceId.set(apiRequestId(error));
      this.state.set('error');
    }
  }
}
