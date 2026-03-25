import { Injectable, signal } from '@angular/core';
import {
  collection, doc, setDoc, getDocs, deleteDoc,
  query, orderBy, Timestamp, getDoc, updateDoc
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { SolicitudCompleta, ResultadoSolvencia } from '../models/solicitud.model';

export interface SolicitudGuardada {
  id: string;
  nombre: string;
  fecha: Date;
  score: number;
  rating: string;
  veredicto: string;
  estado: 'pendiente' | 'aprobado' | 'denegado' | 'revision';
  notas: string;
  solicitud: SolicitudCompleta;
  resultado: ResultadoSolvencia;
}

@Injectable({ providedIn: 'root' })
export class SolicitudesService {

  readonly solicitudes  = signal<SolicitudGuardada[]>([]);
  readonly cargando     = signal<boolean>(false);
  readonly guardando    = signal<boolean>(false);

  // ── Cargar todas las solicitudes del usuario ────────────────────────────

  async cargar(uid: string): Promise<void> {
    this.cargando.set(true);
    try {
      const col = collection(db, 'users', uid, 'solicitudes');
      const q   = query(col, orderBy('fecha', 'desc'));
      const snap = await getDocs(q);

      const lista: SolicitudGuardada[] = snap.docs.map((d: any) => {
        const data = d.data() as any;
        return {
          id: d.id,
          nombre: data.nombre,
          fecha: (data.fecha as Timestamp).toDate(),
          score: data.score,
          rating: data.rating,
          veredicto: data.veredicto,
          estado: data.estado ?? 'pendiente',
          notas: data.notas ?? '',
          solicitud: data.solicitud,
          resultado: data.resultado
        };
      });

      this.solicitudes.set(lista);
    } finally {
      this.cargando.set(false);
    }
  }

  // ── Guardar solicitud actual ─────────────────────────────────────────────

  async guardar(
    uid: string,
    solicitud: SolicitudCompleta,
    resultado: ResultadoSolvencia,
    notas = ''
  ): Promise<string> {
    this.guardando.set(true);
    try {
      const col  = collection(db, 'users', uid, 'solicitudes');
      const ref  = doc(col);  // ID automático
      const data = {
        nombre:    solicitud.solicitante.nombre || 'Sin nombre',
        fecha:     Timestamp.now(),
        score:     resultado.score,
        rating:    resultado.rating,
        veredicto: resultado.veredicto,
        estado:    'pendiente',
        notas,
        solicitud: this.limpiar(solicitud),
        resultado: this.limpiar(resultado)
      };
      await setDoc(ref, data);

      // Actualizar lista local
      const nueva: SolicitudGuardada = {
        id: ref.id, ...data,
        fecha: new Date(),
        estado: 'pendiente',
        notas
      };
      this.solicitudes.update(l => [nueva, ...l]);
      return ref.id;
    } finally {
      this.guardando.set(false);
    }
  }

  // ── Actualizar notas y estado ────────────────────────────────────────────

  async actualizarEstado(
    uid: string,
    id: string,
    estado: SolicitudGuardada['estado'],
    notas: string
  ): Promise<void> {
    const ref = doc(db, 'users', uid, 'solicitudes', id);
    await updateDoc(ref, { estado, notas });
    this.solicitudes.update(l =>
      l.map(s => s.id === id ? { ...s, estado, notas } : s)
    );
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────

  async eliminar(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'solicitudes', id));
    this.solicitudes.update(l => l.filter(s => s.id !== id));
  }

  // ── Eliminar propiedades que Firestore no acepta (undefined, funciones) ──

  private limpiar<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
