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
import { DetalleVerRespuesta } from '../../../app/modules/admin/requerimiento-root/models/requerimiento-visualizar.model';
import { Adjunto, Celda, RespuestaRequerimientoNuevo } from '../../models/respuesta.model';
import { DestinararioService } from '../../services/destinararios.service';
import { RequerimientoService } from '../../services/requerimientos.service';
import { RespuestasService } from '../../services/respuestas.service';

const STORAGE_KEY = 'visualizar-detalle-respuesta';
const STORAGE_DETALLE_ID_KEY = 'visualizar-detalle-id';
const STORAGE_REQUERIMIENTO_ID_KEY = 'requerimiento-id';

type VisualizarRespuestaDetalleState = {
  requerimientoId: string | null,
  visualizarDetalleRespuesta: DetalleVerRespuesta | null,
  obteniendoUrlDescarga: boolean,
  errorAlObtenerUrl: boolean,
  descargandoIds: string[],
  errorDescargaArchivoAdjunto: boolean,
  obteniendoUltimaRespuesta: boolean,
  errorAlObtenerUltimaRespuesta: boolean,
  adjuntosRespuesta: Adjunto[],
  celdasRespuesta: Celda[],
  respuestaId: string | null,
  obteniendoUrlPrefirmadaPorArchivo: boolean,
  errorAlObtenerUrlPrefirmadaPorArchivo: boolean,
  bloquearDescargas: boolean,
  formularioRequerimiento: RespuestaRequerimientoNuevo | null,
};

const initialState: VisualizarRespuestaDetalleState = {
  requerimientoId: null,
  visualizarDetalleRespuesta: null,
  obteniendoUrlDescarga: false,
  errorAlObtenerUrl: false,
  descargandoIds: [],
  errorDescargaArchivoAdjunto: false,
  obteniendoUltimaRespuesta: false,
  errorAlObtenerUltimaRespuesta: false,
  adjuntosRespuesta: [],
  celdasRespuesta: [],
  respuestaId: null,
  obteniendoUrlPrefirmadaPorArchivo: false,
  errorAlObtenerUrlPrefirmadaPorArchivo: false,
  bloquearDescargas: false,
  formularioRequerimiento: null
};

