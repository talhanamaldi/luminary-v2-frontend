# Server-side listeleme, data-grid ve filtreleme

## 1. Backend sözleşmesi

Tablo tipi endpoint'ler `POST` ile ortak sorgu gövdesi alır:

```json
{
  "skip": 0,
  "take": 20,
  "filters": [
    {
      "field": "name",
      "operator": "CONTAINS",
      "value": "ankara"
    }
  ],
  "sorts": [
    {
      "field": "name",
      "direction": "ASC"
    }
  ]
}
```

Response:

```json
{
  "items": [],
  "skip": 0,
  "take": 20,
  "totalItems": 0,
  "hasNext": false
}
```

Frontend sınırları backend ile aynıdır:

- Varsayılan `skip`: `0`
- Varsayılan `take`: `20`
- Maksimum `take`: `100`
- Maksimum filtre: `10`
- Maksimum sıralama: `3`
- Filtreler birbirine `AND` ile bağlanır

Arama, filtre, sorting veya sayfa boyutu değiştiğinde `skip` sıfırlanır.

## 2. Katmanlar

Listeleme iki bağımsız parçaya ayrılmıştır:

### ServerListController

HTTP ve query state'ini yönetir:

- İlk yükleme ve reload
- 300 ms search debounce
- Yeni karakter yazıldığı anda önceki HTTP isteğini iptal etme
- Pagination, filters ve sorts
- Loading, error, total ve empty state
- Stable hata `code` ve request ID
- Component yok edildiğinde subscription temizliği

### DataGrid

Sunum ve kullanıcı etkileşimini yönetir:

- Material table, paginator ve sort
- Search alanı
- Loading progress
- Error, retry ve empty state
- Responsive yatay scroll
- Türkçe paginator
- Template tabanlı normal ve action kolonları

Server-side listelerde `MatTableDataSource` kullanılmaz; client-side filtering/pagination backend state'iyle çelişir.

## 3. Controller oluşturma

Controller component injection context'inde field initializer olarak oluşturulmalıdır:

```ts
private readonly api = inject(AuthApi);

protected readonly workspaceList = createServerListController<
  Workspace,
  WorkspaceFilterField,
  WorkspaceSortField
>({
  load: (request) => this.api.searchWorkspaces(request),
  search: {
    field: 'name',
    operator: 'CONTAINS',
    debounceMs: 300,
  },
  initialTake: 20,
  initialSorts: [{ field: 'name', direction: 'ASC' }],
  errorFallback: 'Çalışma alanları yüklenemedi.',
});
```

`createServerListController()` Angular `DestroyRef` kullandığı için constructor dışındaki rastgele callback'lerde çağrılmamalıdır.

## 4. DataGrid kullanımı

Feature component `imports` listesine `DataGrid` ve `DataGridColumn` eklenir.

```html
<app-data-grid
  [controller]="workspaceList"
  ariaLabel="Çalışma alanları"
  searchLabel="Çalışma alanı ara"
  searchPlaceholder="Ada göre ara"
  emptyTitle="Çalışma alanı bulunamadı"
>
  <ng-template appDataGridColumn="tenantName" header="Çalışma alanı" sortField="name" let-workspace>
    {{ workspace.tenantName }}
  </ng-template>

  <ng-template appDataGridColumn="tenantType" header="Tür" sortField="type" let-workspace>
    {{ workspace.tenantType }}
  </ng-template>

  <ng-template appDataGridColumn="role" header="Rol" sortField="role" let-workspace>
    {{ workspace.role }}
  </ng-template>

  <ng-template appDataGridColumn="actions" header="İşlemler" align="end" width="8rem" let-workspace>
    <button mat-button type="button" (click)="openWorkspace(workspace)">Aç</button>
  </ng-template>
</app-data-grid>
```

Kolon `key` değeri yalnızca frontend tablo kimliğidir. `sortField` backend sorgu alanıdır. Örneğin response'ta `tenantName`, sorguda `name` kullanılır.

## 5. Gelişmiş filtreler

Filtre formu feature'a aittir; ortak `FilterPanel` yalnızca yerleşim ve davranışı sağlar.

```html
<app-filter-panel
  title="Gelişmiş filtreler"
  [activeFilterCount]="activeFilters().length"
  [pending]="workspaceList.loading()"
  (applyFilters)="applyFilters()"
  (clearFilters)="clearFilters()"
>
  <div filterPanelFields [formGroup]="filterForm">
    <!-- Feature'a özel Material form alanları -->
  </div>
</app-filter-panel>

<app-active-filter-chips
  [filters]="activeFilters()"
  (removeFilter)="removeFilter($event)"
  (clearFilters)="clearFilters()"
/>
```

Type-safe kriter üretimi:

```ts
protected applyFilters(): void {
  const value = this.filterForm.getRawValue();

  const filters = collectFilters<WorkspaceFilterField>(
    inFilter('type', value.types),
    inFilter('role', value.roles),
    betweenFilter('joinedAt', value.joinedFrom, value.joinedTo),
  );

  this.workspaceList.setFilters(filters);
}
```

Yardımcılar boş değerlerde `null` döndürür; `collectFilters()` yalnızca dolu kriterleri toplar. Tarihleri backend'in beklediği ISO formata çevirmek feature sorumluluğudur.

Desteklenen yardımcılar:

- `valueFilter()` — tek değerli operatörler
- `inFilter()` — `IN`
- `betweenFilter()` — `BETWEEN`
- `nullFilter()` — `IS_NULL` / `IS_NOT_NULL`
- `collectFilters()` — boş kriterleri eleme

## 6. Controller public API

```ts
controller.items();
controller.loading();
controller.error();
controller.totalItems();
controller.hasNext();
controller.empty();
controller.query();

controller.setSearch(value);
controller.setPage(skip, take);
controller.setFilters(filters);
controller.setSorts(sorts);
controller.reload();
```

UI doğrudan `query()` nesnesini değiştirmez; yalnızca setter metotlarını kullanır.

## 7. Hata davranışı

Liste hatası:

- `code` üzerinden frontend mesajına çevrilir.
- `X-Request-Id` veya `traceId` destek kodu olarak gösterilir.
- Kullanıcı aynı query ile `Tekrar dene` çalıştırabilir.
- `401` genel interceptor tarafından login akışına yönlendirilir.
- `403` liste içinde yetkisiz hata olarak kalır.

## 8. Uygulama kontrol listesi

- Query field ile response field farkını açıkça tanımla.
- Search için backend'in desteklediği `name` gibi sorgu alanını kullan.
- Feature içinde ikinci debounce veya manuel subscription zinciri kurma.
- Filtre/sort değişiminde controller dışından `skip` taşımaya çalışma.
- Action kolonunda gerçek backend işlemi yoksa sahte buton ekleme.
- Liste endpoint'i sayfalıysa bütün kayıtları çekip frontend'de bölme.
