import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from './translate.service';

@Pipe({ name: 'translate' })
export class TranslatePipe implements PipeTransform {
  private translateService = inject(TranslateService);

  transform(value: string): string {
    return this.translateService.translations[value];
  }
}
