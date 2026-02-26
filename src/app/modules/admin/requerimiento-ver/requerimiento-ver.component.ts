import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal
} from '@angular/core';


import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import { CommonModule, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTable, MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { RequerimientoVerStore } from '../../../../shared/store/requerimiento-admin/requerimiento-ver.store';

export enum TipoTitularesValues {
  TITULAR = 0b1000, // 8
  SUPLENTE = 0b0100, // 4
  FACTURACION = 0b0010, // 2
  GERENTE = 0b0001 // 1
}

export const TipoTitularesLabels = {
  [TipoTitularesValues.TITULAR]: 'Encargado titular',
  [TipoTitularesValues.SUPLENTE]: 'Encargado suplente',
  [TipoTitularesValues.FACTURACION]: 'Encargado facturación',
  [TipoTitularesValues.GERENTE]: 'Encargado gerente'
} as const;

@Component({
  selector: 'app-requerimiento-ver',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    MatProgressSpinnerModule,
    RouterModule,
    DatePipe,
    MatTable,
    MatTableModule,
    MatCheckboxModule,
    MatTooltipModule
],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  templateUrl: './requerimiento-ver.component.html',
  styleUrl: './requerimiento-ver.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequerimientoVerComponent implements OnInit{



  store = inject(RequerimientoVerStore);
  router = inject(Router);
  route = inject(ActivatedRoute);


  terminoBusqueda = signal('');

  maxFilasVisibles = 10;

  verMas = signal(false);

  // Estados locales
  readonly idRuta = toSignal(this.route.paramMap.pipe(map(params => params.get('id'))), { initialValue: null });


  filasVisibles = computed(() => {
    const todas = this.filasPlanAccion();
    if (!todas) {
      return [];
    }
    return this.verMas() ? todas : todas.slice(0, this.maxFilasVisibles);
  })

  interesados = computed(() => this.store.listaInteresados());
  idInteresados = computed(() => this.store.listaIdInteresados());
  listaIdInteresadosDelRequerimiento = computed(() => this.store.interesadoDelRequerimiento());

  coordinados = computed(() => {
    const interesadosList = this.interesados();
    const idInteresadosList = this.listaIdInteresadosDelRequerimiento();


    if (!interesadosList || !idInteresadosList) return [];

    return interesadosList.filter(interesado => idInteresadosList.some((i: any) => i.id === interesado.id));
  });

  coordinadorFiltrados = computed(() => {
    const termino = this.terminoBusqueda().toLowerCase().trim();
    const lista = this.coordinados();

    if (!termino) return lista;

    return lista.filter(coordinador => (coordinador.razonSocial ?? '').toLowerCase().includes(termino))
  });

  toggleVerMas() {
    this.verMas.update(v => !v);
  }

  constructor() {
    effect(() => {
      const id = this.idRuta();
      if (!id) {
        return
      }
      this.store.cargaRequerimiento(id);
    });
  }

  async ngOnInit() {
    this.store.obtenerListaInteresados();
  }


  readonly roles = Object.entries(TipoTitularesLabels).map(([value, label]) => ({
    value: Number(value),
    label
  }));

  readonly decodedRoles = computed(() => {
    const detalle = this.store.requerimientoDetalle();

    if (!detalle || typeof detalle.notificaciones !== 'number') return [];

    const values = this.decodeBitmask(detalle.notificaciones);

    const ordered = [
      TipoTitularesValues.TITULAR,
      ...values.filter(v => v !== TipoTitularesValues.TITULAR)
    ]

    return ordered
  });

  readonly selectedRolesLabels = computed(() => {
    const selectedValues = this.decodedRoles();

    return this.roles.filter(r => selectedValues.includes(r.value));
  })

  readonly selectLabel = computed(() => {
    const values = this.decodedRoles();

    if (values.length == 0) return 'Sin roles asignados';

    const firstLabel = this.roles.find(r => r.value === values[0])?.label ?? '';
    if (values.length === 1) return firstLabel;

    const extraCount = values.length - 1;
    return `${firstLabel} (+${extraCount} seleccionado${extraCount > 1 ? 's' : ''})`;
  })

  columnasPlanAccion = computed(() => {
    const detalle = this.store.requerimientoDetalle();

    if (!detalle?.formulario?.columnas) {
      return [];
    }

    return detalle.formulario.columnas.map((c: any) => c.nombre);
  })


  filasPlanAccion = computed(() => {
    const detalle = this.store.requerimientoDetalle();
    if (!detalle || !detalle.celdas || !detalle.formulario) return [];

    const columnas = detalle.formulario.columnas;

    const filas: any[] = [];

    const filasUnicas = [... new Set(detalle.celdas.map((c: any) => c.fila))];

    filasUnicas.forEach(filaNum => {
      const fila: any = {};
      columnas.forEach((col: any) => {
        const celda = detalle.celdas.find((c: any) => c.fila === filaNum && c.columna === col.numero);
        fila[col.nombre] = celda?.valor ?? null;
      });
      filas.push(fila)
    });

    return filas;
  });

  resaltarTexto(texto: string, termino: string): string {
    if (!termino) return texto;

    const regex = new RegExp(`(${termino})`, 'gi');
    return texto.replace(regex, '<span class="bg-yellow-200 font-semibold">$1</span>');
  }

  limpiarBusqueda() {
    this.terminoBusqueda.set('');
  }

  async descargarDocumentoRequerimientoPorOrden(id: string, tipo: string, orden: string) {
    const url = await this.store.obtenerUrlPrefirmadaParaDescargar(id, tipo, orden);
    if (url) {
      this.store.descargarDocumento(url).then((archivo) => {
        if (!archivo) {
        }
      });
    }
  }

  async descargarSolicitudAdjunto(id: string, tipo: string, orden: string) {
    const url = await this.store.obtenerUrlPrefirmadaParaDescargar(id, tipo, orden);
    if (url) {
      this.store.descargarDocumento(url).then((archivo) => {
        if (!archivo) {
        }
      });
    }
  }

  volverAlAdministradorHome() {
    this.router.navigate(['/requerimiento/admin']);
  }

  private decodeBitmask(bitmask: number): number[]{
      const selected: number[] = [];

      if (bitmask & TipoTitularesValues.TITULAR) {
        selected.push(TipoTitularesValues.TITULAR);
      }

      if (bitmask & TipoTitularesValues.SUPLENTE) {
        selected.push(TipoTitularesValues.SUPLENTE);
      }

      if (bitmask & TipoTitularesValues.FACTURACION) {
        selected.push(TipoTitularesValues.FACTURACION);
      }

      if (bitmask & TipoTitularesValues.GERENTE) {
        selected.push(TipoTitularesValues.GERENTE);
      }

      return selected;
    }
}
