import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-projects',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './form-projects.html',
  styleUrl: './form-projects.css',
})
export class FormProjects {

  from = false

  projectForm: FormGroup = new FormGroup({
    title: new FormControl(''),
    description: new FormControl(''),
    price: new FormControl(''),
    timeline: new FormControl('Select timeline'),
  });

  closeForm() {
    this.from = false
  }

  // onSubmit() {
  //   if (this.projectForm.valid) {
  //     this.projectSubmitted.emit(this.projectForm.value);
  //     this.closeForm();
  //   }
  // }
}
