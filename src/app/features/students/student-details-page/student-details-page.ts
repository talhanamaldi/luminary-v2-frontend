import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { firstValueFrom } from 'rxjs';

import { apiErrorCode, apiRequestId } from '../../../core/api/api-error';
import { apiErrorMessageForCode } from '../../../core/api/api-error-messages';
import { APP_PATHS } from '../../../core/config/app-config';
import { InstitutionApi } from '../../../core/institution/institution-api';
import {
  StudentDetails,
  studentFieldLabel,
  studentGradeLabel,
} from '../../../core/institution/institution.models';
import { AppActivityStore } from '../../../core/ui/app-activity.store';
import { AppNotificationService } from '../../../shared/ui/notification/app-notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

const DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

@Component({
  selector: 'app-student-details-page',
  imports: [MatButtonModule, MatCardModule, PageHeader, RouterLink],
  templateUrl: './student-details-page.html',
  styleUrl: './student-details-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly institutionApi = inject(InstitutionApi);
  private readonly activity = inject(AppActivityStore);
  private readonly notification = inject(AppNotificationService);

  private readonly detailsState = signal<StudentDetails | null>(null);
  private readonly errorState = signal<string | null>(null);
  private readonly loadingState = signal(true);

  protected readonly studentsUrl = `/${APP_PATHS.students}`;
  protected readonly loading = this.loadingState.asReadonly();
  protected readonly error = this.errorState.asReadonly();
  protected readonly details = this.detailsState.asReadonly();
  protected readonly title = computed(() => {
    const details = this.detailsState();
    return details ? details.displayName : 'Öğrenci';
  });

  constructor() {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (!userId) {
      this.errorState.set('Geçerli bir öğrenci seçilmedi.');
      this.loadingState.set(false);
      return;
    }

    void this.loadDetails(userId);
  }

  protected gradeLabel(grade: StudentDetails['gradeLevel']): string | null {
    return studentGradeLabel(grade);
  }

  protected fieldLabel(field: StudentDetails['field']): string | null {
    return studentFieldLabel(field);
  }

  protected dateLabel(iso: string | null): string | null {
    if (!iso) {
      return null;
    }
    const value = new Date(iso);
    return Number.isNaN(value.getTime()) ? null : DATE_FORMATTER.format(value);
  }

  private async loadDetails(userId: string): Promise<void> {
    try {
      const details = await this.activity.track(() =>
        firstValueFrom(this.institutionApi.studentDetails(userId)),
      );
      this.detailsState.set(details);
      this.errorState.set(null);
    } catch (error: unknown) {
      this.errorState.set(
        apiErrorMessageForCode(
          apiErrorCode(error),
          'Öğrenci bilgileri şu anda yüklenemedi. Lütfen tekrar deneyin.',
        ),
      );
      this.notification.error(this.errorState() ?? 'Öğrenci bilgileri yüklenemedi.', {
        requestId: apiRequestId(error),
      });
    } finally {
      this.loadingState.set(false);
    }
  }
}
