import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { VisualizarRespuestaStore } from '../../../../../../shared/store/visualizar-requerimiento/visualizar-respuesta.store';

@Component({
  selector: 'app-plan-accion-respuesta-coordinado',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCheckboxModule],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  templateUrl: './plan-accion-respuesta.component.html',
  styleUrls: ['./plan-accion-respuesta.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanAccionRespuestaComponent {
  private store = inject(VisualizarRespuestaStore);

  celdasRespuesta = computed(() => this.store.obtenerCeldasComputed());
  requerimientoRespuesta = computed(() => this.store.obtenerRequerimientoRespuestaComputed());

  columnasVisibles = computed(() => {
    const req = this.requerimientoRespuesta();
    return req?.formulario?.columnas ?? [];
  });

  displayedColumns = computed(() => this.columnasVisibles()!.map(c => c.nombre));

  dataSource = computed(() => {
    const formulario = this.requerimientoRespuesta();

    if (!formulario) {
       return [];
    }


    const columnas = formulario.formulario.columnas;
    const celdasBase = formulario.celdas ?? [];
    const celdasRespuesta = this.celdasRespuesta();

    if (!celdasRespuesta?.length || !columnas?.length) {
      return [];
    }

    const filasMap = new Map<number, any>();

    for (const celda of celdasRespuesta) {
      if (!filasMap.has(celda.fila)) {
        filasMap.set(celda.fila, {});
      }

      const fila = filasMap.get(celda.fila);

      const columna = columnas?.find(col => col.numero === celda.columna);

      if (columnas) {
        fila[columna!.nombre] = this.formatearValor(celda.valor, columna!.tipo)
      }
    }

    const colSeguimiento = columnas?.find(c => c.numero === 5);
    if (colSeguimiento) {
      const celdasSeguimientoBase = celdasBase.filter((c) => c.columna === 5);
      for (const celda of celdasSeguimientoBase) {
        const fila = filasMap.get(celda.fila);
        if (fila) {
          fila[colSeguimiento.nombre] = celda.valor === 'true' ? 'Sí' : 'No';
        }
      }
    }

    return Array.from(filasMap.values());
  })


  private formatearValor(valor: any, tipo: string) {
    if (valor == null) return '';

    switch (tipo) {
      case 'date':
        const date = new Date(valor);
        const parts = new Intl.DateTimeFormat('es-CO', {
          timeZone: 'UTC',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).formatToParts(date);

        const day = parts.find(p => p.type === 'day')?.value ?? '';
        const month = parts.find(p => p.type === 'month')?.value ?? '';
        const year = parts.find(p => p.type === 'year')?.value ?? '';
        return `${day}-${month}-${year}`
      case 'boolean':
        return valor === 'true' || valor === true ? 'Sí' : 'No';
      default:
        return valor;
    }
  }
}
