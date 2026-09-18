import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthStore } from '../auth/auth.store';
import { NotificationStore } from './notification.store';

describe('NotificationStore', () => {
  let store: NotificationStore;
  let auth: AuthStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(NotificationStore);
    auth = TestBed.inject(AuthStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function authenticate(): Promise<void> {
    const initialization = auth.initialize();
    http.expectOne('/api/v1/me').flush({
      user: { email: 'student@luminary.dev', displayName: 'Ada Yılmaz' },
      activeWorkspace: null,
      workspaces: [],
    });
    return initialization;
  }

  it('loads pending invitations for an authenticated user', async () => {
    await authenticate();

    const loading = store.load();
    const request = http.expectOne('/api/v1/invitations/pending');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        invitationId: 'a1b2c3',
        tenantId: 'luminary-demo',
        tenantName: 'Luminary Demo',
        role: 'STUDENT',
        expiresAt: '2026-09-25T12:00:00Z',
        acceptUrl: 'http://localhost:4200/invitations/accept?token=raw-token',
      },
    ]);
    await loading;

    expect(store.pendingInvitations()).toHaveLength(1);
    expect(store.pendingInvitations()[0].tenantName).toBe('Luminary Demo');
    expect(store.count()).toBe(1);
    expect(store.loading()).toBe(false);
  });

  it('clears the list on request failure instead of showing stale invites', async () => {
    await authenticate();
    store.load();
    http.expectOne('/api/v1/invitations/pending').flush(null, {
      status: 503,
      statusText: 'Service Unavailable',
    });
    await store.load();

    expect(store.pendingInvitations()).toHaveLength(0);
    expect(store.count()).toBe(0);
  });

  it('keeps the list empty for anonymous sessions', async () => {
    const initialization = auth.initialize();
    http.expectOne('/api/v1/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    await initialization;

    await store.load();

    expect(store.pendingInvitations()).toHaveLength(0);
    expect(store.clear()).toBeUndefined();
  });
});
