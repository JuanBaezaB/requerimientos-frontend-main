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

import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RequerimientoStore } from '../../../../../../shared/store/requerimiento-admin/requerimiento.store';
import { CustomPaginator } from '../../../../../components/custom-paginador/custom-paginador.component';
import { DeleteAlertComponent } from '../../../../../components/delete-alert/delete-alert.component';
import { RequerimientoBusqueda } from '../../models/requerimiento.model';
import { CambioFechaDrawerComponenta } from "../cambio-fecha-drawer/cambio-fecha-drawer.component";


@Component({
  selector: 'app-tabla-root',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatDatepickerModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    DatePipe,
    MatTooltipModule,
    CambioFechaDrawerComponenta
],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
    { provide: MatPaginatorIntl, useClass: CustomPaginator}
  ],
  templateUrl: './tabla-root.component.html',
  styleUrl: './tabla-root.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablaRootComponent implements AfterViewInit {

  requerimientoStore = inject(RequerimientoStore);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['noRequerimiento', 'titulo', 'fechaDeVencimiento', 'estado', 'acciones'];
  dataTable = signal<RequerimientoBusqueda[]>([]);
  dataSource = new MatTableDataSource<RequerimientoBusqueda>([]);

  pageEvent: PageEvent | undefined;

  // Logica para el Drawer
  public drawerOpen = signal(false);
  elementoSeleccionado = signal({});

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    effect(() => {
      this.dataSource.data = this.requerimientoStore.requerimientos();
    })
  }
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  irAEditarRequerimiento(evento: RequerimientoBusqueda) {
    this.requerimientoStore.irADetalleRequerimiento(evento.id);
  }

  irAVisualizarRequerimiento(evento: RequerimientoBusqueda) {
    this.requerimientoStore.irAVirualizar(evento.id);
  }

  eliminarRequerimiento(evento: RequerimientoBusqueda) {
    const dialogRef = this.dialog.open(DeleteAlertComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.requerimientoStore.eliminarRequerimientoPorId(evento.id);
      }
    });
  }

  onPaginateChange(event: PageEvent) {
    this.requerimientoStore.setPagina(event.pageIndex + 1, event.pageSize);
  }

  cerrarCambioFecha() {
    this.drawerOpen.set(false);
  }

  abrirCambioFecha(evento: Event) {
    this.elementoSeleccionado.set(evento);
    this.drawerOpen.update(() => true);
  }

}
