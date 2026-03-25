/* ============================================================
   Estilos compartidos para todos los pasos del formulario
   Importar en cada componente con styleUrls o ViewEncapsulation.None
   ============================================================ */

export const FORM_STYLES = `
  .section {
    background: var(--color-background-primary);
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: var(--border-radius-lg);
    padding: 1.25rem;
    margin-bottom: 1rem;
  }
  .section-title {
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 1rem;
    padding-bottom: 8px;
    border-bottom: 0.5px solid var(--color-border-tertiary);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .form-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }
  .col-span-2 { grid-column: 1 / -1; }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  label {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  input, select {
    width: 100%;
    padding: 7px 10px;
    border: 0.5px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md);
    font-size: 15px;
    background: var(--color-background-primary);
    color: var(--color-text-primary);
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;
  }
  input:focus, select:focus {
    border-color: #185FA5;
    box-shadow: 0 0 0 2px rgba(24, 95, 165, 0.12);
  }
  .hint {
    font-size: 12px;
    color: var(--color-text-tertiary);
    margin-top: 2px;
  }
  .btn-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
  }
  .btn {
    padding: 8px 20px;
    border-radius: var(--border-radius-md);
    border: 0.5px solid var(--color-border-secondary);
    background: var(--color-background-primary);
    color: var(--color-text-primary);
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }
  .btn:hover { background: var(--color-background-secondary); }
  .btn-primary {
    background: #185FA5;
    border-color: #185FA5;
    color: #fff;
  }
  .btn-primary:hover { background: #0C447C; }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }
  .badge-info {
    background: var(--color-background-info);
    color: var(--color-text-info);
  }
  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .tag {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 15px;
    border: 0.5px solid var(--color-border-secondary);
    cursor: pointer;
    background: var(--color-background-primary);
    color: var(--color-text-secondary);
    transition: all 0.2s;
    user-select: none;
  }
  .tag.selected {
    background: #185FA5;
    border-color: #185FA5;
    color: #fff;
  }
  .info-box {
    background: var(--color-background-info);
    border: 0.5px solid var(--color-border-info);
    border-radius: var(--border-radius-md);
    padding: 10px 14px;
    font-size: 15px;
    color: var(--color-text-info);
    margin-top: 8px;
  }
  .step-info {
    font-size: 15px;
    color: var(--color-text-tertiary);
  }
  @media (max-width: 600px) {
    .form-grid, .form-grid-3 { grid-template-columns: 1fr; }
    .col-span-2 { grid-column: auto; }
  }
`;
