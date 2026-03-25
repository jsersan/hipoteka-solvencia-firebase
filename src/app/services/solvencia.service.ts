import { Injectable } from '@angular/core';
import {
  SolicitudCompleta, ResultadoSolvencia, FactorEvaluacion,
  DatosTitular, DatosHistorialCrediticio, AnalisisRiesgo, EscenarioRiesgo
} from '../models/solicitud.model';

@Injectable({ providedIn: 'root' })
export class SolvenciaService {

  calcularScore(solicitud: SolicitudCompleta): ResultadoSolvencia {
    try {
      return this._calcularScore(solicitud);
    } catch (e) {
      console.error('Error en calcularScore:', e);
      return this._resultadoVacio();
    }
  }

  private _calcularScore(solicitud: SolicitudCompleta): ResultadoSolvencia {
    const { solicitante, titular1, titular2, historial, gastos, patrimonio, prestamo } = solicitud;

    // ── Ingresos totales normalizados a mes ──────────────────────────────────
    const ingMes1 = this.ingresoMensualNormalizado(titular1);
    const ingMes2 = solicitante.titulares === 2 ? this.ingresoMensualNormalizado(titular2) : 0;
    const ingresosTotalesMes = ingMes1 + ingMes2;

    // ── Cuota hipotecaria ────────────────────────────────────────────────────
    const cuotaMensual = this.calcularCuota(
      prestamo.importeFinanciar, prestamo.plazoAnios, prestamo.tae
    );

    // ── Gastos financieros previos ───────────────────────────────────────────
    const gastosFinancieros =
      gastos.gPersonal + gastos.gTarjetas + gastos.gLeasing + gastos.gPension;

    // ── Gastos corrientes de vida ────────────────────────────────────────────
    const gastosVida =
      gastos.gAlimentacion + gastos.gSuministros + gastos.gTransporte +
      gastos.gEducacion + gastos.gSeguros + gastos.gOcio;

    // ── Ratios clave ─────────────────────────────────────────────────────────
    const gastosTotalesHipoteca = gastosFinancieros + cuotaMensual;
    const ratioEsfuerzo = ingresosTotalesMes > 0
      ? (gastosTotalesHipoteca / ingresosTotalesMes) * 100 : 999;
    const ratioEsfuerzoConVida = ingresosTotalesMes > 0
      ? ((gastosTotalesHipoteca + gastosVida) / ingresosTotalesMes) * 100 : 999;
    const rentaLibreResidual = ingresosTotalesMes - gastosTotalesHipoteca - gastosVida;

    const tasacion = prestamo.valorTasacion || prestamo.precioCompra;
    const ltv = tasacion > 0 ? (prestamo.importeFinanciar / tasacion) * 100 : 999;
    const entrada = prestamo.precioCompra - prestamo.importeFinanciar;
    const pctEntrada = prestamo.precioCompra > 0 ? (entrada / prestamo.precioCompra) * 100 : 0;

    // ── Patrimonio ───────────────────────────────────────────────────────────
    const activos =
      patrimonio.ahorro + patrimonio.inversiones + patrimonio.inmuebles +
      patrimonio.vehiculos + patrimonio.planPension + patrimonio.otrosActivos;
    const pasivos =
      patrimonio.dPersonal + patrimonio.dTarjetas +
      patrimonio.dHipoteca + patrimonio.dOtros;
    const patrimonioNeto = activos - pasivos;

    // ── Edad ─────────────────────────────────────────────────────────────────
    let edad = 0;
    if (solicitante.fechaNacimiento) {
      const d = new Date(solicitante.fechaNacimiento);
      edad = new Date().getFullYear() - d.getFullYear();
    }
    const edadFinHipoteca = edad + prestamo.plazoAnios;

    // ────────────────────────────────────────────────────────────────────────
    //  MOTOR DE SCORING (base 500 pts)
    // ────────────────────────────────────────────────────────────────────────
    let score = 200;
    const factores: FactorEvaluacion[] = [];

    // 1. RATIO DE ESFUERZO (max ±200 pts)
    const efScore = this.scoreEsfuerzo(ratioEsfuerzo);
    factores.push({
      label: 'Ratio de esfuerzo',
      valor: ratioEsfuerzo.toFixed(1) + '%',
      descripcion: this.descEsfuerzo(ratioEsfuerzo),
      estado: this.estadoEsfuerzo(ratioEsfuerzo),
      puntos: efScore
    });
    score += efScore;

    // 2. LTV (max ±150 pts)
    const ltvScore = this.scoreLTV(ltv);
    factores.push({
      label: 'LTV (Loan-to-Value)',
      valor: ltv.toFixed(1) + '%',
      descripcion: this.descLTV(ltv),
      estado: this.estadoLTV(ltv),
      puntos: ltvScore
    });
    score += ltvScore;

    // 3. ESTABILIDAD LABORAL TITULAR 1 (max +160 pts)
    const estScore1 = this.scoreEstabilidadLaboral(titular1);
    factores.push({
      label: 'Estabilidad laboral — Titular 1',
      valor: titular1.contrato.replace(/_/g, ' '),
      descripcion: `Antigüedad: ${titular1.antiguedad} años | Sector: ${titular1.sector}`,
      estado: estScore1 >= 100 ? 'success' : estScore1 >= 50 ? 'info' : estScore1 >= 0 ? 'warning' : 'danger',
      puntos: estScore1
    });
    score += estScore1;

    // 3b. TITULAR 2 (si aplica, max +120 pts)
    if (solicitante.titulares === 2) {
      const estScore2 = this.scoreEstabilidadLaboral(titular2) * 0.75;
      factores.push({
        label: 'Estabilidad laboral — Titular 2',
        valor: titular2.contrato.replace(/_/g, ' '),
        descripcion: `Antigüedad: ${titular2.antiguedad} años`,
        estado: estScore2 >= 80 ? 'success' : estScore2 >= 40 ? 'info' : estScore2 >= 0 ? 'warning' : 'danger',
        puntos: Math.round(estScore2)
      });
      score += Math.round(estScore2);
    }

    // 4. HISTORIAL CREDITICIO (max ±200 pts)
    const histScore = this.scoreHistorial(historial);
    factores.push({
      label: 'Historial crediticio',
      valor: historial.morosos === 'no' && historial.impagos === 'no' ? 'Sin incidencias' : 'Con incidencias',
      descripcion: `CIRBE: ${historial.cirbe} | Morosidad: ${historial.morosos} | Impagos: ${historial.impagos}`,
      estado: histScore >= 100 ? 'success' : histScore >= 50 ? 'info' : histScore >= 0 ? 'warning' : 'danger',
      puntos: histScore
    });
    score += histScore;

    // 5. PATRIMONIO NETO (max ±80 pts)
    const patScore = this.scorePatrimonio(patrimonioNeto);
    factores.push({
      label: 'Patrimonio neto',
      valor: this.formatEur(patrimonioNeto),
      descripcion: `Activos: ${this.formatEur(activos)} | Pasivos: ${this.formatEur(pasivos)}`,
      estado: patScore >= 50 ? 'success' : patScore >= 0 ? 'info' : 'danger',
      puntos: patScore
    });
    score += patScore;

    // 6. RENTA LIBRE RESIDUAL (max ±80 pts)
    const rlScore = this.scoreRentaLibre(rentaLibreResidual);
    factores.push({
      label: 'Renta libre residual',
      valor: this.formatEur(rentaLibreResidual) + '/mes',
      descripcion: 'Tras cuota hipotecaria y todos los gastos de vida',
      estado: rlScore >= 40 ? 'success' : rlScore >= 0 ? 'warning' : 'danger',
      puntos: rlScore
    });
    score += rlScore;

    // 7. PENALIZACIONES POR DEPENDIENTES
    const depPen = this.penalizacionDependientes(solicitante.dependientes);
    if (depPen < 0) score += depPen;

    // 8. PENALIZACIÓN POR EDAD FIN HIPOTECA
    if (edadFinHipoteca > 80) score -= 100;
    else if (edadFinHipoteca > 75) score -= 40;

    // 9. BONIFICACIÓN PRODUCTOS VINCULADOS
    const vinBonus = prestamo.productosVinculados.length * 15;
    if (vinBonus > 0) {
      factores.push({
        label: 'Productos vinculados',
        valor: `${prestamo.productosVinculados.length} producto(s)`,
        descripcion: prestamo.productosVinculados.join(', '),
        estado: 'success',
        puntos: vinBonus
      });
      score += vinBonus;
    }

    // 10. AJUSTE POR TIPO DE INMUEBLE
    if (prestamo.tipologia === 'segunda') score -= 30;
    if (prestamo.tipologia === 'inversion') score -= 50;
    if (prestamo.certificadoEnergetico === 'A') score += 20;
    if (prestamo.certificadoEnergetico === 'F') score -= 15;

    // Clamp 0–1000
    score = Math.min(Math.max(Math.round(score), 0), 1000);

    // ── Rating y veredicto ───────────────────────────────────────────────────
    const { rating, veredicto, condicion } = this.determinarRating(score);

    // ── Recomendaciones ──────────────────────────────────────────────────────
    const recomendaciones = this.generarRecomendaciones(
      ratioEsfuerzo, ltv, rentaLibreResidual, pctEntrada,
      edadFinHipoteca, score, condicion
    );

    // ── Condiciones orientativas ─────────────────────────────────────────────
    const condicionesOrientativas = condicion !== 'denied'
      ? this.generarCondicionesOrientativas(score, prestamo, edad)
      : [];

    // ── Análisis de riesgos ──────────────────────────────────────────────────
    const analisisRiesgo = this.generarAnalisisRiesgo({
      solicitud, score, condicion, ratioEsfuerzo, ltv,
      rentaLibreResidual, cuotaMensual, ingresosTotalesMes,
      pctEntrada, edadFinHipoteca, patrimonioNeto
    });

    return {
      score, rating, veredicto, condicion,
      ingresosTotalesMes, cuotaMensual,
      ratioEsfuerzo, ratioEsfuerzoConVida,
      ltv, pctEntrada, patrimonioNeto,
      rentaLibreResidual, edadFinHipoteca,
      factores, recomendaciones, condicionesOrientativas, analisisRiesgo
    };
  }

