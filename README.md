# Luminary Frontend

Luminary'nin Angular tabanlı web istemcisi. Bu depo şu anda uygulamanın geniş feature setini değil, backend ile uyumlu güvenli frontend temelini içerir.

## Teknoloji temeli

- Angular 21 LTS, standalone ve zoneless yapı
- TypeScript strict mode
- Angular Material/CDK
- Signals ile yerel uygulama state'i, HTTP akışlarında RxJS
- SCSS semantic design token sistemi
- Vitest ve Angular test builder
- ESLint + Prettier

NgRx bilinçli olarak eklenmedi. Mevcut state kapsamı signals ve servislerle yeterince küçük; yeni bir global state ihtiyacı ölçüldüğünde tekrar değerlendirilmelidir.

## Mevcut kapsam

- Keycloak/OIDC girişini backend BFF üzerinden başlatma
- Sunucu session cookie'si ve CSRF entegrasyonu
- `GET /api/v1/me` ile uygulama bootstrap'ı
- Aktif workspace görünümü, sayfalı workspace sorgusu ve workspace değiştirme
- Güvenli çıkış
- Öğrenci ve kurum yöneticileri için responsive authenticated shell, sidebar ve topbar
- Kurum yöneticisinin öğrenci daveti oluşturması ve yeniden göndermesi
- Kurum davet linkini kabul etme
- Ortak page header, notification, confirmation, loading ve form yapıları
- Backend sözleşmesiyle uyumlu server-side data-grid, pagination, filtering ve sorting altyapısı
- Giriş sonrası dashboard

Practice, Tasks, Smart Study, Performance ve kurum analitiği gibi alanlar backend sözleşmeleri hazır olmadığı için uygulanmadı.

## Yerel geliştirme

Gereksinimler:

- Node.js `^20.19`, `^22.12` veya `^24.0`
- npm 11+
- `localhost:8080` üzerinde çalışan Luminary backend
- Backend'in kullandığı PostgreSQL ve Keycloak servisleri

Backend klasöründe:

```bash
docker compose up -d
./gradlew bootRun
```

Windows'ta son komut `gradlew.bat bootRun` olarak çalıştırılabilir.

Frontend klasöründe:

```bash
npm install
npm start
```

Uygulama `http://localhost:4200` adresinde açılır. Geliştirme proxy'si `/api` ve `/oauth2` isteklerini `http://localhost:8080` adresine iletir. Bu sayede production'daki same-origin BFF davranışı yerelde de korunur ve Angular'ın XSRF desteği kullanılır.

## Komutlar

```bash
npm start          # geliştirme sunucusu
npm run build      # production derlemesi
npm run test:ci    # testleri tek sefer çalıştır
npm run lint       # TypeScript ve template lint
npm run format     # Prettier ile formatla
npm run format:check
```

## Dizin yapısı

```text
src/app/
├── core/       # tekil servisler, auth, API modelleri ve interceptor'lar
├── features/   # route bazında lazy yüklenen iş alanları
├── layout/     # authenticated shell gibi uygulama kabukları
├── shared/     # domain bağımsız UI, form ve data-access parçaları
├── app.config.ts
└── app.routes.ts
```

Yeni işlevler `features/<domain>` altında, kendi route/component/service dosyalarıyla eklenmelidir. Backend entity'leri doğrudan taklit edilmemeli; OpenAPI/API response sözleşmelerine ait istemci modelleri feature veya `core/api` sınırında tutulmalıdır.

## Geliştirici dokümantasyonu

Ekip için ayrıntılı kullanım ve mimari rehberleri [`docs/README.md`](docs/README.md) altında tutulur:

- [Frontend mimarisi ve geliştirme kuralları](docs/frontend-architecture.md)
- [Auth, workspace ve öğrenci daveti akışları](docs/auth-workspaces-and-invitations.md)
- [Tasarım sistemi, layout ve ortak UI](docs/design-system-and-layout.md)
- [Server-side listeleme, data-grid ve filtreleme](docs/server-side-lists.md)
- [Formlar, bildirimler ve hata yönetimi](docs/forms-feedback-and-errors.md)

Yeni bir ortak yapı eklendiğinde ilgili rehber de aynı değişiklik kapsamında güncellenmelidir.

## Kimlik ve güvenlik notları

- Frontend access token saklamaz; `SESSION` HttpOnly BFF cookie'sini kullanır.
- Mutasyonlarda Angular, `XSRF-TOKEN` cookie'sini `X-XSRF-TOKEN` header'ı olarak yollar.
- Tenant kimliği keyfi header/body alanından alınmaz. Workspace değişikliği backend'in doğruladığı endpoint üzerinden yapılır.
- Öğrenci daveti oluşturulurken frontend rol göndermez; hedef rol backend tarafından `STUDENT` olarak belirlenir.
- Route guard'lar yalnızca UX katmanıdır; gerçek yetkilendirme backend sorumluluğudur.
- Login sonrası geri dönüş URL'si yalnızca güvenli uygulama-içi yollar için session storage'da tutulur.

## Listeleme sözleşmesi

Tablo tipi endpoint'ler `core/api/list-query.ts` içindeki ortak `SearchRequest` ve
`PageResponse<T>` tiplerini kullanır. Workspace listelemesi:

```http
POST /api/v1/me/workspaces
Content-Type: application/json
```

Boş sorgu için `{}` gönderilir. Workspace sorgu alanları response alanlarıyla
aynı olmak zorunda değildir: sorguda `name` ve `type`, response'ta `tenantName`
ve `tenantType` kullanılır. Filtre, sıralama veya `take` değiştiğinde `skip`
sıfırlanmalıdır.

Arama, istek iptali, pagination ve sorting davranışı ortak
`ServerListController` tarafından yönetilir. Yeni liste ekranlarında aynı mantık
yeniden yazılmamalıdır. Ayrıntılar için
[server-side listeleme rehberine](docs/server-side-lists.md) bakın.

## Hata ve request ID davranışı

- RFC 9457 uzantıları `ApiProblem` ile modellenir: `code`, `severity`, `timestamp`,
  `traceId` ve opsiyonel `fields`.
- UI kararları `detail` metnine değil kararlı `code` alanına bağlanır.
- `X-Request-Id` her response'ta `RequestCorrelationStore` tarafından saklanır.
  Hatalarda header yoksa body'deki `traceId` yedek olarak kullanılır.
- Bootstrap `GET /me` isteğindeki `401`, login ekranının gösterilmesini sağlar.
  Aktif oturum sırasındaki diğer `401` cevapları login akışını yeniden başlatır.
- `403` login tekrarı başlatmaz; yetkisiz işlem olarak mevcut ekrana iletilir.
- Form geliştirilirken `applyApiValidationErrors()` ile `fields` değerleri ilgili
  kontrollere dağıtılmalıdır.
