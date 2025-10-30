export enum EJobStatus {
  pending = 'pending',
  funded = 'funded',
  deliverd = 'deliverd',
  approved = 'approved',
  refunded = 'refunded',
}

export interface IJob {
  _id: string;
  title: string;
  description: string;
  price: number;
  clientAddress: string;
  freelancerAddress: string;
  previewHash: string;
  finalHash: string;
  deliveryDeadline: number;
  approvalDeadline: number;
  status: EJobStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  isExpired: boolean;
}

export interface IJobsResponse {
  message: string;
  data: IJob[];
}

export interface IJobResponse {
  message: string;
  data: IJob;
}

export interface IJobInput {
  title: string;
  description: string;
  price: number;
  clientAddress: string;
}

export interface IDealInput {
  approvalDeadline: number;
  deliveryDeadline: number;
  freelancerAddress: string;
}
