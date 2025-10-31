import { Routes } from '@angular/router';
import { NotFound } from './pages/not-found/not-found';
import { Home } from './pages/home/home';
import { Jobs } from './pages/jobs/jobs';
import { JobDetails } from './pages/job-details/job-details';
import { UserProjects } from './pages/user-projects/user-projects';
import { UserDeals } from './pages/user-deals/user-deals';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home, title: 'TrustDeal Home' },
  { path: 'jobs', component: Jobs, title: 'TrustDeal Jobs' },
  { path: 'my-jobs', component: UserProjects, title: 'Your Jobs' },
  { path: 'my-deals', component: UserDeals, title: 'Your Deals' },
  { path: 'job/:id', component: JobDetails, title: 'Job Details' },
  { path: '**', component: NotFound, title: 'Not Found' },
];
