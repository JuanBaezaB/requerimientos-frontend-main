import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpHeaders,
  HttpParams,
  HttpResponse,
} from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import {
  catchError,
  distinctUntilChanged,
  map,
  Observable,
  of,
  throwError,
} from "rxjs";
import { APIRequerimientoService } from "../../api/api.tramite-inverso.service";
import { SugerenciaCorrelativo } from "../entities/sugerencia-correlativo.entity";
import { SugerenciaTitulo } from "../entities/sugerencia-titulo.entity";
import { environment } from "../environment/environment";
import { RespuestaRequerimientoNuevo } from "../models/respuesta.model";
import { TipoSugerencia } from "./requerimientos-filtros.service";

export interface RequestBody {
  titulo: string;
}

export interface RequerimientoRespose {
  id: string;
  correlativo: number;
  titulo: string;
  referencia: string | null;
  solicitud: string | null;
  subNorma: string | null;
  norma: string | null;
  publicacion: string | null;
  estado: string;
  vencimiento: string | null;
}

export interface InteresadoRespuestaResponse {
  id: string;
  interesadoId: string;
  nombre: string;
  rut: string;
  todoId: string;
  respuestas: RespuestaInteresado[];
  selected: boolean;
}
export interface RespuestaInteresado {
  fecha: string;
  id: string;
}

export interface InteresadoDelRequerimiento {
  id: string;
  rutEmpresa: string;
  nombreFantasia: string;
  razonSocial: string;
  correoTitular?: string;
  correoSuplente?: string;
  correoFacturacion?: string;
  correoGerente?: string;
}

interface PresignedURLParams {
  action: "PUT" | "GET";
  orden: string;
  tipo: "REQ" | "SOL";
  archivo?: string;
  extension?: string;
}

export interface UpdateRequeriment {
  id?: string;
  correlativo?: number;
  titulo?: string;
  referencia?: string;
  solicitud?: string;
  subNorma?: string;
  norma?: string;
  publicacion?: string;
  vencimiento?: string;
  solicitudAdjunto?: Adjunto;
  adjuntos?: Adjunto[];
}

export interface Adjunto {
  id?: string;
  nombre: string;
  extension: string;
  orden: number;
  path?: string;
}

export interface PublishRequirementBody {
  interesados: Interesado[];
  solicitudAdjunto: Adjunto;
  adjuntos: Adjunto[];
}

export interface Interesado {
  id: string;
  rutEmpresa: string;
}

export interface UrlArchivoDescarga {
  url: string;
}

@Injectable({ providedIn: "root" })
export class RequerimientoService {
  private readonly http = inject(HttpClient);
  private _http = inject(APIRequerimientoService);

  crearRequerimiento(body: RequestBody): Observable<RequerimientoRespose> {
    return this.http
      .post<RequerimientoRespose>(
        `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos`,
        body,
      )
      .pipe(
        map((res: RequerimientoRespose) => res),
        catchError((error: HttpErrorResponse) => {
          return throwError(() => error);
        }),
      );
  }

