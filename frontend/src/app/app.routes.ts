import { Routes } from '@angular/router';
import { NotFound } from './pages/not-found/not-found';
import { Home } from './pages/home/home';
import { Jobs } from './pages/jobs/jobs';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home, title: 'TrustDeal Home' },
  {path:'jobs', component:Jobs},
  { path: '**', component: NotFound, title: 'Not Found' },
];
