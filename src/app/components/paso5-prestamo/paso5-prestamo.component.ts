import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormularioService } from '../../services/formulario.service';
import { SolvenciaService } from '../../services/solvencia.service';
import { DatosPrestamo } from '../../models/solicitud.model';
import { FORM_STYLES } from '../shared-styles';

@Component({
  selector: 'app-paso5-prestamo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="section">
      <div class="section-title">Características del inmueble</div>
      <div class="form-grid">
        <div class="form-group"><label>Precio de compraventa (€)</label><input type="number" [(ngModel)]="p.precioCompra" min="0" (ngModelChange)="guardar()"></div>
        <div class="form-group"><label>Valor de tasación oficial (€)</label><input type="number" [(ngModel)]="p.valorTasacion" min="0" (ngModelChange)="guardar()"><span class="hint">El banco calcula el LTV sobre el menor de los dos valores</span></div>
        <div class="form-group">
          <label>Tipo de adquisición</label>
          <select [(ngModel)]="p.tipologia" (ngModelChange)="guardar()">
            <option value="primera">Primera residencia (habitual)</option>
            <option value="segunda">Segunda residencia</option>
            <option value="inversion">Inversión / destino alquiler</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tipología del inmueble</label>
          <select [(ngModel)]="p.tipoInmueble" (ngModelChange)="guardar()">
            <option value="piso">Piso o apartamento</option>
            <option value="casa">Casa / chalet</option>
            <option value="obra_nueva">Obra nueva</option>
            <option value="vpo">VPO</option>
          </select>
        </div>
        <div class="form-group">
          <label>Certificado de eficiencia energética</label>
          <select [(ngModel)]="p.certificadoEnergetico" (ngModelChange)="guardar()">
            <option value="A">A — Máxima eficiencia (+20 pts)</option>
            <option value="B">B — Alta eficiencia</option>
            <option value="C">C — Buena eficiencia</option>
            <option value="D">D — Eficiencia media</option>
            <option value="E">E — Baja eficiencia</option>
            <option value="F">F / G — Muy baja eficiencia (−15 pts)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Provincia del inmueble</label>
          <select [(ngModel)]="p.provincia" (ngModelChange)="guardar()">
            <option value="mad">Madrid</option>
            <option value="bar">Barcelona</option>
            <option value="val">Valencia</option>
            <option value="sev">Sevilla</option>
            <option value="bil">Bilbao</option>
            <option value="ss">San Sebastián / Donostia</option>
            <option value="zar">Zaragoza</option>
            <option value="mal">Málaga</option>
            <option value="alc">Alicante</option>
            <option value="otro">Otra provincia</option>
          </select>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Condiciones del préstamo solicitado</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Importe a financiar (€)</label>
          <input type="number" [(ngModel)]="p.importeFinanciar" min="0" (ngModelChange)="guardar()">
          @if (ltvActual > 0) {
            <span class="hint" [class.hint-warn]="ltvActual > 80" [class.hint-ok]="ltvActual <= 80">
              LTV: {{ ltvActual.toFixed(1) }}% {{ ltvActual > 80 ? '— supera el 80%' : '— dentro del límite' }}
            </span>
          }
        </div>
        <div class="form-group">
          <label>Plazo de amortización (años)</label>
          <input type="number" [(ngModel)]="p.plazoAnios" min="5" max="40" (ngModelChange)="guardar()">
          <span class="hint">Máximo habitual: 30 años</span>
        </div>
        <div class="form-group">
          <label>Tipo de interés</label>
          <select [(ngModel)]="p.tipoInteres" (ngModelChange)="guardar()">
            <option value="fijo">Fijo — cuota constante toda la vida</option>
            <option value="variable">Variable — Euríbor + diferencial</option>
            <option value="mixto">Mixto — fijo inicial + variable</option>
          </select>
        </div>
        @if (p.tipoInteres === 'variable' || p.tipoInteres === 'mixto') {
          <div class="form-group">
            <label>Diferencial sobre Euríbor (%)</label>
            <input type="number" [(ngModel)]="p.diferencial" min="0" step="0.05" (ngModelChange)="guardar()">
            <span class="hint">Euríbor actual (referencia): 2.45%</span>
          </div>
        }
        <div class="form-group">
          <label>TAE / Tipo aplicable para cálculo (%)</label>
          <input type="number" [(ngModel)]="p.tae" min="0" step="0.1" (ngModelChange)="guardar()">
        </div>
        <div class="form-group">
          <label>Período de carencia (meses)</label>
          <input type="number" [(ngModel)]="p.carenciaMeses" min="0" max="24" (ngModelChange)="guardar()">
        </div>
      </div>

      <div class="loan-sim">
        <div class="sim-row"><span>Cuota mensual estimada</span><strong>{{ cuotaEstimada | currency:'EUR':'symbol':'1.2-2':'es' }}/mes</strong></div>
        <div class="sim-row"><span>LTV sobre tasación</span><span [class.text-warn]="ltvActual > 80" [class.text-ok]="ltvActual <= 80 && ltvActual > 0">{{ ltvActual > 0 ? ltvActual.toFixed(1)+'%' : '—' }}</span></div>
        <div class="sim-row"><span>Total intereses estimados</span><span class="text-secondary">{{ totalIntereses | currency:'EUR':'symbol':'1.0-0':'es' }}</span></div>
        @if (ratioEsfuerzo > 0) {
          <div class="sim-row">
            <span>Ratio de esfuerzo provisional</span>
            <span [class.text-ok]="ratioEsfuerzo<=35" [class.text-warn]="ratioEsfuerzo>35&&ratioEsfuerzo<=40" [class.text-danger]="ratioEsfuerzo>40">
              {{ ratioEsfuerzo.toFixed(1) }}% {{ ratioEsfuerzo<=35?'✓ Correcto':ratioEsfuerzo<=40?'⚠ Límite':'✕ Excesivo' }}
            </span>
          </div>
        }
      </div>
    </div>

    <div class="section">
      <div class="section-title">Productos vinculados</div>
      <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:10px">La vinculación puede bonificar el tipo de interés y el scoring (+15 pts/producto)</p>
      <div class="tag-row">
        @for (prod of productos; track prod.val) {
          <div class="tag" [class.selected]="esSeleccionado(prod.val)" (click)="toggleProducto(prod.val)">{{ prod.label }}</div>
        }
      </div>
      @if (p.productosVinculados.length > 0) {
        <div class="info-box" style="margin-top:10px">{{ p.productosVinculados.length }} producto(s) vinculado(s) — bonificación de +{{ p.productosVinculados.length * 15 }} puntos</div>
      }
    </div>

    <div class="btn-row">
      <button class="btn" (click)="anterior()">← Atrás</button>
      <button class="btn btn-primary" (click)="calcular()">Calcular solvencia →</button>
    </div>
  `,
  styles: [FORM_STYLES + `
    .loan-sim { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 12px 14px; margin-top: 12px; }
    .sim-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 0.5px solid var(--color-border-tertiary); }
    .sim-row:last-child { border-bottom: none; }
    .text-ok { color: var(--color-text-success); } .text-warn { color: var(--color-text-warning); } .text-danger { color: var(--color-text-danger); } .text-secondary { color: var(--color-text-secondary); }
    .hint-warn { color: var(--color-text-warning) !important; } .hint-ok { color: var(--color-text-success) !important; }
  `]
})
export class Paso5PrestamoComponent implements OnInit {
  p!: DatosPrestamo;

  productos = [
    { val: 'nomina', label: 'Domiciliar nómina' }, { val: 'segurovida', label: 'Seguro de vida' },
    { val: 'segurohogar', label: 'Seguro de hogar' }, { val: 'plan_pension', label: 'Plan de pensiones' },
    { val: 'tarjeta', label: 'Tarjeta de crédito' }, { val: 'fondos', label: 'Fondos de inversión' },
    { val: 'alarma', label: 'Alarma del hogar' },
  ];

  get cuotaEstimada() { return this.solvencia.calcularCuota(this.p.importeFinanciar, this.p.plazoAnios, this.p.tae); }
  get totalIntereses() { return this.solvencia.calcularTotalIntereses(this.p.importeFinanciar, this.p.plazoAnios, this.p.tae); }
  get ltvActual() { const t = this.p.valorTasacion || this.p.precioCompra; return t > 0 ? (this.p.importeFinanciar/t)*100 : 0; }
  get ratioEsfuerzo() {
    const s = this.form.solicitud();
    const norm = (t: any) => t.ingresosMensuales + (t.ingresosMensuales*(t.pagasAnio-12)/12) + t.otrosIngresos;
    const ing = norm(s.titular1) + (s.solicitante.titulares === 2 ? norm(s.titular2) : 0);
    const gf = s.gastos.gPersonal + s.gastos.gTarjetas + s.gastos.gLeasing + s.gastos.gPension;
    return ing > 0 ? ((gf + this.cuotaEstimada)/ing)*100 : 0;
  }

  esSeleccionado(val: string) { return this.p.productosVinculados.includes(val); }
  toggleProducto(val: string) {
    const idx = this.p.productosVinculados.indexOf(val);
    if (idx > -1) this.p.productosVinculados.splice(idx, 1);
    else this.p.productosVinculados.push(val);
    this.guardar();
  }

  constructor(private form: FormularioService, private solvencia: SolvenciaService) {}

  ngOnInit() {
    const s = this.form.solicitud().prestamo;
    this.p = { ...s, productosVinculados: [...(s.productosVinculados || [])] };
  }

  guardar() { this.form.actualizarPrestamo({ ...this.p }); }
  calcular() { this.guardar(); this.form.siguiente(); }
  anterior() { this.guardar(); this.form.anterior(); }
}
