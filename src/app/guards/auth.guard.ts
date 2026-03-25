import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Si Firebase aún está cargando la sesión, esperamos
  if (auth.cargando()) {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (!auth.cargando()) {
          clearInterval(interval);
          if (auth.estaAutenticado) {
            resolve(true);
          } else {
            router.navigate(['/login']);
            resolve(false);
          }
        }
      }, 50);
    });
  }

  if (auth.estaAutenticado) return true;
  router.navigate(['/login']);
  return false;
};
