export interface IComment {
  _id: string;
  jobId: string;
  content: string;
  freelancerAddress: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ICommentsResponse {
  message: string;
  data: IComment[];
}

export interface ICommentResponse {
  message: string;
  data: IComment;
}

export interface ICommentInput {
  content: string;
  freelancerAddress: string;
}
