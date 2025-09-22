import { Component } from '@angular/core';
import { FormControl, FormGroup,Validators } from '@angular/forms';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'theme-blog-reply-form',
  templateUrl: './blog-reply-form.component.html',
  styleUrls: ['./blog-reply-form.component.scss']
})
export class BlogReplyFormComponent {

  public blogReplyForm!: FormGroup;
  public formSubmitted = false;

  constructor() { }

  ngOnInit () {
    this.blogReplyForm = new FormGroup({
      name:new FormControl(null,Validators.required),
      email:new FormControl(null,[Validators.required,Validators.email]),
      subject:new FormControl(null,Validators.required),
      comment:new FormControl(null,Validators.required),
    })
  }

  onSubmit() {
    this.formSubmitted = true;
    if (this.blogReplyForm.valid) {
      console.log('blog-reply-form-value', this.blogReplyForm.value);

      notify({
        message: `Message sent successfully`,
        position: 'top',
        width: 600,
        type: 'success'
      });

      // Reset the form
      this.blogReplyForm.reset();
      this.formSubmitted = false; // Reset formSubmitted to false
    }
    console.log('contact-form', this.blogReplyForm);
  }

  get name() { return this.blogReplyForm.get('name') }
  get email() { return this.blogReplyForm.get('email') }
  get subject() { return this.blogReplyForm.get('subject') }
  get comment() { return this.blogReplyForm.get('comment') }

}
