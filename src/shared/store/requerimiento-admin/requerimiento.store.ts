import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { Observable } from 'rxjs';
import { RequerimientoAdapter } from '../../../app/modules/admin/requerimiento-root/adapter/requerimiento.adapter';
import { RequerimientoBusqueda } from '../../../app/modules/admin/requerimiento-root/models/requerimiento.model';
import { EstadoRequerimiento } from '../../entities/estados-enum';
import { SugerenciaCorrelativo } from '../../entities/sugerencia-correlativo.entity';
import { SugerenciaTitulo } from '../../entities/sugerencia-titulo.entity';
import { RequerimientoTablaService } from '../../services/requerimiento-tabla.service';
import { RequerimientoFiltrosService } from '../../services/requerimientos-filtros.service';
import { RequerimientoService } from '../../services/requerimientos.service';


type RequerimientoState = {
  estados: string[];
  numeroTerm: string;
  tituloTerm: string;
  cargandoNumeros: boolean;
  cargandoTitulos: boolean;
  opcionesNumero: SugerenciaCorrelativo[];
  opcionesTitulo: SugerenciaTitulo[];
  rangoInicio: Date;
  rangoFin: Date;
  requerimientos: RequerimientoBusqueda[];
  cargandoTabla: boolean;
  cambiandoFecha: boolean;
  seCambioFecha: boolean | null;
  metadata: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  }
};

const hoy = new Date();
const haceUnAnio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
const dentroDeUnAnio = new Date(hoy.getFullYear() + 1, hoy.getMonth(), hoy.getDate());

const ESTADOS = [EstadoRequerimiento.PUBLICADO, EstadoRequerimiento.BORRADOR, EstadoRequerimiento.CERRADO];

const STORAGE_FILTER_KEY = 'requerimiento-filtros';

const initialState: RequerimientoState = {
  estados: [],
  numeroTerm: '',
  tituloTerm: '',
  cargandoNumeros: false,
  cargandoTitulos: false,
  opcionesNumero: [],
  opcionesTitulo: [],
  rangoInicio: haceUnAnio,
  rangoFin: dentroDeUnAnio,
  requerimientos: [],
  cargandoTabla: false,
  cambiandoFecha: false,
  seCambioFecha: null,
  metadata: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1
  }
};

