import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withMethods,
  withState
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { CeldaInterface } from '../../models/respuesta.model';
import { DestinararioService, RespuestaPresignedUpload } from '../../services/destinararios.service';
import { AdjuntoInterface, RespuestasService } from '../../services/respuestas.service';
import { MetadataDestinatario } from '../requerimiento-admin/requerimiento-respuesta.store';

export type ResultadoCarga = 'exito' | 'error' | null;


type RespuestaState = {
  cargandoUrlArchivoPorOrden: Record<string, boolean>;
  subiendoArchivoPorOrden: Record<string, boolean>;
  progresoArchivoPorOrden: Record<string, number>;
  resultadoArchivoPorOrden: Record<string, ResultadoCarga>;
  archivosCargadosExitosamente: string[];
  archivosConError: string[];
  adjuntosListosParaEnviar: AdjuntoInterface[],
  celdasParaEnvio: CeldaInterface[],
};

const initialState: RespuestaState = {
  cargandoUrlArchivoPorOrden: {},
  subiendoArchivoPorOrden: {},
  progresoArchivoPorOrden: {},
  resultadoArchivoPorOrden: {},
  archivosCargadosExitosamente: [],
  archivosConError: [],
  adjuntosListosParaEnviar: [],
  celdasParaEnvio: []
};

