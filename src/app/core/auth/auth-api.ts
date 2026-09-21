import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse, SearchRequest } from '../api/list-query';
import { APP_CONFIG } from '../config/app-config';
import { SKIP_AUTH_REDIRECT } from '../http/api-context.interceptor';
import {
  InvitationCreated,
  InvitedWorkspace,
  MeResponse,
  PendingInvitation,
  Workspace,
  WorkspaceFilterField,
  WorkspaceSortField,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.config.apiBaseUrl}/me`, {
      context: new HttpContext().set(SKIP_AUTH_REDIRECT, true),
    });
  }

  searchWorkspaces(
    request: SearchRequest<WorkspaceFilterField, WorkspaceSortField> = {},
  ): Observable<PageResponse<Workspace>> {
    return this.http.post<PageResponse<Workspace>>(
      `${this.config.apiBaseUrl}/me/workspaces`,
      request,
    );
  }

  switchWorkspace(tenantId: string): Observable<Workspace> {
    return this.http.post<Workspace>(`${this.config.apiBaseUrl}/me/active-workspace`, {
      tenantId,
    });
  }

  acceptInvitation(token: string): Observable<InvitedWorkspace> {
    return this.http.post<InvitedWorkspace>(`${this.config.apiBaseUrl}/invitations/accept`, {
      token,
    });
  }

  rejectInvitation(invitationId: string): Observable<void> {
    return this.http.post<void>(
      `${this.config.apiBaseUrl}/invitations/${invitationId}/reject`,
      null,
    );
  }

  createStudentInvitation(email: string): Observable<InvitationCreated> {
    return this.http.post<InvitationCreated>(`${this.config.apiBaseUrl}/invitations`, { email });
  }

  resendStudentInvitation(email: string): Observable<InvitationCreated> {
    return this.http.post<InvitationCreated>(`${this.config.apiBaseUrl}/invitations/resend`, {
      email,
    });
  }

  pendingInvitations(): Observable<PendingInvitation[]> {
    return this.http.get<PendingInvitation[]>(`${this.config.apiBaseUrl}/invitations/pending`);
  }

}
