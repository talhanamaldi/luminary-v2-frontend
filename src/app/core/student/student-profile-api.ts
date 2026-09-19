import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_CONFIG } from '../config/app-config';
import { StudentProfile, UpdateStudentProfileRequest } from './student-profile.models';

/**
 * Student-facing profile API. The active tenant is resolved from the
 * server session; students may only manage their own profile.
 */
@Injectable({ providedIn: 'root' })
export class StudentProfileApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  getOwnProfile(): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(`${this.config.apiBaseUrl}/students/me`);
  }

  updateOwnProfile(request: UpdateStudentProfileRequest): Observable<StudentProfile> {
    return this.http.patch<StudentProfile>(`${this.config.apiBaseUrl}/students/me`, request);
  }
}
