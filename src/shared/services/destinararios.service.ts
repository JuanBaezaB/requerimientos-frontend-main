import { environment } from './../environment/environment';
/// TODO: Aqui abordaremos con el id de destinararios.
/// last entrega la ultima respuesta enviada por el destinatario.
/// aqui encontraremos la ultima data. de la ultima respuesta.
/// /last, trae siempre la ultima respuesta.

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { APIRequerimientoService } from "../../api/api.tramite-inverso.service";
import { UltimaRespuestaDestinatario } from "../models/respuesta.model";
import { AdjuntoInterface } from "./respuestas.service";

export interface RespuestaPresignedUpload{
  url: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class DestinararioService{
  private _http = inject(APIRequerimientoService)
  private readonly _httpStreaming = inject(HttpClient);
  private http = inject(HttpClient);

  /**
   * obtenerUltimaRespuestaDestinatario
   * @param destinatarioId
   * @returns ultima respuesta si existe, si no, este entrega un objeto vacio o null
   */
  obtenerUltimaRespuestaDestinatario(destinatarioId: string): Observable<UltimaRespuestaDestinatario[]> {
    return this._http
      .get<UltimaRespuestaDestinatario[]>(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/destinatarios/${destinatarioId}/respuestas/last`)
      .pipe(map((response) => response));
  }

  /**
   * obtenerUrlPrefirmadaParaCargarRespuestaDestinarario
   * Obtiene url para subir archivo s3 y path para informar al backend
   * @returns { url, path}
   */
  obtenerUrlPrefirmadaParaCargarRespuestaDestinarario(){
    return this._http.post(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/destinatarios/respuestas/presign-upload`)
      .pipe(map((response) => response));
  }

  /**
   *
   * @param payload {adjunto: AdjuntoInterface[], celdas: any}
   * @param destinatarioId string
   * @returns response
   */
  enviarRespuestaACoordinador(payload: { adjuntos: AdjuntoInterface[], celdas: any}, destinatarioId: string) {
    return this._httpStreaming.post<void>(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/destinatarios/${destinatarioId}/responder`, {
        adjuntos: payload.adjuntos.length == 0 ? null : payload.adjuntos,
        celdas: payload.celdas.length == 0 ? null : payload.celdas
    }, {
      observe: 'response'
    });
  }
}
