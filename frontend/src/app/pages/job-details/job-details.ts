import { Component, inject, OnInit, signal } from '@angular/core';
import { JobService } from '../../core/services/job-service/job.service';
import { ActivatedRoute } from '@angular/router';
import { EJobStatus, IJob } from '../../core/models/job.model';
import { CommentService } from '../../core/services/comment-service/comment.service';
import { IComment } from '../../core/models/comment.model';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../core/services/wallet-service/wallet.service';
import { DatePipe } from '@angular/common';
import { ContractService } from '../../core/services/contract-service/contract.service';

@Component({
  selector: 'app-job-details',
  imports: [FormsModule, DatePipe],
  templateUrl: './job-details.html',
  styleUrl: './job-details.css',
})
export class JobDetails implements OnInit {
  private readonly _activeRoute = inject(ActivatedRoute);
  private readonly _jobService = inject(JobService);
  private readonly _commentService = inject(CommentService);
  private readonly _walletService = inject(WalletService);
  private readonly _contractService = inject(ContractService);

  newComment: string = '';
  file = signal<any>(null);
  project = signal<IJob>({} as IJob);
  comments = signal<IComment[]>([]);

  ngOnInit(): void {
    this.getProject();
  }

  getProject() {
    const id = this._activeRoute.snapshot.paramMap.get('id');
    if (id) {
      this._jobService.getJobById(id).subscribe({
        next: (res) => {
          this.project.set(res.data);
          this.getComments();
        },
        error: (res) => alert(res.error.message),
      });
    }
  }

  getComments() {
    const id = this._activeRoute.snapshot.paramMap.get('id');
    if (id) {
      this._commentService.getJobComments(id).subscribe({
        next: (res) => {
          this.comments.set(res.data);
        },
        error: (res) => alert(res.error.message),
      });
    }
  }

  addComment() {
    if (!this._walletService.isConnected()) {
      alert('Connect first to make comment.');
      return;
    }
    if (this.newComment === '') {
      alert('The Comment is empty.');
      return;
    }
    if (this.newComment.trim()) {
      const jobId = this._activeRoute.snapshot.paramMap.get('id');
      const commentData = {
        content: this.newComment.trim(),
        freelancerAddress: this._walletService.getAccountAddress(),
      };
      if (jobId) {
        this._commentService.addComment(jobId, commentData).subscribe({
          next: (res) => {
            alert(res.message);
            this.newComment = '';
            this.getComments();
          },
          error: (res) => alert(res.error.message),
        });
      }
    }
  }

  makeDeal(freelancerAddress: string) {
    this._contractService
      .createProjectHBAR(
        freelancerAddress,
        this.project().approvalPeriod * 24 * 60 * 60,
        this.project().deliveryDeadline,
        this.project().price.toString()
      )
      .then((data) => {
        const obj = {
          freelancerAddress,
          projectId: Number(data),
        };
        this._jobService.makeDeal(this.project()._id, obj).subscribe({
          next: (res) => {
            this._jobService.changeStatus(this.project()._id, EJobStatus.funded);
            this.getProject();
            alert(res.message);
          },
          error: (res) => alert(res.error.message),
        });
      })
      .catch((err) => console.log(err))
      .finally(() => {
        this.getProject();
      });
  }

  compareAddresses(address: string) {
    if (this._walletService.isConnected()) {
      return this._walletService.getAccountAddress() === address;
    }
    return false;
  }

  getAccountId(address: string) {
    return this._walletService.getAccountIdFromAddress(address);
  }

  setFile(e: any) {
    if (e.target.files.length > 0) {
      this.file.set(e.target.files[0]);
    }
  }

  deliverJob() {
    const formData = new FormData();
    formData.append('file', this.file());
    this._jobService.deliverJob(this.project()._id, formData).subscribe({
      next: (res) => {
        this._contractService
          .deliverWork(this.project().projectId, res.data.fileUrl)
          .then(() => alert('Your work delivered successfully'));
        this.getProject();
      },
      error: (res) => alert(res.error.message),
    });
  }

  previewWork() {
    this._jobService
      .generatePreview(this.project()._id, this._walletService.getAccountAddress())
      .subscribe({
        next: (res) => {
          alert(`preview link: ${res.previewUrl}`);
        },
        error: (res) => alert(res.error.message),
      });
  }

  approveWork() {
    this._jobService
      .approveWork(this.project()._id, this._walletService.getAccountAddress())
      .subscribe({
        next: (res) => {
          this._contractService
            .approveWork(this.project().projectId)
            .then(() => alert(`Download Link: ${res.data.fileUrl}`));
        },
        error: (res) => alert(res.error.message),
      });
  }

  withDraw() {
    this._contractService
      .withdraw(this.project().projectId)
      .then(() => alert('Another Trust Deal Done'));
  }

  formToggle: boolean = false;

  openForm() {
    this.formToggle = true;
  }

  closeForm() {
    this.formToggle = false;
  }
}
