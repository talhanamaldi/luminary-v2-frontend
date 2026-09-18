# Auth, workspace ve öğrenci daveti akışları

## 1. Güvenlik modeli

Frontend doğrudan Keycloak token'ı yönetmez. Backend BFF olarak davranır ve tarayıcıya HttpOnly session cookie verir.

```text
Angular → Luminary backend/BFF → Keycloak
        ← session cookie       ← OIDC sonucu
```

Kurallar:

- Token local storage veya session storage'a yazılmaz.
- Bütün HTTP çağrılarında cookie gönderilir.
- Mutasyonlar Angular'ın `XSRF-TOKEN` → `X-XSRF-TOKEN` mekanizmasını kullanır.
- Kullanıcı, tenant veya rol bilgisi frontend tarafından güvenilir kaynak olarak üretilmez.
- Route guard ve görünürlük kontrolleri yalnızca UX'tir; backend authorization zorunludur.

## 2. Uygulama bootstrap'ı

`app.config.ts` içinde `AuthStore.initialize()` app initializer olarak çalışır. İlk istek:

```http
GET /api/v1/me
```

Olası store durumları:

- `loading`: Session kontrol ediliyor.
- `authenticated`: Kullanıcı ve workspace bilgileri alındı.
- `unauthenticated`: `/me` isteği `401` döndü.
- `error`: Backend bağlantısı veya beklenmeyen hata oluştu.

Bootstrap `/me` çağrısı `SKIP_AUTH_REDIRECT` context'i kullanır. Böylece oturumu olmayan kullanıcıda interceptor yönlendirme döngüsü oluşturmaz; login ekranını route guard açar.

## 3. Login akışı

1. `authenticatedGuard`, session yoksa kullanıcıyı `/login?returnUrl=...` adresine gönderir.
2. Login butonu `AuthNavigation.beginLogin()` çağırır.
3. Güvenli uygulama-içi dönüş URL'si session storage'a yazılır.
4. Tarayıcı `/oauth2/authorization/luminary` backend endpoint'ine yönlenir.
5. Backend ve Keycloak OIDC akışını tamamlar.
6. Kullanıcı frontend köküne döndüğünde `landingGuard`, saklanan URL'yi tüketir.

Open redirect önlemi olarak yalnızca `/` ile başlayan, `//` ile başlamayan ve ters slash içermeyen URL'ler saklanır.

Aktif session sırasında alınan `401`, `apiContextInterceptor` tarafından login akışını yeniden başlatır. `403` bu davranışı tetiklemez.

## 4. Workspace state'i

`AuthStore` aşağıdaki state'i sağlar:

```ts
auth.user();
auth.workspaces();
auth.activeWorkspace();
auth.isAuthenticated();
```

Shell workspace switcher için `/me` cevabındaki workspace listesini kullanır. Büyük ve filtrelenebilir liste ekranları ise ayrı sayfalı endpoint'i kullanmalıdır:

```http
POST /api/v1/me/workspaces
```

Aktif workspace değiştirme:

```http
POST /api/v1/me/active-workspace
Content-Type: application/json

{
  "tenantId": "luminary-demo"
}
```

Başarılı değişiklikten sonra `AuthStore` `/me` çağrısını yeniler. Shell ve feature computed state'leri yeni workspace'e göre güncellenir.

Workspace'e bağlı mutation devam ederken context değiştirilmemelidir. Bu nedenle öğrenci daveti gibi işlemler `AppActivityStore.track()` ile sarılır; shell workspace switch ve logout aksiyonlarını geçici olarak kilitler.

## 5. Öğrenci daveti oluşturma

Daveti yalnızca şu aktif workspace koşulundaki kullanıcı görür:

```text
tenantType = INSTITUTION
role       = INSTITUTION_ADMIN
status     = ACTIVE
```

Bu kontrol güvenlik sınırı değil, UI görünürlük kuralıdır.

Yeni davet:

```http
POST /api/v1/invitations
Content-Type: application/json

{
  "email": "student@example.com"
}
```

Yeniden gönderme:

```http
POST /api/v1/invitations/resend
Content-Type: application/json

{
  "email": "student@example.com"
}
```

Frontend:

- E-postayı trim eder ve küçük harfe çevirir.
- `role` veya `tenantId` göndermez.
- Rolü backend `STUDENT` olarak belirler.
- Maili frontend göndermez; backend daveti oluşturur ve mail gönderim sürecini yönetir.
- Başarı response'undaki `expiresAt` değerini kullanıcıya yerel tarih/saat formatıyla gösterir.
- Resend sonrasında önceki bağlantının geçersiz olduğunu belirtir.
- Workspace değişirse eski davet formu ve sonuç state'i temizlenir.

İlgili stable hata kodlarına örnekler:

- `invitation-already-pending`
- `invitation-not-supported`
- `role-required-institution-admin`
- `workspace-inactive`
- `email-required`

## 6. Davet bağlantısını kabul etme

Frontend route'u:

```text
/invitations/accept?token=<token>
```

Akış:

1. Token yoksa istek yapılmadan kullanıcıya hata gösterilir.
2. Kullanıcı authenticated değilse login butonu gösterilir.
3. Login başlatılırken token içeren mevcut URL güvenli dönüş URL'si olarak saklanır.
4. OIDC dönüşünden sonra kullanıcı aynı davet route'una gelir.
5. Frontend aşağıdaki isteği gönderir:

```http
POST /api/v1/invitations/accept
Content-Type: application/json

{
  "token": "..."
}
```

6. Başarılı response sonrasında `AuthStore.refresh()` çalışır ve yeni workspace state'e alınır.
7. Kullanıcı dashboard'a devam eder.

Frontend token'ı decode ederek karar vermez; geçerlilik, hedef e-posta, kullanım ve süre kontrolü backend'e aittir.

İlgili hata kodlarına örnekler:

- `token-required`
- `invitation-not-found`
- `invitation-expired`
- `invitation-already-used`
- `invitation-account-mismatch`
- `already-member`
- `active-institution-exists`

## 7. Logout

```http
POST /api/v1/auth/logout
```

`AuthStore.logout()` endpoint başarısız olsa bile local session state'ini temizler. Ardından kullanıcı login route'una gönderilir. Frontend'in ayrıca token veya kullanıcı verisi temizlemesi gerekmez; token tutulmamaktadır.

## 8. Değişiklik kontrol listesi

- Yeni auth isteğinde cookie ve CSRF interceptor'larını bypass etme.
- `/me` bootstrap isteği dışındaki `401` davranışını değiştirmeden önce global interceptor'ı kontrol et.
- Invitation request'ine rol veya tenant ekleme.
- Token içeriğini frontend authorization amacıyla kullanma.
- Yeni backend hata kodunu `api-error-messages.ts` içine ekle.
- Hatalarda request ID'yi koru ve kullanıcıya destek kodu olarak göster.
- Workspace değişiminde feature'a ait tenant-bound state'in resetlendiğini doğrula.
