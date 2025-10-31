import { Component, inject, OnInit, signal } from '@angular/core';
import { JobService } from '../../core/services/job-service/job.service';
import { ActivatedRoute } from '@angular/router';
import { IJob } from '../../core/models/job.model';
import { CommentService } from '../../core/services/comment-service/comment.service';
import { IComment } from '../../core/models/comment.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-job-details',
  imports: [FormsModule],
  templateUrl: './job-details.html',
  styleUrl: './job-details.css',
})
export class JobDetails implements OnInit {
  private readonly _activeRoute = inject(ActivatedRoute);
  private readonly _servicesJob = inject(JobService);
  private readonly _commentService = inject(CommentService);
  newComment: string = '';

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

  addComment() {
    if (this.newComment.trim()) {
      const jobId = this._activeRoute.snapshot.paramMap.get('id');
      const commentData = {
        content: this.newComment.trim(),
        freelancerAddress: 'user-address-here', // ضع عنوان المستخدم هنا
      };

      if (jobId) {
        this._commentService.addComment(jobId, commentData).subscribe({
          next: (response) => {
            console.log('Comment added:', response);
            this.newComment = ''; // مسح الحقل بعد الإضافة
            // أضف reload للتعليقات أو update للقائمة
          },
          error: (error) => {
            console.error('Error adding comment:', error);
          },
        });
      }
    }
  }
}
