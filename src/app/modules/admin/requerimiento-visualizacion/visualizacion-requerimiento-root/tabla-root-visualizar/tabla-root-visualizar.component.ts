import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  ViewChild
} from '@angular/core';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { CommonModule } from '@angular/common';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RequerimientoVisualizarTablaStore } from '../../../../../../shared/store/requerimiento-admin/requerimiento-visualizar.store';
import { VisualizarDetalleStore } from '../../../../../../shared/store/visualizar-requerimiento/visualizar-detalle.store';
import { VisualizarRespuestaStore } from '../../../../../../shared/store/visualizar-requerimiento/visualizar-respuesta.store';
import { CustomPaginator } from '../../../../../components/custom-paginador/custom-paginador.component';
import { RequerimientoVisualizarBusqueda } from '../models/requerimiento-visualizar.model';


@Component({
  selector: 'app-tabla-visualizar-root',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatDatepickerModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
    { provide: MatPaginatorIntl, useClass: CustomPaginator}
  ],
  templateUrl: './tabla-root-visualizar.component.html',
  styleUrl: './tabla-root-visualizar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablaRootVisualizarComponent implements AfterViewInit {

  requerimientoTablaVisualizarStore = inject(RequerimientoVisualizarTablaStore);
  visualizarDetalleStore = inject(VisualizarDetalleStore);
  visualizarRespuestaStore = inject(VisualizarRespuestaStore);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['noRequerimiento', 'titulo', 'fechaDeVencimiento', 'estado', 'respondidos','pendientes','total','acciones'];
  dataTable = signal<RequerimientoVisualizarBusqueda[]>([]);
  dataSource = new MatTableDataSource<RequerimientoVisualizarBusqueda>([]);

  pageEvent: PageEvent | undefined;

  // Logica para el Drawer
  public drawerOpen = signal(false);
  elementoSeleccionado = signal({});

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    effect(() => {
      this.dataSource.data = this.requerimientoTablaVisualizarStore.requerimientos();
    })
  }
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  irAVisualizarRequerimiento(evento: RequerimientoVisualizarBusqueda) {
    this.visualizarRespuestaStore.setRequerimientoId(evento.id);
    this.visualizarDetalleStore.irADetalleRequerimientoVisualizar(evento);
  }

  onPaginateChange(event: PageEvent) {
    this.requerimientoTablaVisualizarStore.setPagina(event.pageIndex + 1, event.pageSize);
  }

  cerrarCambioFecha() {
    this.drawerOpen.set(false);
  }

  abrirCambioFecha(evento: Event) {
    this.elementoSeleccionado.set(evento);
    this.drawerOpen.update(() => true);
  }

}
