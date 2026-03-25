import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsvImportService } from '../../services/csv-import.service';
import { FormularioService } from '../../services/formulario.service';

type Estado = 'idle' | 'leyendo' | 'ok' | 'error';

@Component({
  selector: 'app-csv-import',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="import-zone"
      [class.dragging]="dragging"
      [class.estado-ok]="estado === 'ok'"
      [class.estado-error]="estado === 'error'"
      (dragover)="onDragOver($event)"
      (dragleave)="dragging = false"
      (drop)="onDrop($event)">

      <!-- IDLE: zona de carga -->
      @if (estado === 'idle') {
        <div class="import-idle">
          <div class="import-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <polyline points="9,15 12,12 15,15"/>
            </svg>
          </div>
          <p class="import-title">Arrastra tu CSV aquí o</p>
          <label class="btn-upload">
            Seleccionar archivo
            <input type="file" accept=".csv,.txt" (change)="onFileSelect($event)" hidden>
          </label>
          <p class="import-hint">
            Formato: dos columnas <code>campo,valor</code> — separador <code>,</code> o <code>;</code>
          </p>
        </div>
      }

      <!-- LEYENDO: spinner animado -->
      @if (estado === 'leyendo') {
        <div class="import-loading">
          <div class="spinner"></div>
          <div class="loading-text">
            <strong>Leyendo {{ nombreArchivo }}</strong>
            <span>Procesando datos del CSV...</span>
          </div>
        </div>
      }

      <!-- OK: importación exitosa -->
      @if (estado === 'ok') {
        <div class="import-ok">
          <div class="ok-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="#3B6D11" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="9,12 12,15 16,9"/>
            </svg>
          </div>
          <div class="ok-body">
            <div class="ok-title">Importación completada</div>
            <div class="ok-detail">
              <strong>{{ nombreArchivo }}</strong> —
              {{ camposCargados }} campos cargados en todos los pasos del formulario
            </div>
            <div class="ok-chips">
              <span class="chip">Solicitante ✓</span>
              <span class="chip">Ingresos ✓</span>
              <span class="chip">Gastos ✓</span>
              <span class="chip">Patrimonio ✓</span>
              <span class="chip">Préstamo ✓</span>
            </div>
          </div>
          <button class="btn-reset" (click)="resetear()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="1,4 1,10 7,10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
            </svg>
            Nuevo archivo
          </button>
        </div>
      }

      <!-- ERROR -->
      @if (estado === 'error') {
        <div class="import-error">
          <div class="error-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#A32D2D" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>Error al importar <strong>{{ nombreArchivo }}</strong></span>
          </div>
          @for (err of errores; track err) {
            <div class="error-item">{{ err }}</div>
          }
          <button class="btn-reset" (click)="resetear()">Intentar con otro archivo</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .import-zone {
      border: 1px dashed var(--color-border-secondary);
      border-radius: var(--border-radius-lg);
      padding: 1.25rem 1.5rem;
      text-align: center;
      transition: border-color 0.2s, background 0.2s;
      background: var(--color-background-primary);
    }
    .import-zone.dragging {
      border-color: #185FA5;
      background: var(--color-background-info);
    }
    .import-zone.estado-ok {
      border-style: solid;
      border-color: #639922;
      background: #EAF3DE;
    }
    .import-zone.estado-error {
      border-style: solid;
      border-color: #E24B4A;
      background: #FCEBEB;
    }

    /* IDLE */
    .import-icon { color: var(--color-text-secondary); margin-bottom: 8px; display: flex; justify-content: center; }
    .import-title { font-size: 14px; color: var(--color-text-secondary); margin: 0 0 10px; }
    .btn-upload {
      display: inline-block; padding: 7px 18px;
      border-radius: var(--border-radius-md);
      border: 0.5px solid var(--color-border-secondary);
      background: var(--color-background-secondary);
      color: var(--color-text-primary); font-size: 13px; cursor: pointer; transition: all 0.2s;
    }
    .btn-upload:hover { background: var(--color-border-tertiary); }
    .import-hint { font-size: 11px; color: var(--color-text-tertiary); margin: 10px 0 0; }
    code { font-family: monospace; background: var(--color-background-secondary); padding: 1px 5px; border-radius: 3px; }

    /* LEYENDO */
    .import-loading {
      display: flex; align-items: center; gap: 16px; justify-content: center; padding: 6px 0;
    }
    .spinner {
      width: 32px; height: 32px; border-radius: 50%;
      border: 3px solid var(--color-border-tertiary);
      border-top-color: #185FA5;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { text-align: left; }
    .loading-text strong { display: block; font-size: 14px; margin-bottom: 2px; }
    .loading-text span { font-size: 12px; color: var(--color-text-secondary); }

    /* OK */
    .import-ok {
      display: flex; align-items: flex-start; gap: 14px; text-align: left;
    }
    .ok-icon { flex-shrink: 0; margin-top: 2px; }
    .ok-body { flex: 1; }
    .ok-title { font-size: 15px; font-weight: 500; color: #27500A; margin-bottom: 3px; }
    .ok-detail { font-size: 13px; color: #3B6D11; margin-bottom: 10px; }
    .ok-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      font-size: 11px; padding: 3px 10px;
      background: rgba(99,153,34,0.18); color: #27500A;
      border-radius: 20px; font-weight: 500;
    }

    /* ERROR */
    .import-error { text-align: left; }
    .error-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #791F1F; margin-bottom: 10px;
    }
    .error-item {
      font-size: 12px; color: #791F1F;
      background: rgba(226,75,74,0.1);
      padding: 6px 10px; border-radius: var(--border-radius-md); margin-bottom: 4px;
    }

    /* BOTÓN RESET */
    .btn-reset {
      display: inline-flex; align-items: center; gap: 5px;
      margin-top: 12px; font-size: 12px; padding: 5px 12px;
      border: 0.5px solid var(--color-border-secondary);
      border-radius: var(--border-radius-md);
      background: var(--color-background-primary);
      cursor: pointer; color: var(--color-text-secondary); font-family: inherit;
      transition: all 0.2s;
    }
    .btn-reset:hover { background: var(--color-background-secondary); }
  `]
})
export class CsvImportComponent {
  @Output() importado = new EventEmitter<void>();

  dragging = false;
  estado: Estado = 'idle';
  nombreArchivo = '';
  camposCargados = 0;
  errores: string[] = [];

  constructor(private csv: CsvImportService, private form: FormularioService) {}

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragging = true; }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.procesar(file);
  }

  onFileSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.procesar(file);
  }

  private procesar(file: File) {
    this.nombreArchivo = file.name;
    this.estado = 'leyendo';

    // Pequeño delay para que se vea el spinner (la lectura es instantánea)
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const contenido = e.target?.result as string;
        const res = this.csv.parsear(contenido);

        if (res.ok && res.solicitud) {
          this.camposCargados = res.camposCargados;
          this.form.cargarSolicitud(res.solicitud, file.name, res.camposCargados);
          this.estado = 'ok';
          // Emitir tras un momento para que se vea el estado OK antes de cerrar el panel
          setTimeout(() => this.importado.emit(), 1200);
        } else {
          this.errores = res.errores;
          this.estado = 'error';
        }
      };
      reader.readAsText(file, 'UTF-8');
    }, 600);
  }

  resetear() {
    this.estado = 'idle';
    this.nombreArchivo = '';
    this.errores = [];
    this.camposCargados = 0;
    this.form.descartarCsv();
  }
}
