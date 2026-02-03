

import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { distinctUntilChanged, map, Observable } from "rxjs";
import { APIRequerimientoService } from "../../api/api.tramite-inverso.service";
import { environment } from "../environment/environment";

export interface UrlArchivoRespuesta {
  url: string;
}

export interface AdjuntoInterface{
  nombre: string;
  tipo: string;
  extension: string;
  orden: string;
  path: string;
}


@Injectable({ providedIn: 'root' })
export class RespuestasService{
  private _http = inject(APIRequerimientoService)
  private http = inject(HttpClient);
  private readonly _httpStreaming = inject(HttpClient);

  obtenerUrlArchivoSubir(id: string, extension: string, orden: string, archivo: string) {
    const queryParams = new HttpParams({
      fromObject:
      {
        orden: orden,
        extension: extension,
        archivo: archivo,
        action: 'PUT'
      }
    });
    return this._http.get<UrlArchivoRespuesta>(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/respuestas/${id}/url`, queryParams ).pipe(map((response) => response.url));
  }

  // Se cambio para separar servicio presign-upload
  // se cambio para separar servicio para descarga presign-download

  subirArchivoRespuesta(url: string, archivo: File): Observable<{ type: 'progress' | 'complete';  value: number}> {
    const headers = new HttpHeaders({
      'Content-Type': archivo.type,
      'Content-Disposition': 'attachment',
    });

    return this._httpStreaming.put(url, archivo, {
      headers,
      reportProgress: true,
      observe: 'events'
    }).pipe(map((event: HttpEvent<any>) => {
      switch (event.type) {
        case HttpEventType.UploadProgress:
          return {
            type: 'progress' as const,
            value: Math.round((event.loaded / (event.total || 1)) * 100),
          };
        case HttpEventType.Response:
          return {
            type: 'complete' as const,
            value: 100
          };
        default:
          return {
            type: 'progress' as const,
            value: 0
          };
      }
    }),
      distinctUntilChanged(),);
  }

  obtenerUrlPrefirmadaParaDescargaDeArchivoAdjuntoPorOrden(respuestaId: string, orden: string): Observable<{ url: string }>{
    return this.http.post<{ url: string }>(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/respuestas/${respuestaId}/presign-download/?orden=${orden}`,null);
  }

}
