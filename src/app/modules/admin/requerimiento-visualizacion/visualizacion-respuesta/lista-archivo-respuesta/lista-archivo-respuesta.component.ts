import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';

import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter
} from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CommonModule } from '@angular/common';
import { Adjunto } from '../../../../../../shared/models/respuesta.model';
import { VisualizarRespuestaStore } from '../../../../../../shared/store/visualizar-requerimiento/visualizar-respuesta.store';

@Component({
  selector: 'app-lista-archivo-respuesta-coordinado',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  templateUrl: './lista-archivo-respuesta.component.html',
  styleUrl: './lista-archivo-respuesta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaArchivoRespuestaComponent {

  visualizarRespuestaStore = inject(VisualizarRespuestaStore);

  adjuntos = computed(() => this.visualizarRespuestaStore.obtenerAdjuntosComputed());
  respuestaId = computed(() => this.visualizarRespuestaStore.respuestaId());

  descargarArchivo(adjunto: Adjunto) {
    this.visualizarRespuestaStore.descargarArchivoRespuestaPorOrden(this.respuestaId()!, adjunto.orden);
  }

}
