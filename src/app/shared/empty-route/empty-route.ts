import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Router guards always redirect before this placeholder is rendered. */
@Component({
  selector: 'app-empty-route',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyRoute {}
