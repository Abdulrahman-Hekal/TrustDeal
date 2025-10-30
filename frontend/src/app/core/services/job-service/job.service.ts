import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  EJobStatus,
  IDealInput,
  IipfsResponse,
  IJobInput,
  IJobResponse,
  IJobsResponse,
  IPreviewResponse,
} from '../../models/job.model';

@Injectable({
  providedIn: 'root',
})
export class JobService {
  private readonly _httpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}jobs`;

  getAllJobs() {
    return this._httpClient.get<IJobsResponse>(`${this.baseUrl}`);
  }

  getUserJobs(userAddress: string) {
    return this._httpClient.get<IJobsResponse>(`${this.baseUrl}/user/${userAddress}`);
  }

  getJobById(jobId: string) {
    return this._httpClient.get<IJobResponse>(`${this.baseUrl}/${jobId}`);
  }

  postNewJob(jobData: IJobInput) {
    return this._httpClient.post<IJobResponse>(`${this.baseUrl}`, jobData);
  }

  makeDeal(jobId: string, dealData: IDealInput) {
    return this._httpClient.put<IJobResponse>(`${this.baseUrl}/${jobId}`, dealData);
  }

  deliverJob(jobId: string, fileFormData: FormData) {
    return this._httpClient.post<IipfsResponse>(`${this.baseUrl}/deliver/${jobId}`, fileFormData);
  }

  generatePreview(jobId: string, userAddress: string) {
    return this._httpClient.post<IPreviewResponse>(`${this.baseUrl}/preview/${jobId}`, {
      userAddress,
    });
  }

  approveWork(jobId: string, userAddress: string) {
    return this._httpClient.post<IipfsResponse>(`${this.baseUrl}/approve/${jobId}`, {
      userAddress,
    });
  }

  changeStatus(jobId: string, status: EJobStatus) {
    return this._httpClient.put<IJobResponse>(`${this.baseUrl}/status/${jobId}`, { status });
  }

  deleteJob(jobId: string) {
    return this._httpClient.delete<{ message: string }>(`${this.baseUrl}/${jobId}`);
  }
}
