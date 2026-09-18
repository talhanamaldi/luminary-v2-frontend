const TR_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  'access-denied': 'Bu işlem için yetkiniz bulunmuyor.',
  'active-institution-exists': 'Hesabınız zaten aktif bir kurum çalışma alanına bağlı.',
  'already-member': 'Bu çalışma alanına zaten üyesiniz.',
  'email-required': 'Geçerli bir e-posta adresi girin.',
  'invitation-account-mismatch': 'Bu davet farklı bir e-posta adresi için oluşturulmuş.',
  'invitation-already-pending': 'Bu e-posta adresi için bekleyen bir davet zaten var.',
  'invitation-already-used': 'Bu davet daha önce kullanılmış.',
  'invitation-expired': 'Bu davetin süresi dolmuş. Kurumunuzdan yeni bir davet isteyin.',
  'invitation-not-found': 'Davet bulunamadı veya artık geçerli değil.',
  'invitation-not-supported': 'Bu çalışma alanında öğrenci daveti desteklenmiyor.',
  'membership-not-found': 'Bu çalışma alanına erişiminiz bulunmuyor.',
  'membership-revoked': 'Bu çalışma alanındaki üyeliğiniz sona ermiş.',
  'role-required-institution-admin': 'Öğrenci daveti göndermek için kurum yöneticisi olmalısınız.',
  'token-required': 'Davet bağlantısında geçerli bir token bulunamadı.',
  'user-not-found': 'Oturumunuza bağlı kullanıcı hesabı bulunamadı.',
  'validation-failed': 'Girdiğiniz bilgileri kontrol edin.',
  'workspace-inactive': 'Bu çalışma alanı şu anda aktif değil.',
};

/** Keeps UI behavior tied to stable API codes, not translated backend detail. */
export function apiErrorMessageForCode(code: string | null, fallback: string): string {
  return (code && TR_ERROR_MESSAGES[code]) || fallback;
}
