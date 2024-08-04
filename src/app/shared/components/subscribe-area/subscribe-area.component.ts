import { Component,Input } from '@angular/core';

@Component({
  selector: 'app-subscribe-area',
  templateUrl: './subscribe-area.component.html',
  styleUrls: ['./subscribe-area.component.scss']
})
export class SubscribeAreaComponent {
  name: string = '';
  email: string = '';

  handleFormSubmit() {

  }
}
