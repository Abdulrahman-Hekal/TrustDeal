
import { Component, inject, OnInit, signal } from '@angular/core';
import { JobService } from '../../core/services/job-service/job.service';
import { IJob, IJobsResponse } from '../../core/models/job.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-jobs',
  imports: [],
  templateUrl: './jobs.html',
  styleUrl: './jobs.css',
})
export class Jobs implements OnInit {

  private readonly _jobService = inject(JobService);
  private readonly _router = inject(Router)

  jobs = signal<IJob[]>([]);

  ngOnInit(): void {
    this._jobService.getAllJobs().subscribe({
      next: (res) => {
        this.jobs.set(res.data);
      },
      error: (err) => console.log(err),
    });
  }

  showDetails(id : string){
    this._router.navigate([`job/${id}`])
  }
}
