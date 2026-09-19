import { StudentField, StudentGradeLevel } from '../institution/institution.models';

export interface StudentProfile {
  readonly profileId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly gradeLevel: StudentGradeLevel;
  readonly field: StudentField;
  readonly schoolName: string | null;
}

export interface UpdateStudentProfileRequest {
  readonly gradeLevel: StudentGradeLevel;
  readonly field: StudentField;
  readonly schoolName: string | null;
}
