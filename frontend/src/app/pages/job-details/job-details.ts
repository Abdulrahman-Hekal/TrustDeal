import { Component, inject, OnInit, signal } from '@angular/core';
import { JobService } from '../../core/services/job-service/job.service';
import { ActivatedRoute } from '@angular/router';
import { IJob } from '../../core/models/job.model';

@Component({
  selector: 'app-job-details',
  imports: [],
  templateUrl: './job-details.html',
  styleUrl: './job-details.css',
})
export class JobDetails implements OnInit {

  private readonly _activeRoute = inject(ActivatedRoute)
  private readonly _servicesJob = inject(JobService)

  project : IJob | null = null
  jobs = signal<IJob[]>([])

  
  ngOnInit(): void {
    const id = this._activeRoute.snapshot.paramMap.get('id')
    if(id){
      this._servicesJob.getJobById(id).subscribe({
        next: res => {
          console.log(res.data);
          this.project = res.data
        },
      })
    }
  }
}
