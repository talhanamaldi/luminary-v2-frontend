export type SchoolNotificationType = 'INVITE_ACCEPTED' | 'INVITE_REJECTED';

export interface SchoolNotification {
  readonly notificationId: string;
  readonly type: SchoolNotificationType;
  readonly tenantId: string;
  readonly studentUserId: string;
  readonly studentEmail: string;
  readonly studentDisplayName: string;
  readonly invitationId: string;
  readonly createdAt: string;
  readonly readAt: string | null;
}

export type StudentGradeLevel = 'GRADE_11' | 'GRADE_12' | 'GRADUATE';
export type StudentField = 'SAYISAL' | 'ESIT_AGIRLIK' | 'SOZEL' | 'DIL';

export interface StudentListItem {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly country: string | null;
  readonly city: string | null;
  readonly gradeLevel: StudentGradeLevel | null;
  readonly field: StudentField | null;
  readonly schoolName: string | null;
  readonly joinedAt: string;
}

export interface StudentDetails extends StudentListItem {
  readonly profileUpdatedAt: string | null;
}

export type StudentFilterField = 'name' | 'email' | 'city' | 'country';
export type StudentSortField = 'name' | 'email' | 'joinedAt' | 'gradeLevel';

const GRADES: Readonly<Record<StudentGradeLevel, string>> = {
  GRADE_11: '11. sınıf',
  GRADE_12: '12. sınıf',
  GRADUATE: 'Mezun',
};

export function studentGradeLabel(grade: StudentGradeLevel | null): string | null {
  return grade ? GRADES[grade] : null;
}

const FIELDS: Readonly<Record<StudentField, string>> = {
  SAYISAL: 'Sayısal',
  ESIT_AGIRLIK: 'Eşit ağırlık',
  SOZEL: 'Sözel',
  DIL: 'Dil',
};

export function studentFieldLabel(field: StudentField | null): string | null {
  return field ? FIELDS[field] : null;
}

const NOTIFICATION_TYPE_LABELS: Readonly<Record<SchoolNotificationType, string>> = {
  INVITE_ACCEPTED: 'daveti kabul etti',
  INVITE_REJECTED: 'daveti reddetti',
};

export function schoolNotificationTypeLabel(type: SchoolNotificationType | null): string | null {
  return type ? NOTIFICATION_TYPE_LABELS[type] : null;
}
