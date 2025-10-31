import { Component, inject, OnInit, signal } from '@angular/core';
import { JobService } from '../../core/services/job-service/job.service';
import { ActivatedRoute } from '@angular/router';
import { IJob } from '../../core/models/job.model';
import { CommentService } from '../../core/services/comment-service/comment.service';
import { IComment } from '../../core/models/comment.model';

@Component({
  selector: 'app-job-details',
  imports: [],
  templateUrl: './job-details.html',
  styleUrl: './job-details.css',
})
export class JobDetails implements OnInit {
  private readonly _activeRoute = inject(ActivatedRoute);
  private readonly _servicesJob = inject(JobService);
  private readonly _commentService = inject(CommentService);

  project = signal<IJob | null>(null);
  comments = signal<IComment[]>([]);

  ngOnInit(): void {
    const id = this._activeRoute.snapshot.paramMap.get('id');
    if (id) {
      this._servicesJob.getJobById(id).subscribe({
        next: (res) => {
          this.project.set(res.data);
          this.getComment();
        },
        error: (err) => console.log(err),
      });
    }
  }

  getComment() {
    const id = this._activeRoute.snapshot.paramMap.get('id');
    if (id) {
      this._commentService.getJobComments(id).subscribe({
        next: (res) => {
          this.comments.set(res.data);
        },
        error: (err) => console.log(err),
      });
    }
  }

  // addComment(){
  //   this._commentService.addComment()
  // }
}
