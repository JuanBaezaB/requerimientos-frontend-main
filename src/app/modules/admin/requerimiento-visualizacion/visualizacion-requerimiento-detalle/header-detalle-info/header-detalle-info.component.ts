import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';




import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter
} from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


import { CommonModule, DatePipe } from '@angular/common';
import { VisualizarDetalleStore } from '../../../../../../shared/store/visualizar-requerimiento/visualizar-detalle.store';

@Component({
  selector: 'app-header-detalle-info',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
    DatePipe
],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  templateUrl: './header-detalle-info.component.html',
  styleUrl: './header-detalle-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderDetalleInfoComponent {
  visualizarDetalleStore = inject(VisualizarDetalleStore);
  detalleVisualizar = signal(this.visualizarDetalleStore.obtenerDetalleDelRequerimientoVisualizar());

  constructor() {
  }
}
