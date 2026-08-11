import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'timeFormat',
    standalone: false
})
export class TimeFormatPipe implements PipeTransform {

  transform(value: string, showAmPm: boolean = true): string {
    if (!value) return '';

    const parts = value.split(':').map(Number);
    let hour = parts[0];
    const minute = parts[1];
    const suffix = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; 

    return showAmPm ? `${hour}:${minute < 10 ? '0' + minute : minute} ${suffix}` : `${hour}:${minute < 10 ? '0' + minute : minute}`;
  }
}