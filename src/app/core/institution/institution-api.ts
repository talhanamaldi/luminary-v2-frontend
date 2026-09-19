import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PageResponse, SearchRequest } from '../api/list-query';
import { APP_CONFIG } from '../config/app-config';
import {
  SchoolNotification,
  StudentDetails,
  StudentFilterField,
  StudentListItem,
  StudentSortField,
} from './institution.models';

/**
 * Institution-only API surface: student directory and school notifications.
 * All endpoints require an active INSTITUTION_ADMIN workspace, resolved from
 * the server session.
 */
@Injectable({ providedIn: 'root' })
export class InstitutionApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  students(
    request: SearchRequest<StudentFilterField, StudentSortField> = {},
  ): Observable<PageResponse<StudentListItem>> {
    return this.http.post<PageResponse<StudentListItem>>(
      `${this.config.apiBaseUrl}/institution/students`,
      request,
    );
  }

  studentDetails(userId: string): Observable<StudentDetails> {
    return this.http.get<StudentDetails>(
      `${this.config.apiBaseUrl}/institution/students/${encodeURIComponent(userId)}`,
    );
  }

  schoolNotifications(): Observable<SchoolNotification[]> {
    return this.http.get<SchoolNotification[]>(
      `${this.config.apiBaseUrl}/institution/notifications`,
    );
  }

  markSchoolNotificationRead(notificationId: string): Observable<void> {
    return this.http.post<void>(
      `${this.config.apiBaseUrl}/institution/notifications/${encodeURIComponent(notificationId)}/read`,
      null,
    );
  }
}
