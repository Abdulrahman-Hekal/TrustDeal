import { Component, inject, OnInit, signal } from '@angular/core';
import { JobService } from '../../core/services/job-service/job.service';
import { Router } from '@angular/router';
import { IJob } from '../../core/models/job.model';
import { WalletService } from '../../core/services/wallet-service/wallet.service';
import { ContractService } from '../../core/services/contract-service/contract.service';

@Component({
  selector: 'app-user-projects',
  imports: [],
  templateUrl: './user-projects.html',
  styleUrl: './user-projects.css',
})
export class UserProjects implements OnInit {
  private readonly _jobService = inject(JobService);
  private readonly _walletService = inject(WalletService);
  private readonly _contractService = inject(ContractService);
  private readonly _router = inject(Router);

  jobs = signal<IJob[]>([]);

  ngOnInit() {
    this.initializeWallet();
  }

  private async initializeWallet() {
    if (!this._walletService.isConnected()) {
      await this._walletService.connect();
      await this._contractService.initContract();
      location.reload();
    }
    this._jobService.getUserJobs(this._walletService.getAccountAddress()).subscribe({
      next: (res) => {
        this.jobs.set(res.data);
      },
      error: (res) => alert(res.error.message),
    });
  }

  showDetails(id: string) {
    this._router.navigate([`job/${id}`]);
  }
}
