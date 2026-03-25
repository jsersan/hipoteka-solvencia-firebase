# SolvenciaHipotecaria

Motor de análisis de solvencia para el estudio de crédito hipotecario.  
Desarrollado con **Angular 19** (standalone components, signals).

---

## Estructura del proyecto

```
src/
└── app/
    ├── models/
    │   └── solicitud.model.ts          # Interfaces TypeScript de toda la solicitud
    ├── services/
    │   ├── solvencia.service.ts        # Motor de scoring (lógica de negocio)
    │   └── formulario.service.ts       # Estado global del formulario (Signals)
    ├── components/
    │   ├── shared-styles.ts            # CSS compartido exportado como constante
    │   ├── stepper/
    │   │   └── stepper.component.ts    # Barra de progreso entre pasos
    │   ├── paso1-solicitante/
    │   │   └── paso1-solicitante.component.ts
    │   ├── paso2-ingresos/
    │   │   └── paso2-ingresos.component.ts
    │   ├── paso3-gastos/
    │   │   └── paso3-gastos.component.ts
    │   ├── paso4-patrimonio/
    │   │   └── paso4-patrimonio.component.ts
    │   ├── paso5-prestamo/
    │   │   └── paso5-prestamo.component.ts
    │   └── paso6-resultado/
    │       └── paso6-resultado.component.ts
    ├── app.component.ts                # Shell principal con @switch de pasos
    └── app.config.ts                   # ApplicationConfig (standalone bootstrap)
```

---

## Instalación y arranque

### Prerequisitos
- Node.js ≥ 18
- Angular CLI ≥ 19

```bash
# 1. Instalar Angular CLI globalmente (si no está instalado)
npm install -g @angular/cli

# 2. Entrar en el proyecto
cd hipoteca-solvencia

# 3. Instalar dependencias
npm install

# 4. Arrancar servidor de desarrollo
ng serve

# La aplicación estará disponible en http://localhost:4200
```

### Build de producción

```bash
ng build --configuration production
# Artefactos generados en dist/hipoteca-solvencia/
```

---

## Arquitectura y decisiones técnicas

### Angular 19 — Standalone Components
Todos los componentes usan `standalone: true`. No hay `NgModule`.  
Cada componente declara sus propias dependencias en el array `imports`.

### Gestión de estado con Signals
`FormularioService` usa `signal<SolicitudCompleta>()` para el estado reactivo.  
Los componentes leen y actualizan el estado a través del servicio sin necesidad de `@Input`/`@Output` entre pasos.

```typescript
// Leer estado reactivo
pasoActual = this.form.pasoActual;  // Signal<number>

// Actualizar parcialmente
this.form.actualizarSolicitante({ nombre: 'Juan García' });
```

### Control flow moderno (@switch, @if, @for)
Se usa la nueva sintaxis de control flow de Angular 17+, sin `*ngIf` ni `*ngFor`.

```html
@switch (pasoActual()) {
  @case (1) { <app-paso1-solicitante /> }
  @case (2) { <app-paso2-ingresos /> }
}
```

---

## Motor de Scoring

El `SolvenciaService` calcula un **score de 0 a 1000** basado en 8 factores ponderados:

| Factor | Rango de puntos | Peso aprox. |
|--------|----------------|-------------|
| Ratio de esfuerzo (cuota/ingresos) | −100 a +200 | 30% |
| LTV (Loan-to-Value) | −150 a +150 | 20% |
| Estabilidad laboral T1 | −200 a +175 | 20% |
| Historial crediticio | −400 a +130 | 15% |
| Patrimonio neto | −60 a +80 | 8% |
| Renta libre residual | −80 a +40 | 5% |
| Productos vinculados | 0 a +90 | bonif. |
| Penalizaciones (edad, dependientes) | 0 a −160 | correc. |

### Umbrales de rating

| Score | Rating | Veredicto |
|-------|--------|-----------|
| 750–1000 | A | Aprobado |
| 600–749 | B | Aprobado con condiciones |
| 450–599 | C | Estudio adicional requerido |
| 0–449 | D | Denegado |

---

## Flujo de la aplicación

```
Paso 1 — Datos personales y unidad familiar
    ↓
Paso 2 — Situación laboral, ingresos y historial crediticio
    ↓
Paso 3 — Compromisos financieros y gastos de vida
    ↓
Paso 4 — Activos, ahorros y deudas (patrimonio neto)
    ↓
Paso 5 — Inmueble, condiciones del préstamo y vinculación
    ↓
Paso 6 — Resultado: score, rating, factores y recomendaciones
```

---

## Posibles extensiones

- **Exportación a PDF** del informe de solvencia (jsPDF o backend)
- **Persistencia** en `localStorage` para retomar solicitudes
- **Comparador de escenarios** (ej: subir entrada vs. ampliar plazo)
- **Simulador de tipos** con evolución del Euríbor
- **Backend NestJS / Spring Boot** con base de datos de solicitudes
- **Autenticación** de analistas con roles (junior / senior / supervisor)
- **Internacionalización** `@angular/localize` para otros mercados

---

## Normativa de referencia

- Ley 5/2019, de 15 de marzo, reguladora de los contratos de crédito inmobiliario (LCCI)
- Circular 5/2012 del Banco de España (transparencia de servicios bancarios)
- EBA Guidelines on loan origination and monitoring (EBA/GL/2020/06)
- Reglamento (UE) 575/2013 (CRR) — tratamiento de exposiciones hipotecarias

---

> **Aviso:** Esta herramienta es de uso interno orientativo y no constituye oferta vinculante de financiación.
# hipoteka-solvencia-firebase
