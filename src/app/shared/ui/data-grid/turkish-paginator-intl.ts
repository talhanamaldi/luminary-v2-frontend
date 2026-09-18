import { MatPaginatorIntl } from '@angular/material/paginator';

export class TurkishPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Sayfa başına kayıt';
  override nextPageLabel = 'Sonraki sayfa';
  override previousPageLabel = 'Önceki sayfa';
  override firstPageLabel = 'İlk sayfa';
  override lastPageLabel = 'Son sayfa';

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    const normalizedLength = Math.max(0, length);
    if (normalizedLength === 0 || pageSize === 0) {
      return `0 / ${normalizedLength}`;
    }

    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, normalizedLength);
    return `${startIndex + 1}–${endIndex} / ${normalizedLength}`;
  };
}
