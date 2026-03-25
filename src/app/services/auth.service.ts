import { Injectable, signal } from '@angular/core';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase.config';

export interface UsuarioApp {
  uid: string;
  email: string | null;
  nombre: string | null;
  fotoUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  readonly usuario = signal<UsuarioApp | null>(null);
  readonly cargando = signal<boolean>(true);

  constructor() {
    // Escucha cambios de sesión de Firebase en tiempo real
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.usuario.set({
          uid: user.uid,
          email: user.email,
          nombre: user.displayName,
          fotoUrl: user.photoURL
        });
      } else {
        this.usuario.set(null);
      }
      this.cargando.set(false);
    });
  }

  get uid(): string | null {
    return this.usuario()?.uid ?? null;
  }

  get estaAutenticado(): boolean {
    return this.usuario() !== null;
  }

  // ── Email + contraseña ───────────────────────────────────────────────────

  async registrar(email: string, password: string, nombre: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: nombre });
    this.usuario.update(u => u ? { ...u, nombre } : u);
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  // ── Google OAuth ─────────────────────────────────────────────────────────

  async loginConGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  // ── Cerrar sesión ────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    await signOut(auth);
  }
}
