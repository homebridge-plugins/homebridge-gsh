// src/app/shared/pipes/user-data.pipe.ts (adjust path as needed)
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateToString',
  pure: true,
})
export class DateToStringPipe implements PipeTransform {
  transform(value: string | Date | undefined | null): string {
    console.log('DateToStringPipe', value);
    if (!value) {
      return 'N/A';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
