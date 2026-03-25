import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type Modo = 'login' | 'registro';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-shell">
      <div class="login-card">

        <!-- Logo -->
        <div class="login-logo">
          <span class="logo-icon">H</span>
          <div>
            <span class="logo-title">¡Txema Serrano's Hipoteka!</span>
            <span class="logo-sub">Motor de análisis de crédito inmobiliario</span>
          </div>
        </div>

        <!-- Tabs login / registro -->
        <div class="tab-row">
          <button class="tab" [class.active]="modo() === 'login'"
            (click)="modo.set('login')">Iniciar sesión</button>
          <button class="tab" [class.active]="modo() === 'registro'"
            (click)="modo.set('registro')">Crear cuenta</button>
        </div>

        <!-- Formulario -->
        @if (modo() === 'registro') {
          <div class="form-group">
            <label>Nombre completo</label>
            <input type="text" [(ngModel)]="nombre" placeholder="Tu nombre">
          </div>
        }
        <div class="form-group">
          <label>Correo electrónico</label>
          <input type="email" [(ngModel)]="email" placeholder="correo@ejemplo.com"
            (keydown.enter)="submit()">
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input [type]="verPassword ? 'text' : 'password'"
            [(ngModel)]="password" placeholder="Mínimo 6 caracteres"
            (keydown.enter)="submit()">
          <button class="ver-pass" (click)="verPassword = !verPassword">
            {{ verPassword ? 'Ocultar' : 'Ver' }}
          </button>
        </div>

        @if (error()) {
          <div class="alert-error">{{ error() }}</div>
        }

        <button class="btn-primary" [disabled]="cargando()" (click)="submit()">
          @if (cargando()) { Cargando... }
          @else { {{ modo() === 'login' ? 'Entrar' : 'Crear cuenta' }} }
        </button>

        <div class="divider"><span>o</span></div>

        <button class="btn-google" [disabled]="cargando()" (click)="loginGoogle()">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        <p class="legal">
          Acceso restringido a analistas autorizados.
          Los datos se almacenan de forma segura en Firebase (Google Cloud, región UE).
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--color-background-tertiary); padding: 1rem;
    }
    .login-card {
      background: var(--color-background-primary);
      border: 0.5px solid var(--color-border-tertiary);
      border-radius: var(--border-radius-lg);
      padding: 2rem; width: 100%; max-width: 400px;
    }
    .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
    .logo-icon { width: 36px; height: 36px; background: #185FA5; color: #fff; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 18px; flex-shrink: 0; }
    .logo-title { font-size: 15px; font-weight: 500; display: block; }
    .logo-sub { font-size: 11px; color: var(--color-text-secondary); display: block; }
    .tab-row { display: flex; gap: 4px; margin-bottom: 1.25rem; background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 3px; }
    .tab { flex: 1; padding: 7px; border: none; background: transparent; border-radius: 6px; font-size: 13px; cursor: pointer; color: var(--color-text-secondary); font-family: inherit; transition: all 0.2s; }
    .tab.active { background: var(--color-background-primary); color: var(--color-text-primary); font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; position: relative; }
    label { font-size: 12px; font-weight: 500; color: var(--color-text-secondary); }
    input { padding: 9px 12px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); font-size: 14px; background: var(--color-background-primary); color: var(--color-text-primary); outline: none; font-family: inherit; }
    input:focus { border-color: #185FA5; box-shadow: 0 0 0 2px rgba(24,95,165,0.12); }
    .ver-pass { position: absolute; right: 10px; bottom: 9px; border: none; background: none; font-size: 11px; color: var(--color-text-secondary); cursor: pointer; font-family: inherit; }
    .alert-error { background: var(--color-background-danger); border: 0.5px solid var(--color-border-danger); color: var(--color-text-danger); border-radius: var(--border-radius-md); padding: 8px 12px; font-size: 13px; margin-bottom: 12px; }
    .btn-primary { width: 100%; padding: 10px; background: #185FA5; color: #fff; border: none; border-radius: var(--border-radius-md); font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: background 0.2s; }
    .btn-primary:hover:not(:disabled) { background: #0C447C; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .divider { text-align: center; margin: 14px 0; position: relative; }
    .divider::before { content:''; position:absolute; top:50%; left:0; right:0; height:0.5px; background:var(--color-border-tertiary); }
    .divider span { background: var(--color-background-primary); padding: 0 10px; font-size: 12px; color: var(--color-text-secondary); position: relative; }
    .btn-google { width: 100%; padding: 9px; border: 0.5px solid var(--color-border-secondary); background: var(--color-background-primary); color: var(--color-text-primary); border-radius: var(--border-radius-md); font-size: 13px; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
    .btn-google:hover:not(:disabled) { background: var(--color-background-secondary); }
    .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }
    .legal { font-size: 11px; color: var(--color-text-tertiary); text-align: center; margin-top: 1rem; line-height: 1.5; }
  `]
})
export class LoginComponent {
  modo     = signal<Modo>('login');
  error    = signal<string>('');
  cargando = signal<boolean>(false);

  email       = '';
  password    = '';
  nombre      = '';
  verPassword = false;

  constructor(private auth: AuthService, private router: Router) {}

  async submit() {
    this.error.set('');
    if (!this.email || !this.password) {
      this.error.set('Por favor, rellena todos los campos.');
      return;
    }
    this.cargando.set(true);
    try {
      if (this.modo() === 'login') {
        await this.auth.login(this.email, this.password);
      } else {
        if (!this.nombre) { this.error.set('Introduce tu nombre.'); return; }
        if (this.password.length < 6) { this.error.set('La contraseña debe tener al menos 6 caracteres.'); return; }
        await this.auth.registrar(this.email, this.password, this.nombre);
      }
      this.router.navigate(['/']);
    } catch (e: any) {
      this.error.set(this.traducirError(e.code));
    } finally {
      this.cargando.set(false);
    }
  }

  async loginGoogle() {
    this.error.set('');
    this.cargando.set(true);
    try {
      await this.auth.loginConGoogle();
      this.router.navigate(['/']);
    } catch (e: any) {
      this.error.set('Error al conectar con Google. Inténtalo de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }

  private traducirError(code: string): string {
    const errores: Record<string, string> = {
      'auth/user-not-found':      'No existe ninguna cuenta con ese correo.',
      'auth/wrong-password':      'Contraseña incorrecta.',
      'auth/email-already-in-use':'Ya existe una cuenta con ese correo.',
      'auth/invalid-email':       'El formato del correo no es válido.',
      'auth/weak-password':       'La contraseña debe tener al menos 6 caracteres.',
      'auth/too-many-requests':   'Demasiados intentos fallidos. Espera unos minutos.',
      'auth/network-request-failed': 'Error de red. Comprueba tu conexión.',
      'auth/popup-closed-by-user':'Se cerró la ventana de Google sin completar el acceso.',
    };
    return errores[code] ?? 'Error desconocido. Inténtalo de nuevo.';
  }
}
