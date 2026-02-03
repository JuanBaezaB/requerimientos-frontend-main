import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';




import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter
} from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CommonModule } from '@angular/common';
import { VisualizarDetalleStore } from '../../../../../shared/store/visualizar-requerimiento/visualizar-detalle.store';
import { VisualizarRespuestaStore } from '../../../../../shared/store/visualizar-requerimiento/visualizar-respuesta.store';
import { HeaderRespuestaVisualizarCoordinado } from "./header-respuesta/header-respuesta.component";
import { ListaArchivoRespuestaComponent } from "./lista-archivo-respuesta/lista-archivo-respuesta.component";
import { PlanAccionRespuestaComponent } from "./plan-accion-respuesta/plan-accion-respuesta.component";

@Component({
  selector: 'app-visualizacion-respuesta-coordinado',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
    PlanAccionRespuestaComponent,
    ListaArchivoRespuestaComponent,
    HeaderRespuestaVisualizarCoordinado
],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  templateUrl: './visualizacion-respuesta.component.html',
  styleUrl: './visualizacion-respuesta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualizacionRespuestaComponent {
  visualizarDetalleStore = inject(VisualizarDetalleStore);
  detalleVisualizar = signal(this.visualizarDetalleStore.obtenerDetalleDelRequerimientoVisualizar());

  visualizarRespuestaStore = inject(VisualizarRespuestaStore);

  headerDetalleVisualizar = computed(() => this.visualizarRespuestaStore.informacionHeaderRespuesta());

  constructor() {
    this.visualizarRespuestaStore.obtenerInfoRespuestaHeader();
    this.visualizarRespuestaStore.obtenerInfoRespuestaContenido(this.headerDetalleVisualizar()?.id!);
  }

}
