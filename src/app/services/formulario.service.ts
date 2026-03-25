import { Injectable, signal, computed } from '@angular/core';
import {
  SolicitudCompleta, DatosSolicitante, DatosTitular,
  DatosHistorialCrediticio, DatosGastos, DatosPatrimonio, DatosPrestamo,
  ResultadoSolvencia
} from '../models/solicitud.model';
import { SolvenciaService } from './solvencia.service';

@Injectable({ providedIn: 'root' })
export class FormularioService {
  constructor(private solvencia: SolvenciaService) {}

  readonly pasoActual = signal<number>(1);
  readonly totalPasos = 6;
  readonly solicitud = signal<SolicitudCompleta>(this.valorInicial());

  // Signal para rastrear si hay datos cargados desde CSV
  readonly csvCargado = signal<{ nombreArchivo: string; camposCargados: number } | null>(null);
  // Incrementa cada vez que se entra al paso 6
  readonly versionResultado = signal<number>(0);
  readonly guardadoOk = signal<boolean>(false);
  // Resultado calculado reactivamente — siempre actualizado con los datos del signal
  readonly resultado = computed<ResultadoSolvencia>(() => this.solvencia.calcularScore(this.solicitud()));

  private valorInicial(): SolicitudCompleta {
    return {
      solicitante: {
        nombre: '', fechaNacimiento: '', estadoCivil: '',
        regimenEconomico: '', nacionalidad: 'es', aniosResidencia: 10,
        titulares: 1, dependientes: 0, bebes: 0, discapacidad: 'no',
        ccaa: '', municipio: 'media', viviendaActual: 'alquiler'
      },
      titular1: this.titularVacio(),
      titular2: this.titularVacio(),
      historial: { cirbe: 'no', morosos: 'no', impagos: 'no', relacionBancaria: 0 },
      gastos: {
        gPersonal: 0, gTarjetas: 0, gLeasing: 0, gPension: 0, gAlquiler: 0, gOtros: 0,
        gAlimentacion: 600, gSuministros: 200, gTransporte: 150,
        gEducacion: 0, gSeguros: 80, gOcio: 200
      },
      patrimonio: {
        ahorro: 0, inversiones: 0, inmuebles: 0, vehiculos: 0,
        planPension: 0, otrosActivos: 0,
        dPersonal: 0, dTarjetas: 0, dHipoteca: 0, dOtros: 0
      },
      prestamo: {
        precioCompra: 0, valorTasacion: 0, tipologia: 'primera',
        tipoInmueble: 'piso', certificadoEnergetico: 'C', provincia: 'mad',
        importeFinanciar: 0, plazoAnios: 25, tipoInteres: 'fijo',
        tae: 3.5, diferencial: 0.75, carenciaMeses: 0, productosVinculados: []
      }
    };
  }

  private titularVacio(): DatosTitular {
    return { contrato: 'indefinido', antiguedad: 0, sector: 'otro', ingresosMensuales: 0, pagasAnio: 14, otrosIngresos: 0 };
  }

  actualizarSolicitante(datos: Partial<DatosSolicitante>): void {
    this.solicitud.update(s => ({ ...s, solicitante: { ...s.solicitante, ...datos } }));
  }
  actualizarTitular1(datos: Partial<DatosTitular>): void {
    this.solicitud.update(s => ({ ...s, titular1: { ...s.titular1, ...datos } }));
  }
  actualizarTitular2(datos: Partial<DatosTitular>): void {
    this.solicitud.update(s => ({ ...s, titular2: { ...s.titular2, ...datos } }));
  }
  actualizarHistorial(datos: Partial<DatosHistorialCrediticio>): void {
    this.solicitud.update(s => ({ ...s, historial: { ...s.historial, ...datos } }));
  }
  actualizarGastos(datos: Partial<DatosGastos>): void {
    this.solicitud.update(s => ({ ...s, gastos: { ...s.gastos, ...datos } }));
  }
  actualizarPatrimonio(datos: Partial<DatosPatrimonio>): void {
    this.solicitud.update(s => ({ ...s, patrimonio: { ...s.patrimonio, ...datos } }));
  }
  actualizarPrestamo(datos: Partial<DatosPrestamo>): void {
    this.solicitud.update(s => ({ ...s, prestamo: { ...s.prestamo, ...datos } }));
  }
  irAPaso(n: number): void {
    if (n >= 1 && n <= this.totalPasos) {
      if (n === 6) this.versionResultado.update(v => v + 1);
      this.pasoActual.set(n);
    }
  }
  siguiente(): void { this.irAPaso(this.pasoActual() + 1); }
  anterior(): void { this.irAPaso(this.pasoActual() - 1); }

  cargarSolicitud(s: SolicitudCompleta, nombreArchivo: string, camposCargados: number): void {
    // 1. Establecer datos primero
    this.solicitud.set(s);
    this.csvCargado.set({ nombreArchivo, camposCargados });
    // 2. Navegar al paso 6 en el siguiente tick, después de que el signal se propague
    setTimeout(() => {
      this.versionResultado.update(v => v + 1);
      this.pasoActual.set(6);
    }, 50);
  }

  descartarCsv(): void {
    this.csvCargado.set(null);
  }

  mostrarGuardado(): void {
    this.guardadoOk.set(true);
    setTimeout(() => this.guardadoOk.set(false), 3000);
  }

  resetear(): void {
    this.solicitud.set(this.valorInicial());
    this.pasoActual.set(1);
    this.csvCargado.set(null);
  }
}
