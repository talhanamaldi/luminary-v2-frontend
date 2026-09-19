import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';

import { apiErrorCode, apiRequestId } from '../../../core/api/api-error';
import { apiErrorMessageForCode } from '../../../core/api/api-error-messages';
import {
  StudentField,
  studentFieldLabel,
  StudentGradeLevel,
  studentGradeLabel,
} from '../../../core/institution/institution.models';
import { StudentProfileApi } from '../../../core/student/student-profile-api';
import { StudentProfile } from '../../../core/student/student-profile.models';
import { AppActivityStore } from '../../../core/ui/app-activity.store';
import {
  applyApiValidationErrors,
  clearApiValidationError,
} from '../../../shared/forms/api-validation-errors';
import { FormActions } from '../../../shared/ui/form-actions/form-actions';
import { AppNotificationService } from '../../../shared/ui/notification/app-notification.service';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

const GRADE_LEVELS: readonly StudentGradeLevel[] = ['GRADE_11', 'GRADE_12', 'GRADUATE'];
const STUDENT_FIELDS: readonly StudentField[] = ['SAYISAL', 'ESIT_AGIRLIK', 'SOZEL', 'DIL'];
const SCHOOL_NAME_MAX_LENGTH = 120;

@Component({
  selector: 'app-student-profile-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
    FormActions,
  ],
  templateUrl: './student-profile-page.html',
  styleUrl: './student-profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentProfilePage {
  private readonly api = inject(StudentProfileApi);
  private readonly activity = inject(AppActivityStore);
  private readonly notification = inject(AppNotificationService);

  private readonly loadingState = signal(true);
  private readonly errorState = signal<string | null>(null);
  private readonly savingState = signal(false);
  private readonly dirtyState = signal(false);

  protected readonly loading = this.loadingState.asReadonly();
  protected readonly error = this.errorState.asReadonly();
  protected readonly saving = this.savingState.asReadonly();
  protected readonly dirty = this.dirtyState.asReadonly();
  protected readonly grades = GRADE_LEVELS;
  protected readonly fields = STUDENT_FIELDS;
  protected readonly gradeOptions = computed(() =>
    GRADE_LEVELS.map((grade) => ({ value: grade, label: studentGradeLabel(grade) })),
  );
  protected readonly fieldOptions = computed(() =>
    STUDENT_FIELDS.map((field) => ({ value: field, label: studentFieldLabel(field) })),
  );

  protected readonly form = new FormGroup({
    gradeLevel: new FormControl<StudentGradeLevel | null>(null, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    field: new FormControl<StudentField | null>(null, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    schoolName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(SCHOOL_NAME_MAX_LENGTH)],
    }),
  });

  private savedValues: StudentProfile | null = null;

  constructor() {
    // Grade level and school name are managed by the institution. The
    // student may only update their academic field.
    this.form.controls.gradeLevel.disable();
    this.form.controls.schoolName.disable();
    this.form.valueChanges.subscribe(() => this.dirtyState.set(this.isDirty()));
    void this.loadProfile();
  }

  protected gradeLabel(grade: StudentGradeLevel): string | null {
    return studentGradeLabel(grade);
  }

  protected fieldLabel(field: StudentField): string | null {
    return studentFieldLabel(field);
  }

  protected saveProfile(): void {
    void this.submitProfile();
  }

  protected cancelProfile(): void {
    if (this.saving()) {
      return;
    }
    this.resetForm();
  }

  protected clearFieldError(field: 'gradeLevel' | 'field' | 'schoolName'): void {
    clearApiValidationError(this.form.controls[field]);
  }

  protected async loadProfile(): Promise<void> {
    try {
      const profile = await this.activity.track(() => firstValueFrom(this.api.getOwnProfile()));
      this.savedValues = profile;
      this.form.patchValue({
        gradeLevel: profile.gradeLevel,
        field: profile.field,
        schoolName: profile.schoolName ?? '',
      });
      this.errorState.set(null);
    } catch (error: unknown) {
      this.errorState.set(
        apiErrorMessageForCode(
          apiErrorCode(error),
          'Profiliniz şu anda yüklenemedi. Lütfen tekrar deneyin.',
        ),
      );
      this.notification.error(this.errorState() ?? 'Profil yüklenemedi.', {
        requestId: apiRequestId(error),
      });
    } finally {
      this.loadingState.set(false);
    }
  }

  private async submitProfile(): Promise<void> {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = {
      gradeLevel: this.form.controls.gradeLevel.value as StudentGradeLevel,
      field: this.form.controls.field.value as StudentField,
      schoolName:
        this.form.controls.schoolName.value.trim() === ''
          ? null
          : this.form.controls.schoolName.value.trim(),
    };

    this.savingState.set(true);
    try {
      const profile = await this.activity.track(() =>
        firstValueFrom(this.api.updateOwnProfile(request)),
      );
      this.savedValues = profile;
      this.form.patchValue({ schoolName: profile.schoolName ?? '' });
      this.dirtyState.set(false);
      this.notification.success('Profiliniz güncellendi.');
    } catch (error: unknown) {
      this.notification.error(
        apiErrorMessageForCode(
          apiErrorCode(error),
          'Profiliniz şu anda güncellenemedi. Lütfen tekrar deneyin.',
        ),
        { requestId: apiRequestId(error) },
      );
      applyApiValidationErrors(this.form, error);
    } finally {
      this.savingState.set(false);
    }
  }

  private isDirty(): boolean {
    const saved = this.savedValues;
    if (!saved) {
      return false;
    }
    return this.form.controls.field.value !== saved.field;
  }

  private resetForm(): void {
    if (this.savedValues) {
      this.form.patchValue({
        gradeLevel: this.savedValues.gradeLevel,
        field: this.savedValues.field,
        schoolName: this.savedValues.schoolName ?? '',
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
      this.dirtyState.set(false);
      this.clearFieldError('gradeLevel');
      this.clearFieldError('field');
      this.clearFieldError('schoolName');
    }
  }
}
