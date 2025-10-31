import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { JobService } from '../../core/services/job-service/job.service';
import { WalletService } from '../../core/services/wallet-service/wallet.service';

@Component({
  selector: 'app-form-projects',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './form-projects.html',
  styleUrl: './form-projects.css',
})
export class FormProjects {
  private readonly _jobServices = inject(JobService);
  private readonly _walletService = inject(WalletService);
  fromToggle = signal(false);

  projectForm: FormGroup = new FormGroup({
    title: new FormControl(''),
    description: new FormControl(''),
    price: new FormControl(''),
    jobPeriod: new FormControl(''),
    approvalPeriod: new FormControl(''),
  });

  onSubmit() {
    const projectForm = this.projectForm.value;
    projectForm.clientAddress = this._walletService.getAccountAddress();
    this._jobServices.postNewJob(projectForm).subscribe({
      next: (res) => {
        alert(res.message);
        this.closeForm();
      },
      error: (res) => {
        alert(res.error.message);
        this.closeForm();
      },
    });
  }

  closeForm() {
    this.fromToggle.set(false);
  }

  openForm() {
    if (this._walletService.isConnected()) {
      this.fromToggle.set(true);
    } else {
      alert('Please Connect your Wallet first.');
    }
  }
}
