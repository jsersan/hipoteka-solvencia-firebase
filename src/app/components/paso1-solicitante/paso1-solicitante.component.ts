import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormularioService } from '../../services/formulario.service';
import { DatosSolicitante } from '../../models/solicitud.model';
import { FORM_STYLES } from '../shared-styles';

@Component({
  selector: 'app-paso1-solicitante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="section">
      <div class="section-title">Datos personales del solicitante</div>
      <div class="form-grid">
        <div class="form-group col-span-2">
          <label>Nombre completo</label>
          <input type="text" [(ngModel)]="datos.nombre" placeholder="Nombre y apellidos" (ngModelChange)="guardar()">
        </div>
        <div class="form-group">
          <label>Fecha de nacimiento</label>
          <input type="date" [(ngModel)]="datos.fechaNacimiento" (ngModelChange)="guardar()">
          @if (edad > 0) {
            <span class="hint">{{ edad }} años — fin hipoteca con {{ edad + plazoAnios }} años</span>
          }
        </div>
        <div class="form-group">
          <label>Estado civil</label>
          <select [(ngModel)]="datos.estadoCivil" (ngModelChange)="guardar()">
            <option value="">Seleccionar...</option>
            <option value="soltero">Soltero/a</option>
            <option value="casado">Casado/a</option>
            <option value="pareja">Pareja de hecho</option>
            <option value="divorciado">Divorciado/a</option>
            <option value="viudo">Viudo/a</option>
          </select>
        </div>
        <div class="form-group">
          <label>Régimen económico matrimonial</label>
          <select [(ngModel)]="datos.regimenEconomico" (ngModelChange)="guardar()">
            <option value="">Seleccionar...</option>
            <option value="gananciales">Sociedad de gananciales</option>
            <option value="separacion">Separación de bienes</option>
            <option value="no_aplica">No aplica</option>
          </select>
        </div>
        <div class="form-group">
          <label>Nacionalidad</label>
          <select [(ngModel)]="datos.nacionalidad" (ngModelChange)="guardar()">
            <option value="es">Española</option>
            <option value="ue">UE (otra)</option>
            <option value="extra">Extracomunitario/a</option>
          </select>
        </div>
        <div class="form-group">
          <label>Años de residencia en España</label>
          <input type="number" [(ngModel)]="datos.aniosResidencia" min="0" max="80" (ngModelChange)="guardar()">
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Composición de la unidad familiar</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Número de titulares de la hipoteca</label>
          <select [(ngModel)]="datos.titulares" (ngModelChange)="guardar()">
            <option [ngValue]="1">1 titular</option>
            <option [ngValue]="2">2 titulares (mejora el perfil)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Personas dependientes (hijos, mayores a cargo...)</label>
          <select [(ngModel)]="datos.dependientes" (ngModelChange)="guardar()">
            <option [ngValue]="0">Ninguna</option>
            <option [ngValue]="1">1 dependiente</option>
            <option [ngValue]="2">2 dependientes</option>
            <option [ngValue]="3">3 dependientes</option>
            <option [ngValue]="4">4 o más dependientes</option>
          </select>
        </div>
        <div class="form-group">
          <label>Menores de 3 años en la unidad</label>
          <select [(ngModel)]="datos.bebes" (ngModelChange)="guardar()">
            <option [ngValue]="0">Ninguno</option>
            <option [ngValue]="1">1</option>
            <option [ngValue]="2">2 o más</option>
          </select>
        </div>
        <div class="form-group">
          <label>Discapacidad reconocida en la unidad familiar</label>
          <select [(ngModel)]="datos.discapacidad" (ngModelChange)="guardar()">
            <option value="no">No</option>
            <option value="menor33">Sí — grado inferior al 33%</option>
            <option value="mayor33">Sí — grado ≥ 33%</option>
            <option value="mayor65">Sí — grado ≥ 65% (gran discapacidad)</option>
          </select>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Localización y situación residencial</div>
      <div class="form-grid-3">
        <div class="form-group">
          <label>Comunidad autónoma de residencia</label>
          <select [(ngModel)]="datos.ccaa" (ngModelChange)="guardar()">
            <option value="">Seleccionar...</option>
            <option value="mad">Madrid</option>
            <option value="cat">Cataluña</option>
            <option value="pv">País Vasco</option>
            <option value="nav">Navarra</option>
            <option value="val">C. Valenciana</option>
            <option value="and">Andalucía</option>
            <option value="gal">Galicia</option>
            <option value="ara">Aragón</option>
            <option value="ast">Asturias</option>
            <option value="can">Canarias</option>
            <option value="cant">Cantabria</option>
            <option value="clm">Castilla-La Mancha</option>
            <option value="cyl">Castilla y León</option>
            <option value="ext">Extremadura</option>
            <option value="bal">Islas Baleares</option>
            <option value="rio">La Rioja</option>
            <option value="mur">Murcia</option>
            <option value="other">Otra</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tipo de municipio</label>
          <select [(ngModel)]="datos.municipio" (ngModelChange)="guardar()">
            <option value="gran">Gran ciudad (&gt;500k hab.)</option>
            <option value="media">Ciudad media (50k–500k hab.)</option>
            <option value="pequena">Municipio pequeño (&lt;50k hab.)</option>
            <option value="rural">Rural</option>
          </select>
        </div>
        <div class="form-group">
          <label>Situación de vivienda actual</label>
          <select [(ngModel)]="datos.viviendaActual" (ngModelChange)="guardar()">
            <option value="alquiler">Arrendatario/a (alquiler)</option>
            <option value="propietario">Propietario/a</option>
            <option value="familiar">Con familiares (sin coste)</option>
            <option value="otro">Otra situación</option>
          </select>
        </div>
      </div>
    </div>

    <div class="btn-row">
      <span class="step-info">Paso 1 de 5</span>
      <button class="btn btn-primary" (click)="siguiente()">Continuar →</button>
    </div>
  `,
  styles: [FORM_STYLES]
})
export class Paso1SolicitanteComponent implements OnInit {
  datos!: DatosSolicitante;
  plazoAnios = 25;

  get edad(): number {
    if (!this.datos?.fechaNacimiento) return 0;
    return new Date().getFullYear() - new Date(this.datos.fechaNacimiento).getFullYear();
  }

  constructor(private form: FormularioService) {}

  ngOnInit() {
    // Copia local fresca en cada montaje del componente (el @switch lo destruye/recrea)
    const s = this.form.solicitud();
    this.datos = { ...s.solicitante };
    this.plazoAnios = s.prestamo.plazoAnios;
  }

  guardar() {
    this.form.actualizarSolicitante(this.datos);
  }

  siguiente() {
    this.guardar();
    this.form.siguiente();
  }
}
