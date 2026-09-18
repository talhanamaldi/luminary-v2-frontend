export type MembershipRole = 'STUDENT' | 'INSTITUTION_ADMIN';
export type TenantType = 'INSTITUTION' | 'PERSONAL';
export type MembershipStatus = 'ACTIVE' | 'REVOKED';

export interface AuthenticatedUser {
  readonly email: string | null;
  readonly displayName: string;
}

export interface Workspace {
  readonly tenantId: string;
  readonly tenantName: string;
  readonly tenantType: TenantType;
  readonly role: MembershipRole;
  readonly status: MembershipStatus;
}

export interface MeResponse {
  readonly user: AuthenticatedUser;
  readonly activeWorkspace: string | null;
  readonly workspaces: readonly Workspace[];
}

export interface InvitedWorkspace {
  readonly tenantId: string;
  readonly tenantName: string;
  readonly tenantType: TenantType;
  readonly role: MembershipRole;
  readonly joinedAt: string;
}

export interface InvitationCreated {
  readonly invitationId: string;
  readonly tenantId: string;
  readonly email: string;
  readonly role: 'STUDENT';
  readonly expiresAt: string;
}

export type WorkspaceFilterField = 'tenantId' | 'name' | 'type' | 'role' | 'joinedAt';
export type WorkspaceSortField = 'name' | 'type' | 'role' | 'joinedAt';

const MEMBERSHIP_ROLE_LABELS: Readonly<Record<MembershipRole, string>> = {
  STUDENT: 'Öğrenci',
  INSTITUTION_ADMIN: 'Kurum yöneticisi',
};

const TENANT_TYPE_LABELS: Readonly<Record<TenantType, string>> = {
  INSTITUTION: 'Kurum',
  PERSONAL: 'Kişisel',
};

const MEMBERSHIP_STATUS_LABELS: Readonly<Record<MembershipStatus, string>> = {
  ACTIVE: 'Aktif',
  REVOKED: 'Erişim kaldırıldı',
};

export function membershipRoleLabel(role: MembershipRole | null): string | null {
  return role ? MEMBERSHIP_ROLE_LABELS[role] : null;
}

export function tenantTypeLabel(type: TenantType | null): string | null {
  return type ? TENANT_TYPE_LABELS[type] : null;
}

export function membershipStatusLabel(status: MembershipStatus | null): string | null {
  return status ? MEMBERSHIP_STATUS_LABELS[status] : null;
}
