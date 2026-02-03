import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../environment/environment';
import { PublicarRequerimientoRequest } from '../../models/requerimiento-request.model';
import { Requerimiento } from '../../models/respuesta.model';
import { InteresadosResponse } from '../../services/interesado.service';
import { RequerimientoTablaService } from '../../services/requerimiento-tabla.service';
import { RequerimientoRespose, RequerimientoService } from '../../services/requerimientos.service';


type RequerimientoCrearOEditarState = {
  loadingCreandoNuevoRequerimiento: boolean;
  idRequerimiento: string | null;
  correlativo: number | null;
  errorCreandoNuevoRequerimiento: boolean;
  subiendoArchivos: boolean;
  cargandoDetalleRequerimiento: boolean;
  requerimientoDetalle: Partial<Requerimiento> | null;
  interesadosDelRequerimiento: InteresadosResponse[] | null;
  modoEdicion: boolean;
  modoVisualizacion: boolean;
  borradorGuardado: boolean;
};

const initialState: RequerimientoCrearOEditarState = {
  loadingCreandoNuevoRequerimiento: false,
  idRequerimiento: null,
  correlativo: null,
  errorCreandoNuevoRequerimiento: false,
  subiendoArchivos: false,
  cargandoDetalleRequerimiento: false,
  requerimientoDetalle: null,
  interesadosDelRequerimiento: null,
  modoEdicion: false,
  modoVisualizacion: false,
  borradorGuardado: false,
};


export const RequerimientoCrearOEditarStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isLoadingCrear: computed(() => store.loadingCreandoNuevoRequerimiento()),
    tieneCorrelativo: computed(() => store.correlativo() !== null),
    seEstanSubiendoArchivos: computed(() => store.subiendoArchivos()),
    destinatarios: computed(() => store.requerimientoDetalle()?.destinatarios ?? []),
    destinatariosPorId: computed(() => (store.interesadosDelRequerimiento() ?? [])),
    seGuadoBorrador: computed(() => store.borradorGuardado()),
  })),
  withMethods(
    (
      store,
      requerimientoService = inject(RequerimientoService),
      requerimientoTablaService = inject(RequerimientoTablaService),
    ) => ({
      marcarBorradorGuardado(valor: boolean) {
        patchState(store, { borradorGuardado: valor });
      },
      establecerIdRequerimiento(id: string | null) {
        patchState(store, { idRequerimiento: id });
      },
      obtenerInteresadosDelRequerimiento() {
        const requerimientoId = store.idRequerimiento();
        requerimientoService.obtenerInteresadosDelRequerimiento(requerimientoId!).subscribe(({
          next: (result) => {
            patchState(store, { interesadosDelRequerimiento: result });
          },
          error: (err) => {
          }
        }))
      },
      cargarDetalleSoloVisualizacion(id: string) {
        patchState(store, { cargandoDetalleRequerimiento: true, modoVisualizacion: true, modoEdicion: false });
        requerimientoTablaService.obtenerRequerimientoPorIdDeTabla(id).subscribe(({
          next: (requerimiento) => {

            const normalizado: Requerimiento = {
              ...requerimiento,
              titulo: requerimiento.titulo ?? '',
              referencia: requerimiento.referencia ?? '',
              solicitud: requerimiento.solicitud ?? '',
              norma: requerimiento.norma ?? null,
              subNorma: requerimiento.subNorma ?? null,
              vencimiento: requerimiento.vencimiento ?? null,
              adjuntoSolicitud: requerimiento.adjuntoSolicitud ?? null,
              adjuntos: requerimiento.adjuntos ?? [],
              destinatarios: requerimiento.destinatarios ?? [],
              celdas: requerimiento.celdas ?? [],
              tipo: requerimiento.tipo ?? null,
              notificaciones: requerimiento.notificaciones,
            }

            patchState(store, {
              requerimientoDetalle: normalizado,
              correlativo: normalizado.correlativo,
              idRequerimiento: normalizado.id,
              modoVisualizacion: true, modoEdicion: false, cargandoDetalleRequerimiento: false
            });
          },
          error: () => {
            patchState(store, { cargandoDetalleRequerimiento: false, modoVisualizacion: true });
          },
        }));


      },
      cargarDetalleRequerimiento(id: string) {
        patchState(store, { cargandoDetalleRequerimiento: true, modoEdicion: true, modoVisualizacion: false });
        requerimientoTablaService.obtenerRequerimientoPorIdDeTabla(id).subscribe(({
          next: (requerimiento) => {

            const normalizado: Requerimiento = {
              ...requerimiento,
              titulo: requerimiento.titulo ?? '',
              referencia: requerimiento.referencia ?? '',
              solicitud: requerimiento.solicitud ?? '',
              norma: requerimiento.norma ?? null,
              subNorma: requerimiento.subNorma ?? null,
              vencimiento: requerimiento.vencimiento ?? null,
              adjuntoSolicitud: requerimiento.adjuntoSolicitud ?? null,
              adjuntos: requerimiento.adjuntos ?? [],
              destinatarios: requerimiento.destinatarios ?? [],
              celdas: requerimiento.celdas ?? [],
              tipo: requerimiento.tipo ?? null,
              notificaciones: requerimiento.notificaciones,
            }

            patchState(store, {
              requerimientoDetalle: normalizado,
              correlativo: normalizado.correlativo,
              idRequerimiento: normalizado.id,
              cargandoDetalleRequerimiento: false,
              modoVisualizacion: false,
              modoEdicion: true
            });
          },
          error: () => {
            patchState(store, { cargandoDetalleRequerimiento: false });
          }
        }));
      },
      subiendoArchivosALaNube(subiendoArchivo: boolean) {
        patchState(store, { subiendoArchivos: subiendoArchivo });
      },
      construirPayload(
        formRawValue: any
      ): PublicarRequerimientoRequest {

        const step1 = formRawValue?.step1 ?? {};
        const step2 = formRawValue?.step2 ?? {};
        const step3 = formRawValue?.step3 ?? {};
        const step4 = formRawValue?.step4 ?? {};
        const step5 = formRawValue?.step5 ?? {};

        let adjuntos = [];
        let celdas = [];

        let modo: 'adjuntos' | 'accion' | null = null;

        const rawModo = step3?.modo;

        if (rawModo === 'adjuntos' || rawModo === 'accion') {
          modo = rawModo;
        } else if (rawModo?.value) {
          modo = rawModo.value;
        }

        const destinatarios = (step4?.coordinador ?? []).map((c: any) => ({
          interesadoId: c.id
        }));

        const fileSolicitud = step2?.fileSolicitudName;

        const adjuntoSolicitud = fileSolicitud ? {
          nombre: this.stripExtension(fileSolicitud),
          extension: this.getExtension(fileSolicitud),
          orden: 1,
        } : undefined;


        if (modo === "adjuntos") {
          adjuntos = (step3?.fileInputs || []).filter((f: any) => f.fileName?.trim() || f.title?.trim()).map((f: any, index: number) => ({
            nombre: f.fileName ? this.stripExtension(f.fileName) : "",
            extension: f.fileName ? this.getExtension(f.fileName) : "",
            orden: index + 1,
            titulo: f.title ?? null,
          }));
        }


        if (modo === "accion") {
          celdas = (step3?.planAccion || []).flatMap((row: any, rowIndex: number) => [
            { fila: rowIndex + 1, columna: 1, valor: (rowIndex + 1).toString() },
            { fila: rowIndex + 1, columna: 2, valor: row.tituloPlan || "" },
            { fila: rowIndex + 1, columna: 3 },
            { fila: rowIndex + 1, columna: 4 },
            { fila: rowIndex + 1, columna: 5, valor: String(row.seguimiento ?? false) },
          ]);
        }

        let tipoRequerimiento;

        if (modo === 'adjuntos') {
          tipoRequerimiento = 'Con archivos adjuntos';
        } else if (modo === 'accion') {
          tipoRequerimiento = 'Plan de Acción'
        } else {
          tipoRequerimiento = null;
        }

        // Fecha vencimiento debe ser 23,59,59,0
        const localDate = new Date(formRawValue.step1.fechaVencimiento).setHours(23, 59, 59, 0);

        return {
          titulo: step1?.titulo ?? '',
          vencimiento: step1?.fechaVencimiento ? new Date(localDate).toISOString(): '',
          solicitud: step2?.solicitud ?? "",
          referencia: step1?.referencia ?? '',
          correlativo: store.correlativo()!,
          notificaciones: Array.isArray(step5.notificaciones) ? step5.notificaciones.reduce((acc: number, curr: number) => acc + curr, 0): step5.notificaciones ?? 8,
          tipo: tipoRequerimiento,
          formulario:
          {
            id: environment.formulario
          },
          subNorma: step1?.subNorma?.label ?? null,
          norma: step1?.norma?.label ?? null,
          destinatarios, // destinatarios
          adjuntoSolicitud,
          adjuntos,
          celdas,
        }
      },
      crearRequerimiento(titulo: string) {
        patchState(store, { loadingCreandoNuevoRequerimiento: true, correlativo: null, modoEdicion: false });
        requerimientoService.crearRequerimiento({ titulo: titulo }).subscribe(({
          next: (response: RequerimientoRespose) => {
            patchState(store, {
              correlativo: response.correlativo, idRequerimiento: response.id, requerimientoDetalle: {
                id: response.id,
                correlativo: response.correlativo,
                titulo: response.titulo ?? titulo,
                vencimiento: response.vencimiento ? new Date(response.vencimiento) : new Date(),
                adjuntoSolicitud: undefined,
                adjuntos:[]
            }});
          }, error: (_) => {
          },
          complete: () => {
            patchState(store, { loadingCreandoNuevoRequerimiento: false });
          }
        }))
      },
      guardarRequerimientoBorrador(id: string, data: any): Observable<boolean> {
        const payload = this.construirPayload(data);
        return requerimientoService.guardarBorradorDeRequerimiento(id, payload).pipe(
          map(() => true),
          catchError((error) => {
            return of(false);
          })
        );
      },
      publicarRequerimiento(id: string): Observable<boolean>{
        return requerimientoService.publicarRequerimiento(id).pipe(
          map(() => true),
          catchError(() => of(false))
        )
      },
      publicarRequerimientoConBorrador(id: string, formRawValue: any): Observable<boolean> {
        return this.guardarRequerimientoBorrador(id, formRawValue).pipe(
          switchMap((guardado) => {
            if (!guardado) {
              return of(false)
            }
            return this.publicarRequerimiento(id)
          })
        );
      },
      limpiarPayload(obj: any): any {
        if (Array.isArray(obj)) {
          return obj.map((v) => this.limpiarPayload(v));
        } else if (typeof obj === 'object' && obj !== null) {
          return Object.fromEntries(
              Object.entries(obj)
                .map(([k, v]) => {
                  if (v === '') return [k, null];
                  return [k, this.limpiarPayload(v)];
                })
                .filter(([_, v]) => v !== undefined),
            );
        }
        return obj === '' ? null : obj;
      },
      limpiarRequerimiento() {
        patchState(store, {...initialState})
      },
      stripExtension(fileName: string): string {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot > -1 ? fileName.substring(0, lastDot) : fileName;
      },
      getExtension(fileName: string): string {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot > -1 ? fileName.substring(lastDot + 1) : '';
      },
    }),
  ),
);
