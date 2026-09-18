# Frontend mimarisi ve geliştirme kuralları

## 1. Temel yaklaşım

Luminary frontend, büyüyen bir ürün için küçük ve anlaşılır katmanlar üzerine kuruludur:

- Angular standalone component ve lazy route yapısı kullanılır.
- Component state'i için signals, asenkron HTTP akışları için RxJS kullanılır.
- Angular Material/CDK erişilebilir davranış ve temel UI primitive'lerini sağlar.
- Luminary'ye özgü görünüm semantic SCSS token'ları ve küçük reusable componentlerle oluşturulur.
- Backend güvenlik ve veri sözleşmesi frontend tarafından yeniden icat edilmez.

NgRx şu an kullanılmamaktadır. Global state kapsamı büyüyüp signals ve servislerin yetersiz kaldığı ölçülmeden eklenmemelidir.

## 2. Kütüphane kararları

### Angular Material/CDK

Dialog, snackbar, sidenav, form controls, table, paginator ve sorting gibi karmaşık erişilebilir davranışlarda Material/CDK kullanılır. Bu bileşenler Luminary token'larıyla görsel olarak özelleştirilir.

### Tailwind ve PrimeNG

Şu an projeye eklenmemiştir. Material yanında ikinci bir component sistemi veya Tailwind utility katmanı eklemek:

- aynı ihtiyacı karşılayan birden fazla API,
- tema ve spacing tutarsızlığı,
- bundle ve bakım maliyeti

oluşturacağı için mevcut ihtiyaçlarda tercih edilmemektedir. Bu karar ancak ölçülmüş bir ihtiyaç ve ekip kararıyla değiştirilmelidir.

## 3. Dizin sorumlulukları

```text
src/app/
├── core/
│   ├── api/          # Uygulama çapındaki HTTP sözleşmeleri ve RFC 9457 modelleri
│   ├── auth/         # Session, kullanıcı, workspace ve auth API
│   ├── config/       # Deployment/runtime config token'ları
│   ├── http/         # Interceptor ve request correlation
│   └── ui/           # Uygulama çapındaki küçük UI state servisleri
├── features/         # Domain ve route bazlı ekranlar
├── layout/           # Authenticated shell gibi route kabukları
└── shared/
    ├── data-access/  # Domain bağımsız liste/filter controller'ları
    ├── forms/        # Angular form yardımcıları
    └── ui/           # Reusable görsel componentler
```

Kurallar:

- Bir feature başka bir feature'ın iç dosyalarını import etmez.
- Domain bilgisi taşıyan component `features/<domain>` altında kalır.
- `shared` yalnızca birden fazla domain tarafından anlamlı biçimde kullanılabilecek yapılardır.
- `core` içindeki servisler genellikle uygulama ömrü boyunca tektir.
- Backend entity sınıfları kopyalanmaz; istemcinin kullandığı request/response sözleşmeleri modellenir.

## 4. Routing ve authenticated shell

Public route'lar (`login`, davet kabulü) doğrudan yüklenir. Authenticated route'lar `AuthenticatedShell` child route'u olarak tanımlanır.

```ts
{
  path: '',
  canActivate: [authenticatedGuard],
  loadComponent: () =>
    import('./layout/authenticated-shell/authenticated-shell').then(
      (m) => m.AuthenticatedShell,
    ),
  children: [
    {
      path: 'example',
      loadComponent: () =>
        import('./features/example/example-page').then((m) => m.ExamplePage),
    },
  ],
}
```

Shell şu sorumlulukları taşır:

- Responsive sidebar ve mobil drawer
- Topbar, aktif workspace ve workspace değiştirme
- Profil menüsü ve logout
- Global işlem göstergesi
- Child route için `router-outlet`

Aktif workspace'i bulunan öğrenci ve kurum yöneticileri sidebar kullanır. Menü görünürlüğü UX amaçlı role göre filtrelenebilir; gerçek yetkilendirme her zaman backend tarafından yapılmalıdır.

Yeni menü bağlantısı, karşılık gelen gerçek route hazır olmadan eklenmemelidir.

## 5. State ve HTTP sınırları

- Component'e özel geçici state: `signal`, `computed` ve reactive form.
- Bir route altındaki server liste state'i: `ServerListController`.
- Session ve aktif workspace: `AuthStore`.
- Birden fazla layout parçasını etkileyen işlem: `AppActivityStore`.
- HTTP request/response dönüşümü: API servisinde veya feature data-access katmanında.

Component içinde doğrudan URL birleştirmek yerine API servis metodu kullanılmalıdır.

## 6. Kimlik doğrulama ve güvenlik

Luminary, BFF/session-cookie modeli kullanır:

- Access token frontend'e verilmez ve local/session storage'a yazılmaz.
- Bütün HTTP istekleri `withCredentials: true` ile gönderilir.
- Angular XSRF yapılandırması `XSRF-TOKEN` cookie'sini mutasyonlarda `X-XSRF-TOKEN` header'ına taşır.
- Tenant bilgisi frontend tarafından güven kaynağı olarak üretilmez.
- Aktif workspace yalnızca backend'in doğruladığı endpoint ile değiştirilir.
- Route guard yalnızca kullanıcı deneyimini düzenler; authorization değildir.

HTTP davranışı:

- `401`: Session geçersizse login akışı başlatılır.
- `403`: Tekrar login yerine yetkisiz işlem olarak gösterilir.
- UI davranışı backend `detail` metnine değil stabil `code` alanına bağlanır.
- Hata raporunda `X-Request-Id`, yoksa `traceId` kullanılır.

## 7. Yeni feature kontrol listesi

1. Route'u lazy olarak authenticated shell altına ekle.
2. Domain modellerini feature veya uygun API sınırında tanımla.
3. HTTP çağrılarını API servisine koy.
4. Sayfa başlığında `PageHeader` kullan.
5. Listeyse `ServerListController` ve `DataGrid` kullan.
6. Gelişmiş filtre gerekiyorsa `FilterPanel` ve builder yardımcılarını kullan.
7. Form validation hatalarını `applyApiValidationErrors()` ile dağıt.
8. Global geri bildirimi notification, alanla ilişkili hatayı form içinde göster.
9. Yetkiyi frontend koşullarına emanet etme.
10. Format, lint ve production build çalıştır.

## 8. Kaçınılması gerekenler

- Her liste ekranında pagination/search RxJS akışını yeniden yazmak
- `MatTableDataSource` ile server-side veriyi client-side filtrelemek
- Backend hata `detail` metnine göre koşul yazmak
- Hex renk, spacing ve radius değerlerini feature SCSS dosyalarında çoğaltmak
- Genel amaçlı olduğu kanıtlanmadan component'i `shared` altına taşımak
- Backend'i olmayan boş/sahte navigasyon ekranları üretmek
