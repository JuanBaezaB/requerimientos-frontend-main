import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { RequerimientoVisualizarBusqueda, RequerimientoVisualizarDetalle } from '../../../app/modules/admin/requerimiento-root/models/requerimiento-visualizar.model';
import { RespuestaRequerimiento } from '../../entities/respuesta-enum';
import { InteresadoDelRequerimiento, InteresadoRespuestaResponse, RequerimientoService } from '../../services/requerimientos.service';

const STORAGE_KEY = 'visualizar-detalle-requerimiento';
const STORAGE_FILTER_KEY = 'visualizar-requerimiento-filtros';
const STORAGE_DETALLE_ID_KEY = 'visualizar-detalle-id';


const RESPUESTAS = [RespuestaRequerimiento.SI, RespuestaRequerimiento.NO];

const hoy = new Date();
const haceUnAnio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
const dentroDeUnAnio = new Date(hoy.getFullYear() + 1, hoy.getMonth(), hoy.getDate());

function fmtDMY(d: Date) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}


type VisualizarDetalleState = {
  requerimientoId: string | null;
  requerimientoDetalleVisualizar: RequerimientoVisualizarBusqueda | null,
  visualizarDetalleTipoRequerimiento: RequerimientoVisualizarDetalle | null,
  respuestas: string[];
  cargandoListaInteresados: boolean;
  listaInteresados: InteresadoDelRequerimiento[];
  listaIdsDeInteresados: string[];
  errorAlObtenerListaInteresados: boolean;
  rangoInicio: Date;
  rangoFin: Date;
  cargandoTabla: boolean;
  tablaRespuestaInteresados: InteresadoRespuestaResponse[] | null,
  warningSinResultados: boolean,
  errorAlCargarTabla: boolean;
  enviandoRecordatorio: boolean;
  errorEnviarRecordatorio: boolean;
  sortActive: string | null;
  sortDirection: 'asc' | 'desc' | '';
};

const initialState: VisualizarDetalleState = {
  requerimientoId: null,
  requerimientoDetalleVisualizar: null,
  visualizarDetalleTipoRequerimiento: null,
  respuestas: [],
  cargandoListaInteresados: false,
  listaInteresados: [],
  listaIdsDeInteresados: [],
  errorAlObtenerListaInteresados: false,
  rangoInicio: haceUnAnio,
  rangoFin: dentroDeUnAnio,
  cargandoTabla: false,
  tablaRespuestaInteresados: null,
  warningSinResultados: false,
  errorAlCargarTabla: false,
  enviandoRecordatorio: false,
  errorEnviarRecordatorio: false,
  sortActive: null,
  sortDirection: '',
};

function loadInitialState(): VisualizarDetalleState{
  const stored = sessionStorage.getItem(STORAGE_KEY);
  const storedId = sessionStorage.getItem(STORAGE_DETALLE_ID_KEY);
  return stored ? {
    requerimientoDetalleVisualizar: JSON.parse(stored),
    visualizarDetalleTipoRequerimiento: null,
    requerimientoId: storedId ?? null,
    cargandoListaInteresados: false,
    respuestas: [],
    listaInteresados: [],
    listaIdsDeInteresados: [],
    errorAlObtenerListaInteresados: false,
    rangoInicio: haceUnAnio,
    rangoFin: dentroDeUnAnio,
    cargandoTabla: false,
    tablaRespuestaInteresados: null,
    warningSinResultados: false,
    errorAlCargarTabla: false,
    enviandoRecordatorio: false,
    errorEnviarRecordatorio: false,
    sortActive: null,
    sortDirection: ''
  } : {
      ...initialState
  }
}

function compare(a: string | number | Date, b: string | number | Date, isAsc: boolean): number{
  if (a == null && b != null) {
    return -1 * (isAsc ? 1 : -1);
  }

  if (b == null && a != null) {
    return 1 * (isAsc ? 1 : -1);
  }

  if (a == null && b == null) {
    return 0;
  }

  return (a < b ? -1 : 1) * (isAsc ? 1 : -1)
}

