import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { FormularioService } from './services/formulario.service';
import { AuthService } from './services/auth.service';
import { SolicitudesService } from './services/solicitudes.service';
import { CsvImportComponent } from './components/csv-import/csv-import.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, CsvImportComponent],
  template: `
    <div class="app-shell">

      <!-- ── CABECERA (siempre visible) ────────────────────────────── -->
      <header class="app-header">
        <div class="header-inner">
          <div class="logo">
            <span class="logo-icon">H</span>
            <div>
              <span class="logo-title">¡Txema Serrano's Hipoteka!</span>
              <span class="logo-sub">Motor de análisis de crédito inmobiliario</span>
            </div>
          </div>

          <div class="header-actions">
            <!-- Acciones CSV (solo si autenticado) -->
            @if (auth.usuario()) {
              <button class="btn-header" (click)="descargarPlantilla()" title="Descargar plantilla CSV vacía">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="12" y1="13" x2="12" y2="19"/><polyline points="9,16 12,19 15,16"/>
                </svg>
                Plantilla
              </button>
              <button class="btn-header" (click)="exportarCSV()" title="Exportar datos a CSV">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Exportar
              </button>
              <button class="btn-import-toggle" [class.active]="showImport" (click)="showImport = !showImport">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9,15 12,12 15,15"/>
                </svg>
                Importar CSV
              </button>
              <button class="btn-header btn-historial" (click)="irAHistorial()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Historial
              </button>

              <!-- Avatar usuario -->
              <div class="user-menu">
                <button class="user-btn" (click)="showUserMenu = !showUserMenu">
                  <div class="user-avatar">{{ iniciales() }}</div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9"/>
                  </svg>
                </button>
              </div>
            }
            <span class="version-badge">v2.3</span>
          </div>
        </div>

        <!-- Panel importar CSV -->
        @if (showImport && auth.usuario()) {
          <div class="import-panel">
            <app-csv-import (importado)="onImportado()" />
          </div>
        }
      </header>

      <!-- Banner CSV cargado -->
      @if (csvCargado() && !showImport && auth.usuario()) {
        <div class="csv-banner">
          <div class="csv-banner-inner">
            <div class="csv-banner-left">
              <div class="csv-icon-wrap">✓</div>
              <div class="csv-banner-text">
                <strong>Datos cargados desde CSV</strong>
                <span>{{ csvCargado()!.nombreArchivo }} — {{ csvCargado()!.camposCargados }} campos importados</span>
              </div>
            </div>
            <div class="csv-banner-actions">
              <button class="csv-btn-edit" (click)="showImport = true">Cambiar archivo</button>
              <button class="csv-btn-dismiss" (click)="descartarCsv()">✕</button>
            </div>
          </div>
        </div>
      }

      <!-- Banner guardado OK -->
      @if (guardadoOk()) {
        <div class="save-banner">✓ Solicitud guardada correctamente en tu historial</div>
      }

      <!-- ── CONTENIDO DE LA RUTA ACTIVA ────────────────────────────── -->
      <main class="app-main">
        <router-outlet />
      </main>

      <footer class="app-footer">
        <span>Uso interno exclusivo — Análisis orientativo, no vinculante</span>
        <span>Ley 5/2019 de contratos de crédito inmobiliario</span>
      </footer>
    </div>

    <!-- Dropdown fuera del header para evitar clipping del stacking context -->
    @if (showUserMenu && auth.usuario()) {
      <div class="user-dropdown-portal">
        <div class="user-info">
          <div class="user-nombre">{{ auth.usuario()!.nombre || auth.usuario()!.email }}</div>
          <div class="user-email">{{ auth.usuario()!.email }}</div>
        </div>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" (click)="irAHistorial(); $event.stopPropagation()">Ver historial</button>
        <button class="dropdown-item danger" (click)="logout(); $event.stopPropagation()">Cerrar sesión</button>
      </div>
    }


  `,
  styles: [`
    .app-shell { min-height: 100vh; display: flex; flex-direction: column; background: var(--color-background-tertiary); }
    .app-header { background: var(--color-background-primary); border-bottom: 0.5px solid var(--color-border-tertiary); padding: 0 1.5rem; position: relative; z-index: 100; }
    .header-inner { max-width: 960px; margin: 0 auto; width: 100%; display: flex; align-items: center; justify-content: space-between; height: 56px; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { width: 32px; height: 32px; background: #185FA5; color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 16px; }
    .logo-title { font-size: 15px; font-weight: 500; display: block; line-height: 1.2; }
    .logo-sub { font-size: 11px; color: var(--color-text-secondary); display: block; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .btn-header { display: flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-secondary); background: var(--color-background-primary); color: var(--color-text-secondary); font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: inherit; white-space: nowrap; }
    .btn-header:hover { background: var(--color-background-secondary); color: var(--color-text-primary); }
    .btn-historial { border-color: #185FA5; color: #185FA5; }
    .btn-historial:hover { background: var(--color-background-info); }
    .btn-import-toggle { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-secondary); background: var(--color-background-primary); color: var(--color-text-primary); font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: inherit; white-space: nowrap; }
    .btn-import-toggle:hover, .btn-import-toggle.active { background: var(--color-background-info); border-color: var(--color-border-info); color: var(--color-text-info); }
    .version-badge { font-size: 11px; padding: 2px 8px; border: 0.5px solid var(--color-border-secondary); border-radius: 20px; color: var(--color-text-secondary); }
    .import-panel { max-width: 960px; margin: 0 auto; width: 100%; padding: 0 0 1rem; }
    /* Usuario */
    .user-btn { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-secondary); background: var(--color-background-primary); cursor: pointer; transition: all 0.2s; }
    .user-btn:hover { background: var(--color-background-secondary); }
    .user-avatar { width: 26px; height: 26px; border-radius: 50%; background: #185FA5; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 500; }
    .user-dropdown-portal {
      position: fixed;
      top: 56px;
      right: 16px;
      width: 220px;
      background: var(--color-background-primary);
      border: 0.5px solid var(--color-border-secondary);
      border-radius: var(--border-radius-lg);
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      z-index: 9999;
      overflow: hidden;
    }
    .user-info { padding: 12px 14px; }
    .user-nombre { font-size: 13px; font-weight: 500; }
    .user-email { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }
    .dropdown-divider { height: 0.5px; background: var(--color-border-tertiary); }
    .dropdown-item { width: 100%; text-align: left; padding: 10px 14px; border: none; background: none; font-size: 13px; cursor: pointer; color: var(--color-text-primary); font-family: inherit; transition: background 0.15s; display: block; }
    .dropdown-item:hover { background: var(--color-background-secondary); }
    .dropdown-item.danger { color: var(--color-text-danger); }
    .dropdown-item.danger:hover { background: var(--color-background-danger); }
    /* CSV banner */
    .csv-banner { background: #EAF3DE; border-bottom: 1px solid #C0DD97; }
    .csv-banner-inner { max-width: 960px; margin: 0 auto; width: 100%; padding: 10px 1rem; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .csv-banner-left { display: flex; align-items: center; gap: 10px; }
    .csv-icon-wrap { width: 28px; height: 28px; border-radius: 50%; background: #639922; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .csv-banner-text strong { display: block; font-size: 13px; color: #27500A; }
    .csv-banner-text span { font-size: 12px; color: #3B6D11; }
    .csv-banner-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .csv-btn-edit { font-size: 12px; padding: 4px 12px; border: 0.5px solid #639922; border-radius: var(--border-radius-md); background: transparent; color: #27500A; cursor: pointer; font-family: inherit; }
    .csv-btn-dismiss { font-size: 13px; width: 26px; height: 26px; border-radius: 50%; border: none; background: rgba(99,153,34,0.2); color: #27500A; cursor: pointer; }
    /* Save banner */
    .save-banner { background: #EAF3DE; border-bottom: 1px solid #C0DD97; padding: 10px 1.5rem; font-size: 13px; color: #27500A; text-align: center; }
    /* Main */
    .app-main { flex: 1; max-width: 960px; margin: 0 auto; width: 100%; padding: 1.5rem 1rem; }
    .app-footer { text-align: center; padding: 1rem; font-size: 12px; color: var(--color-text-tertiary); border-top: 0.5px solid var(--color-border-tertiary); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px; max-width: 960px; margin: 0 auto; width: 100%; }
    @media (max-width: 700px) { .btn-header span, .btn-import-toggle span { display: none; } }
  `]
})
export class AppComponent {
  showImport   = false;
  showUserMenu = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.showUserMenu = false;
    }
  }

  constructor(
    public  auth: AuthService,
    public  sols: SolicitudesService,
    private form: FormularioService,
    private router: Router
  ) {}

  csvCargado  = this.form.csvCargado;
  guardadoOk  = this.form.guardadoOk;

  iniciales(): string {
    const n = this.auth.usuario()?.nombre ?? this.auth.usuario()?.email ?? '?';
    return n.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  }

  onImportado()  { setTimeout(() => { this.showImport = false; }, 0); }
  descartarCsv() { this.form.descartarCsv(); }

  irAHistorial() {
    this.showUserMenu = false;
    this.router.navigate(['/historial']);
  }

  async logout() {
    this.showUserMenu = false;
    await this.auth.logout();
    this.router.navigate(['/login']);
  }

  // ── Descarga plantilla CSV vacía ────────────────────────────────────────

  descargarPlantilla() {
    const campos = [
      'nombre','fecha_nacimiento','estado_civil','regimen_economico','nacionalidad',
      'anios_residencia','titulares','dependientes','bebes','discapacidad','ccaa',
      'municipio','vivienda_actual','t1_contrato','t1_antiguedad','t1_sector',
      't1_ingresos','t1_pagas','t1_otros_ingresos','t2_contrato','t2_antiguedad',
      't2_sector','t2_ingresos','t2_pagas','t2_otros_ingresos','cirbe','morosos',
      'impagos','relacion_bancaria','g_personal','g_tarjetas','g_leasing','g_pension',
      'g_alquiler','g_otros','g_alimentacion','g_suministros','g_transporte','g_educacion',
      'g_seguros','g_ocio','ahorro','inversiones','inmuebles','vehiculos','plan_pension',
      'otros_activos','d_personal','d_tarjetas','d_hipoteca','d_otros','precio_compra',
      'valor_tasacion','tipologia','tipo_inmueble','certificado_energetico','provincia',
      'importe_financiar','plazo_anios','tipo_interes','tae','diferencial',
      'carencia_meses','productos_vinculados'
    ];
    const def: Record<string, string> = {
      nacionalidad:'es',titulares:'1',dependientes:'0',bebes:'0',discapacidad:'no',
      municipio:'media',vivienda_actual:'alquiler',t1_contrato:'indefinido',t1_pagas:'14',
      t1_otros_ingresos:'0',t2_contrato:'sin_ingresos',t2_antiguedad:'0',t2_sector:'otro',
      t2_ingresos:'0',t2_pagas:'14',t2_otros_ingresos:'0',cirbe:'no',morosos:'no',
      impagos:'no',relacion_bancaria:'0',g_personal:'0',g_tarjetas:'0',g_leasing:'0',
      g_pension:'0',g_alquiler:'0',g_otros:'0',g_alimentacion:'600',g_suministros:'200',
      g_transporte:'150',g_educacion:'0',g_seguros:'80',g_ocio:'200',ahorro:'0',
      inversiones:'0',inmuebles:'0',vehiculos:'0',plan_pension:'0',otros_activos:'0',
      d_personal:'0',d_tarjetas:'0',d_hipoteca:'0',d_otros:'0',tipologia:'primera',
      tipo_inmueble:'piso',certificado_energetico:'C',plazo_anios:'25',tipo_interes:'fijo',
      tae:'3.5',diferencial:'0.75',carencia_meses:'0',productos_vinculados:''
    };
    const csv = [['campo','valor'],...campos.map(c=>[c,def[c]??''])].map(f=>f.join(',')).join('\n');
    this.bajar(csv, 'plantilla_solicitud_hipotecaria.csv');
  }

  // ── Exporta los datos actuales del formulario ────────────────────────────

  exportarCSV() {
    const s = this.form.solicitud();
    const { solicitante: sol, titular1: t1, titular2: t2,
            historial: h, gastos: g, patrimonio: pat, prestamo: p } = s;
    const f: [string, string|number][] = [
      ['campo','valor'],['nombre',sol.nombre],['fecha_nacimiento',sol.fechaNacimiento],
      ['estado_civil',sol.estadoCivil],['regimen_economico',sol.regimenEconomico],
      ['nacionalidad',sol.nacionalidad],['anios_residencia',sol.aniosResidencia],
      ['titulares',sol.titulares],['dependientes',sol.dependientes],['bebes',sol.bebes],
      ['discapacidad',sol.discapacidad],['ccaa',sol.ccaa],['municipio',sol.municipio],
      ['vivienda_actual',sol.viviendaActual],
      ['t1_contrato',t1.contrato],['t1_antiguedad',t1.antiguedad],['t1_sector',t1.sector],
      ['t1_ingresos',t1.ingresosMensuales],['t1_pagas',t1.pagasAnio],['t1_otros_ingresos',t1.otrosIngresos],
      ['t2_contrato',t2.contrato],['t2_antiguedad',t2.antiguedad],['t2_sector',t2.sector],
      ['t2_ingresos',t2.ingresosMensuales],['t2_pagas',t2.pagasAnio],['t2_otros_ingresos',t2.otrosIngresos],
      ['cirbe',h.cirbe],['morosos',h.morosos],['impagos',h.impagos],['relacion_bancaria',h.relacionBancaria],
      ['g_personal',g.gPersonal],['g_tarjetas',g.gTarjetas],['g_leasing',g.gLeasing],
      ['g_pension',g.gPension],['g_alquiler',g.gAlquiler],['g_otros',g.gOtros],
      ['g_alimentacion',g.gAlimentacion],['g_suministros',g.gSuministros],
      ['g_transporte',g.gTransporte],['g_educacion',g.gEducacion],
      ['g_seguros',g.gSeguros],['g_ocio',g.gOcio],
      ['ahorro',pat.ahorro],['inversiones',pat.inversiones],['inmuebles',pat.inmuebles],
      ['vehiculos',pat.vehiculos],['plan_pension',pat.planPension],['otros_activos',pat.otrosActivos],
      ['d_personal',pat.dPersonal],['d_tarjetas',pat.dTarjetas],
      ['d_hipoteca',pat.dHipoteca],['d_otros',pat.dOtros],
      ['precio_compra',p.precioCompra],['valor_tasacion',p.valorTasacion],
      ['tipologia',p.tipologia],['tipo_inmueble',p.tipoInmueble],
      ['certificado_energetico',p.certificadoEnergetico],['provincia',p.provincia],
      ['importe_financiar',p.importeFinanciar],['plazo_anios',p.plazoAnios],
      ['tipo_interes',p.tipoInteres],['tae',p.tae],
      ['diferencial',p.diferencial],['carencia_meses',p.carenciaMeses],
      ['productos_vinculados',(p.productosVinculados||[]).join('|')],
    ];
    const nombre = sol.nombre ? sol.nombre.replace(/\s+/g,'_').toLowerCase() : 'solicitud';
    this.bajar(f.map(r=>r.join(',')).join('\n'), `${nombre}_${new Date().toISOString().slice(0,10)}.csv`);
  }

  private bajar(contenido: string, nombre: string) {
    const blob = new Blob(['\uFEFF'+contenido], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = nombre; a.click();
    URL.revokeObjectURL(url);
  }
}
