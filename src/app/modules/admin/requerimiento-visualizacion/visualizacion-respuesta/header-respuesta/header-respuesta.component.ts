import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';
import { VisualizarRespuestaStore } from './../../../../../../shared/store/visualizar-requerimiento/visualizar-respuesta.store';




import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter
} from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-header-respuesta-visualizar-coordinado',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
    DatePipe,
],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  templateUrl: './header-respuesta.component.html',
  styleUrl: './header-respuesta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderRespuestaVisualizarCoordinado {

  visualizarRespuestaStore = inject(VisualizarRespuestaStore);

  headerDetalleVisualizar = computed(() => this.visualizarRespuestaStore.informacionHeaderRespuesta());

  constructor() {
  }

}