function fmtDMY(d: Date) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export const RequerimientoStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    estadoDisplay: computed(() => {
      return (store.estados() || []).filter(v => v !== '__ALL__').map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
    }),
    isAllSelected: computed(() => ESTADOS.every(s => store.estados().includes(s))),
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
      requerimientoFiltroService = inject(RequerimientoFiltrosService),
      requerimientoTablaService = inject(RequerimientoTablaService),
      requerimientoService = inject(RequerimientoService),
      router = inject(Router),
    ) => ({
      obtenerNumeros(term: string, fechaInicio: string, fechaTermino: string): Observable<SugerenciaCorrelativo[]> {
        return requerimientoFiltroService.obtenerNumeros(term, fechaInicio, fechaTermino);
      },
      obtenerTitulos(term: string, fechaInicio: string, fechaTermino: string): Observable<SugerenciaTitulo[]>{
        return requerimientoFiltroService.obtenerTitulos(term, fechaInicio, fechaTermino);
      },
      setRangoFechas(inicio: Date, fin: Date) {
        patchState(store, { rangoInicio: inicio, rangoFin: fin });
      },
      resetRangoFechas() {
        patchState(store, { rangoInicio: haceUnAnio, rangoFin: dentroDeUnAnio });
      },
      getRangoFechasISO(): { inicio?: string, fin?: string } | undefined {
        const ini = store.rangoInicio();
        const fin = store.rangoFin();
        if (!ini && !fin) return undefined;
        return {
          ...(ini ? { inicio: new Date(ini.setHours(0,0,0,0)).toISOString() } : {}),
          ...(fin ? { fin: new Date(fin.setHours(23,59,59,999)).toISOString() }:{}),
        };
      },
      setOpcionesNumero(opciones: SugerenciaCorrelativo[]) {
        patchState(store, { opcionesNumero: opciones });
      },
      setOpcionesTitulo(opciones: SugerenciaTitulo[]) {
        patchState(store, { opcionesTitulo: opciones });
      },
      normalizarFecha(fechaIso: string | Date | null | undefined): Date | null {
        if (!fechaIso) return null;

        // Si viene como Date, clonamos solo con año/mes/día
        if (fechaIso instanceof Date) {
          return new Date(fechaIso.getFullYear(), fechaIso.getMonth(), fechaIso.getDate());
        }

        // Si viene como string ISO
        if (typeof fechaIso === 'string') {
          const d = new Date(fechaIso);
          if (isNaN(d.getTime())) return null;
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }

        return null;
      },
      obtenerRequerimientoPorFiltros(fechaInicio: string,
        fechaTermino: string,
        estados: string[],
        correlativo?: string,
        titulo?: string, limite: number = 10, pagina: number = 1) {

        patchState(store, { cargandoTabla: true });

        requerimientoFiltroService.obtenerRequerimientosParaTabla({
          correlativo: correlativo ?? '',
          titulo: titulo ?? '',
          estados: estados && estados.length > 0 ? estados.join(',') : '',
          fechaInicio: fechaInicio ?? '',
          fechaFin: fechaTermino ?? '',
          limite: limite,
          pagina: pagina
        }).subscribe(({
          next: (resultadosDto) => {
            const dataNormalizada = resultadosDto.data.map((item: any) => ({
              ...item,
              fechaDeVencimiento: this.normalizarFecha(item.vencimiento),
              vencimiento: this.normalizarFecha(item.vencimiento)
            }));
            const adaptados = RequerimientoAdapter.fromApiList(dataNormalizada);
            patchState(store, {
              requerimientos: adaptados,
              cargandoTabla: false,
              metadata: {
                currentPage: resultadosDto.metadata.currentPage,
                itemsPerPage: resultadosDto.metadata.itemsPerPage,
                totalItems: resultadosDto.metadata.totalItems,
                totalPages: resultadosDto.metadata.totalPages,
              }
            });
          },
          error: () => {
            patchState(store, {
              requerimientos: [],
              cargandoTabla: false,
              metadata: {
                currentPage: 1,
                itemsPerPage: 10,
                totalItems: 0,
                totalPages: 1,
              }
            })
          },
        }));
      },
      irADetalleRequerimiento(id: string) {
        router.navigate([`/requerimiento/admin/editar/${id}`]);
      },
      irAVirualizar(id: string) {
        router.navigate([`/requerimiento/admin/ver/${id}`]);
      },
      setFiltros(payload: {
        numeroTerm?: string;
        tituloTerm?: string;
        estados?: string[] ,
        rangoInicio?: Date | null,
        rangoFin?: Date | null,
        resetPage?: boolean;
      }) {
        const newState = {
          numeroTerm: payload.numeroTerm ?? store.numeroTerm(),
          tituloTerm: payload.tituloTerm ?? store.tituloTerm(),
          estados: payload.estados ?? store.estados(),
          rangoInicio: payload.rangoInicio ?? store.rangoInicio(),
          rangoFin: payload.rangoFin ?? store.rangoFin(),
          metadata: payload.resetPage ? { ...store.metadata(), currentPage: 1 } : store.metadata(),
        };
        patchState(store, newState);

        sessionStorage.setItem(STORAGE_FILTER_KEY, JSON.stringify({
          numeroTerm: newState.numeroTerm,
          tituloTerm: newState.tituloTerm,
          estados: newState.estados,
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
            numeroTerm: saved.numeroTerm ?? '',
            tituloTerm: saved.tituloTerm ?? '',
            estados: saved.estados ?? [],
            rangoInicio: saved.rangoInicio ? new Date(saved.rangoInicio) : haceUnAnio,
            rangoFin: saved.rangoFin ? new Date(saved.rangoFin) : dentroDeUnAnio,
          });
        } catch (e) {

        }
      },
      setPagina(page: number, pageSize?: number) {
        patchState(store, {
          metadata: {
            ...store.metadata(),
            currentPage: page,
            itemsPerPage: pageSize ?? store.metadata().itemsPerPage
          }
        });

        this.buscarConFiltros(page);
      },
      buscarConFiltros(pagina: number = store.metadata().currentPage) {

        let fechaInicio = new Date(store.rangoInicio().setHours(0, 0, 0, 0)).toISOString();
        let fechaFin = new Date(store.rangoFin().setHours(23, 59, 59, 999)).toISOString();

        const ini = fechaInicio;
        const fin = fechaFin;
        const estados = store.estados() ?? [];
        const correlativo = store.numeroTerm() || undefined;
        const titulo = store.tituloTerm() || undefined;
        const limite = store.metadata().itemsPerPage;

        this.obtenerRequerimientoPorFiltros(
          ini, fin, estados, correlativo, titulo, limite, pagina
        );
      },
      actualizarSugerencias() {
        const inicioIso = this.getRangoFechasISO()?.inicio;
        const finIso = this.getRangoFechasISO()?.fin;

        const numeroTerm = store.numeroTerm();
        if (numeroTerm) {
          this.obtenerNumeros(numeroTerm, inicioIso!, finIso!).subscribe((resultado) => {
            patchState(store, { opcionesNumero: resultado });
          });
        } else {
          patchState(store, { opcionesNumero: [] });
        }

        const tituloTerm = store.tituloTerm();
        if (tituloTerm) {
          this.obtenerTitulos(tituloTerm, inicioIso!, finIso!).subscribe(resultado => {
            patchState(store, { opcionesTitulo: resultado });
          })
        } else {
          patchState(store, { opcionesTitulo: [] });
        }
      },
      eliminarRequerimientoPorId(id: string) {
        patchState(store, { cargandoTabla: true });

        requerimientoTablaService.eliminarRequerimiento(id).subscribe({
          next: () => {
            this.obtenerRequerimientoPorFiltros(
              this.getRangoFechasISO()?.inicio!,
              this.getRangoFechasISO()?.fin!,
              store.estados(),
              store.numeroTerm(),
              store.tituloTerm(),
              store.metadata().itemsPerPage,
              store.metadata().currentPage
            );

            this.actualizarSugerencias();
          },
          error: (error) => {
            patchState(store, { cargandoTabla: false });
          },
        });
      },
      aplazarConNuevaFechaVencimiento(id: string, nuevoVencimiento: string) {
        patchState(store, { cambiandoFecha: true });
        requerimientoService.aplazarRequerimientoNuevaFecha(id, nuevoVencimiento).subscribe(({
          next: () => {
            patchState(store, { cambiandoFecha: false, seCambioFecha: true });
          },
          error: () => {
            patchState(store, { cambiandoFecha: false, seCambioFecha: false }); // ORIGINAL
          },
        }))
      },
      limpiarFiltros() {
        sessionStorage.removeItem(STORAGE_FILTER_KEY);
        patchState(store, initialState);
      },
      limpiarCambioFecha() {
        patchState(store, {
          seCambioFecha: null,
          cargandoTabla: false,
          cambiandoFecha: false,
        })
      }
    }),
  ),
);
