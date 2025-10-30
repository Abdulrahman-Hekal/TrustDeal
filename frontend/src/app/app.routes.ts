import { Routes } from '@angular/router';
import { NotFound } from './pages/not-found/not-found';
import { Home } from './pages/home/home';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home, title: 'TrustDeal Home' },
  { path: '**', component: NotFound, title: 'Not Found' },
];
