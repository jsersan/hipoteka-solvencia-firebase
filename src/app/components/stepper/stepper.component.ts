import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormularioService } from '../../services/formulario.service';

interface Paso { num: number; label: string; icon: string; }

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="stepper">
      @for (paso of pasos; track paso.num) {
        <div class="step-item" [class.done]="pasoActual() > paso.num" [class.active]="pasoActual() === paso.num">
          <div class="step-connector-left"
            [class.filled]="pasoActual() >= paso.num">
          </div>
          <button class="step-btn" (click)="irA(paso.num)" [disabled]="paso.num > pasoActual()">
            <div class="step-circle">
              @if (pasoActual() > paso.num) {
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              } @else {
                {{ paso.num }}
              }
            </div>
            <span class="step-label">{{ paso.label }}</span>
          </button>
          <div class="step-connector-right"
            [class.filled]="pasoActual() > paso.num">
          </div>
        </div>
      }
    </nav>
  `,
  styles: [`
    .stepper {
      display: flex;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding: 0;
      list-style: none;
    }
    .step-item {
      flex: 1;
      display: flex;
      align-items: center;
      flex-direction: column;
      position: relative;
    }
    .step-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      z-index: 1;
    }
    .step-btn:disabled { cursor: default; }
    .step-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid var(--color-border-secondary);
      background: var(--color-background-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-secondary);
      transition: all 0.25s;
    }
    .step-label {
      font-size: 10px;
      color: var(--color-text-secondary);
      text-align: center;
      white-space: nowrap;
    }
    .active .step-circle {
      background: #185FA5;
      border-color: #185FA5;
      color: #fff;
    }
    .active .step-label { color: #185FA5; font-weight: 500; }
    .done .step-circle {
      background: var(--color-background-success);
      border-color: var(--color-border-success);
      color: var(--color-text-success);
    }
    .step-connector-left,
    .step-connector-right {
      flex: 1;
      height: 1px;
      background: var(--color-border-tertiary);
      position: absolute;
      top: 14px;
    }
    .step-connector-left { right: 50%; left: 0; }
    .step-connector-right { left: 50%; right: 0; }
    .step-item:first-child .step-connector-left,
    .step-item:last-child .step-connector-right { display: none; }
    .filled { background: #185FA5; }
    @media (max-width: 500px) {
      .step-label { font-size: 8px; }
      .step-circle { width: 22px; height: 22px; font-size: 10px; }
    }
  `]
})
export class StepperComponent {
  pasos: Paso[] = [
    { num: 1, label: 'Solicitante', icon: '👤' },
    { num: 2, label: 'Ingresos', icon: '💼' },
    { num: 3, label: 'Gastos', icon: '📊' },
    { num: 4, label: 'Patrimonio', icon: '🏦' },
    { num: 5, label: 'Préstamo', icon: '🏠' },
    { num: 6, label: 'Resultado', icon: '📋' },
  ];

  constructor(private form: FormularioService) {}
  pasoActual = this.form.pasoActual;
  irA(n: number) { if (n <= this.form.pasoActual()) this.form.irAPaso(n); }
}
