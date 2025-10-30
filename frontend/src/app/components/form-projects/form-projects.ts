import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { JobService } from '../../core/services/job-service/job.service';
import { IJobInput } from '../../core/models/job.model';

@Component({
  selector: 'app-form-projects',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './form-projects.html',
  styleUrl: './form-projects.css',
})
export class FormProjects {
  constructor(private _jobServices: JobService){}
  fromToggle = false

  projectForm: FormGroup = new FormGroup({
    title: new FormControl(''),
    description: new FormControl(''),
    price: new FormControl(''),
    clientAddress: new FormControl(''),
  });

  closeForm() {
    this.fromToggle = false
  }
  
  openForm(){
    this.fromToggle = true
  }

  onSubmit() {
    const projectForm = this.projectForm.value
    this._jobServices.postNewJob(projectForm).subscribe({
      next: () => {
        alert('Category added successfully');
        this.closeForm();
      },
      error: err => console.error(err)
    })
  }
}
