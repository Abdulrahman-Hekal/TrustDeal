import { Component, inject, OnInit, signal } from '@angular/core';
import { JobService } from '../../core/services/job-service/job.service';
import { IJob } from '../../core/models/job.model';
import { Router } from '@angular/router';
import { WalletService } from '../../core/services/wallet-service/wallet.service';

@Component({
  selector: 'app-user-deals',
  imports: [],
  templateUrl: './user-deals.html',
  styleUrl: './user-deals.css',
})
export class UserDeals implements OnInit {
  private readonly _jobService = inject(JobService);
  private readonly _walletService = inject(WalletService);
  private readonly _router = inject(Router);

  jobs = signal<IJob[]>([]);

  ngOnInit() {
    if (this._walletService.isConnected()) {
      this._jobService.getUserJobs(this._walletService.getAccountAddress()).subscribe({
        next: (res) => {
          this.jobs.set(res.data);
        },
        error: (res) => alert(res.error.message),
      });
    } else {
      this._router.navigate(['/home']);
      alert('Connect first to see your Deals');
    }
  }

  showDetails(id: string) {
    this._router.navigate([`job/${id}`]);
  }

  compareAddresses(address: string) {
    if (this._walletService.isConnected()) {
      return this._walletService.getAccountAddress() === address;
    }
    return false;
  }

  deleteJob(id: string) {
    this._jobService.deleteJob(id).subscribe({
      next: (res) => alert(res.message),
      error: (res) => alert(res.error.message),
    });
  }
}
