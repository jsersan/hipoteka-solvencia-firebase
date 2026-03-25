import { Injectable } from '@angular/core';
import { SolicitudCompleta } from '../models/solicitud.model';

export interface CsvImportResult {
  ok: boolean;
  solicitud?: SolicitudCompleta;
  errores: string[];
  camposCargados: number;
}

@Injectable({ providedIn: 'root' })
export class CsvImportService {

  parsear(contenido: string): CsvImportResult {
    const errores: string[] = [];
    const lineas = contenido.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);

    if (lineas.length < 2) {
      return { ok: false, errores: ['El archivo CSV está vacío o no tiene datos.'], camposCargados: 0 };
    }

    const sep = lineas[0].includes(';') ? ';' : ',';
    const mapa: Record<string, string> = {};
    let camposCargados = 0;

    for (let i = 1; i < lineas.length; i++) {
      const partes = lineas[i].split(sep);
      if (partes.length < 2) continue;
      const campo = partes[0].trim().toLowerCase().replace(/\s+/g, '_');
      const valor = partes.slice(1).join(sep).trim().replace(/^"|"$/g, '');
      if (valor !== '') { mapa[campo] = valor; camposCargados++; }
    }

    const n = (campo: string, def = 0): number => {
      const v = mapa[campo];
      if (!v) return def;
      const p = parseFloat(v.replace(',', '.'));
      return isNaN(p) ? def : p;
    };
    const s = (campo: string, def = ''): string => mapa[campo] ?? def;
    const ii = (campo: string, def = 0): number => parseInt(s(campo, String(def))) || def;

    try {
      const solicitud: SolicitudCompleta = {
        solicitante: {
          nombre: s('nombre'),
          fechaNacimiento: s('fecha_nacimiento'),
          estadoCivil: s('estado_civil') as any || '',
          regimenEconomico: s('regimen_economico') as any || '',
          nacionalidad: s('nacionalidad', 'es') as any,
          aniosResidencia: n('anios_residencia', 10),
          titulares: (ii('titulares', 1) === 2 ? 2 : 1) as 1 | 2,
          dependientes: ii('dependientes', 0),
          bebes: ii('bebes', 0),
          discapacidad: s('discapacidad', 'no') as any,
          ccaa: s('ccaa'),
          municipio: s('municipio', 'media') as any,
          viviendaActual: s('vivienda_actual', 'alquiler') as any,
        },
        titular1: {
          contrato: s('t1_contrato', 'indefinido') as any,
          antiguedad: n('t1_antiguedad'),
          sector: s('t1_sector', 'otro'),
          ingresosMensuales: n('t1_ingresos'),
          pagasAnio: ii('t1_pagas', 14) as any,
          otrosIngresos: n('t1_otros_ingresos'),
        },
        titular2: {
          contrato: s('t2_contrato', 'indefinido') as any,
          antiguedad: n('t2_antiguedad'),
          sector: s('t2_sector', 'otro'),
          ingresosMensuales: n('t2_ingresos'),
          pagasAnio: ii('t2_pagas', 14) as any,
          otrosIngresos: n('t2_otros_ingresos'),
        },
        historial: {
          cirbe: s('cirbe', 'no') as any,
          morosos: s('morosos', 'no') as any,
          impagos: s('impagos', 'no') as any,
          relacionBancaria: n('relacion_bancaria'),
        },
        gastos: {
          gPersonal: n('g_personal'), gTarjetas: n('g_tarjetas'),
          gLeasing: n('g_leasing'), gPension: n('g_pension'),
          gAlquiler: n('g_alquiler'), gOtros: n('g_otros'),
          gAlimentacion: n('g_alimentacion', 600), gSuministros: n('g_suministros', 200),
          gTransporte: n('g_transporte', 150), gEducacion: n('g_educacion'),
          gSeguros: n('g_seguros', 80), gOcio: n('g_ocio', 200),
        },
        patrimonio: {
          ahorro: n('ahorro'), inversiones: n('inversiones'),
          inmuebles: n('inmuebles'), vehiculos: n('vehiculos'),
          planPension: n('plan_pension'), otrosActivos: n('otros_activos'),
          dPersonal: n('d_personal'), dTarjetas: n('d_tarjetas'),
          dHipoteca: n('d_hipoteca'), dOtros: n('d_otros'),
        },
        prestamo: {
          precioCompra: n('precio_compra'), valorTasacion: n('valor_tasacion'),
          tipologia: s('tipologia', 'primera') as any,
          tipoInmueble: s('tipo_inmueble', 'piso') as any,
          certificadoEnergetico: s('certificado_energetico', 'C') as any,
          provincia: s('provincia', 'mad'),
          importeFinanciar: n('importe_financiar'), plazoAnios: n('plazo_anios', 25),
          tipoInteres: s('tipo_interes', 'fijo') as any,
          tae: n('tae', 3.5), diferencial: n('diferencial', 0.75),
          carenciaMeses: n('carencia_meses'),
          productosVinculados: s('productos_vinculados')
            ? s('productos_vinculados').split('|').map(p => p.trim()).filter(Boolean)
            : [],
        },
      };

      if (!solicitud.prestamo.precioCompra) errores.push('Falta el precio de compra del inmueble.');
      if (!solicitud.prestamo.importeFinanciar) errores.push('Falta el importe a financiar.');
      if (!solicitud.titular1.ingresosMensuales) errores.push('Falta el ingreso mensual del Titular 1.');

      return { ok: errores.length === 0, solicitud, errores, camposCargados };
    } catch (e) {
      return { ok: false, errores: ['Error al procesar el CSV: ' + String(e)], camposCargados: 0 };
    }
  }
}
