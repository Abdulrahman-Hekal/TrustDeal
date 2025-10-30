import { Component, OnInit } from '@angular/core';
import { JobService } from '../../core/services/job-service/job.service';
import { IJob, IJobsResponse } from '../../core/models/job.model';

@Component({
  selector: 'app-jobs',
  imports: [],
  templateUrl: './jobs.html',
  styleUrl: './jobs.css',
})
export class Jobs implements OnInit {
  constructor(private _jobService: JobService){}

  jobs : IJob[] = []

  ngOnInit(): void {
    this._jobService.getAllJobs().subscribe({
      next:res => this.jobs = res.data,
      error:err => console.log(err)      
    })
  }
}
