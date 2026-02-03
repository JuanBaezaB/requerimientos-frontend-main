import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { CeldaInterface } from '../models/respuesta.model';



type DialogConfigmState = {
  idRespuesta: string | null;
  iniciandoEnvioSolicitud: boolean | null;
  resultadoEnvio: 'exito' | 'error' | null;
  celdasParaEnvio: CeldaInterface[];
};

const initialState: DialogConfigmState = {
  idRespuesta: null,
  iniciandoEnvioSolicitud: null,
  resultadoEnvio: null,
  celdasParaEnvio: []
};

export const DialogConfirmStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ idRespuesta, iniciandoEnvioSolicitud, resultadoEnvio }) => ({
    obtenerIrDespuesta: computed(() => idRespuesta()),
    obtenerEstadoEnvio: computed(() => iniciandoEnvioSolicitud()),
    obtenerResultadoEnvio: computed(() => resultadoEnvio())
  })),
  withMethods(
    (
      store,
    ) => ({
      setIdRespuesta: (idRespuesta: string) => {
        patchState(store, { idRespuesta: idRespuesta });
      },
      setIniciandoEnvioSolicitud: () => {
        patchState(store, { iniciandoEnvioSolicitud: true });
      },
      setResultadoEnvio: (resultado: 'exito' | 'error') => {
        patchState(store, { resultadoEnvio: resultado });
      },
      reiniciarEstados: () => {
        patchState(store, {
          idRespuesta: null,
          iniciandoEnvioSolicitud: null,
          resultadoEnvio: null
        });
      },
      setCeldasParaEnvio(celdas: CeldaInterface[]) {
        patchState(store, { celdasParaEnvio: celdas });
      }
    }),
  ),
);
