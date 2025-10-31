import { Component, inject, OnInit, signal } from '@angular/core';
import { JobService } from '../../core/services/job-service/job.service';
import { IJob } from '../../core/models/job.model';
import { Router } from '@angular/router';
import { WalletService } from '../../core/services/wallet-service/wallet.service';

@Component({
  selector: 'app-jobs',
  imports: [],
  templateUrl: './jobs.html',
  styleUrl: './jobs.css',
})
export class Jobs implements OnInit {
  private readonly _jobService = inject(JobService);
  private readonly _walletService = inject(WalletService);
  private readonly _router = inject(Router);

  jobs = signal<IJob[]>([]);

  ngOnInit(): void {
    this._jobService.getAllJobs().subscribe({
      next: (res) => {
        this.jobs.set(res.data);
      },
      error: (err) => console.log(err),
    });
  }

  showDetails(id: string) {
    this._router.navigate([`/job/${id}`]);
  }

  deleteJob(id: string) {
    this._jobService.deleteJob(id).subscribe({
      next: (res) => alert(res.message),
      error: (res) => alert(res.error.message),
    });
  }

  compareAddresses(address: string) {
    if (this._walletService.isConnected()) {
      return this._walletService.getAccountAddress() === address;
    }
    return false;
  }
}
