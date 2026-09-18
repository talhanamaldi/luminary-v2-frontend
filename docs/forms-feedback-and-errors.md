# Formlar, bildirimler ve hata yönetimi

## 1. Form yaklaşımı

Feature formları Angular Reactive Forms ile oluşturulur. Proje genelinde JSON tabanlı dinamik form motoru yoktur. Alanlar ve iş kuralları feature içinde kalırken tekrar eden davranışlar shared yardımcılarla standardize edilir.

Temel yapılar:

- `FormActions`: Kaydet/Vazgeç ve pending durumu
- `FormErrorSummary`: Forma ait genel hata listesi ve request ID
- `applyApiValidationErrors()`: Backend field hatalarını kontrollere dağıtma
- `clearApiValidationError()`: Kullanıcı alanı değiştirdiğinde eski server hatasını temizleme

## 2. RFC 9457 hata sözleşmesi

Backend hataları ortak problem formatındadır:

```json
{
  "status": 422,
  "code": "validation-failed",
  "severity": "ERROR",
  "traceId": "request-id",
  "fields": {
    "email": "must be a well-formed email address"
  }
}
```

Kurallar:

- Davranış `detail` metnine değil `code` alanına bağlanır.
- Kullanıcı mesajı `apiErrorMessageForCode()` ile belirlenir.
- Destek kodu için önce `X-Request-Id`, sonra `traceId` kullanılır.
- `422` field hataları ilgili forma uygulanır.
- `403` tekrar login tetiklemez.

## 3. Backend field hatalarını forma uygulama

```ts
try {
  await firstValueFrom(this.api.save(request));
} catch (error: unknown) {
  const validation = applyApiValidationErrors(this.form, error);

  this.formMessages.set(Object.values(validation.unhandledFields));
  this.requestId.set(apiRequestId(error));
}
```

Yardımcı `filters[0].field` değerini Angular'ın `filters.0.field` control path'ine çevirir. Eşleşen kontrollere `{ server: message }` hatası ekler ve alanı touched yapar. Bulunamayan alanlar `unhandledFields` içinde döner; bunlar genel hata özetinde gösterilebilir.

Template:

```html
<mat-form-field appearance="outline">
  <mat-label>E-posta</mat-label>
  <input matInput type="email" formControlName="email" />

  @if (form.controls.email.hasError('required')) {
  <mat-error>E-posta zorunludur.</mat-error>
  } @else if (form.controls.email.hasError('server')) {
  <mat-error>{{ form.controls.email.getError('server') }}</mat-error>
  }
</mat-form-field>
```

Kullanıcı alanı değiştirdiğinde eski server hatası temizlenmelidir:

```ts
this.form.controls.email.valueChanges
  .pipe(takeUntilDestroyed())
  .subscribe(() => clearApiValidationError(this.form.controls.email));
```

## 4. FormActions

Formun sonunda standart buton yerleşimi sağlar:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <!-- Alanlar -->

  <app-form-error-summary [messages]="formMessages()" [requestId]="requestId()" />

  <app-form-actions
    submitLabel="Davet gönder"
    pendingLabel="Gönderiliyor…"
    [pending]="submitting()"
    [submitDisabled]="form.invalid"
    (cancelRequested)="cancel()"
  />
</form>
```

Cancel butonu form geçersiz olsa da kullanılabilir; yalnızca pending durumda kilitlenir. `submitDisabled` yalnızca submit aksiyonunu kontrol eder.

Ek ikincil aksiyonlar `formSecondaryAction` projection alanına verilebilir.

## 5. FormErrorSummary

Alanla eşleşmeyen veya formun tamamını etkileyen hatalar için kullanılır. Field error'ları burada tekrar etmek yerine ilgili input altında göstermek tercih edilir.

```html
<app-form-error-summary
  title="Form kaydedilemedi"
  [messages]="generalErrors()"
  [requestId]="requestId()"
/>
```

## 6. Notification mı inline feedback mi?

Notification kullanın:

- Workspace değiştirme gibi global işlem sonucu
- Kullanıcının bulunduğu formdan bağımsız kısa başarı bilgisi
- Başka bir UI bölgesini etkileyen hata

Inline feedback kullanın:

- Validation hatası
- Davet oluşturma gibi form sonucunun kullanıcı tarafından tekrar okunması gerekiyorsa
- Expiry tarihi veya destek kodu gibi bağlamsal bilgiler varsa

Aynı hata hem notification hem form içinde tekrar gösterilmemelidir.

## 7. Confirmation dialog

Confirmation yalnızca kullanıcı için anlamlı sonuç doğuran işlemlerde kullanılmalıdır. Normal navigasyon, logout veya risksiz form iptali için gereksiz onay gösterilmemelidir.

```ts
this.confirmation
  .confirm({
    title: 'Daveti iptal et?',
    message: 'Bu davet bağlantısı artık kullanılamayacak.',
    confirmLabel: 'Daveti iptal et',
    tone: 'danger',
  })
  .subscribe((confirmed) => {
    if (confirmed) {
      this.cancelInvitation();
    }
  });
```

## 8. Submit akışı kontrol listesi

1. Double-submit'i `pending` ile engelle.
2. Form invalid ise `markAllAsTouched()` çağır.
3. Request modelini form değerinden açıkça oluştur.
4. Mutation tenant context'ine bağlıysa `AppActivityStore.track()` kullan.
5. Başarıda form state'ini bilinçli olarak resetle veya koru.
6. `validation-failed` alanlarını forma dağıt.
7. Genel mesajı stabil `code` üzerinden üret.
8. Hata raporu için request ID'yi göster.
9. `finally` içinde pending state'ini kapat.
