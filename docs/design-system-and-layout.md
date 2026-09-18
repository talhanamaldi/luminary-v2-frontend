# Tasarım sistemi, layout ve ortak UI

## 1. Tasarım dili

Luminary arayüzü sakin, okunabilir ve içerik odaklıdır. Görsel kararlar `src/styles/_tokens.scss` içindeki `--lm-*` semantic token'larıyla verilir.

Token grupları:

- Renk: `--lm-color-primary`, `--lm-color-text`, `--lm-color-surface-*`
- Durum: `--lm-color-success`, `--lm-color-warning`, `--lm-color-danger`
- Spacing: `--lm-space-1` … `--lm-space-12`
- Radius: `--lm-radius-sm` … `--lm-radius-full`
- Shadow ve layout: `--lm-shadow-*`, `--lm-shell-*`, `--lm-content-max-width`

Feature stilinde doğrudan renk kullanmak yerine anlamına uygun token kullanılmalıdır:

```scss
.card {
  padding: var(--lm-space-5);
  border: 1px solid var(--lm-color-border);
  border-radius: var(--lm-radius-lg);
  color: var(--lm-color-text);
  background: var(--lm-color-surface-raised);
}
```

Yeni token ancak birden fazla yerde tekrarlanacak semantic bir karar olduğunda eklenmelidir. Component'e özgü tek seferlik ölçüler token'a dönüştürülmemelidir.

## 2. Material ile reusable component dengesi

Material davranışı sağlar; proje componentleri Luminary anlamını ve standardını sağlar.

Material'dan doğrudan kullanılanlar:

- Input, select, button ve form-field
- Sidenav, menu, dialog ve snackbar
- Table, paginator, sort ve progress bar

Luminary reusable componentleri:

- `PageHeader`
- `DataGrid`
- `FilterPanel` ve `ActiveFilterChips`
- `FormActions` ve `FormErrorSummary`
- Notification ve confirmation servisleri

Basit bir `mat-form-field` veya `mat-button` yalnızca görünüm amacıyla tekrar sarılmamalıdır.

## 3. PageHeader

Standart ve hero olmak üzere iki görünüm sağlar.

```html
<app-page-header
  eyebrow="Öğrenci yönetimi"
  title="Öğrenciler"
  description="Kuruma bağlı öğrencileri görüntüleyin ve yönetin."
>
  <button pageHeaderActions mat-flat-button type="button">Öğrenci ekle</button>
</app-page-header>
```

Dashboard gibi güçlü karşılama alanlarında `appearance="hero"` kullanılabilir. Liste ve detay ekranlarında varsayılan görünüm tercih edilmelidir.

## 4. Authenticated shell

`AuthenticatedShell`, feature sayfalarının tekrar etmemesi gereken uygulama kabuğudur. Feature componentleri topbar, sidebar, workspace switcher veya logout üretmez; yalnızca route içeriğini üretir.

Breakpoint `56.25rem` altında sidebar drawer moduna geçer. Aktif workspace yoksa sade topbar gösterilir. Aktif üyeliği olan öğrenci ve yöneticiler aynı shell'i kullanır.

Menü öğeleri eklenirken:

- Route gerçekten mevcut olmalıdır.
- İkonlar ek bir icon font zorunluluğu oluşturmamalıdır.
- Role göre görünürlük ayrı bir UX kuralı olarak ele alınmalıdır.
- Backend authorization yine zorunludur.

## 5. Notification

Kısa, global ve belirli bir forma bağlı olmayan geri bildirimlerde `AppNotificationService` kullanılır.

```ts
private readonly notification = inject(AppNotificationService);

this.notification.success('Değişiklikler kaydedildi.');

this.notification.error('İşlem tamamlanamadı.', {
  requestId: apiRequestId(error),
});
```

Tonlar: `info`, `success`, `warning`, `error`. Varsayılan süre tona göre belirlenir. Hata notification'ında mümkünse request ID verilmelidir.

Form alanıyla doğrudan ilişkili validation hataları notification yerine ilgili alanın altında gösterilmelidir.

## 6. Confirmation dialog

Silme, erişim kaldırma veya geri alınması zor işlemlerde kullanılır:

```ts
private readonly confirmation = inject(ConfirmationDialogService);

this.confirmation
  .confirm({
    title: 'Öğrenciyi kaldır?',
    message: 'Öğrencinin kurum erişimi kaldırılacak.',
    confirmLabel: 'Erişimi kaldır',
    tone: 'danger',
  })
  .subscribe((confirmed) => {
    if (confirmed) {
      // Gerçek backend işlemi
    }
  });
```

Dialog metin tabanlıdır; keyfi HTML kabul etmez.

## 7. Global loading koordinasyonu

Child feature içinde devam eden bir mutation sırasında workspace değiştirme veya logout gibi context değiştiren işlemler engellenmeliyse `AppActivityStore.track()` kullanılır:

```ts
private readonly activity = inject(AppActivityStore);

await this.activity.track(() => firstValueFrom(this.api.save(request)));
```

Shell, `activity.pending()` true olduğunda progress bar gösterir ve context değiştiren aksiyonları kilitler. Her küçük read isteğini global activity'ye bağlamayın; liste loading durumu `DataGrid` içinde gösterilir.

## 8. Responsive ve erişilebilirlik kuralları

- Yeni ekranlar en az `20rem` genişlikte çalışmalıdır.
- Tablo taşması yatay scroll ile yönetilir.
- Icon-only button'larda anlamlı `aria-label` bulunur.
- Loading, error ve success durumlarında uygun `role`/live region kullanılır.
- Renk tek başına anlam taşımaz; metin veya label ile desteklenir.
- Focus görünümü kaldırılmaz.