export const VisualizarRespuestaStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    informacionHeaderRespuesta: computed(() => {
      return store.visualizarDetalleRespuesta()
    }),
    obtenerAdjuntosComputed: computed(() => {
      return store.adjuntosRespuesta()
    }),
    obtenerCeldasComputed: computed(() => {
      return store.celdasRespuesta()
    }),
    obtenerRequerimientoRespuestaComputed: computed(() => {
      return store.formularioRequerimiento();
    }),
    obtenerRespuestaIdComputed: computed(() => {
      return store.respuestaId()
    }),
  })),
  withMethods(
    (
      store,
      router = inject(Router),
      requerimientoService = inject(RequerimientoService),
      destinatarioService = inject(DestinararioService),
      respuestasService = inject(RespuestasService),
    ) => ({
      setRequerimientoId(requerimientoId: string) {
        patchState(store, { requerimientoId: requerimientoId })
        sessionStorage.setItem(STORAGE_REQUERIMIENTO_ID_KEY, requerimientoId);
      },
      irAVisualizarRespuestaCoordinado(evento: DetalleVerRespuesta) {
        patchState(store, { visualizarDetalleRespuesta: evento });
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(evento));
        router.navigate([`/requerimiento/admin/detalle/respuesta/${evento.id}`]);
      },
      obtenerInfoRespuestaHeader() {
        const respuestaEncode = sessionStorage.getItem(STORAGE_KEY);
        const respuestaDecode = JSON.parse(respuestaEncode!);
        patchState(store, { visualizarDetalleRespuesta: respuestaDecode})
      },
      obtenerInfoRespuestaContenido(destinatarioId: string) {
        patchState(store, { obteniendoUltimaRespuesta: true });
        const requerimientoId = sessionStorage.getItem(STORAGE_REQUERIMIENTO_ID_KEY);
        requerimientoService.obtenerRequerimientoDetalle(requerimientoId!).subscribe(({
          next: (result) => {
            patchState(store, {formularioRequerimiento: result})
          },
          error: (_) => {
          }
        }));

        destinatarioService.obtenerUltimaRespuestaDestinatario(destinatarioId).subscribe(({
          next: (result) => {
            patchState(store, { obteniendoUltimaRespuesta: false, errorAlObtenerUltimaRespuesta: false, respuestaId: result[0].id! });
            if (result[0].adjuntos.length > 0) {
              patchState(store, {adjuntosRespuesta: result[0].adjuntos})
            } else if (result[0].celdas.length > 0) {
              patchState(store, { celdasRespuesta: result[0].celdas });
            } else {
              patchState(store, { celdasRespuesta: [], adjuntosRespuesta: [] });
            }
          },
          error: (_) => {
            patchState(store, { obteniendoUltimaRespuesta: false, errorAlObtenerUltimaRespuesta: true });
          }
        }))
      },
      async obtenerUrlPrefirmadaDeCoordinadosSeleccionados(ids: string[]) {
        patchState(store, { obteniendoUrlDescarga: true });
        try {
          const payload  = ids.map(id => ({ id }));

          const urlPrefirmada = await firstValueFrom(requerimientoService.obtenerUrlPrefirmadaParaDescargarArchivosAdjunto(store.requerimientoId()! ?? sessionStorage.getItem(STORAGE_DETALLE_ID_KEY), payload));
          if (!urlPrefirmada) {
            patchState(store, { obteniendoUrlDescarga: false, errorAlObtenerUrl: true });
          }
          patchState(store, { obteniendoUrlDescarga: false, errorAlObtenerUrl: false });
          this.descargarArchivoDesdeUrlPrefirmada(urlPrefirmada.url);
        } catch (err) {
          patchState(store, { obteniendoUrlDescarga: false, errorAlObtenerUrl: true });
        }

      },
      async obtenerUrlPrefirmadaPorCoordinado(id: string, rutCoordinado: string){
        patchState(store, { descargandoIds: [...store.descargandoIds(), id] });

        try {
          const payload = [{ id }];
          const urlPrefirmada = await firstValueFrom(
            requerimientoService.obtenerUrlPrefirmadaParaDescargarArchivosAdjunto(store.requerimientoId()! ?? sessionStorage.getItem(STORAGE_DETALLE_ID_KEY), payload)
          );

          if (!urlPrefirmada) {
            patchState(store, { errorAlObtenerUrl: true });
          } else {
            patchState(store, { errorAlObtenerUrl: false });
            this.descargarArchivoDesdeUrlPrefirmada(urlPrefirmada.url, rutCoordinado);
          }
        } catch (err) {
          patchState(store, { errorAlObtenerUrl: true });
        } finally {
          patchState(store, {
            descargandoIds: store.descargandoIds().filter((d) => d !== id)
          })
        }
      },
      async descargarArchivoRespuestaPorOrden(respuestaId: string, orden: string) {
        patchState(store, { descargandoIds: [...store.descargandoIds(), orden], bloquearDescargas: true })
        try {
          const urlPrefirmada = await firstValueFrom(respuestasService.obtenerUrlPrefirmadaParaDescargaDeArchivoAdjuntoPorOrden(respuestaId, orden));
          if (urlPrefirmada) {
            patchState(store, {errorAlObtenerUrlPrefirmadaPorArchivo: false });
            this.descargarArchivoDesdeUrlPrefirmada(urlPrefirmada.url);
          }
        } catch (_) {
          patchState(store, { errorAlObtenerUrlPrefirmadaPorArchivo: true });
        } finally {
          patchState(store, {
            descargandoIds: store.descargandoIds().filter(id => id !== orden),
            bloquearDescargas: false
          })
        }
      },
      async descargarArchivoDesdeUrlPrefirmada(url: string, rutCoordinado?: string) {
        try {
          const response = await firstValueFrom(requerimientoService.descargarArchivoAdjunto(url));

          const blob = response.body!;
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = 'descarga';

          const filenameStarMatch = contentDisposition?.match(/filename\*\=UTF-8''(.+?)(;|$)/);
          const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);

          if (filenameStarMatch?.[1]) {
            filename = rutCoordinado ??  decodeURIComponent(filenameStarMatch[1]);
          } else if (filenameMatch?.[1]) {
            filename = rutCoordinado ??  decodeURIComponent(filenameMatch[1]);
          } else {
            const urlParts = url.split('?')[0].split('/');
            filename = rutCoordinado ?? decodeURIComponent(urlParts[urlParts.length - 1]);
          }

          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = rutCoordinado ? filename+'.zip' : filename;

          link.click();

          window.URL.revokeObjectURL(link.href);
          return response;
        } catch (err) {
          patchState(store, { errorDescargaArchivoAdjunto: true });
          return null;
        }
      },
      limpiarEstadoStore() {
        patchState(store, { ...initialState });
      },
      estaDescargandoArchivo(orden: string) {
        return computed(() => store.descargandoIds().includes(orden));
      }
    }),
  ),
);
