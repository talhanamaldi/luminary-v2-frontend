import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Workspace } from '../auth/auth.models';
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

  function authenticate(
    workspaces: readonly Workspace[] = [],
    activeWorkspace: string | null = null,
  ): Promise<void> {
    const initialization = auth.initialize();
    http.expectOne('/api/v1/me').flush({
      user: { email: 'student@luminary.dev', displayName: 'Ada Yılmaz' },
      activeWorkspace,
      workspaces,
    });
    return initialization;
  }

  const adminWorkspace: Workspace = {
    tenantId: 'zafer06',
    tenantName: 'Zafer Koleji',
    tenantType: 'INSTITUTION',
    role: 'INSTITUTION_ADMIN',
    status: 'ACTIVE',
  };

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

  it('rejects an invitation and drops it from the pending list', async () => {
    await authenticate();
    store.load();
    http.expectOne('/api/v1/invitations/pending').flush([
      {
        invitationId: 'a1b2c3',
        tenantId: 'luminary-demo',
        tenantName: 'Luminary Demo',
        role: 'STUDENT',
        expiresAt: '2026-09-25T12:00:00Z',
        acceptUrl: 'http://localhost:4200/invitations/accept?token=raw-token',
      },
      {
        invitationId: 'd4e5f6',
        tenantId: 'other-school',
        tenantName: 'Other School',
        role: 'STUDENT',
        expiresAt: '2026-09-25T12:00:00Z',
        acceptUrl: 'http://localhost:4200/invitations/accept?token=other-token',
      },
    ]);
    await store.load();

    const rejection = store.reject('a1b2c3');
    const request = http.expectOne('/api/v1/invitations/a1b2c3/reject');
    expect(request.request.method).toBe('POST');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await rejection;

    expect(store.pendingInvitations()).toHaveLength(1);
    expect(store.pendingInvitations()[0].invitationId).toBe('d4e5f6');
  });

  it('keeps the list empty for anonymous sessions', async () => {
    const initialization = auth.initialize();
    http.expectOne('/api/v1/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    await initialization;

    await store.load();

    expect(store.pendingInvitations()).toHaveLength(0);
    expect(store.clear()).toBeUndefined();
  });

  it('loads school notifications alongside invitations for an admin workspace', async () => {
    await authenticate([adminWorkspace], adminWorkspace.tenantId);

    const loading = store.load();
    const invitationsRequest = http.expectOne('/api/v1/invitations/pending');
    const schoolRequest = http.expectOne('/api/v1/institution/notifications');
    invitationsRequest.flush([
      {
        invitationId: 'a1b2c3',
        tenantId: 'other-school',
        tenantName: 'Other School',
        role: 'STUDENT',
        expiresAt: '2026-09-25T12:00:00Z',
        acceptUrl: 'http://localhost:4200/invitations/accept?token=raw-token',
      },
    ]);
    schoolRequest.flush([
      {
        notificationId: 'n1',
        type: 'INVITE_ACCEPTED',
        tenantId: 'zafer06',
        studentUserId: 'u1',
        studentEmail: 'ada@luminary.dev',
        studentDisplayName: 'Ada Yılmaz',
        invitationId: 'inv-1',
        createdAt: '2026-09-19T09:00:00Z',
        readAt: null,
      },
      {
        notificationId: 'n2',
        type: 'INVITE_REJECTED',
        tenantId: 'zafer06',
        studentUserId: 'u2',
        studentEmail: 'ali@luminary.dev',
        studentDisplayName: 'Ali Demir',
        invitationId: 'inv-2',
        createdAt: '2026-09-18T09:00:00Z',
        readAt: '2026-09-19T08:00:00Z',
      },
    ]);
    await loading;

    expect(store.schoolNotifications()).toHaveLength(2);
    expect(store.unreadSchoolNotifications()).toHaveLength(1);
    expect(store.count()).toBe(2);
    expect(store.items()).toHaveLength(3);
    expect(store.items()[0].kind).toBe('school');
    expect(store.items()[2].kind).toBe('invitation');
    expect(store.isSchoolView()).toBe(true);
  });

  it('keeps the school list empty for workspaces without an admin role', async () => {
    await authenticate();

    const loading = store.load();
    http.expectOne('/api/v1/invitations/pending').flush([]);
    await loading;

    expect(store.schoolNotifications()).toHaveLength(0);
    expect(store.isSchoolView()).toBe(false);
    expect(store.count()).toBe(0);
  });

  it('marks all unread school notifications as read', async () => {
    await authenticate([adminWorkspace], adminWorkspace.tenantId);

    const loading = store.load();
    const invitationsRequest = http.expectOne('/api/v1/invitations/pending');
    const schoolRequest = http.expectOne('/api/v1/institution/notifications');
    invitationsRequest.flush([]);
    schoolRequest.flush([
      {
        notificationId: 'n1',
        type: 'INVITE_ACCEPTED',
        tenantId: 'zafer06',
        studentUserId: 'u1',
        studentEmail: 'ada@luminary.dev',
        studentDisplayName: 'Ada Yılmaz',
        invitationId: 'inv-1',
        createdAt: '2026-09-19T09:00:00Z',
        readAt: null,
      },
      {
        notificationId: 'n2',
        type: 'INVITE_REJECTED',
        tenantId: 'zafer06',
        studentUserId: 'u2',
        studentEmail: 'ali@luminary.dev',
        studentDisplayName: 'Ali Demir',
        invitationId: 'inv-2',
        createdAt: '2026-09-18T09:00:00Z',
        readAt: '2026-09-19T08:00:00Z',
      },
    ]);
    await loading;

    const marking = store.markAllSchoolNotificationsRead();
    const request = http.expectOne('/api/v1/institution/notifications/n1/read');
    expect(request.request.method).toBe('POST');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await marking;

    expect(store.unreadSchoolNotifications()).toHaveLength(0);
    expect(store.count()).toBe(0);
  });
});
