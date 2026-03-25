import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormularioService } from '../../services/formulario.service';
import { DatosGastos } from '../../models/solicitud.model';
import { FORM_STYLES } from '../shared-styles';

@Component({
  selector: 'app-paso3-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="section">
      <div class="section-title">Compromisos financieros actuales</div>
      <p class="section-desc">Cuotas mensuales de deudas vigentes que continuarán durante la hipoteca</p>
      <div class="form-grid">
        <div class="form-group"><label>Préstamo personal (€/mes)</label><input type="number" [(ngModel)]="g.gPersonal" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Cuota mínima tarjetas de crédito (€/mes)</label><input type="number" [(ngModel)]="g.gTarjetas" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Leasing / renting vehículo (€/mes)</label><input type="number" [(ngModel)]="g.gLeasing" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Pensión alimenticia / manutención (€/mes)</label><input type="number" [(ngModel)]="g.gPension" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Alquiler actual (si no cesa) (€/mes)</label><input type="number" [(ngModel)]="g.gAlquiler" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Otros compromisos (€/mes)</label><input type="number" [(ngModel)]="g.gOtros" min="0" (ngModelChange)="guardar()"></div>
      </div>
      <div class="total-row"><span>Total compromisos financieros/mes</span><strong>{{ totalFinancieros | currency:'EUR':'symbol':'1.0-0':'es' }}</strong></div>
    </div>

    <div class="section">
      <div class="section-title">Gastos corrientes de vida (estimación mensual)</div>
      <div class="form-grid">
        <div class="form-group"><label>Alimentación y hogar (€/mes)</label><input type="number" [(ngModel)]="g.gAlimentacion" min="0" (ngModelChange)="guardar()"><span class="hint">Media: 500–800 €</span></div>
        <div class="form-group"><label>Suministros (€/mes)</label><input type="number" [(ngModel)]="g.gSuministros" min="0" (ngModelChange)="guardar()"><span class="hint">Media: 150–250 €</span></div>
        <div class="form-group"><label>Transporte (€/mes)</label><input type="number" [(ngModel)]="g.gTransporte" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Educación y guardería (€/mes)</label><input type="number" [(ngModel)]="g.gEducacion" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Seguros (€/mes)</label><input type="number" [(ngModel)]="g.gSeguros" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Ocio y varios (€/mes)</label><input type="number" [(ngModel)]="g.gOcio" min="0" (ngModelChange)="guardar()"></div>
      </div>
      <div class="total-row"><span>Total gastos de vida/mes</span><strong>{{ totalVida | currency:'EUR':'symbol':'1.0-0':'es' }}</strong></div>
    </div>

    <div class="capacity-card">
      <div class="capacity-row"><span>Ingresos totales</span><span>{{ ingresoTotal | currency:'EUR':'symbol':'1.0-0':'es' }}/mes</span></div>
      <div class="capacity-row"><span>— Compromisos financieros previos</span><span class="text-danger">–{{ totalFinancieros | currency:'EUR':'symbol':'1.0-0':'es' }}</span></div>
      <div class="capacity-row"><span>— Gastos corrientes de vida</span><span class="text-secondary">–{{ totalVida | currency:'EUR':'symbol':'1.0-0':'es' }}</span></div>
      <div class="capacity-divider"></div>
      <div class="capacity-row total">
        <span>Capacidad disponible para cuota hipotecaria</span>
        <strong [class.text-success]="capacidad > 0" [class.text-danger]="capacidad <= 0">
          {{ capacidad | currency:'EUR':'symbol':'1.0-0':'es' }}/mes
        </strong>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn" (click)="anterior()">← Atrás</button>
      <button class="btn btn-primary" (click)="siguiente()">Continuar →</button>
    </div>
  `,
  styles: [FORM_STYLES + `
    .section-desc { font-size: 12px; color: var(--color-text-secondary); margin-bottom: 12px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0 0; border-top: 0.5px solid var(--color-border-tertiary); margin-top: 12px; font-size: 13px; }
    .capacity-card { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 14px 16px; margin-bottom: 0; }
    .capacity-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
    .capacity-row.total { font-size: 14px; padding-top: 8px; }
    .capacity-divider { height: 0.5px; background: var(--color-border-secondary); margin: 6px 0; }
    .text-danger { color: var(--color-text-danger); }
    .text-success { color: var(--color-text-success); }
    .text-secondary { color: var(--color-text-secondary); }
  `]
})
export class Paso3GastosComponent implements OnInit {
  g!: DatosGastos;

  get totalFinancieros() { return (this.g.gPersonal||0)+(this.g.gTarjetas||0)+(this.g.gLeasing||0)+(this.g.gPension||0)+(this.g.gAlquiler||0)+(this.g.gOtros||0); }
  get totalVida() { return (this.g.gAlimentacion||0)+(this.g.gSuministros||0)+(this.g.gTransporte||0)+(this.g.gEducacion||0)+(this.g.gSeguros||0)+(this.g.gOcio||0); }
  get ingresoTotal() {
    const s = this.form.solicitud();
    const norm = (t: any) => t.ingresosMensuales + (t.ingresosMensuales*(t.pagasAnio-12)/12) + t.otrosIngresos;
    return norm(s.titular1) + (s.solicitante.titulares === 2 ? norm(s.titular2) : 0);
  }
  get capacidad() { return this.ingresoTotal - this.totalFinancieros - this.totalVida; }

  constructor(private form: FormularioService) {}

  ngOnInit() {
    this.g = { ...this.form.solicitud().gastos };
  }

  guardar() { this.form.actualizarGastos(this.g); }
  siguiente() { this.guardar(); this.form.siguiente(); }
  anterior() { this.guardar(); this.form.anterior(); }
}
