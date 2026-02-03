import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { Requerimiento } from '../../models/respuesta.model';
import { InteresadoService } from '../../services/interesado.service';
import { RequerimientoTablaService } from '../../services/requerimiento-tabla.service';
import { RequerimientoService } from '../../services/requerimientos.service';

export interface InteresadoRespuesta{
  id: string;
  nombreFantasia: string;
  rutEmpresa: string;
}

type RequerimientoVerState = {
  cargandoRequerimiento: boolean;
  errorAlObtenerRequerimiento: boolean;
  requerimientoDetalle: Requerimiento | null;
  interesadosDelRequerimiento: InteresadoRespuesta[] | null;
  descargandoArchivoPorOrden: Record<string, boolean>;
  errorDescargaPorOrden: Record<string, boolean>;
  progresoDescargaPorOrden: Record<string, number>;
  interesados: any[];
};

const initialState: RequerimientoVerState = {
  cargandoRequerimiento: false,
  errorAlObtenerRequerimiento: false,
  requerimientoDetalle: null,
  interesadosDelRequerimiento: null,
  descargandoArchivoPorOrden: {},
  errorDescargaPorOrden: {},
  progresoDescargaPorOrden: {},
  interesados: [],
};


export const RequerimientoVerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    tieneRequerimiento: computed(() => !!store.requerimientoDetalle()),
    listaInteresados: computed(() => store.interesados()),
    listaIdInteresados: computed(() => store.requerimientoDetalle()?.destinatarios),
    interesadoDelRequerimiento: computed(() => store.interesadosDelRequerimiento())
  })),
  withMethods(
    (
      store,
      requerimientoTablaService = inject(RequerimientoTablaService),
      requerimientoService = inject(RequerimientoService),
      interesadoService = inject(InteresadoService),
    ) => ({
      async cargaRequerimiento(id: string) {
        patchState(store, { cargandoRequerimiento: true, errorAlObtenerRequerimiento: false })
        requerimientoTablaService.obtenerRequerimientoPorIdDeTabla(id).subscribe(({
          next: (requerimiento) => {
            patchState(store, { cargandoRequerimiento: false, requerimientoDetalle: requerimiento });
            this.obtenerInteresadosDelRequerimiento();
          },
          error: (err) => {
            patchState(store, { cargandoRequerimiento: false, errorAlObtenerRequerimiento: true });
          }
        }))
      },
      obtenerInteresadosDelRequerimiento() {
        const requerimientoId = store.requerimientoDetalle()?.id;
        requerimientoService.obtenerInteresadosDelRequerimiento(requerimientoId!).subscribe(({
          next: (result) => {
            patchState(store, { interesadosDelRequerimiento: result })
          },
          error: (err) => {
          }
        }))
      },
      limpiarVista() {
        patchState(store, { cargandoRequerimiento: false, errorAlObtenerRequerimiento: false, requerimientoDetalle: null });
      },
      async obtenerUrlPrefirmadaParaDescargar(id: string, tipo: string, orden: string): Promise<string> {
        patchState(store, (state) => ({
          descargandoArchivoPorOrden: { ...state.descargandoArchivoPorOrden, [orden]: true },
          errorDescargaPorOrden: { ...state.errorDescargaPorOrden, [orden]: false },
          progresoDescargaPorOrden: { ...state.progresoDescargaPorOrden, [orden]: 0 },
        }));

        try {
          const urlPrefirmada = await firstValueFrom(requerimientoService.obtenerUrlArchivo(id, tipo, orden));
          patchState(store, {
            progresoDescargaPorOrden: {
              ...store.progresoDescargaPorOrden(),
              [orden]: 50
            }
          });

          return urlPrefirmada;
        } catch (err) {
          patchState(store, {
            errorDescargaPorOrden: {
              ...store.errorDescargaPorOrden(),
              [orden]: true
            }
          });
          throw err;
        } finally {
          patchState(store, {
            descargandoArchivoPorOrden: {
              ...store.descargandoArchivoPorOrden(),
              [orden]: false
            }
          })
        }
      },
      async obtenerListaInteresados() {
        const intaresadosResult = await firstValueFrom(interesadoService.getInteresado());
        patchState(store, { interesados: intaresadosResult });
      },
      async descargarDocumento(url: string){
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
          return null;
        }
      }
    }),
  ),
);
