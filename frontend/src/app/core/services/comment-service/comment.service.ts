import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ICommentInput, ICommentResponse, ICommentsResponse } from '../../models/comment.model';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private readonly _httpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}comments`;

  getJobComments(jobId: string) {
    return this._httpClient.get<ICommentsResponse>(`${this.baseUrl}/${jobId}`);
  }

  addComment(jobId: string, commentData: ICommentInput) {
    return this._httpClient.post<ICommentResponse>(`${this.baseUrl}/${jobId}`, commentData);
  }
}
