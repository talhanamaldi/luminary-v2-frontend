# Luminary frontend dokümantasyonu

Bu klasör frontend mimarisi ve ortak altyapı için yaşayan dokümantasyondur. Amaç yalnızca mevcut dosyaları açıklamak değil, yeni feature geliştirirken ekip içinde aynı kararların uygulanmasını sağlamaktır.

## Okuma sırası

1. [Frontend mimarisi ve geliştirme kuralları](frontend-architecture.md)
2. [Auth, workspace ve öğrenci daveti akışları](auth-workspaces-and-invitations.md)
3. [Tasarım sistemi, layout ve ortak UI](design-system-and-layout.md)
4. [Server-side listeleme, data-grid ve filtreleme](server-side-lists.md)
5. [Formlar, bildirimler ve hata yönetimi](forms-feedback-and-errors.md)

## Hızlı karar tablosu

| İhtiyaç                         | Kullanılacak yapı                           |
| ------------------------------- | ------------------------------------------- |
| Authenticated ekran             | `AuthenticatedShell` altında lazy route     |
| Sayfa başlığı                   | `PageHeader`                                |
| Kısa global geri bildirim       | `AppNotificationService`                    |
| Silme/geri alınamaz işlem onayı | `ConfirmationDialogService`                 |
| Uzun süren global işlem         | `AppActivityStore.track()`                  |
| Sayfalı backend listesi         | `ServerListController` + `DataGrid`         |
| Gelişmiş liste filtresi         | `FilterPanel` + filter builder yardımcıları |
| Aktif filtre görünümü           | `ActiveFilterChips`                         |
| Form buton alanı                | `FormActions`                               |
| Form genel hata özeti           | `FormErrorSummary`                          |
| RFC 9457 field hataları         | `applyApiValidationErrors()`                |

## Dokümantasyon bakım kuralı

- Ortak bir component veya servis eklenirse bu indeks ve ilgili rehber güncellenir.
- Backend listeleme veya hata sözleşmesi değişirse önce `core/api` tipleri, ardından örnekler güncellenir.
- Dokümandaki örnekler gerçek public API isimlerini kullanmalıdır.
- Uygulanmamış feature veya endpoint varmış gibi dokümantasyon yazılmamalıdır.
