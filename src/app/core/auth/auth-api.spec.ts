import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthApi } from './auth-api';

describe('AuthApi', () => {
  let api: AuthApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AuthApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the BFF session from /me', () => {
    api.me().subscribe();

    const request = http.expectOne('/api/v1/me');
    expect(request.request.method).toBe('GET');
    request.flush({ user: {}, activeWorkspace: null, workspaces: [] });
  });

  it('switches workspace without sending tenant identity in a header', () => {
    api.switchWorkspace('sinav_06').subscribe();

    const request = http.expectOne('/api/v1/me/active-workspace');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ tenantId: 'sinav_06' });
    expect(request.request.headers.has('X-Tenant-Id')).toBe(false);
    request.flush({
      tenantId: 'sinav_06',
      tenantName: 'Sınav Okulları',
      tenantType: 'INSTITUTION',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
  });

  it('accepts an invitation through the documented endpoint', () => {
    api.acceptInvitation('one-time-token').subscribe();

    const request = http.expectOne('/api/v1/invitations/accept');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token: 'one-time-token' });
    request.flush({
      tenantId: 'sinav_06',
      tenantName: 'Sınav Okulları',
      tenantType: 'INSTITUTION',
      role: 'STUDENT',
      joinedAt: '2026-09-16T20:00:00Z',
    });
  });

  it('lists the signed-in user pending invitations', () => {
    api.pendingInvitations().subscribe();

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
  });
});
