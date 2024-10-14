import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat'
})
export class TimeFormatPipe implements PipeTransform {

  transform(value: string, showAmPm: boolean = true): string {
    if (!value) return '';

    let [hour, minute] = value.split(':').map(Number);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; 

    return showAmPm ? `${hour}:${minute < 10 ? '0' + minute : minute} ${suffix}` : `${hour}:${minute < 10 ? '0' + minute : minute}`;
  }
}