export const RespuestaStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (
      store,
      respuestaService = inject(RespuestasService),
      destinatarioService = inject(DestinararioService),
    ) => ({
      async obtenerUrlPrefirmadaParaCargarArchivoPorOrden(id: string, orden: string, nombreArchivo: string, archivo: File): Promise<boolean> {
        patchState(
          store, {
            cargandoUrlArchivoPorOrden: {
              ...store.cargandoUrlArchivoPorOrden,
              [orden]: true
            },
          }
        );
        try {
          const extension = await this.obtenerExtensionDelNombre(nombreArchivo);
          const nombreSinExtension = await this.obtenerNombreSinExtension(nombreArchivo)
          const urlPrefirmada = await firstValueFrom(respuestaService.obtenerUrlArchivoSubir(id, extension, orden, nombreSinExtension));

          patchState(store, {
            cargandoUrlArchivoPorOrden: {
              ...store.cargandoUrlArchivoPorOrden,
              [orden]: false
            },

          });

          this.subirArchivoRespuestaPorOrden(archivo, urlPrefirmada, orden, '', nombreSinExtension, extension);
          return true;
        } catch (_) {
          patchState(store, {
            cargandoUrlArchivoPorOrden: {
              ...store.cargandoUrlArchivoPorOrden,
              [orden]: false
            },
            resultadoArchivoPorOrden: {
              ...store.resultadoArchivoPorOrden,
              [orden]: 'error'
            }
          });
          return false;
        }
      },
      async obtenerUrlPrefirmadaParaCargarArchivo(id: string, orden: string, nombreArchivo: string, archivo: File) {
        patchState(
          store, {
            cargandoUrlArchivoPorOrden: {
              ...store.cargandoUrlArchivoPorOrden,
              [orden]: true
            },
          }
        );
        try {

          const { url, path } = await firstValueFrom(destinatarioService.obtenerUrlPrefirmadaParaCargarRespuestaDestinarario()) as RespuestaPresignedUpload;
          const urlPrefirmada = url;

          // TODO: tengo que usar el Path para informar al servicio
          const extension = await this.obtenerExtensionDelNombre(nombreArchivo);
          const nombreSinExtension = await this.obtenerNombreSinExtension(nombreArchivo)
          const pathAInformar = path;

          patchState(store, {
            cargandoUrlArchivoPorOrden: {
              ...store.cargandoUrlArchivoPorOrden,
              [orden]: false
            },

          });

          this.subirArchivoRespuestaPorOrden(archivo, urlPrefirmada, orden, pathAInformar, nombreSinExtension, extension);
          return true;
        } catch (_) {
          patchState(store, {
            cargandoUrlArchivoPorOrden: {
              ...store.cargandoUrlArchivoPorOrden,
              [orden]: false
            },
            resultadoArchivoPorOrden: {
              ...store.resultadoArchivoPorOrden,
              [orden]: 'error'
            }
          });
          return false;
        }


      },
      async obtenerExtensionDelNombre(nombreArchivo: string): Promise<string> {
        const ultimoPunto = nombreArchivo.lastIndexOf('.');
        return ultimoPunto !== -1 ? nombreArchivo.substring(ultimoPunto + 1).toLowerCase() : '';
      },
      async obtenerNombreSinExtension(nombreArchivo: string): Promise<string> {
        const ultimoPunto = nombreArchivo.lastIndexOf('.');
        return ultimoPunto !== -1
          ? nombreArchivo.substring(0, ultimoPunto)
          : nombreArchivo;
      },
      async subirArchivoRespuestaPorOrden(archivo: File, urlPrefirmada: string, orden: string, pathArchivo: string, nombreSinExtension: string, extension: string) {
        patchState(store, {
          subiendoArchivoPorOrden: {
            ...store.subiendoArchivoPorOrden,
            [orden]: true,
          },
          progresoArchivoPorOrden: {
            ...store.progresoArchivoPorOrden,
            [orden]: 0
          },
          resultadoArchivoPorOrden: {
            ...store.resultadoArchivoPorOrden,
            [orden]: null,
          },
          archivosConError: store.archivosConError().filter(o => o !== orden),
        })

        respuestaService.subirArchivoRespuesta(urlPrefirmada, archivo).subscribe({
          next: async (progreso) => {
            if (progreso.type === 'progress') {
              patchState(store, {
                progresoArchivoPorOrden: {
                  ...store.progresoArchivoPorOrden,
                  [orden]: progreso.value
                }
              })
            }
            if (progreso.type === 'complete') {

              const nuevosAdjuntos = store.adjuntosListosParaEnviar().filter(a => a.orden !== orden);

              nuevosAdjuntos.push({
                orden,
                nombre: archivo.name.replace(/\.[^/.]+$/,''),
                tipo: archivo.type,
                extension: archivo.name.split('.').pop() ?? '',
                path: pathArchivo
              })

              patchState(store, {
                subiendoArchivoPorOrden: {
                  ...store.subiendoArchivoPorOrden,
                  [orden]: false
                },
                progresoArchivoPorOrden: {
                  ...store.progresoArchivoPorOrden,
                  [orden]: 100,
                },
                resultadoArchivoPorOrden: {
                  ...store.resultadoArchivoPorOrden,
                  [orden]: 'exito',
                },
                archivosCargadosExitosamente: [
                  ...store.archivosCargadosExitosamente().filter(o => o !== orden),
                  orden
                ],
                adjuntosListosParaEnviar: nuevosAdjuntos
              })
            }
          },
          error: () => {
            patchState(store, {
              subiendoArchivoPorOrden: {
                ...store.subiendoArchivoPorOrden,
                [orden]: false,
              },
              progresoArchivoPorOrden: {
                ...store.progresoArchivoPorOrden,
                [orden]: 0
              },
              resultadoArchivoPorOrden: {
                ...store.resultadoArchivoPorOrden,
                [orden]: 'error'
              },
              archivosConError: [
                ...store.archivosConError().filter(o => o !== orden), orden
              ],
              archivosCargadosExitosamente: store.archivosCargadosExitosamente().filter(o => o !== orden),
              adjuntosListosParaEnviar: store.adjuntosListosParaEnviar().filter(a => a.orden !== orden),
            },);
          }
          })
      },
      async enviarRespuestaAlCoordinador(payload: { adjuntos: AdjuntoInterface[], celdas: any[]}) {
        try {

          const metadataEncode = sessionStorage.getItem("metadata");
          const metadataDecode = JSON.parse(metadataEncode ?? '') as MetadataDestinatario;
          const response = await firstValueFrom(destinatarioService.enviarRespuestaACoordinador(payload, metadataDecode.destinatarioId));

          return response.status === 200;
        } catch (err) {
          return false;
        }
      },
      limpiarResultados() {
        patchState(store, {
          cargandoUrlArchivoPorOrden: {},
          subiendoArchivoPorOrden: {},
          progresoArchivoPorOrden: {},
          resultadoArchivoPorOrden: {},
          archivosCargadosExitosamente: [],
          archivosConError: [],
          adjuntosListosParaEnviar: [],
          celdasParaEnvio: [],
        })
      },
      setCeldasParaEnvio(celdas: CeldaInterface[], columnas: { id: string; nombre: string; tipo: string }[]) {
        const normalizadas = celdas.map(c => {
        if (c.valor instanceof Date) {
          const meta = columnas[c.columna - 1]; // 👈 buscamos la columna en base al índice
          let valorNormalizado: string;

          if (meta?.nombre.toLowerCase().includes('inicio')) {
            valorNormalizado = this.toIsoZALocalDate(c.valor, true); // 00:00:00Z
          } else if (meta?.nombre.toLowerCase().includes('termino') || meta?.nombre.toLowerCase().includes('término')) {
            valorNormalizado = this.toIsoZALocalDate(c.valor, false); // 23:59:59Z
          } else {
            valorNormalizado = c.valor.toISOString(); // fallback
          }

          return { ...c, valor: valorNormalizado };
        }

        return c;
      });
        patchState(store, { celdasParaEnvio: normalizadas });
      },
      obtenerCeldasParaEnvio(): CeldaInterface[]{
        return store.celdasParaEnvio();
      },
      toIsoZALocalDate(fechaLocal: Date, isInicio: boolean): string {
        const year = fechaLocal.getFullYear();
        const month = fechaLocal.getMonth(); // 0-based
        const day = fechaLocal.getDate();

        const hour = isInicio ? 0 : 23;
        const minute = isInicio ? 0 : 59;
        const second = isInicio ? 0 : 59;

        const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second));
        return utcDate.toISOString();
      },
      adjuntosOCeldasParaEnviar(): { adjuntos: AdjuntoInterface[], celdas: any[] }{
        const adjuntos = store.adjuntosListosParaEnviar();
        const celdas = store.celdasParaEnvio();

        if (adjuntos.length > 0) {
          return {
            adjuntos,
            celdas: []
          }
        }
        return {
          adjuntos: [],
          celdas,
        }
      }
    }),
  ),
);
