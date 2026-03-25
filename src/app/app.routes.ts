import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/formulario/formulario.component').then(m => m.FormularioComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'historial',
    loadComponent: () => import('./components/historial/historial.component').then(m => m.HistorialComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];
