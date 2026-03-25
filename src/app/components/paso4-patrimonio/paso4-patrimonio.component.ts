import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormularioService } from '../../services/formulario.service';
import { DatosPatrimonio } from '../../models/solicitud.model';
import { FORM_STYLES } from '../shared-styles';

@Component({
  selector: 'app-paso4-patrimonio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="section">
      <div class="section-title">Activos y ahorros</div>
      <div class="form-grid">
        <div class="form-group"><label>Ahorro disponible para entrada (€)</label><input type="number" [(ngModel)]="p.ahorro" min="0" (ngModelChange)="guardar()"><span class="hint">Mínimo recomendado: 20% del precio + 10% gastos</span></div>
        <div class="form-group"><label>Inversiones y fondos (€)</label><input type="number" [(ngModel)]="p.inversiones" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Valor de otros inmuebles propios (€)</label><input type="number" [(ngModel)]="p.inmuebles" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Valor de vehículos (€)</label><input type="number" [(ngModel)]="p.vehiculos" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Plan de pensiones — valor acumulado (€)</label><input type="number" [(ngModel)]="p.planPension" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Otros activos (€)</label><input type="number" [(ngModel)]="p.otrosActivos" min="0" (ngModelChange)="guardar()"></div>
      </div>
      <div class="total-row"><span>Total activos</span><strong class="text-success">{{ totalActivos | currency:'EUR':'symbol':'1.0-0':'es' }}</strong></div>
    </div>

    <div class="section">
      <div class="section-title">Pasivos y deudas pendientes</div>
      <div class="form-grid">
        <div class="form-group"><label>Saldo pendiente préstamos personales (€)</label><input type="number" [(ngModel)]="p.dPersonal" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Saldo pendiente tarjetas de crédito (€)</label><input type="number" [(ngModel)]="p.dTarjetas" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Capital pendiente hipoteca existente (€)</label><input type="number" [(ngModel)]="p.dHipoteca" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Otras deudas (€)</label><input type="number" [(ngModel)]="p.dOtros" min="0" (ngModelChange)="guardar()"></div>
      </div>
      <div class="total-row"><span>Total pasivos</span><strong class="text-danger">{{ totalPasivos | currency:'EUR':'symbol':'1.0-0':'es' }}</strong></div>
    </div>

    <div class="balance-card" [class.positive]="patrimonioNeto >= 0" [class.negative]="patrimonioNeto < 0">
      <div class="balance-label">Patrimonio neto (activos – pasivos)</div>
      <div class="balance-value">{{ patrimonioNeto | currency:'EUR':'symbol':'1.0-0':'es' }}</div>
      <div class="balance-bar-wrap"><div class="balance-bar" [style.width.%]="barWidth"></div></div>
      <div class="balance-note">
        @if (patrimonioNeto >= 100000) { Patrimonio sólido — aporta garantía significativa }
        @else if (patrimonioNeto >= 20000) { Patrimonio moderado — suficiente para la operación }
        @else if (patrimonioNeto >= 0) { Patrimonio ajustado — no penaliza pero no suma garantías }
        @else { Patrimonio negativo — puede dificultar la aprobación }
      </div>
    </div>

    <div class="btn-row">
      <button class="btn" (click)="anterior()">← Atrás</button>
      <button class="btn btn-primary" (click)="siguiente()">Continuar →</button>
    </div>
  `,
  styles: [FORM_STYLES + `
    .total-row { display: flex; justify-content: space-between; padding: 8px 0 0; border-top: 0.5px solid var(--color-border-tertiary); margin-top: 12px; font-size: 13px; }
    .text-success { color: var(--color-text-success); } .text-danger { color: var(--color-text-danger); }
    .balance-card { border-radius: var(--border-radius-md); padding: 14px 16px; border: 0.5px solid var(--color-border-tertiary); }
    .balance-card.positive { background: var(--color-background-success); border-color: var(--color-border-success); }
    .balance-card.negative { background: var(--color-background-danger); border-color: var(--color-border-danger); }
    .balance-label { font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px; }
    .balance-value { font-size: 24px; font-weight: 500; margin-bottom: 10px; }
    .balance-bar-wrap { height: 4px; background: var(--color-border-tertiary); border-radius: 2px; overflow: hidden; margin-bottom: 8px; }
    .balance-bar { height: 100%; background: #639922; border-radius: 2px; transition: width 0.6s ease; }
    .balance-card.negative .balance-bar { background: #E24B4A; }
    .balance-note { font-size: 12px; color: var(--color-text-secondary); }
  `]
})
export class Paso4PatrimonioComponent implements OnInit {
  p!: DatosPatrimonio;

  get totalActivos() { return (this.p.ahorro||0)+(this.p.inversiones||0)+(this.p.inmuebles||0)+(this.p.vehiculos||0)+(this.p.planPension||0)+(this.p.otrosActivos||0); }
  get totalPasivos() { return (this.p.dPersonal||0)+(this.p.dTarjetas||0)+(this.p.dHipoteca||0)+(this.p.dOtros||0); }
  get patrimonioNeto() { return this.totalActivos - this.totalPasivos; }
  get barWidth() { const m = Math.max(this.totalActivos, this.totalPasivos, 1); return Math.min((Math.abs(this.patrimonioNeto)/m)*100, 100); }

  constructor(private form: FormularioService) {}

  ngOnInit() {
    this.p = { ...this.form.solicitud().patrimonio };
  }

  guardar() { this.form.actualizarPatrimonio(this.p); }
  siguiente() { this.guardar(); this.form.siguiente(); }
  anterior() { this.guardar(); this.form.anterior(); }
}
