import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { InteresadoRespuestaResponse } from '../../../../../../shared/services/requerimientos.service';
import { RequerimientoStore } from '../../../../../../shared/store/requerimiento-admin/requerimiento.store';
import { VisualizarDetalleStore } from '../../../../../../shared/store/visualizar-requerimiento/visualizar-detalle.store';
import { VisualizarRespuestaStore } from '../../../../../../shared/store/visualizar-requerimiento/visualizar-respuesta.store';
import { CustomPaginator } from '../../../../../components/custom-paginador/custom-paginador.component';
import { DetalleVerRespuesta, RequerimientoVisualizarDetalle } from '../../../requerimiento-root/models/requerimiento-visualizar.model';

@Component({
  selector: 'app-tabla-visualizacion-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatDatepickerModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    DatePipe,
    MatTooltipModule,
    FormsModule,
    MatCheckboxModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
    { provide: MatPaginatorIntl, useClass: CustomPaginator },
  ],
  templateUrl: './tabla-detalle-visualizacion.component.html',
  styleUrl: './tabla-detalle-visualizacion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablaDetalleVisualizacionComponent {
  requerimientoStore = inject(RequerimientoStore);
  visualizarDetalleStore = inject(VisualizarDetalleStore);
  visualizarRespuestaStore = inject(VisualizarRespuestaStore);

  detalleVisualizar = signal(this.visualizarDetalleStore.obtenerDetalleDelRequerimientoVisualizar());
  displayedColumns: string[] = ['indice', 'rut', 'coordinado', 'respuesta', 'fecha', 'descargar', 'acciones'];

  // paginación
  pageIndex = signal(0);
  pageSize = signal(10);

  // fuente de datos (derivada del store)
  private sortedData = computed(() => this.visualizarDetalleStore.sortedData() ?? []);

  // selección (solo IDs, local)
  private selectedIdsSet = signal<Set<string>>(new Set());

  // computado: mezcla los datos del store con el estado de selección
  combinedData = computed(() =>
    this.sortedData().map(item => ({
      ...item,
      selected: this.selectedIdsSet().has(item.id),
    }))
  );

  // computed para paginado manual
  pagedData = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    return this.combinedData().slice(start, end);
  });

  dataSource = new MatTableDataSource<(InteresadoRespuestaResponse & { selected?: boolean })>([]);

  // contadores
  totalCount = computed(() => {
    const data = this.sortedData();

    // this.sortedData().length
    return data.filter(item => item.respuestas?.length > 0).length;
  });

  totalPaginateCount = computed(() => {
    return this.sortedData().length;
  })
  selectedCount = computed(() => {
    const selectedIds = this.selectedIdsSet();
    const data = this.sortedData();
    return data.filter(item => selectedIds.has(item.id) && item.respuestas?.length > 0).length;
  });
  mostrarWidget = computed(() => this.selectedCount() > 1);

  // output
  selectionChange = output<{ ids: string[]; validCount: number}>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    // actualizar la data de la tabla cada vez que cambie el paginado o el store
    effect(() => {
      this.dataSource.data = this.pagedData();
    });

    // emitir selección al padre
    effect(() => {
      this.selectionChange.emit({ids:[...this.selectedIdsSet()], validCount: this.selectedCount()});
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  // --- MÉTODOS DE SELECCIÓN ---

  toggleRowSelection(id: string, checked: boolean): void {
    const newSet = new Set(this.selectedIdsSet());
    if (checked) newSet.add(id);
    else newSet.delete(id);
    this.selectedIdsSet.set(newSet);
  }

  toggleAllSelection(event: MatCheckboxChange): void {
    const checked = event.checked;
    const newSet = new Set<string>();
    if (checked) {
      this.sortedData().forEach(item => newSet.add(item.id));
    }
    this.selectedIdsSet.set(newSet);
  }

  seleccionarTodos(): void {
    const newSet = new Set(this.sortedData().map(i => i.id));
    this.selectedIdsSet.set(newSet);
  }

  isAllSelected(): boolean {
    const total = this.totalCount();
    const selected = this.selectedCount();
    return total > 0 && selected === total;
  }

  isIndeterminate(): boolean {
    const total = this.totalCount();
    const selected = this.selectedCount();
    return selected > 0 && selected < total;
  }

  onPaginateChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  getSeleccionados(): InteresadoRespuestaResponse[] {
    const ids = this.selectedIdsSet();
    return this.sortedData().filter(i => ids.has(i.id));
  }

  // --- OTRAS ACCIONES ---
  obtenerUrlArchivoDeCoordinador(id: string, element: any) {
    this.visualizarRespuestaStore.obtenerUrlPrefirmadaPorCoordinado(id, element.rut);
  }

  onSortChange(sort: Sort) {
    this.visualizarDetalleStore.setSort({
      active: sort.active,
      direction: sort.direction || '',
    });
  }

  irAVisualizarRequerimiento(evento: RequerimientoVisualizarDetalle) {
    const infoRespuesta: DetalleVerRespuesta = {
      id: evento.id,
      rut: evento.rut,
      nombre: evento.nombre,
      numeroRequerimiento: this.detalleVisualizar()?.noRequerimiento!,
      fechaVencimiento: this.detalleVisualizar()?.fechaDeVencimiento!,
      tipoRespuesta: this.detalleVisualizar()?.tipo!,
      titulo: this.detalleVisualizar()?.titulo!,
      destinatarioId: evento.interesadoId,
    };
    this.visualizarRespuestaStore.irAVisualizarRespuestaCoordinado(infoRespuesta);
  }
}