export const VisualizarDetalleStore = signalStore(
  { providedIn: 'root' },
  withState(loadInitialState()),
  withComputed((store) => ({
    obtenerDetalleDelRequerimientoVisualizar: computed(() => store.requerimientoDetalleVisualizar()),
    tablaDataSource: computed(() => {
      const data = store.tablaRespuestaInteresados() ?? [];
      return data.map(item => ({ ...item, selected: item.selected ?? false }));
    }),
    sortedData: computed(() => {
      const data = store.tablaRespuestaInteresados() ?? [];
      const sortActive = store.sortActive();
      const sortDirection = store.sortDirection();

      if (!sortActive || sortDirection === '') {
        return data;
      }

      const isAsc = sortDirection === 'asc';


      return [...data].sort((a, b) => {
        switch (sortActive) {
          case 'rut':
            return compare(a.rut, b.rut, isAsc);
          case 'coordinado':
            return compare(a.nombre, b.nombre, isAsc)
          case 'respuesta':
            const aTieneRespuesta = a.respuestas?.length > 0;
            const bTieneRespuesta = b.respuestas?.length > 0;

            if (aTieneRespuesta === bTieneRespuesta) {
              return 0;
            }

            return (aTieneRespuesta ? 1 : -1) * (isAsc ? 1 : -1);
          case 'fecha':
            const aTieneFecha = a.respuestas?.length > 0;
            const bTieneFecha = b.respuestas?.length > 0;

            if (aTieneFecha !== bTieneFecha) {
              return (aTieneFecha ? 1 : -1) * (isAsc ? 1 : -1);
            }

            if (!aTieneFecha && !bTieneFecha) {
              return 0;
            }

            const fechaA = new Date(a.respuestas[0].fecha);
            const fechaB = new Date(b.respuestas[0].fecha);
            return compare(fechaA, fechaB, isAsc)
          default:
            return 0;
        }
      })

    }),
    isAllSelected: computed(() => RESPUESTAS.every(s => store.respuestas().includes(s))),
    startAt: computed(() => store.rangoInicio()),
    endAt: computed(() => store.rangoFin()),
    rangoEstado: computed<'vacio' | 'completo' | 'incompleto'>(() => {
      const ini = store.rangoInicio();
      const fin = store.rangoFin();
      if (!ini && !fin) return 'vacio';
      if (ini && fin) return 'completo';
      return 'incompleto';
    }),
    rangoIncompleto: computed(() => {
      const ini = store.rangoInicio();
      const fin = store.rangoFin();
      return (ini && !fin) || (!ini && fin);
    }),
    rangoDisplay: computed(() => {
      const ini = store.rangoInicio();
      const fin = store.rangoFin();
      return (ini && fin) ? `${fmtDMY(ini)} - ${fmtDMY(fin)}` : '';
    }),
    minDate: computed(() => {
      const hoy = new Date();
      return new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
    }),
    maxDate: computed(() => {
      const hoy = new Date();
      return new Date(hoy.getFullYear() + 1, hoy.getMonth(), hoy.getDate());
    }),

  })),
  withMethods(
    (
      store,
      router = inject(Router),
      requerimientoService = inject(RequerimientoService)
    ) => ({
      setSort(sort: { active: string; direction: 'asc' | 'desc' | '' }) {
        patchState(store, {sortActive: sort.active, sortDirection: sort.direction})
      },
      irADetalleRequerimientoVisualizar(evento:RequerimientoVisualizarBusqueda ) {
        patchState(store, { requerimientoDetalleVisualizar: evento, requerimientoId: evento.id });
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(evento));
        sessionStorage.setItem(STORAGE_DETALLE_ID_KEY, evento.id);
        router.navigate([`/requerimiento/admin/detalle/${evento.id}`])
      },
      limpiarVisualizarDetalleRequerimiento() {
        patchState(store, { ...initialState });
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_DETALLE_ID_KEY);
      },
      setRangoFechas(inicio: Date, fin: Date) {
        patchState(store, { rangoInicio: inicio, rangoFin: fin });
      },
      obtenerListaDeInteresados(requerimientoId: string) {
        patchState(store, { cargandoListaInteresados: true, requerimientoId: requerimientoId });
        requerimientoService.obtenerInteresadosDelRequerimiento(requerimientoId).subscribe(({
          next: (resultado) => {
            patchState(store, {cargandoListaInteresados: false, listaInteresados: resultado, errorAlObtenerListaInteresados: false})
          },
          error: (err) => {
            patchState(store, {cargandoListaInteresados: false, listaInteresados: [], errorAlObtenerListaInteresados: true})
          }
        }))
      },
      obtenerInteresadosPorFiltros(fechaInicio: string,
        fechaTermino: string,
        respuestas: string[],
        listaIdsInteresados: string[]) {

        const listaFiltradaIdsInteresados = listaIdsInteresados.filter(id => id !== '__ALL__').map(id => ({id}));

        patchState(store, { cargandoTabla: true });

        requerimientoService.obtenerInteresadosParaTabla(
          store.requerimientoId()!,
          fechaInicio,
          fechaTermino,
          respuestas,
          listaFiltradaIdsInteresados,
        ).subscribe(({
          next: (tabla) => {
            if (tabla.length > 0) {
              patchState(store, { cargandoTabla: false, tablaRespuestaInteresados: tabla, warningSinResultados: false, errorAlCargarTabla: false })
              return;
            }
            patchState(store, { cargandoTabla: false, tablaRespuestaInteresados: tabla, warningSinResultados: true, errorAlCargarTabla: false })
          },
          error: () => {
            patchState(store, {cargandoTabla: false, tablaRespuestaInteresados: null, errorAlCargarTabla: true})
          }
        }))
      },
      buscarConFiltros() {
        let fechaInicio = new Date(store.rangoInicio().setHours(0, 0, 0, 0)).toISOString();
        let fechaFin = new Date(store.rangoFin().setHours(23, 59, 59, 999)).toISOString();

        const ini = fechaInicio;
        const fin = fechaFin;
        const respuestas = store.respuestas() ?? [];
        const listaIdsInteresados = store.listaIdsDeInteresados() || [];

        this.obtenerInteresadosPorFiltros(
          ini,
          fin,
          respuestas,
          listaIdsInteresados
        );
      },
      setFiltros(payload: {
              listaIdsInteresados: string[]
              rangoInicio?: Date | null,
              rangoFin?: Date | null,
            }) {
        const newState = {
                listaIdsInteresados: payload.listaIdsInteresados ?? [],
                rangoInicio: payload.rangoInicio ?? store.rangoInicio(),
                rangoFin: payload.rangoFin ?? store.rangoFin(),
              };
              patchState(store, newState);

              sessionStorage.setItem(STORAGE_FILTER_KEY, JSON.stringify({
                rangoInicio: newState.rangoInicio?.toISOString(),
                rangoFin: newState.rangoFin?.toISOString(),
              }));
            },
      rehidratarFiltros() {
        const raw = sessionStorage.getItem(STORAGE_FILTER_KEY);
        if (!raw) return;

        try {
          const saved = JSON.parse(raw);
          patchState(store, {
            rangoInicio: saved.rangoInicio ? new Date(saved.rangoInicio) : haceUnAnio,
            rangoFin: saved.rangoFin ? new Date(saved.rangoFin) : dentroDeUnAnio,
          });
        } catch (e) {
        }
      },
      async enviarRecordatorioAInteresados(): Promise<boolean> {
        patchState(store, { enviandoRecordatorio: true });
        try {
          await firstValueFrom(requerimientoService.enviarRecordatorioAInteresados(store.requerimientoId()!));
          patchState(store, { enviandoRecordatorio: false, errorEnviarRecordatorio: false });
          return true;
        } catch (_) {
          patchState(store, { enviandoRecordatorio: false, errorEnviarRecordatorio: true });
          return false;
        }
      },
    }),
  ),
);
