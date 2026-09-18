import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  let store: AuthStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(AuthStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('hydrates the authenticated user and active workspace', async () => {
    const initialization = store.initialize();
    http.expectOne('/api/v1/me').flush({
      user: { email: 'student@luminary.dev', displayName: 'Ada Yılmaz' },
      activeWorkspace: 'sinav_06',
      workspaces: [
        {
          tenantId: 'sinav_06',
          tenantName: 'Sınav Okulları',
          tenantType: 'INSTITUTION',
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      ],
    });
    await initialization;

    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()?.displayName).toBe('Ada Yılmaz');
    expect(store.activeWorkspace()?.tenantId).toBe('sinav_06');
  });

  it('treats a 401 response as an anonymous session', async () => {
    const initialization = store.initialize();
    http.expectOne('/api/v1/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    await initialization;

    expect(store.status()).toBe('unauthenticated');
    expect(store.isAuthenticated()).toBe(false);
  });

  it('keeps dependency failures distinct from an anonymous session', async () => {
    const initialization = store.initialize();
    http.expectOne('/api/v1/me').flush(null, {
      status: 503,
      statusText: 'Service Unavailable',
    });
    await initialization;

    expect(store.status()).toBe('error');
    expect(store.isAuthenticated()).toBe(false);
  });
});
