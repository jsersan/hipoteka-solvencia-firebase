import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SolicitudesService, SolicitudGuardada } from '../../services/solicitudes.service';
import { FormularioService } from '../../services/formulario.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="historial-shell">
      <div class="hist-header">
        <div>
          <h2 class="hist-title">Historial de solicitudes</h2>
          <p class="hist-sub">{{ solicitudes().length }} análisis guardados</p>
        </div>
        <div class="hist-actions">
          <input class="search" type="text" [(ngModel)]="busqueda"
            placeholder="Buscar por nombre...">
          <button class="btn-back" (click)="volver()">← Volver al análisis</button>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading">Cargando historial...</div>
      } @else if (filtradas().length === 0) {
        <div class="empty">
          <p>No hay solicitudes guardadas todavía.</p>
          <p style="font-size:13px;color:var(--color-text-tertiary)">Completa un análisis y pulsa "Guardar solicitud" en la pantalla de resultado.</p>
        </div>
      } @else {
        <div class="lista">
          @for (s of filtradas(); track s.id) {
            <div class="sol-card" [class]="'borde-' + s.rating.toLowerCase()">
              <div class="sol-top">
                <div class="sol-info">
                  <div class="sol-nombre">{{ s.nombre }}</div>
                  <div class="sol-fecha">{{ s.fecha | date:'dd/MM/yyyy HH:mm' }}</div>
                </div>
                <div class="sol-badges">
                  <span class="badge-rating" [class]="'rating-' + s.rating.toLowerCase()">
                    Rating {{ s.rating }}
                  </span>
                  <span class="badge-score">{{ s.score }} / 1000</span>
                  <span class="badge-estado" [class]="'estado-' + s.estado">
                    {{ etiquetaEstado(s.estado) }}
                  </span>
                </div>
              </div>

              <div class="sol-veredicto">{{ s.veredicto }}</div>

              <!-- Métricas rápidas -->
              <div class="sol-metrics">
                <span>Ingresos: <strong>{{ s.resultado.ingresosTotalesMes | number:'1.0-0':'es' }} €/mes</strong></span>
                <span>Cuota: <strong>{{ s.resultado.cuotaMensual | number:'1.0-0':'es' }} €/mes</strong></span>
                <span>Esfuerzo: <strong [class.text-danger]="s.resultado.ratioEsfuerzo > 40">{{ s.resultado.ratioEsfuerzo.toFixed(1) }}%</strong></span>
                <span>LTV: <strong [class.text-danger]="s.resultado.ltv > 80">{{ s.resultado.ltv.toFixed(1) }}%</strong></span>
              </div>

              <!-- Notas editables -->
              @if (editandoId() === s.id) {
                <div class="notas-edit">
                  <textarea [(ngModel)]="notasTemp" rows="3" placeholder="Observaciones del analista..."></textarea>
                  <div class="notas-btns">
                    <select [(ngModel)]="estadoTemp">
                      <option value="pendiente">Pendiente</option>
                      <option value="aprobado">Aprobado</option>
                      <option value="revision">En revisión</option>
                      <option value="denegado">Denegado</option>
                    </select>
                    <button class="btn-sm btn-ok" (click)="guardarNotas(s)">Guardar</button>
                    <button class="btn-sm" (click)="editandoId.set(null)">Cancelar</button>
                  </div>
                </div>
              } @else if (s.notas) {
                <div class="notas-view">{{ s.notas }}</div>
              }

              <!-- Acciones -->
              <div class="sol-acciones">
                <button class="btn-sm" (click)="cargarSolicitud(s)">
                  Cargar en formulario
                </button>
                <button class="btn-sm" (click)="iniciarEdicion(s)">
                  {{ editandoId() === s.id ? 'Editando...' : 'Añadir nota' }}
                </button>
                <button class="btn-sm btn-danger" (click)="confirmarEliminar(s)">
                  Eliminar
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .historial-shell { max-width: 860px; margin: 0 auto; padding: 1.5rem 1rem; }
    .hist-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; gap: 12px; flex-wrap: wrap; }
    .hist-title { font-size: 18px; font-weight: 500; margin: 0 0 4px; }
    .hist-sub { font-size: 13px; color: var(--color-text-secondary); margin: 0; }
    .hist-actions { display: flex; gap: 8px; align-items: center; }
    .search { padding: 7px 12px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); font-size: 13px; background: var(--color-background-primary); color: var(--color-text-primary); outline: none; font-family: inherit; min-width: 180px; }
    .search:focus { border-color: #185FA5; }
    .btn-back { padding: 7px 14px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); background: var(--color-background-primary); color: var(--color-text-secondary); font-size: 13px; cursor: pointer; font-family: inherit; }
    .btn-back:hover { background: var(--color-background-secondary); }
    .loading, .empty { text-align: center; padding: 3rem 1rem; color: var(--color-text-secondary); font-size: 14px; }
    .lista { display: flex; flex-direction: column; gap: 12px; }
    .sol-card { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-left: 3px solid var(--color-border-secondary); border-radius: var(--border-radius-lg); padding: 1rem 1.25rem; }
    .borde-a { border-left-color: #639922; }
    .borde-b { border-left-color: #BA7517; }
    .borde-c { border-left-color: #185FA5; }
    .borde-d { border-left-color: #E24B4A; }
    .sol-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; gap: 8px; flex-wrap: wrap; }
    .sol-nombre { font-size: 15px; font-weight: 500; }
    .sol-fecha { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
    .sol-badges { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .badge-rating { font-size: 11px; font-weight: 500; padding: 2px 10px; border-radius: 20px; }
    .rating-a { background: #EAF3DE; color: #27500A; }
    .rating-b { background: #FAEEDA; color: #633806; }
    .rating-c { background: #E6F1FB; color: #0C447C; }
    .rating-d { background: #FCEBEB; color: #791F1F; }
    .badge-score { font-size: 12px; font-weight: 500; color: var(--color-text-secondary); }
    .badge-estado { font-size: 11px; padding: 2px 10px; border-radius: 20px; }
    .estado-pendiente { background: var(--color-background-secondary); color: var(--color-text-secondary); }
    .estado-aprobado  { background: #EAF3DE; color: #27500A; }
    .estado-revision  { background: #FAEEDA; color: #633806; }
    .estado-denegado  { background: #FCEBEB; color: #791F1F; }
    .sol-veredicto { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 10px; }
    .sol-metrics { display: flex; gap: 16px; font-size: 12px; color: var(--color-text-secondary); flex-wrap: wrap; margin-bottom: 10px; }
    .sol-metrics strong { color: var(--color-text-primary); }
    .text-danger { color: var(--color-text-danger) !important; }
    .sol-acciones { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-sm { padding: 5px 12px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); background: var(--color-background-primary); color: var(--color-text-secondary); font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .btn-sm:hover { background: var(--color-background-secondary); }
    .btn-ok { background: #185FA5; color: #fff; border-color: #185FA5; }
    .btn-ok:hover { background: #0C447C; }
    .btn-danger { color: var(--color-text-danger); border-color: var(--color-border-danger); }
    .btn-danger:hover { background: var(--color-background-danger); }
    .notas-edit { margin: 10px 0; }
    .notas-edit textarea { width: 100%; padding: 8px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); font-size: 13px; font-family: inherit; background: var(--color-background-primary); color: var(--color-text-primary); resize: vertical; outline: none; }
    .notas-btns { display: flex; gap: 8px; margin-top: 6px; align-items: center; }
    .notas-btns select { padding: 5px 8px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); font-size: 12px; background: var(--color-background-primary); color: var(--color-text-primary); font-family: inherit; }
    .notas-view { font-size: 12px; color: var(--color-text-secondary); background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 8px 10px; margin: 8px 0; border-left: 2px solid var(--color-border-secondary); }
    @media (max-width: 600px) { .sol-metrics { gap: 10px; } .hist-header { flex-direction: column; } }
  `]
})
export class HistorialComponent implements OnInit {
  solicitudes = this.sols.solicitudes;
  cargando    = this.sols.cargando;
  editandoId  = signal<string | null>(null);
  busqueda    = '';
  notasTemp   = '';
  estadoTemp: SolicitudGuardada['estado'] = 'pendiente';

  get filtradas() {
    return () => {
      const b = this.busqueda.toLowerCase();
      return this.solicitudes().filter(s =>
        !b || s.nombre.toLowerCase().includes(b)
      );
    };
  }

  constructor(
    private auth: AuthService,
    private sols: SolicitudesService,
    private form: FormularioService,
    private router: Router
  ) {}

  async ngOnInit() {
    const uid = this.auth.uid;
    if (uid) await this.sols.cargar(uid);
  }

  etiquetaEstado(estado: string): string {
    const m: Record<string, string> = {
      pendiente: 'Pendiente', aprobado: 'Aprobado',
      revision: 'En revisión', denegado: 'Denegado'
    };
    return m[estado] ?? estado;
  }

  iniciarEdicion(s: SolicitudGuardada) {
    this.editandoId.set(s.id);
    this.notasTemp  = s.notas;
    this.estadoTemp = s.estado;
  }

  async guardarNotas(s: SolicitudGuardada) {
    const uid = this.auth.uid;
    if (!uid) return;
    await this.sols.actualizarEstado(uid, s.id, this.estadoTemp, this.notasTemp);
    this.editandoId.set(null);
  }

  async confirmarEliminar(s: SolicitudGuardada) {
    if (!confirm(`¿Eliminar la solicitud de "${s.nombre}"? Esta acción no se puede deshacer.`)) return;
    const uid = this.auth.uid;
    if (uid) await this.sols.eliminar(uid, s.id);
  }

  cargarSolicitud(s: SolicitudGuardada) {
    this.form.cargarSolicitud(s.solicitud, s.nombre, 0);
    this.router.navigate(['/']);
  }

  volver() { this.router.navigate(['/']); }
}
