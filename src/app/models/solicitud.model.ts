export interface DatosSolicitante {
  nombre: string;
  fechaNacimiento: string;
  estadoCivil: 'soltero' | 'casado' | 'pareja' | 'divorciado' | 'viudo' | '';
  regimenEconomico: 'gananciales' | 'separacion' | 'no_aplica' | '';
  nacionalidad: 'es' | 'ue' | 'extra';
  aniosResidencia: number;
  titulares: 1 | 2;
  dependientes: number;
  bebes: number;
  discapacidad: 'no' | 'menor33' | 'mayor33' | 'mayor65';
  ccaa: string;
  municipio: 'gran' | 'media' | 'pequena' | 'rural';
  viviendaActual: 'alquiler' | 'propietario' | 'familiar' | 'otro';
}

export interface DatosTitular {
  contrato: 'indefinido' | 'indefinido_parcial' | 'temporal' | 'funcionario' | 'autonomo' | 'pensionista' | 'desempleado' | 'sin_ingresos';
  antiguedad: number;
  sector: string;
  ingresosMensuales: number;
  pagasAnio: 12 | 14 | 15 | 16;
  otrosIngresos: number;
}

export interface DatosHistorialCrediticio {
  cirbe: 'no' | 'si_bajo' | 'si_medio' | 'si_alto';
  morosos: 'no' | 'si_saldado' | 'si_pendiente';
  impagos: 'no' | '1' | 'varios' | 'grave';
  relacionBancaria: number;
}

export interface DatosGastos {
  // Compromisos financieros
  gPersonal: number;
  gTarjetas: number;
  gLeasing: number;
  gPension: number;
  gAlquiler: number;
  gOtros: number;
  // Gastos de vida
  gAlimentacion: number;
  gSuministros: number;
  gTransporte: number;
  gEducacion: number;
  gSeguros: number;
  gOcio: number;
}

export interface DatosPatrimonio {
  ahorro: number;
  inversiones: number;
  inmuebles: number;
  vehiculos: number;
  planPension: number;
  otrosActivos: number;
  dPersonal: number;
  dTarjetas: number;
  dHipoteca: number;
  dOtros: number;
}

export interface DatosPrestamo {
  precioCompra: number;
  valorTasacion: number;
  tipologia: 'primera' | 'segunda' | 'inversion';
  tipoInmueble: 'piso' | 'casa' | 'obra_nueva' | 'vpo';
  certificadoEnergetico: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  provincia: string;
  importeFinanciar: number;
  plazoAnios: number;
  tipoInteres: 'fijo' | 'variable' | 'mixto';
  tae: number;
  diferencial: number;
  carenciaMeses: number;
  productosVinculados: string[];
}

export interface SolicitudCompleta {
  solicitante: DatosSolicitante;
  titular1: DatosTitular;
  titular2: DatosTitular;
  historial: DatosHistorialCrediticio;
  gastos: DatosGastos;
  patrimonio: DatosPatrimonio;
  prestamo: DatosPrestamo;
}

export interface FactorEvaluacion {
  label: string;
  valor: string;
  descripcion: string;
  estado: 'success' | 'warning' | 'danger' | 'info';
  puntos: number;
}

export interface ResultadoSolvencia {
  score: number;
  rating: 'A' | 'B' | 'C' | 'D';
  veredicto: string;
  condicion: 'approved' | 'conditional' | 'denied';
  ingresosTotalesMes: number;
  cuotaMensual: number;
  ratioEsfuerzo: number;
  ratioEsfuerzoConVida: number;
  ltv: number;
  pctEntrada: number;
  patrimonioNeto: number;
  rentaLibreResidual: number;
  edadFinHipoteca: number;
  factores: FactorEvaluacion[];
  recomendaciones: { tipo: 'success' | 'warning' | 'danger' | 'info'; mensaje: string }[];
  condicionesOrientativas: { concepto: string; valor: string }[];
  analisisRiesgo: AnalisisRiesgo;
}

export interface EscenarioRiesgo {
  titulo: string;
  probabilidad: 'alta' | 'media' | 'baja';
  impacto: 'critico' | 'alto' | 'medio' | 'bajo';
  descripcion: string;
  consecuencia: string;
  cuotaNueva?: number;
  esfuerzoNuevo?: number;
}

export interface AnalisisRiesgo {
  causasDenegacion: { causa: string; gravedad: 'bloqueante' | 'importante' | 'moderada'; detalle: string }[];
  consecuenciasConcesion: { titulo: string; tipo: 'financiero' | 'legal' | 'social'; descripcion: string }[];
  escenariosMacro: EscenarioRiesgo[];
  escenariosPersonales: EscenarioRiesgo[];
  puntosDebiles: string[];
  puntosAMejorar: { accion: string; impactoEsperado: string; dificultad: 'facil' | 'media' | 'dificil' }[];
}
