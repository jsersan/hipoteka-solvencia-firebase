import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormularioService } from '../../services/formulario.service';
import { AuthService } from '../../services/auth.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import { StepperComponent } from '../stepper/stepper.component';
import { Paso1SolicitanteComponent } from '../paso1-solicitante/paso1-solicitante.component';
import { Paso2IngresosComponent } from '../paso2-ingresos/paso2-ingresos.component';
import { Paso3GastosComponent } from '../paso3-gastos/paso3-gastos.component';
import { Paso4PatrimonioComponent } from '../paso4-patrimonio/paso4-patrimonio.component';
import { Paso5PrestamoComponent } from '../paso5-prestamo/paso5-prestamo.component';
import { Paso6ResultadoComponent } from '../paso6-resultado/paso6-resultado.component';

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [
    CommonModule, StepperComponent,
    Paso1SolicitanteComponent, Paso2IngresosComponent,
    Paso3GastosComponent, Paso4PatrimonioComponent,
    Paso5PrestamoComponent, Paso6ResultadoComponent
  ],
  template: `
    <app-stepper />

    <div class="paso-container">
      @switch (pasoActual()) {
        @case (1) { <app-paso1-solicitante /> }
        @case (2) { <app-paso2-ingresos /> }
        @case (3) { <app-paso3-gastos /> }
        @case (4) { <app-paso4-patrimonio /> }
        @case (5) { <app-paso5-prestamo /> }
        @case (6) {
          <app-paso6-resultado />
          @if (auth.usuario()) {
            <div class="guardar-bar">
              <button class="btn-guardar" [disabled]="sols.guardando()" (click)="guardarEnFirebase()">
                @if (sols.guardando()) {
                  <span class="spinner-sm"></span> Guardando...
                } @else {
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17,21 17,13 7,13"/><polyline points="7,3 7,8 15,8"/>
                  </svg>
                  Guardar solicitud en historial
                }
              </button>
              <span class="guardar-hint">Se guardará con el score y todos los datos actuales</span>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .paso-container { animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: translateY(0); } }
    .guardar-bar { display: flex; align-items: center; gap: 12px; margin-top: 1rem; padding: 12px 0; border-top: 0.5px solid var(--color-border-tertiary); }
    .btn-guardar { display: flex; align-items: center; gap: 7px; padding: 9px 20px; background: #185FA5; color: #fff; border: none; border-radius: var(--border-radius-md); font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: background 0.2s; }
    .btn-guardar:hover:not(:disabled) { background: #0C447C; }
    .btn-guardar:disabled { opacity: 0.6; cursor: not-allowed; }
    .guardar-hint { font-size: 12px; color: var(--color-text-secondary); }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class FormularioComponent {
  pasoActual = this.form.pasoActual;

  constructor(
    public auth: AuthService,
    public sols: SolicitudesService,
    private form: FormularioService
  ) {}

  async guardarEnFirebase() {
    const uid = this.auth.uid;
    if (!uid) return;
    await this.sols.guardar(uid, this.form.solicitud(), this.form.resultado());
    this.form.mostrarGuardado();
  }
}