  updateRequirement(
    idRequirement: string,
    body: UpdateRequeriment,
  ): Observable<any> {
    return this.http
      .put(
        `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${idRequirement}`,
        body,
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => error);
        }),
      );
  }

  publicarRequerimiento(id: string): Observable<any> {
    return this._http
      .post(
        `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${id}/publicar`,
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => error);
        }),
      );
  }

  obtenerUrlPrefirmada(
    idRequirement: string,
    params: PresignedURLParams,
  ): Observable<{ url: string }> {
    let httpParams = new HttpParams()
      .set("action", params.action)
      .set("orden", params.orden)
      .set("tipo", params.tipo);

    if (params.archivo) {
      httpParams = httpParams.set("archivo", params.archivo);
    }
    if (params.extension) {
      httpParams = httpParams.set("extension", params.extension);
    }

    const headers = new HttpHeaders({
      "Content-Disposition": "attachment",
    });

    return this.http
      .get<{ url: string }>(
        `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${idRequirement}/url`,
        {
          params: httpParams,
          headers: headers,
        },
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => error);
        }),
      );
  }

  subirArchivo(
    url: string,
    file: File,
  ): Observable<{ type: "progress" | "complete"; value: number }> {
    const headers = new HttpHeaders({
      "Content-Type": file.type,
      "Content-Disposition": "attachment",
    });
    return this.http
      .put(url, file, {
        headers,
        reportProgress: true,
        observe: "events",
      })
      .pipe(
        map((event: HttpEvent<any>) => {
          switch (event.type) {
            case HttpEventType.UploadProgress:
              return {
                type: "progress" as const,
                value: Math.round((event.loaded / (event.total || 1)) * 100),
              };
            case HttpEventType.Response:
              return {
                type: "complete" as const,
                value: 100,
              };
            default:
              return {
                type: "progress" as const,
                value: 0,
              };
          }
        }),
        distinctUntilChanged(),
      );
  }

  obtenerRequerimientoDetalle(
    id: string,
  ): Observable<RespuestaRequerimientoNuevo> {
    return this._http
      .get<RespuestaRequerimientoNuevo>(
        `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${id}`,
      )
      .pipe(map((response) => response));
  }

  obtenerRequerimientoDetalleNuevo(
    id: string,
  ): Observable<RespuestaRequerimientoNuevo> {
    return this._http
      .get<RespuestaRequerimientoNuevo>(
        `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${id}`,
      )
      .pipe(map((response) => response));
  }

  obtenerUrlArchivo(id: string, tipo: string, orden?: string) {
    let queryParams = new HttpParams()
      .set("action", "GET")
      .set("orden", orden!)
      .set("tipo", tipo);

    const headers = new HttpHeaders({
      "Content-Disposition": "attachment",
    });

    return this.http
      .get<UrlArchivoDescarga>(
        `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${id}/url`,
        {
          params: queryParams,
          headers: headers,
        },
      )
      .pipe(map((response) => response.url));
  }

  descargarArchivoAdjunto(url: string): Observable<HttpResponse<Blob>> {
    return this.http.get(url, {
      responseType: "blob",
      observe: "response",
    });
  }

  // Borrador y Editar
  guardarBorradorDeRequerimiento(id: string, data: any): Observable<void> {
    return this._http.put(
      `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${id}`,
      data,
    );
  }

  aplazarRequerimientoNuevaFecha(
    id: string,
    vencimiento: string,
  ): Observable<void> {
    return this._http.post(
      `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${id}/aplazar`,
      {
        vencimiento: vencimiento,
      },
    );
  }

  /**
   * obtenerInteresadosDelRequerimiento
   * @param requerimientoId : id del requerimiento
   * @returns lista de interesados del requerimiento
   */
  obtenerInteresadosDelRequerimiento(
    requerimientoId: string,
  ): Observable<InteresadoDelRequerimiento[]> {
    if (!requerimientoId) {
      return of([]);
    }
    return this._http
      .get<
        InteresadoDelRequerimiento[]
      >(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${requerimientoId}/interesados`)
      .pipe(map((respuesta) => respuesta));
  }

  /**
   * Obtiene tabla de interesados en base a filtros
   * @param {string} fechaInicio: fecha de inicio para filtrar tabla
   * @param {string} fechaTermino: fecha de termino para filtrar tabla
   * @param {string[]}respuestas: Si o No tiene respuesta
   * @param {any[]} listaIdsInteresados: lista de ids de los interesados que queremos obtener en la tabla
   * @returns {any} tablaInteresadoRespuestas
   */
  obtenerInteresadosParaTabla(
    requerimientoId: string,
    fechaInicio: string,
    fechaTermino: string,
    respuestas: string[],
    listaIdsInteresados: any[],
  ): Observable<InteresadoRespuestaResponse[]> {
    return this.http
      .post<InteresadoRespuestaResponse[]>(
        `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${requerimientoId}/destinatarios`,
        {
          respuesta: respuestas,
          fechaInicio: fechaInicio,
          fechaFin: fechaTermino,
          interesados: listaIdsInteresados,
        },
      )
      .pipe(map((respuesta) => respuesta));
  }

  /**
   * Envia un recordatorio a los interesados que no han respondido mediante un POST
   * @param {string} requerimientoId : id del requerimiento
   */
  enviarRecordatorioAInteresados(requerimientoId: string): Observable<void> {
    return this._http.post(
      `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${requerimientoId}/destinatarios/recordar`,
      {},
    );
  }

  /**
   * función para obtener url prefirmada para descarga de archivos con la estructura de destinatarios: [{'id':'...'},{...}]
   * @param requerimientoId: id del requerimiento
   * @param payload: objeto con ids de los coordinados que se requiere descargar el archivo
   * @returns url: url prefirmada para descargar el archivo
   */
  obtenerUrlPrefirmadaParaDescargarArchivosAdjunto(
    requerimientoId: string,
    payload: { id: string }[],
  ): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(
      `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${requerimientoId}/destinatarios/presign-download`,
      {
        destinatarios: payload,
      },
    );
  }

  // Servicios asociados al coordinado, requerimiento y sugerencias

  /**
   * función para obtener los requerimientos por el id del interesado
   * @param interesadoId
   * @returns
   */
  obtenerRequerimientosDelInteresado(
    interesadoId: string,
  ): Observable<RespuestaRequerimientoNuevo> {
    return this._http
      .get<RespuestaRequerimientoNuevo>(
        `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/?interesadoId=${interesadoId}`,
      )
      .pipe(map((response) => response));
  }

  /**
   * función para obtener numeros asociados al interesado coordinado
   * @param term : palabra a buscar por el coordinado interesado
   * @param fechaInicio : fecha de inicio de la busqueda
   * @param fechaFin : fecha de fin de la busqueda
   * @returns array de SugerenciaCorrelativo
   */
  obtenerNumerosPorIdInteresado(
    term: string,
    fechaInicio: string,
    fechaFin: string,
    interesadoId: string,
  ): Observable<SugerenciaCorrelativo[]> {
    let queryParams = new HttpParams()
      .set("campo", TipoSugerencia.CORRELATIVO)
      .set("valor", term)
      .set("limite", 10)
      .set("fechaInicio", fechaInicio)
      .set("fechaFin", fechaFin)
      .set("interesadoId", interesadoId);

    return this.http
      .get(
        `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/sugerencias`,
        {
          params: queryParams,
        },
      )
      .pipe(
        map((response: any) => {
          return response as SugerenciaCorrelativo[];
        }),
      );
  }

  /**
   * función para obtener titulos asociados al interesado coordinado
   * @param term : numero a buscar para el coordiando intersado
   * @param fechaInicio : fecha de inicio de la busqueda
   * @param fechaFin : fecha fin de la busqueda
   * @returns array de SugerenciaTitulo[]
   */
  obtenerTitulosPorIdInteresado(
    term: string,
    fechaInicio: string,
    fechaFin: string,
    interesadoId: string,
  ): Observable<SugerenciaTitulo[]> {
    let queryParams = new HttpParams()
      .set("campo", TipoSugerencia.TITULO)
      .set("valor", term)
      .set("limite", 10)
      .set("fechaInicio", fechaInicio)
      .set("fechaFin", fechaFin)
      .set("interesadoId", interesadoId);

    return this.http
      .get(
        `${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/sugerencias`,
        {
          params: queryParams,
        },
      )
      .pipe(
        map((response: any) => {
          return response as SugerenciaTitulo[];
        }),
      );
  }
}