  private _resultadoVacio(): ResultadoSolvencia {
    return {
      score: 0, rating: 'D', veredicto: 'Error en el cálculo', condicion: 'denied',
      ingresosTotalesMes: 0, cuotaMensual: 0, ratioEsfuerzo: 0, ratioEsfuerzoConVida: 0,
      ltv: 0, pctEntrada: 0, patrimonioNeto: 0, rentaLibreResidual: 0, edadFinHipoteca: 0,
      factores: [], recomendaciones: [], condicionesOrientativas: [],
      analisisRiesgo: { causasDenegacion: [], consecuenciasConcesion: [], escenariosMacro: [], escenariosPersonales: [], puntosDebiles: [], puntosAMejorar: [] }
    };
  }

  // ── Helpers de cálculo ─────────────────────────────────────────────────────

  calcularCuota(capital: number, plazoAnios: number, tae: number): number {
    if (capital <= 0 || plazoAnios <= 0) return 0;
    const r = tae / 100 / 12;
    const n = plazoAnios * 12;
    if (r === 0) return capital / n;
    return capital * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  calcularTotalIntereses(capital: number, plazoAnios: number, tae: number): number {
    const cuota = this.calcularCuota(capital, plazoAnios, tae);
    return cuota * plazoAnios * 12 - capital;
  }

  private ingresoMensualNormalizado(t: DatosTitular): number {
    return t.ingresosMensuales + (t.ingresosMensuales * (t.pagasAnio - 12) / 12) + t.otrosIngresos;
  }

  // ── Funciones de scoring ───────────────────────────────────────────────────

  private scoreEsfuerzo(e: number): number {
    if (e <= 30) return 200;
    if (e <= 35) return 150;
    if (e <= 40) return 80;
    if (e <= 45) return 20;
    return -100;
  }

  private descEsfuerzo(e: number): string {
    if (e <= 30) return 'Excelente — ratio muy por debajo del 30% recomendado';
    if (e <= 35) return 'Bueno — dentro del rango aceptable (31-35%)';
    if (e <= 40) return 'Aceptable — en el límite superior recomendado (36-40%)';
    if (e <= 45) return 'Elevado — supera el umbral del 40% (41-45%)';
    return 'Excesivo — supera el 45%, riesgo de impago muy alto';
  }

  private estadoEsfuerzo(e: number): 'success' | 'warning' | 'danger' | 'info' {
    if (e <= 35) return 'success';
    if (e <= 40) return 'warning';
    return 'danger';
  }

  private scoreLTV(ltv: number): number {
    if (ltv <= 60) return 150;
    if (ltv <= 70) return 100;
    if (ltv <= 80) return 60;
    if (ltv <= 90) return -20;
    return -150;
  }

  private descLTV(ltv: number): string {
    if (ltv <= 60) return 'Muy bajo — excelente cobertura de garantía';
    if (ltv <= 70) return 'Bajo — buena cobertura del activo';
    if (ltv <= 80) return 'Estándar — dentro del límite habitual del 80%';
    if (ltv <= 90) return 'Alto — por encima del 80%, requiere garantías adicionales';
    return 'Muy alto — supera el 90%, riesgo elevado para la entidad';
  }

  private estadoLTV(ltv: number): 'success' | 'warning' | 'danger' | 'info' {
    if (ltv <= 70) return 'success';
    if (ltv <= 80) return 'info';
    if (ltv <= 90) return 'warning';
    return 'danger';
  }

  private scoreEstabilidadLaboral(t: DatosTitular): number {
    const base: Record<string, number> = {
      funcionario: 120, indefinido: 100, pensionista: 80,
      indefinido_parcial: 50, autonomo: 60, temporal: 10,
      desempleado: -50, sin_ingresos: -200
    };
    const pts = base[t.contrato] ?? 0;
    const antigBonus = t.antiguedad >= 10 ? 40 : t.antiguedad >= 5 ? 20 : t.antiguedad >= 2 ? 10 : 0;

    // Bonus sector estable
    const sectorBonus = ['publico', 'financiero', 'salud'].includes(t.sector) ? 15 : 0;

    return pts + antigBonus + sectorBonus;
  }

  private scoreHistorial(h: DatosHistorialCrediticio): number {
    let pts = 100;
    if (h.morosos === 'si_pendiente') pts -= 200;
    else if (h.morosos === 'si_saldado') pts -= 50;
    if (h.impagos === 'grave') pts -= 200;
    else if (h.impagos === 'varios') pts -= 100;
    else if (h.impagos === '1') pts -= 30;
    if (h.cirbe === 'si_alto') pts -= 80;
    else if (h.cirbe === 'si_medio') pts -= 30;
    pts += Math.min(h.relacionBancaria * 5, 30);
    return pts;
  }

  private scorePatrimonio(pat: number): number {
    if (pat > 100_000) return 80;
    if (pat > 50_000) return 50;
    if (pat > 20_000) return 20;
    if (pat < 0) return -60;
    return 0;
  }

  private scoreRentaLibre(renta: number): number {
    if (renta > 600) return 40;
    if (renta > 300) return 20;
    if (renta > 0) return 0;
    return -80;
  }

  private penalizacionDependientes(dep: number): number {
    if (dep >= 4) return -60;
    if (dep === 3) return -30;
    if (dep === 2) return -15;
    if (dep === 1) return -5;
    return 0;
  }

  private determinarRating(score: number): {
    rating: 'A' | 'B' | 'C' | 'D';
    veredicto: string;
    condicion: 'approved' | 'conditional' | 'denied';
  } {
    // Escala calibrada con base 200:
    // Perfil excelente (esfuerzo<30%, LTV<60%, funcionario, sin deudas) → ~950-1000
    // Perfil bueno (esfuerzo<35%, LTV<80%, indefinido, limpio) → ~700-850
    // Perfil ajustado (esfuerzo 35-40%, LTV 70-80%) → ~500-700
    // Perfil débil (esfuerzo >40%, morosidad, temporal) → <500
    if (score >= 750) return { rating: 'A', veredicto: 'Aprobado', condicion: 'approved' };
    if (score >= 550) return { rating: 'B', veredicto: 'Aprobado con condiciones', condicion: 'conditional' };
    if (score >= 380) return { rating: 'C', veredicto: 'Estudio adicional requerido', condicion: 'conditional' };
    return { rating: 'D', veredicto: 'Denegado', condicion: 'denied' };
  }

  private generarRecomendaciones(
    esfuerzo: number, ltv: number, rentaLibre: number,
    pctEntrada: number, edadFin: number, score: number,
    condicion: string
  ) {
    const recs: { tipo: 'success' | 'warning' | 'danger' | 'info'; mensaje: string }[] = [];

    if (esfuerzo > 40)
      recs.push({ tipo: 'danger', mensaje: `El ratio de esfuerzo (${esfuerzo.toFixed(1)}%) supera el 40%. Considera ampliar el plazo, aportar más entrada o reducir deudas previas.` });
    else if (esfuerzo > 35)
      recs.push({ tipo: 'warning', mensaje: `El ratio de esfuerzo (${esfuerzo.toFixed(1)}%) supera el 35% recomendado. La aprobación puede requerir garantías adicionales.` });

    if (ltv > 80)
      recs.push({ tipo: 'warning', mensaje: `El LTV (${ltv.toFixed(1)}%) supera el 80%. Aumentar la aportación inicial mejoraría significativamente las condiciones.` });

    if (rentaLibre < 0)
      recs.push({ tipo: 'danger', mensaje: `La renta residual es negativa (${Math.round(rentaLibre)} €/mes). No hay margen tras cuota e hipoteca y gastos. Operación inviable en las condiciones actuales.` });
    else if (rentaLibre < 300)
      recs.push({ tipo: 'warning', mensaje: `La renta libre residual (${Math.round(rentaLibre)} €/mes) es muy ajustada. Sin margen ante imprevistos o subidas de tipos.` });

    if (pctEntrada < 20)
      recs.push({ tipo: 'info', mensaje: `La aportación inicial representa el ${pctEntrada.toFixed(1)}% del precio. Los bancos exigen mínimo el 20% más un 10-12% adicional para gastos de compraventa (notaría, AJD, registro).` });

    if (edadFin > 80)
      recs.push({ tipo: 'danger', mensaje: `La hipoteca finalizaría con ${edadFin} años. La normativa bancaria limita habitualmente la edad máxima al vencimiento a 75-80 años. Considera reducir el plazo o adelantar la operación.` });
    else if (edadFin > 75)
      recs.push({ tipo: 'warning', mensaje: `La hipoteca finalizaría con ${edadFin} años, en el límite de algunas entidades. Verifica los criterios concretos del banco.` });

    if (score >= 600 && condicion !== 'denied')
      recs.push({ tipo: 'success', mensaje: 'Perfil aceptable. Domiciliar nómina y contratar seguro de vida/hogar con la entidad puede mejorar el tipo de interés hasta 0,5-1 punto.' });

    return recs;
  }

  private generarCondicionesOrientativas(score: number, prestamo: any, edad: number) {
    return [
      { concepto: 'Tipo de hipoteca recomendado', valor: prestamo.tae > 4.5 ? 'Fijo (protección ante subidas)' : 'Variable o mixto' },
      { concepto: 'Plazo máximo orientativo', valor: Math.min(prestamo.plazoAnios, 75 - edad) + ' años' },
      { concepto: 'LTV máximo admitido', valor: score >= 750 ? '80%' : score >= 550 ? '75%' : '70%' },
      { concepto: 'Productos vinculados requeridos', valor: score >= 750 ? 'Opcionales' : 'Nómina + seguro de vida' },
      { concepto: 'Garantías adicionales', valor: score >= 700 ? 'No requeridas' : 'Posible aval solidario' },
      { concepto: 'Nivel de documentación', valor: score >= 700 ? 'Estándar' : 'Reforzada (3 últimas declaraciones IRPF)' },
      { concepto: 'Tasación independiente', valor: score >= 650 ? 'Recomendable' : 'Obligatoria' },
    ];
  }

  private formatEur(n: number): string {
    return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  }

  private generarAnalisisRiesgo(ctx: {
    solicitud: any, score: number, condicion: string,
    ratioEsfuerzo: number, ltv: number, rentaLibreResidual: number,
    cuotaMensual: number, ingresosTotalesMes: number,
    pctEntrada: number, edadFinHipoteca: number, patrimonioNeto: number
  }): AnalisisRiesgo {
    const { solicitud, score, condicion, ratioEsfuerzo, ltv,
      rentaLibreResidual, cuotaMensual, ingresosTotalesMes,
      pctEntrada, edadFinHipoteca, patrimonioNeto } = ctx;
    const { prestamo, titular1, historial } = solicitud;
    const euribor = 2.45; // referencia

    // ── CAUSAS DE DENEGACIÓN ─────────────────────────────────────────────────
    const causas: AnalisisRiesgo['causasDenegacion'] = [];

    if (ratioEsfuerzo > 45)
      causas.push({
        causa: `Ratio de esfuerzo excesivo: ${ratioEsfuerzo.toFixed(1)}%`,
        gravedad: 'bloqueante',
        detalle: `La cuota más los compromisos financieros previos consumen el ${ratioEsfuerzo.toFixed(1)}% de los ingresos netos. El Banco de España recomienda no superar el 35% y ninguna entidad concede hipotecas por encima del 45-50%. Con este ratio, ante cualquier imprevisto (enfermedad, ERTE, reparación) el prestatario entraría en impago en menos de 3 meses.`
      });
    else if (ratioEsfuerzo > 40)
      causas.push({
        causa: `Ratio de esfuerzo elevado: ${ratioEsfuerzo.toFixed(1)}%`,
        gravedad: 'importante',
        detalle: `La cuota supera el 40% de los ingresos, por encima del umbral de precaución. La EBA (Autoridad Bancaria Europea) clasifica estas operaciones como "de mayor riesgo" y exige provisiones adicionales al banco, lo que habitualmente se traduce en condiciones más restrictivas o denegación directa.`
      });

    if (ltv > 90)
      causas.push({
        causa: `LTV crítico: ${ltv.toFixed(1)}% (máximo habitual 80%)`,
        gravedad: 'bloqueante',
        detalle: `Se financia el ${ltv.toFixed(1)}% del valor de tasación. El capital prestado supera ampliamente la garantía real del inmueble. Si el prestatario dejase de pagar y el banco ejecutase la hipoteca, una caída de precios del 10% haría que la vivienda no cubriese la deuda, generando pérdidas directas a la entidad. El Reglamento CRR (UE 575/2013) obliga a los bancos a ponderar estas exposiciones al 100%, encareciendo el capital regulatorio.`
      });
    else if (ltv > 80)
      causas.push({
        causa: `LTV superior al 80%: ${ltv.toFixed(1)}%`,
        gravedad: 'importante',
        detalle: `La mayoría de entidades limitan la financiación al 80% del valor de tasación para primera residencia. Superar este umbral requiere garantías adicionales (aval, segunda hipoteca) o seguros de impago hipotecario (tipo PMI), que incrementan el coste total de la operación entre 0,3% y 0,8% anual.`
      });

    if (historial.morosos === 'si_pendiente')
      causas.push({
        causa: 'Inclusión en ficheros de morosos con deuda pendiente',
        gravedad: 'bloqueante',
        detalle: 'Figurar en ASNEF, RAI u otros ficheros con deuda vigente es causa automática de denegación en prácticamente todas las entidades financieras españolas. La Ley Orgánica 3/2018 (LOPDGDD) permite la inclusión en estos ficheros y las entidades los consultan obligatoriamente en el análisis de riesgo. La deuda debe saldarse y solicitar la cancelación del registro antes de iniciar cualquier proceso hipotecario.'
      });

    if (historial.impagos === 'grave')
      causas.push({
        causa: 'Impago grave o proceso concursal en el historial',
        gravedad: 'bloqueante',
        detalle: 'Un impago grave (más de 90 días en mora) o un concurso de acreedores figura en el CIRBE durante al menos 6 años. Esto implica una prima de riesgo que ninguna entidad puede asumir sin incumplir sus propias políticas internas de riesgo crediticio y las directrices de supervisión del Banco de España.'
      });

    if (rentaLibreResidual < 0)
      causas.push({
        causa: `Renta libre residual negativa: ${Math.round(rentaLibreResidual)} €/mes`,
        gravedad: 'bloqueante',
        detalle: `Tras abonar la cuota hipotecaria, los compromisos financieros previos y los gastos corrientes de vida, el saldo mensual es negativo (${Math.round(rentaLibreResidual)} €). Esto significa que el solicitante necesitaría endeudarse cada mes para cubrir sus necesidades básicas. Ningún análisis actuarial de riesgo puede avalar esta operación.`
      });

    if (pctEntrada < 10)
      causas.push({
        causa: `Aportación inicial insuficiente: ${pctEntrada.toFixed(1)}% del precio`,
        gravedad: 'bloqueante',
        detalle: `La entrada aportada es inferior al 10% del precio. Además de los gastos de compraventa (ITP/AJD: 6-10%, notaría, registro, gestoría: ~2%), el banco financia como máximo el 80% del menor entre precio y tasación. Con esta entrada no es posible estructurar la operación sin financiación adicional.`
      });
    else if (pctEntrada < 20)
      causas.push({
        causa: `Entrada por debajo del 20%: ${pctEntrada.toFixed(1)}%`,
        gravedad: 'importante',
        detalle: `Con menos del 20% de entrada más el ~10% de gastos de formalización, el solicitante alcanza el límite de financiación del 80% sin margen. No quedan recursos para imprevistos post-compra (reformas, reparaciones, mudanza). El análisis de solvencia resultante es muy ajustado.`
      });

    if (titular1.contrato === 'temporal' || titular1.contrato === 'desempleado')
      causas.push({
        causa: `Inestabilidad laboral: contrato ${titular1.contrato}`,
        gravedad: titular1.contrato === 'desempleado' ? 'bloqueante' : 'importante',
        detalle: titular1.contrato === 'desempleado'
          ? 'Sin ingresos acreditables por empleo es imposible demostrar capacidad de pago sostenida. La prestación por desempleo no se considera ingreso consolidado a efectos hipotecarios.'
          : 'Un contrato temporal implica riesgo de extinción sin preaviso. La mayoría de entidades exigen al menos 1 año de antigüedad en el contrato o 2 en la empresa para computar los ingresos íntegramente. Con contrato temporal reciente, los ingresos se ponderan al 50-70%.'
      });

    if (edadFinHipoteca > 80)
      causas.push({
        causa: `Hipoteca finaliza a los ${edadFinHipoteca} años`,
        gravedad: 'importante',
        detalle: `La gran mayoría de entidades españolas limitan la edad máxima al vencimiento a 75-80 años, en línea con las tablas de mortalidad del INE. Superar este límite requiere un seguro de vida de prima elevada o reducir el plazo, lo que incrementa la cuota y puede hacer la operación inviable.`
      });

    // ── CONSECUENCIAS DE CONCESIÓN INDEBIDA ─────────────────────────────────
    const consecuencias: AnalisisRiesgo['consecuenciasConcesion'] = [];

    if (ratioEsfuerzo > 35) {
      const mesesHastaImpago = Math.max(1, Math.round((patrimonioNeto > 0 ? patrimonioNeto : 0) / Math.abs(rentaLibreResidual < 0 ? rentaLibreResidual : cuotaMensual * 0.3)));
      consecuencias.push({
        titulo: 'Riesgo de impago en el corto-medio plazo',
        tipo: 'financiero',
        descripcion: `Con un ratio de esfuerzo del ${ratioEsfuerzo.toFixed(1)}%, cualquier reducción de ingresos o incremento de gastos imprevistos (enfermedad, ERTE, reparación del hogar) podría generar el primer impago en un horizonte de ${Math.min(mesesHastaImpago, 18)} a 24 meses. La estadística del Banco de España muestra que el 73% de los expedientes de ejecución hipotecaria corresponden a préstamos con ratio inicial superior al 40%.`
      });
    }

    if (ltv > 80)
      consecuencias.push({
        titulo: 'Riesgo de patrimonio negativo (negative equity)',
        tipo: 'financiero',
        descripcion: `Con un LTV del ${ltv.toFixed(1)}%, una corrección del mercado inmobiliario del 15-20% (similar a la ocurrida en 2011-2014 en España, cuando los precios cayeron un 30% de media) dejaría la deuda viva por encima del valor de mercado del inmueble. El prestatario quedaría en "equity negativo": aunque vendiese el piso, seguiría debiendo dinero al banco. Esta situación es especialmente peligrosa porque limita totalmente la movilidad laboral y geográfica del titular.`
      });

    consecuencias.push({
      titulo: 'Historial crediticio dañado y embargo de vivienda habitual',
      tipo: 'legal',
      descripcion: 'El impago hipotecario desencadena: (1) Inclusión inmediata en ficheros de morosos. (2) Demanda judicial de ejecución hipotecaria (art. 681 LEC) con costas procesales que pueden superar los 15.000 €. (3) Subasta pública del inmueble, habitualmente por debajo del valor de mercado. (4) Si la subasta no cubre la deuda, el banco puede perseguir el resto con el patrimonio presente y futuro del deudor (art. 1911 CC). (5) Periodo de insolvencia que impide acceder a cualquier financiación durante 6-10 años.'
    });

    consecuencias.push({
      titulo: 'Impacto sobre la unidad familiar y calidad de vida',
      tipo: 'social',
      descripcion: `Destinar más del ${ratioEsfuerzo.toFixed(0)}% de los ingresos a la hipoteca implica recortes severos en alimentación, educación, salud y ocio. Las investigaciones del Observatorio Social de la Caixa muestran que familias con ratio de esfuerzo superior al 40% presentan tasas de estrés financiero crónico 3 veces superiores a la media, con impacto directo en la salud mental, el rendimiento laboral y el desarrollo infantil en hogares con menores.`
    });

    if (solicitud.solicitante.dependientes > 1)
      consecuencias.push({
        titulo: `Vulnerabilidad familiar con ${solicitud.solicitante.dependientes} dependientes`,
        tipo: 'social',
        descripcion: `La presencia de ${solicitud.solicitante.dependientes} personas dependientes a cargo añade una capa de rigidez a los gastos que no puede eliminarse en caso de dificultad. A diferencia de los gastos de ocio o transporte, los costes de cuidado, educación y alimentación de dependientes son prácticamente inelásticos a la baja, lo que reduce drásticamente la capacidad de adaptación ante un shock financiero.`
      });

    // ── ESCENARIOS MACROECONÓMICOS ─────────────────────────────────────────
    const escenariosMacro: EscenarioRiesgo[] = [];

    // Solo para hipoteca variable o mixta
    if (prestamo.tipoInteres === 'variable' || prestamo.tipoInteres === 'mixto') {
      const taeAlta = euribor + 2 + (prestamo.diferencial || 0.75);
      const cuotaEuribor2 = this.calcularCuota(prestamo.importeFinanciar, prestamo.plazoAnios, taeAlta);
      const esfuerzoEuribor2 = ingresosTotalesMes > 0 ? ((cuotaEuribor2 + (cuotaMensual - cuotaMensual)) / ingresosTotalesMes) * 100 : 0;
      escenariosMacro.push({
        titulo: 'Subida del Euríbor +2 puntos',
        probabilidad: 'media',
        impacto: esfuerzoEuribor2 > 50 ? 'critico' : esfuerzoEuribor2 > 40 ? 'alto' : 'medio',
        descripcion: `El Euríbor alcanzó el 4,16% en octubre 2023 desde el -0,5% de 2022. Una nueva subida hasta el ${(euribor + 2).toFixed(2)}% elevaría el tipo aplicable al ${taeAlta.toFixed(2)}%.`,
        consecuencia: `La cuota mensual pasaría de ${Math.round(cuotaMensual).toLocaleString('es-ES')} € a ${Math.round(cuotaEuribor2).toLocaleString('es-ES')} € (+${Math.round(cuotaEuribor2 - cuotaMensual).toLocaleString('es-ES')} €/mes). El ratio de esfuerzo alcanzaría el ${esfuerzoEuribor2.toFixed(1)}%.`,
        cuotaNueva: cuotaEuribor2,
        esfuerzoNuevo: esfuerzoEuribor2
      });

      const taeMax = euribor + 4 + (prestamo.diferencial || 0.75);
      const cuotaMax = this.calcularCuota(prestamo.importeFinanciar, prestamo.plazoAnios, taeMax);
      escenariosMacro.push({
        titulo: 'Escenario de estrés: Euríbor +4 puntos',
        probabilidad: 'baja',
        impacto: 'critico',
        descripcion: `Test de estrés exigido por la EBA (Directiva 2014/17/UE, art. 18): las entidades deben calcular la cuota con el tipo más alto de los últimos 20 años. El tipo máximo histórico en España fue del 14,5% (1992).`,
        consecuencia: `Con un tipo del ${taeMax.toFixed(2)}%, la cuota ascendería a ${Math.round(cuotaMax).toLocaleString('es-ES')} €/mes, un incremento del ${(cuotaMensual > 0 ? Math.round((cuotaMax/cuotaMensual - 1)*100) : 0)}% sobre la cuota inicial.`,
        cuotaNueva: cuotaMax,
        esfuerzoNuevo: ingresosTotalesMes > 0 ? (cuotaMax / ingresosTotalesMes) * 100 : 0
      });
    }

    escenariosMacro.push({
      titulo: 'Recesión económica y caída de precios inmobiliarios (-20%)',
      probabilidad: 'media',
      impacto: ltv > 70 ? 'critico' : 'alto',
      descripcion: 'España ha experimentado dos crisis inmobiliarias severas en 40 años (1992-1996: -30% y 2008-2014: -45% en algunas zonas). El Banco de España estima una probabilidad del 15-20% de corrección moderada en los próximos 5 años en las principales ciudades.',
      consecuencia: `Una caída del 20% sobre el valor de tasación de ${prestamo.valorTasacion > 0 ? prestamo.valorTasacion.toLocaleString('es-ES') : prestamo.precioCompra.toLocaleString('es-ES')} € dejaría el inmueble valorado en ${Math.round((prestamo.valorTasacion || prestamo.precioCompra) * 0.8).toLocaleString('es-ES')} €. El nuevo LTV sobre deuda pendiente superaría el ${Math.min(Math.round(ltv * 1.25), 150)}%, imposibilitando una refinanciación o venta sin pérdidas.`
    });

    escenariosMacro.push({
      titulo: 'Inflación persistente y pérdida de poder adquisitivo',
      probabilidad: 'alta',
      impacto: ratioEsfuerzo > 35 ? 'alto' : 'medio',
      descripcion: 'La inflación acumulada 2021-2024 ha erosionado el poder adquisitivo de los hogares españoles en un 15-18% según el INE. Las hipotecas a tipo fijo protegen la cuota, pero no el resto de gastos del hogar.',
      consecuencia: `Si la inflación se mantiene al 3% anual, en 10 años los gastos de vida habrán aumentado un 34% en términos nominales. Con ingresos creciendo al 2%, la renta libre residual actual de ${Math.round(rentaLibreResidual).toLocaleString('es-ES')} €/mes se reduciría progresivamente, pudiendo llegar a ser negativa.`
    });

    escenariosMacro.push({
      titulo: 'Cambio normativo: nuevas cargas fiscales sobre vivienda',
      probabilidad: 'media',
      impacto: 'medio',
      descripcion: 'El entorno regulatorio en materia de vivienda está en proceso de revisión continua. La Ley 12/2023 de Derecho a la Vivienda ya ha introducido limitaciones y nuevas obligaciones para propietarios.',
      consecuencia: 'Un incremento del IBI, la eliminación de deducciones fiscales por vivienda habitual o la implantación de nuevos impuestos sobre inmuebles (en debate parlamentario) añadiría entre 500 y 2.000 € anuales en costes para el titular.'
    });

    // ── ESCENARIOS PERSONALES ──────────────────────────────────────────────
    const escenariosPersonales: EscenarioRiesgo[] = [];

    const cuotaReduccion30 = cuotaMensual;
    const ingresoReduccion30 = ingresosTotalesMes * 0.7;
    const esfuerzoReduccion30 = ingresoReduccion30 > 0 ? (cuotaReduccion30 / ingresoReduccion30) * 100 : 999;
    escenariosPersonales.push({
      titulo: 'Pérdida del 30% de ingresos (ERTE, jornada parcial)',
      probabilidad: titular1.contrato === 'temporal' ? 'alta' : titular1.contrato === 'autonomo' ? 'media' : 'media',
      impacto: esfuerzoReduccion30 > 50 ? 'critico' : esfuerzoReduccion30 > 40 ? 'alto' : 'medio',
      descripcion: `Un ERTE supone percibir el 70% del salario regulador (con tope en la base máxima de cotización). Para autónomos, una caída de actividad del 30% es estadísticamente frecuente en los primeros 5 años.`,
      consecuencia: `Los ingresos caerían a ${Math.round(ingresoReduccion30).toLocaleString('es-ES')} €/mes. El ratio de esfuerzo se elevaría al ${esfuerzoReduccion30.toFixed(1)}%, ${esfuerzoReduccion30 > 50 ? 'haciendo inviable el pago de la cuota sin descapitalizar ahorros' : 'situando la hipoteca en zona de riesgo elevado'}.`,
      cuotaNueva: cuotaReduccion30,
      esfuerzoNuevo: esfuerzoReduccion30
    });

    escenariosPersonales.push({
      titulo: 'Pérdida total de empleo (desempleo sin prestación)',
      probabilidad: titular1.contrato === 'temporal' ? 'alta' : 'media',
      impacto: 'critico',
      descripcion: 'El desempleo de larga duración (más de 12 meses) agota la prestación contributiva. España tiene una tasa de paro estructural históricamente superior al 10%, con picos del 27% (2013).',
      consecuencia: `Sin ingresos, el titular agoraría sus ahorros disponibles (${solicitud.patrimonio.ahorro.toLocaleString('es-ES')} €) en aproximadamente ${solicitud.patrimonio.ahorro > 0 ? (cuotaMensual > 0 ? Math.round(solicitud.patrimonio.ahorro / cuotaMensual) : 0) : 0} meses de cuota hipotecaria, sin contar otros gastos básicos de vida.`
    });

    if (solicitud.solicitante.dependientes > 0)
      escenariosPersonales.push({
        titulo: `Incremento de gastos por dependientes (${solicitud.solicitante.dependientes} a cargo)`,
        probabilidad: 'alta',
        impacto: 'medio',
        descripcion: 'Los costes asociados a dependientes crecen con el tiempo: escolarización, actividades extraescolares, universidad, cuidado de mayores. El coste medio de crianza de un hijo hasta los 18 años en España supera los 120.000 € según estudios del CSIC.',
        consecuencia: `Estimando un incremento gradual de 200-500 €/mes en los próximos 5-10 años por cada dependiente, la renta libre disponible se reduciría en ${solicitud.solicitante.dependientes * 300}–${solicitud.solicitante.dependientes * 500} €/mes adicionales.`
      });

    escenariosPersonales.push({
      titulo: 'Gastos extraordinarios de mantenimiento del inmueble',
      probabilidad: 'alta',
      impacto: 'bajo',
      descripcion: 'Los expertos inmobiliarios recomiendan provisionar anualmente el 1-2% del valor del inmueble para mantenimiento y reparaciones (fontanería, electricidad, electrodomésticos, pintura, derramas de comunidad).',
      consecuencia: `Para un inmueble de ${(prestamo.precioCompra).toLocaleString('es-ES')} €, esto supone entre ${Math.round(prestamo.precioCompra * 0.01 / 12).toLocaleString('es-ES')} y ${Math.round(prestamo.precioCompra * 0.02 / 12).toLocaleString('es-ES')} €/mes adicionales que raramente se consideran en el análisis de solvencia inicial.`
    });

    if (edadFinHipoteca > 67)
      escenariosPersonales.push({
        titulo: 'Reducción de ingresos por jubilación durante la vida del préstamo',
        probabilidad: 'alta',
        impacto: 'alto',
        descripcion: `La hipoteca finalizará a los ${edadFinHipoteca} años, lo que implica que parte del préstamo se pagará en edad de jubilación. La tasa de sustitución del sistema público español (pensión/último salario) es del 72% de media, pero está en tendencia decreciente debido al envejecimiento poblacional.`,
        consecuencia: `Al jubilarse, los ingresos podrían reducirse a aproximadamente el 72% del salario actual. Con la cuota actual de ${Math.round(cuotaMensual).toLocaleString('es-ES')} €, el ratio de esfuerzo en jubilación podría superar el ${(ingresosTotalesMes > 0 ? (cuotaMensual / (ingresosTotalesMes * 0.72) * 100) : 0).toFixed(1)}%.`
      });

    // ── PUNTOS DÉBILES Y MEJORAS ─────────────────────────────────────────
    const puntosDebiles: string[] = causas
      .filter(c => c.gravedad === 'bloqueante' || c.gravedad === 'importante')
      .map(c => c.causa);

    const puntosAMejorar: AnalisisRiesgo['puntosAMejorar'] = [];

    if (ratioEsfuerzo > 35)
      puntosAMejorar.push({
        accion: 'Reducir deudas previas (préstamo personal, tarjetas)',
        impactoEsperado: `Cada 100 €/mes de deuda cancelada reduce el ratio de esfuerzo ~${ingresosTotalesMes > 0 ? (100/ingresosTotalesMes*100).toFixed(1) : "~2-3"} puntos`,
        dificultad: 'media'
      });

    if (ltv > 80)
      puntosAMejorar.push({
        accion: 'Aumentar la aportación inicial mediante mayor ahorro previo',
        impactoEsperado: 'Cada 10.000 € adicionales de entrada reduce el LTV ~' + ((prestamo.valorTasacion||prestamo.precioCompra) > 0 ? (10000/(prestamo.valorTasacion||prestamo.precioCompra)*100).toFixed(1) : '~4') + ' puntos',
        dificultad: 'dificil'
      });

    if (titular1.contrato === 'temporal')
      puntosAMejorar.push({
        accion: 'Estabilizar situación laboral (indefinido o 2+ años en misma empresa)',
        impactoEsperado: 'Un contrato indefinido puede sumar entre 80-120 puntos de scoring y permite computar el 100% de los ingresos',
        dificultad: 'media'
      });

    if (historial.morosos === 'si_pendiente' || historial.morosos === 'si_saldado')
      puntosAMejorar.push({
        accion: 'Saldar deudas en ficheros de morosos y solicitar cancelación registral',
        impactoEsperado: 'Requisito bloqueante: sin sanear el historial crediticio es imposible obtener financiación',
        dificultad: 'media'
      });

    if (solicitud.solicitante.titulares === 1 && puntosAMejorar.length > 0)
      puntosAMejorar.push({
        accion: 'Incorporar un segundo titular con ingresos estables',
        impactoEsperado: 'Un cotitular con 1.500 €/mes netos puede reducir el ratio de esfuerzo entre 10-20 puntos y añadir +60-80 pts de scoring',
        dificultad: 'facil'
      });

    return { causasDenegacion: causas, consecuenciasConcesion: consecuencias, escenariosMacro, escenariosPersonales, puntosDebiles, puntosAMejorar };
  }

}