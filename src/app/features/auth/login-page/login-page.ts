import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthNavigation } from '../../../core/auth/auth-navigation';
import { AuthStore } from '../../../core/auth/auth.store';
import { RequestCorrelationStore } from '../../../core/http/request-correlation.store';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule, MatCardModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly route = inject(ActivatedRoute);
  private readonly navigation = inject(AuthNavigation);

  protected readonly auth = inject(AuthStore);
  protected readonly correlations = inject(RequestCorrelationStore);
  protected readonly hasConnectionError = computed(() => this.auth.status() === 'error');

  protected login(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    if (returnUrl) {
      this.navigation.beginLogin(returnUrl);
      return;
    }

    this.navigation.beginLogin();
  }

  protected retry(): void {
    void this.auth.refresh();
  }
}
