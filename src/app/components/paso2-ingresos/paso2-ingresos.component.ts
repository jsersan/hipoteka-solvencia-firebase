import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormularioService } from '../../services/formulario.service';
import { DatosTitular, DatosHistorialCrediticio } from '../../models/solicitud.model';
import { FORM_STYLES } from '../shared-styles';

@Component({
  selector: 'app-paso2-ingresos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="section">
      <div class="section-title">Situación laboral — Titular 1 <span class="badge badge-info">Principal</span></div>
      <div class="form-grid">
        <div class="form-group">
          <label>Tipo de contrato / situación laboral</label>
          <select [(ngModel)]="t1.contrato" (ngModelChange)="guardar()">
            <option value="indefinido">Indefinido — jornada completa</option>
            <option value="indefinido_parcial">Indefinido — jornada parcial</option>
            <option value="temporal">Temporal / por obra</option>
            <option value="funcionario">Funcionario/a de carrera</option>
            <option value="autonomo">Autónomo/a o empresario/a</option>
            <option value="pensionista">Pensionista / jubilado/a</option>
            <option value="desempleado">Desempleado/a con prestación</option>
            <option value="sin_ingresos">Sin ingresos acreditables</option>
          </select>
        </div>
        <div class="form-group">
          <label>Antigüedad en empresa o actividad (años)</label>
          <input type="number" [(ngModel)]="t1.antiguedad" min="0" max="50" (ngModelChange)="guardar()">
          <span class="hint">Mayor antigüedad mejora el scoring</span>
        </div>
        <div class="form-group">
          <label>Sector profesional</label>
          <select [(ngModel)]="t1.sector" (ngModelChange)="guardar()">
            <option value="publico">Sector público / administración</option>
            <option value="financiero">Financiero / banca / seguros</option>
            <option value="tecnologia">Tecnología / telecomunicaciones</option>
            <option value="salud">Salud / farmacéutico</option>
            <option value="educacion">Educación / investigación</option>
            <option value="industria">Industria / manufactura</option>
            <option value="energia">Energía / utilities</option>
            <option value="comercio">Comercio / distribución / retail</option>
            <option value="hosteleria">Hostelería / turismo</option>
            <option value="construccion">Construcción / inmobiliario</option>
            <option value="transporte">Transporte / logística</option>
            <option value="otro">Otro sector</option>
          </select>
        </div>
        <div class="form-group">
          <label>Ingresos netos mensuales (€) — 12 pagas</label>
          <input type="number" [(ngModel)]="t1.ingresosMensuales" min="0" (ngModelChange)="guardar()">
        </div>
        <div class="form-group">
          <label>Número de pagas al año</label>
          <select [(ngModel)]="t1.pagasAnio" (ngModelChange)="guardar()">
            <option [ngValue]="12">12 pagas (sin extras)</option>
            <option [ngValue]="14">14 pagas (+ verano y Navidad)</option>
            <option [ngValue]="15">15 pagas</option>
            <option [ngValue]="16">16 pagas</option>
          </select>
          <span class="hint">Ingreso mensual normalizado: {{ ingresoNorm1 | currency:'EUR':'symbol':'1.0-0':'es' }}/mes</span>
        </div>
        <div class="form-group">
          <label>Otros ingresos regulares netos (€/mes)</label>
          <input type="number" [(ngModel)]="t1.otrosIngresos" min="0" (ngModelChange)="guardar()">
        </div>
      </div>
    </div>

    @if (dosTitulares) {
      <div class="section">
        <div class="section-title">Situación laboral — Titular 2 <span class="badge badge-info">Cotitular</span></div>
        <div class="form-grid">
          <div class="form-group">
            <label>Tipo de contrato / situación laboral</label>
            <select [(ngModel)]="t2.contrato" (ngModelChange)="guardar()">
              <option value="indefinido">Indefinido — jornada completa</option>
              <option value="indefinido_parcial">Indefinido — jornada parcial</option>
              <option value="temporal">Temporal / por obra</option>
              <option value="funcionario">Funcionario/a de carrera</option>
              <option value="autonomo">Autónomo/a o empresario/a</option>
              <option value="pensionista">Pensionista / jubilado/a</option>
              <option value="desempleado">Desempleado/a con prestación</option>
              <option value="sin_ingresos">Sin ingresos acreditables</option>
            </select>
          </div>
          <div class="form-group">
            <label>Antigüedad (años)</label>
            <input type="number" [(ngModel)]="t2.antiguedad" min="0" max="50" (ngModelChange)="guardar()">
          </div>
          <div class="form-group">
            <label>Sector profesional</label>
            <select [(ngModel)]="t2.sector" (ngModelChange)="guardar()">
              <option value="publico">Sector público</option>
              <option value="financiero">Financiero / banca</option>
              <option value="tecnologia">Tecnología</option>
              <option value="salud">Salud</option>
              <option value="educacion">Educación</option>
              <option value="industria">Industria</option>
              <option value="comercio">Comercio</option>
              <option value="hosteleria">Hostelería</option>
              <option value="construccion">Construcción</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="form-group">
            <label>Ingresos netos mensuales (€)</label>
            <input type="number" [(ngModel)]="t2.ingresosMensuales" min="0" (ngModelChange)="guardar()">
          </div>
          <div class="form-group">
            <label>Número de pagas al año</label>
            <select [(ngModel)]="t2.pagasAnio" (ngModelChange)="guardar()">
              <option [ngValue]="12">12 pagas</option>
              <option [ngValue]="14">14 pagas</option>
              <option [ngValue]="15">15 pagas</option>
              <option [ngValue]="16">16 pagas</option>
            </select>
            <span class="hint">Normalizado: {{ ingresoNorm2 | currency:'EUR':'symbol':'1.0-0':'es' }}/mes</span>
          </div>
          <div class="form-group">
            <label>Otros ingresos regulares netos (€/mes)</label>
            <input type="number" [(ngModel)]="t2.otrosIngresos" min="0" (ngModelChange)="guardar()">
          </div>
        </div>
      </div>
    } @else {
      <div class="info-box">
        Para activar el segundo titular regresa al paso 1 y selecciona «2 titulares».
      </div>
    }

    <div class="section">
      <div class="section-title">Historial crediticio</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Situación en CIRBE</label>
          <select [(ngModel)]="historial.cirbe" (ngModelChange)="guardar()">
            <option value="no">No figura / riesgo mínimo</option>
            <option value="si_bajo">Figura con riesgo bajo</option>
            <option value="si_medio">Figura con riesgo medio</option>
            <option value="si_alto">Figura con riesgo elevado</option>
          </select>
        </div>
        <div class="form-group">
          <label>Ficheros de morosos (ASNEF, RAI...)</label>
          <select [(ngModel)]="historial.morosos" (ngModelChange)="guardar()">
            <option value="no">No figura en ningún fichero</option>
            <option value="si_saldado">Figura con deuda saldada</option>
            <option value="si_pendiente">Figura con deuda pendiente</option>
          </select>
        </div>
        <div class="form-group">
          <label>Impagos o incidencias en los últimos 24 meses</label>
          <select [(ngModel)]="historial.impagos" (ngModelChange)="guardar()">
            <option value="no">Sin incidencias</option>
            <option value="1">1 impago leve</option>
            <option value="varios">Varios impagos o retrasos</option>
            <option value="grave">Impago grave / concurso</option>
          </select>
        </div>
        <div class="form-group">
          <label>Antigüedad relación bancaria (años)</label>
          <input type="number" [(ngModel)]="historial.relacionBancaria" min="0" max="50" (ngModelChange)="guardar()">
          <span class="hint">La fidelidad bancaria aporta hasta +30 pts</span>
        </div>
      </div>
    </div>

    <div class="summary-card">
      <div class="summary-row">
        <span>Ingresos totales normalizados</span>
        <strong>{{ ingresoTotal | currency:'EUR':'symbol':'1.0-0':'es' }}/mes</strong>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn" (click)="anterior()">← Atrás</button>
      <button class="btn btn-primary" (click)="siguiente()">Continuar →</button>
    </div>
  `,
  styles: [FORM_STYLES + `
    .summary-card { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 12px 16px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
  `]
})
export class Paso2IngresosComponent implements OnInit {
  t1!: DatosTitular;
  t2!: DatosTitular;
  historial!: DatosHistorialCrediticio;

  get dosTitulares() { return this.form.solicitud().solicitante.titulares === 2; }
  get ingresoNorm1() { return this.t1.ingresosMensuales + (this.t1.ingresosMensuales * (this.t1.pagasAnio - 12) / 12) + this.t1.otrosIngresos; }
  get ingresoNorm2() { return this.t2.ingresosMensuales + (this.t2.ingresosMensuales * (this.t2.pagasAnio - 12) / 12) + this.t2.otrosIngresos; }
  get ingresoTotal() { return this.ingresoNorm1 + (this.dosTitulares ? this.ingresoNorm2 : 0); }

  constructor(private form: FormularioService) {}

  ngOnInit() {
    const s = this.form.solicitud();
    this.t1 = { ...s.titular1 };
    this.t2 = { ...s.titular2 };
    this.historial = { ...s.historial };
  }

  guardar() {
    this.form.actualizarTitular1(this.t1);
    this.form.actualizarTitular2(this.t2);
    this.form.actualizarHistorial(this.historial);
  }

  siguiente() { this.guardar(); this.form.siguiente(); }
  anterior() { this.guardar(); this.form.anterior(); }
}
