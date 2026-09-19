import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_PATHS } from '../../../core/config/app-config';
import { InstitutionApi } from '../../../core/institution/institution-api';
import {
  StudentFilterField,
  StudentListItem,
  StudentSortField,
  studentGradeLabel,
} from '../../../core/institution/institution.models';
import { createServerListController } from '../../../shared/data-access/server-list-controller';
import { DataGridColumn } from '../../../shared/ui/data-grid/data-grid-column';
import { DataGrid } from '../../../shared/ui/data-grid/data-grid';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

const JOINED_AT_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'medium',
});

@Component({
  selector: 'app-students-page',
  imports: [DataGrid, DataGridColumn, PageHeader, RouterLink],
  templateUrl: './students-page.html',
  styleUrl: './students-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentsPage {
  private readonly institutionApi = inject(InstitutionApi);

  private readonly controller = createServerListController<
    StudentListItem,
    StudentFilterField,
    StudentSortField
  >({
    load: (request) => this.institutionApi.students(request),
    search: { field: 'name', operator: 'CONTAINS', debounceMs: 300 },
    initialSorts: [{ field: 'name', direction: 'ASC' }],
    errorFallback: 'Öğrenci listesi şu anda yüklenemedi. Lütfen tekrar deneyin.',
  });

  protected readonly list = this.controller;
  protected readonly studentsUrl = `/${APP_PATHS.students}`;

  protected student(item: unknown): StudentListItem {
    return item as StudentListItem;
  }

  protected studentDetailsUrl(userId: string): string {
    return `${this.studentsUrl}/${encodeURIComponent(userId)}`;
  }

  protected gradeLabel(grade: StudentListItem['gradeLevel']): string | null {
    return studentGradeLabel(grade);
  }

  protected joinedLabel(iso: string): string | null {
    const value = new Date(iso);
    return Number.isNaN(value.getTime()) ? null : JOINED_AT_FORMATTER.format(value);
  }
}
