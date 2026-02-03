import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { RespuestaRequerimientoNuevo, UltimaRespuestaDestinatario } from '../../models/respuesta.model';
import { DestinararioService } from '../../services/destinararios.service';
import { RequerimientoService } from '../../services/requerimientos.service';


type RequerimientoRespuestaState = {
  detalleRequerimiento: RespuestaRequerimientoNuevo | null;
  respuestaRequerimiento: UltimaRespuestaDestinatario | null;
  respuestaNoEncontrada: boolean;
  urlPrefirmadaDescargaRequerimiento: string | null;
  cargandoRespuesta: boolean;
  descargandoArchivoSolicitud: boolean;
  descargandoArchivoRequerimientoPorOrden: Record<string, boolean>;
  errorRespuesta: boolean;
  errorDescargaArchivoAdjunto: boolean;
};

const initialState: RequerimientoRespuestaState = {
  detalleRequerimiento: null,
  respuestaRequerimiento: null,
  respuestaNoEncontrada: false,
  urlPrefirmadaDescargaRequerimiento: null,
  cargandoRespuesta: false,
  descargandoArchivoSolicitud: false,
  descargandoArchivoRequerimientoPorOrden: {},
  errorRespuesta: false,
  errorDescargaArchivoAdjunto: false
};

export interface MetadataDestinatario{
  destinatarioId: string;
}

export const RequerimientoRespuestaStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    tieneRespuesta: computed(() => ({
      existe: !!store.respuestaRequerimiento(),
      data: store.respuestaRequerimiento()
    })),
  })),
  withMethods(
    (
      store,
      requerimientoService = inject(RequerimientoService),
      destinatarioService = inject(DestinararioService),
    ) => ({
      async obtenerDetalleRequerimientoPorId(id: string) {
        patchState(store, { cargandoRespuesta: true, errorRespuesta: false });
        requerimientoService.obtenerRequerimientoDetalleNuevo(id).subscribe({
          next: (response) => {
            patchState(store, { cargandoRespuesta: false, errorRespuesta: false, detalleRequerimiento: response, });
            this.obtenerUltimaRespuestaDelRequerimiento();
          },
          error: (e) => {
            patchState(store, { cargandoRespuesta: false, errorRespuesta: true });
          }
        });
      },
      async obtenerUltimaRespuestaDelRequerimiento() {
        const metadataEncode = sessionStorage.getItem('metadata');
        const metadataDecode = JSON.parse(metadataEncode!) as MetadataDestinatario;
        const destinatarioId = metadataDecode.destinatarioId;

        destinatarioService.obtenerUltimaRespuestaDestinatario(destinatarioId).subscribe(({
          next: (resultado) => {
            patchState(store, { respuestaRequerimiento: {...resultado[0]} });
          },
          error: (err: HttpErrorResponse) => {
            if (err.status == 404) {
              patchState(store, { respuestaRequerimiento: null, respuestaNoEncontrada: true })
              return;
            }
            patchState(store, { errorRespuesta: true });
          }
        }))
      },
      async obtenerUrlPrefirmadaDeSolicitudArchivoADescargar(id: string, tipo: string, orden?: string) {
        patchState(store,{descargandoArchivoSolicitud: true})
        try {
          const url = await firstValueFrom(requerimientoService.obtenerUrlArchivo(id, tipo, orden));
          patchState(store, { urlPrefirmadaDescargaRequerimiento: url, descargandoArchivoSolicitud: false });
          return url;
        } catch (e) {
          patchState(store, { urlPrefirmadaDescargaRequerimiento: null, descargandoArchivoSolicitud: false, errorDescargaArchivoAdjunto: true });
          return '';
        }
      },
      async obtenerUrlPrefirmadaDeArchivoRequerimientoDescargar(id: string, tipo: string, orden: string) {
        patchState(store, state => ({
          ...state,
          descargandoArchivoRequerimientoPorOrden: {
            ...state.descargandoArchivoRequerimientoPorOrden,
            [orden]: true
          }
        }));
        try {
          const url = await firstValueFrom(requerimientoService.obtenerUrlArchivo(id, tipo, orden));
          patchState(store, state => ({
            ...state,
            descargandoArchivoRequerimientoPorOrden: {
              ...state.descargandoArchivoRequerimientoPorOrden,
              [orden]: false
            }
          }));
          return url;
        } catch (e) {
          patchState(store, state => ({
              ...state,
              urlPrefirmadaDescargaRequerimiento: null,
              errorDescargaArchivoAdjunto: true,
            descargandoArchivoRequerimientoPorOrden: {
              ...state.descargandoArchivoRequerimientoPorOrden,
              [orden]: false
            }
          }));
          return '';
        }
      },
      async descargarArchivoSolicitudORequerimiento(url: string) {
        try {
          const response = await firstValueFrom(
            requerimientoService.descargarArchivoAdjunto(url)
          );

          const blob = response.body!;
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = 'documento';

          const filenameStarMatch = contentDisposition?.match(/filename\*\=UTF-8''(.+?)(;|$)/);
          const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);

          if (filenameStarMatch?.[1]) {
            filename = decodeURIComponent(filenameStarMatch[1]);
          } else if (filenameMatch?.[1]) {
            filename = decodeURIComponent(filenameMatch[1]);
          } else {
            const urlParts = url.split('?')[0].split('/');
            filename = decodeURIComponent(urlParts[urlParts.length - 1]);
          }

          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = filename;
          link.click();

          window.URL.revokeObjectURL(link.href);
          return response;
        } catch (e) {
          patchState(store, { errorDescargaArchivoAdjunto: true });
          return null;
        }
      },
      limpiarStore() {
        patchState(store, {})
      }
    }),
  ),
);
