import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormularioService } from '../../services/formulario.service';
import { SolvenciaService } from '../../services/solvencia.service';
import { ResultadoSolvencia } from '../../models/solicitud.model';

@Component({
  selector: 'app-paso6-resultado',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- VEREDICTO + GAUGE -->
    <div class="verdict-box" [class]="'verdict-' + r.condicion">
      <div class="verdict-inner">
        <div class="score-gauge">
            <svg viewBox="0 0 200 130" width="200" height="130">
              <!-- Track: semicírculo de fondo -->
              <path d="M 20 110 A 80 80 0 0 1 180 110"
                stroke="rgba(0,0,0,0.10)" stroke-width="12" fill="none" stroke-linecap="round"/>
              <!-- Fill: stroke-dasharray garantiza corrección para cualquier score 0-1000 -->
              <path d="M 20 110 A 80 80 0 0 1 180 110"
                [attr.stroke]="scoreColor"
                stroke-width="12" fill="none" stroke-linecap="round"
                [attr.stroke-dasharray]="gaugeDash"/>
              <text x="100" y="92" text-anchor="middle" font-size="38"
                font-weight="600" [attr.fill]="scoreColor">{{ r.score }}</text>
              <text x="100" y="112" text-anchor="middle" font-size="14"
                fill="rgba(0,0,0,0.40)">/1000</text>
              <text x="20" y="128" text-anchor="middle" font-size="11"
                fill="rgba(0,0,0,0.30)">0</text>
              <text x="180" y="128" text-anchor="middle" font-size="11"
                fill="rgba(0,0,0,0.30)">1000</text>
            </svg>
        </div>
        <div class="verdict-text">
          <div class="verdict-rating-badge" [style.background]="ratingBg" [style.color]="scoreColor">
            Rating {{ r.rating }}
          </div>
          <div class="verdict-title">{{ r.veredicto }}</div>
          @if (nombreSolicitante) {
            <div class="verdict-name">{{ nombreSolicitante }}</div>
          }
        </div>
      </div>
    </div>

    <!-- MÉTRICAS -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Ingresos netos/mes</div>
        <div class="metric-value">{{ r.ingresosTotalesMes | currency:'EUR':'symbol':'1.0-0':'es' }}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Cuota hipotecaria</div>
        <div class="metric-value">{{ r.cuotaMensual | currency:'EUR':'symbol':'1.0-0':'es' }}/mes</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Ratio de esfuerzo</div>
        <div class="metric-value" [class]="'color-' + estadoEsfuerzo">{{ r.ratioEsfuerzo.toFixed(1) }}%</div>
        <div class="metric-sub">Rec. ≤35%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">LTV</div>
        <div class="metric-value" [class]="'color-' + estadoLTV">{{ r.ltv.toFixed(1) }}%</div>
        <div class="metric-sub">Máx. habitual 80%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Renta libre residual</div>
        <div class="metric-value"
          [class.color-success]="r.rentaLibreResidual >= 400"
          [class.color-warning]="r.rentaLibreResidual > 0 && r.rentaLibreResidual < 400"
          [class.color-danger]="r.rentaLibreResidual <= 0">
          {{ r.rentaLibreResidual | currency:'EUR':'symbol':'1.0-0':'es' }}/mes
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Patrimonio neto</div>
        <div class="metric-value"
          [class.color-success]="r.patrimonioNeto > 0"
          [class.color-danger]="r.patrimonioNeto < 0">
          {{ r.patrimonioNeto | currency:'EUR':'symbol':'1.0-0':'es' }}
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Entrada aportada</div>
        <div class="metric-value" [class.color-warning]="r.pctEntrada < 20">{{ r.pctEntrada.toFixed(1) }}%</div>
        <div class="metric-sub">Rec. ≥20%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Edad fin hipoteca</div>
        <div class="metric-value" [class.color-warning]="r.edadFinHipoteca > 75">{{ r.edadFinHipoteca }} años</div>
      </div>
    </div>

    <!-- FACTORES -->
    <div class="section">
      <div class="section-title">Factores de evaluación del scoring</div>
      @for (f of r.factores; track f.label) {
        <div class="factor-row">
          <div class="factor-info">
            <div class="factor-label">{{ f.label }}</div>
            <div class="factor-desc">{{ f.descripcion }}</div>
          </div>
          <div class="factor-right">
            <div class="factor-bar-wrap">
              <div class="factor-bar" [style.width.%]="factorBarWidth(f.puntos)" [class]="'bar-' + f.estado"></div>
            </div>
            <span class="factor-val" [class]="'color-' + f.estado">{{ f.valor }}</span>
            <span class="factor-pts" [class]="f.puntos >= 0 ? 'pts-pos' : 'pts-neg'">
              {{ f.puntos >= 0 ? '+' : '' }}{{ f.puntos }}
            </span>
          </div>
        </div>
      }
    </div>

    <!-- CAUSAS DE DENEGACIÓN (solo si denegado o con muchas causas) -->
    @if (r.analisisRiesgo.causasDenegacion.length > 0) {
      <div class="section">
        <div class="section-title risk-title">
          <span class="risk-icon danger">!</span>
          Causas de denegación o alerta
        </div>
        @for (causa of r.analisisRiesgo.causasDenegacion; track causa.causa) {
          <div class="causa-item" [class]="'causa-' + causa.gravedad">
            <div class="causa-header">
              <span class="causa-badge" [class]="'badge-' + causa.gravedad">
                {{ causa.gravedad === 'bloqueante' ? 'Bloqueante' : causa.gravedad === 'importante' ? 'Importante' : 'Moderada' }}
              </span>
              <span class="causa-titulo">{{ causa.causa }}</span>
            </div>
            <div class="causa-detalle">{{ causa.detalle }}</div>
          </div>
        }
      </div>
    }

    <!-- CONSECUENCIAS DE CONCESIÓN INDEBIDA -->
    @if (r.condicion !== 'approved' && r.analisisRiesgo.consecuenciasConcesion.length > 0) {
      <div class="section">
        <div class="section-title risk-title">
          <span class="risk-icon warning">⚠</span>
          Consecuencias de conceder este crédito
        </div>
        <p class="section-intro">Si una entidad financiera concediese este crédito en las condiciones actuales, las consecuencias previsibles para el prestatario serían:</p>
        @for (c of r.analisisRiesgo.consecuenciasConcesion; track c.titulo) {
          <div class="consec-item">
            <div class="consec-tipo" [class]="'tipo-' + c.tipo">
              {{ c.tipo === 'financiero' ? 'Financiero' : c.tipo === 'legal' ? 'Legal' : 'Social' }}
            </div>
            <div class="consec-body">
              <div class="consec-titulo">{{ c.titulo }}</div>
              <div class="consec-desc">{{ c.descripcion }}</div>
            </div>
          </div>
        }
      </div>
    }

    <!-- ESCENARIOS MACROECONÓMICOS -->
    <div class="section">
      <div class="section-title risk-title">
        <span class="risk-icon info">↗</span>
        Análisis de escenarios macroeconómicos
      </div>
      <p class="section-intro">Impacto de cambios en el entorno económico sobre la viabilidad del préstamo:</p>
      <div class="escenarios-grid">
        @for (esc of r.analisisRiesgo.escenariosMacro; track esc.titulo) {
          <div class="escenario-card" [class]="'impacto-' + esc.impacto">
            <div class="esc-header">
              <div class="esc-badges">
                <span class="esc-badge prob" [class]="'prob-' + esc.probabilidad">
                  Probabilidad {{ esc.probabilidad }}
                </span>
                <span class="esc-badge imp" [class]="'imp-' + esc.impacto">
                  Impacto {{ esc.impacto }}
                </span>
              </div>
              <div class="esc-titulo">{{ esc.titulo }}</div>
            </div>
            <div class="esc-desc">{{ esc.descripcion }}</div>
            <div class="esc-consecuencia">
              <span class="esc-cons-label">Consecuencia:</span> {{ esc.consecuencia }}
            </div>
            @if (esc.cuotaNueva && esc.esfuerzoNuevo) {
              <div class="esc-metrics">
                <span class="esc-metric">
                  Cuota: <strong>{{ esc.cuotaNueva | currency:'EUR':'symbol':'1.0-0':'es' }}/mes</strong>
                </span>
                <span class="esc-metric" [class.text-danger]="esc.esfuerzoNuevo > 40">
                  Esfuerzo: <strong>{{ esc.esfuerzoNuevo.toFixed(1) }}%</strong>
                </span>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- ESCENARIOS PERSONALES -->
    <div class="section">
      <div class="section-title risk-title">
        <span class="risk-icon warning">👤</span>
        Análisis de escenarios personales del solicitante
      </div>
      <p class="section-intro">Situaciones que pueden afectar directamente a la capacidad de pago:</p>
      <div class="escenarios-grid">
        @for (esc of r.analisisRiesgo.escenariosPersonales; track esc.titulo) {
          <div class="escenario-card" [class]="'impacto-' + esc.impacto">
            <div class="esc-header">
              <div class="esc-badges">
                <span class="esc-badge prob" [class]="'prob-' + esc.probabilidad">
                  Probabilidad {{ esc.probabilidad }}
                </span>
                <span class="esc-badge imp" [class]="'imp-' + esc.impacto">
                  Impacto {{ esc.impacto }}
                </span>
              </div>
              <div class="esc-titulo">{{ esc.titulo }}</div>
            </div>
            <div class="esc-desc">{{ esc.descripcion }}</div>
            <div class="esc-consecuencia">
              <span class="esc-cons-label">Consecuencia:</span> {{ esc.consecuencia }}
            </div>
            @if (esc.cuotaNueva && esc.esfuerzoNuevo) {
              <div class="esc-metrics">
                <span class="esc-metric">
                  Cuota: <strong>{{ esc.cuotaNueva | currency:'EUR':'symbol':'1.0-0':'es' }}/mes</strong>
                </span>
                <span class="esc-metric" [class.text-danger]="esc.esfuerzoNuevo > 40">
                  Esfuerzo: <strong>{{ esc.esfuerzoNuevo.toFixed(1) }}%</strong>
                </span>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- PLAN DE MEJORA -->
    @if (r.analisisRiesgo.puntosAMejorar.length > 0) {
      <div class="section">
        <div class="section-title risk-title">
          <span class="risk-icon success">✓</span>
          Acciones para mejorar el perfil crediticio
        </div>
        @for (m of r.analisisRiesgo.puntosAMejorar; track m.accion) {
          <div class="mejora-item">
            <div class="mejora-dif" [class]="'dif-' + m.dificultad">
              {{ m.dificultad === 'facil' ? 'Fácil' : m.dificultad === 'media' ? 'Moderado' : 'Difícil' }}
            </div>
            <div class="mejora-body">
              <div class="mejora-accion">{{ m.accion }}</div>
              <div class="mejora-impacto">{{ m.impactoEsperado }}</div>
            </div>
          </div>
        }
      </div>
    }

    <!-- CONDICIONES ORIENTATIVAS -->
    @if (r.condicionesOrientativas.length > 0) {
      <div class="section">
        <div class="section-title">Condiciones orientativas del préstamo</div>
        <table class="cond-table">
          <thead><tr><th>Concepto</th><th>Orientación</th></tr></thead>
          <tbody>
            @for (c of r.condicionesOrientativas; track c.concepto) {
              <tr>
                <td class="text-secondary">{{ c.concepto }}</td>
                <td class="text-bold">{{ c.valor }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- RECOMENDACIONES -->
    @if (r.recomendaciones.length > 0) {
      <div class="section">
        <div class="section-title">Observaciones</div>
        @for (rec of r.recomendaciones; track rec.mensaje) {
          <div class="alert" [class]="'alert-' + rec.tipo">{{ rec.mensaje }}</div>
        }
      </div>
    }

    <div class="legal-note">
      Este análisis es meramente orientativo y no constituye oferta ni compromiso de financiación. El estudio definitivo queda sujeto a la política de riesgos de la entidad financiera, verificación documental y tasación oficial del inmueble, conforme a la Ley 5/2019 reguladora de los contratos de crédito inmobiliario y las Directrices EBA/GL/2020/06 sobre originación y seguimiento de préstamos.
    </div>

    <div class="btn-row">
      <button class="btn" (click)="volver()">← Modificar datos</button>
      <button class="btn" (click)="resetear()">Nueva solicitud</button>
    </div>
  `,
  styles: [`
    /* BASE */
    .section { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 1.25rem; margin-bottom: 1rem; }
    .section-title { font-size: 15px; font-weight: 500; margin-bottom: 1rem; padding-bottom: 8px; border-bottom: 0.5px solid var(--color-border-tertiary); display: flex; align-items: center; gap: 8px; }
    .section-intro { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 14px; line-height: 1.6; }
    .risk-title { gap: 8px; }
    .risk-icon { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .risk-icon.danger { background: var(--color-background-danger); color: var(--color-text-danger); }
    .risk-icon.warning { background: var(--color-background-warning); color: var(--color-text-warning); }
    .risk-icon.info { background: var(--color-background-info); color: var(--color-text-info); }
    .risk-icon.success { background: var(--color-background-success); color: var(--color-text-success); }
    /* VEREDICTO */
    .verdict-box { border-radius: var(--border-radius-lg); padding: 1.5rem; margin-bottom: 1rem; border: 1px solid; }
    .verdict-approved  { background: #EAF3DE; border-color: #639922; }
    .verdict-conditional { background: #FAEEDA; border-color: #BA7517; }
    .verdict-denied    { background: #FCEBEB; border-color: #E24B4A; }
    .verdict-inner { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
    .score-gauge { flex-shrink: 0; }
    .verdict-text { flex: 1; }
    .verdict-rating-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-bottom: 8px; }
    .verdict-title { font-size: 26px; font-weight: 500; margin-bottom: 4px; line-height: 1.2; }
    .verdict-name { font-size: 14px; opacity: 0.65; margin-top: 4px; }
    /* MÉTRICAS */
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 1rem; }
    .metric-card { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 12px 14px; }
    .metric-label { font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px; }
    .metric-value { font-size: 18px; font-weight: 500; }
    .metric-sub { font-size: 11px; color: var(--color-text-tertiary); margin-top: 2px; }
    .color-success { color: var(--color-text-success); }
    .color-warning { color: var(--color-text-warning); }
    .color-danger  { color: var(--color-text-danger); }
    .color-info    { color: var(--color-text-info); }
    /* FACTORES */
    .factor-row { display: flex; align-items: center; gap: 14px; padding: 10px 0; border-bottom: 0.5px solid var(--color-border-tertiary); }
    .factor-row:last-child { border-bottom: none; }
    .factor-info { flex: 0 0 200px; }
    .factor-label { font-size: 13px; font-weight: 500; }
    .factor-desc  { font-size: 11px; color: var(--color-text-tertiary); margin-top: 2px; }
    .factor-right { flex: 1; display: flex; align-items: center; gap: 10px; }
    .factor-bar-wrap { flex: 1; height: 6px; background: var(--color-background-secondary); border-radius: 3px; overflow: hidden; }
    .factor-bar { height: 100%; border-radius: 3px; transition: width 0.8s ease; }
    .bar-success { background: #639922; } .bar-warning { background: #BA7517; } .bar-danger { background: #E24B4A; } .bar-info { background: #378ADD; }
    .factor-val  { font-size: 12px; font-weight: 500; min-width: 70px; text-align: right; }
    .factor-pts  { font-size: 12px; min-width: 38px; text-align: right; font-variant-numeric: tabular-nums; }
    .pts-pos { color: var(--color-text-success); } .pts-neg { color: var(--color-text-danger); }
    /* CAUSAS */
    .causa-item { border-radius: var(--border-radius-md); padding: 12px 14px; margin-bottom: 10px; border-left: 4px solid; }
    .causa-bloqueante { background: #FCEBEB; border-color: #E24B4A; }
    .causa-importante { background: #FAEEDA; border-color: #BA7517; }
    .causa-moderada   { background: var(--color-background-secondary); border-color: var(--color-border-secondary); }
    .causa-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
    .causa-badge { font-size: 11px; font-weight: 500; padding: 2px 10px; border-radius: 20px; flex-shrink: 0; }
    .badge-bloqueante { background: #E24B4A; color: #fff; }
    .badge-importante { background: #BA7517; color: #fff; }
    .badge-moderada   { background: var(--color-border-secondary); color: var(--color-text-secondary); }
    .causa-titulo { font-size: 13px; font-weight: 500; }
    .causa-detalle { font-size: 12px; line-height: 1.65; color: var(--color-text-secondary); }
    /* CONSECUENCIAS */
    .consec-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 0.5px solid var(--color-border-tertiary); }
    .consec-item:last-child { border-bottom: none; }
    .consec-tipo { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; height: fit-content; flex-shrink: 0; white-space: nowrap; }
    .tipo-financiero { background: var(--color-background-danger); color: var(--color-text-danger); }
    .tipo-legal { background: var(--color-background-warning); color: var(--color-text-warning); }
    .tipo-social { background: var(--color-background-info); color: var(--color-text-info); }
    .consec-titulo { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
    .consec-desc { font-size: 12px; color: var(--color-text-secondary); line-height: 1.65; }
    /* ESCENARIOS */
    .escenarios-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .escenario-card { border-radius: var(--border-radius-md); padding: 14px; border: 0.5px solid var(--color-border-tertiary); background: var(--color-background-primary); }
    .impacto-critico { border-left: 3px solid #E24B4A; background: #FCEBEB; }
    .impacto-alto    { border-left: 3px solid #BA7517; background: #FAEEDA; }
    .impacto-medio   { border-left: 3px solid #185FA5; background: var(--color-background-info); }
    .impacto-bajo    { border-left: 3px solid #639922; background: var(--color-background-success); }
    .esc-header { margin-bottom: 8px; }
    .esc-badges { display: flex; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
    .esc-badge { font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
    .prob-alta   { background: rgba(226,75,74,0.2); color: #791F1F; }
    .prob-media  { background: rgba(186,117,23,0.2); color: #633806; }
    .prob-baja   { background: rgba(55,138,221,0.2); color: #0C447C; }
    .imp-critico { background: #E24B4A; color: #fff; }
    .imp-alto    { background: #BA7517; color: #fff; }
    .imp-medio   { background: #185FA5; color: #fff; }
    .imp-bajo    { background: #639922; color: #fff; }
    .esc-titulo { font-size: 13px; font-weight: 500; }
    .esc-desc { font-size: 12px; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 8px; }
    .esc-consecuencia { font-size: 12px; line-height: 1.6; margin-bottom: 6px; }
    .esc-cons-label { font-weight: 500; }
    .esc-metrics { display: flex; gap: 14px; margin-top: 8px; padding-top: 8px; border-top: 0.5px solid var(--color-border-tertiary); }
    .esc-metric { font-size: 12px; color: var(--color-text-secondary); }
    .text-danger { color: var(--color-text-danger); }
    /* MEJORAS */
    .mejora-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 0.5px solid var(--color-border-tertiary); align-items: flex-start; }
    .mejora-item:last-child { border-bottom: none; }
    .mejora-dif { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 500; flex-shrink: 0; height: fit-content; white-space: nowrap; }
    .dif-facil   { background: var(--color-background-success); color: var(--color-text-success); }
    .dif-media   { background: var(--color-background-warning); color: var(--color-text-warning); }
    .dif-dificil { background: var(--color-background-danger); color: var(--color-text-danger); }
    .mejora-accion  { font-size: 13px; font-weight: 500; margin-bottom: 3px; }
    .mejora-impacto { font-size: 12px; color: var(--color-text-secondary); }
    /* TABLA */
    .cond-table { width: 100%; font-size: 13px; border-collapse: collapse; }
    .cond-table th { text-align: left; font-weight: 500; color: var(--color-text-secondary); padding: 7px 8px; border-bottom: 0.5px solid var(--color-border-secondary); }
    .cond-table td { padding: 8px; border-bottom: 0.5px solid var(--color-border-tertiary); }
    .cond-table tr:last-child td { border-bottom: none; }
    .text-secondary { color: var(--color-text-secondary); } .text-bold { font-weight: 500; }
    /* ALERTAS */
    .alert { padding: 10px 14px; border-radius: var(--border-radius-md); font-size: 13px; margin: 6px 0; border: 0.5px solid; line-height: 1.6; }
    .alert-success { background: var(--color-background-success); border-color: var(--color-border-success); color: var(--color-text-success); }
    .alert-warning { background: var(--color-background-warning); border-color: var(--color-border-warning); color: var(--color-text-warning); }
    .alert-danger  { background: var(--color-background-danger);  border-color: var(--color-border-danger);  color: var(--color-text-danger); }
    .alert-info    { background: var(--color-background-info);    border-color: var(--color-border-info);    color: var(--color-text-info); }
    /* LEGAL */
    .legal-note { font-size: 12px; color: var(--color-text-tertiary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); padding: 10px 14px; line-height: 1.6; margin-bottom: 1rem; }
    /* BOTONES */
    .btn-row { display: flex; justify-content: space-between; gap: 8px; }
    .btn { padding: 9px 22px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-secondary); background: var(--color-background-primary); color: var(--color-text-primary); font-size: 14px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .btn:hover { background: var(--color-background-secondary); }
    /* RESPONSIVE */
    @media (max-width: 640px) {
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
      .factor-info { flex: 0 0 130px; }
      .verdict-inner { flex-direction: column; gap: 1rem; }
      .verdict-title { font-size: 20px; }
      .escenarios-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class Paso6ResultadoComponent implements OnInit {
  // computed signal del servicio — siempre refleja los datos actuales del formulario
  get r(): ResultadoSolvencia { return this.form.resultado(); }

  get nombreSolicitante() { return this.form.solicitud().solicitante.nombre; }

  get estadoEsfuerzo() {
    const e = this.r.ratioEsfuerzo;
    return e <= 35 ? 'success' : e <= 40 ? 'warning' : 'danger';
  }

  get estadoLTV() {
    const l = this.r.ltv;
    return l <= 70 ? 'success' : l <= 80 ? 'info' : l <= 90 ? 'warning' : 'danger';
  }

  get scoreColor() {
    const s = this.r.score;
    return s >= 750 ? '#3B6D11' : s >= 600 ? '#854F0B' : s >= 450 ? '#BA7517' : '#A32D2D';
  }

  get ratingBg() {
    const s = this.r.score;
    return s >= 750 ? 'rgba(99,153,34,0.15)' : s >= 600 ? 'rgba(186,117,23,0.15)' : 'rgba(226,75,74,0.15)';
  }

  get gaugeDash(): string {
    // stroke-dasharray="fill total" sobre el semicírculo completo.
    // Circunferencia semicírculo radio 80 = π × 80 = 251.327...
    // Funciona para cualquier score 0-1000 sin cálculos trigonométricos.
    const SEMI = Math.PI * 80; // 251.327
    const fill = Math.max(0, Math.min(1, this.r.score / 1000)) * SEMI;
    return `${fill.toFixed(3)} ${SEMI.toFixed(3)}`;
  }

  factorBarWidth(pts: number): number {
    return Math.max(0, Math.min(100, ((pts + 200) / 420) * 100));
  }

  constructor(private form: FormularioService, private solvencia: SolvenciaService) {}

  ngOnInit() {}
  // El getter r() lee form.resultado() que es un computed signal
  // Se actualiza automáticamente cuando el usuario edita cualquier campo del formulario

  volver() { this.form.irAPaso(1); }
  resetear() { this.form.resetear(); }
}
