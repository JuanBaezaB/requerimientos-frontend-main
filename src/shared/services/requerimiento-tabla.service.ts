import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { APIRequerimientoService } from "../../api/api.tramite-inverso.service";
import { environment } from "../environment/environment";
import { Requerimiento } from "../models/respuesta.model";

@Injectable({ providedIn: 'root' })
export class RequerimientoTablaService {
  private readonly http = inject(HttpClient);
  private _http = inject(APIRequerimientoService);

  eliminarRequerimiento(id: string): Observable<void> {
    return this._http.delete(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${id}`);
  }

  obtenerRequerimientoPorIdDeTabla(id: string): Observable<Requerimiento>{
    return this._http.get<Requerimiento>(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${id}`);
  }
}
