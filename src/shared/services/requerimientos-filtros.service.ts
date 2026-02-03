import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RequerimientoDto } from './../../app/modules/admin/requerimiento-root/models/requerimiento.dto';

import { map, Observable } from 'rxjs';
import { APIRequerimientoService } from '../../api/api.tramite-inverso.service';
import { SugerenciaCorrelativo } from '../entities/sugerencia-correlativo.entity';
import { SugerenciaTitulo } from '../entities/sugerencia-titulo.entity';
import { environment } from '../environment/environment';

export enum TipoSugerencia{
  CORRELATIVO = 'correlativo',
  TITULO = 'titulo'
}

export interface PaginacionMetadata{
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export interface RespuestaPaginada<T>{
  data: T[];
  metadata: PaginacionMetadata;
}

export interface BuscarRequerimientoPorParametros{
  correlativo: string;
  titulo: string;
  estados: string; // Cambiar ya que es un array de Strings
  fechaInicio: string;
  fechaFin: string;
  limite: number;
  pagina: number
}

@Injectable({ providedIn: 'root' })
export class RequerimientoFiltrosService {
  private readonly http = inject(HttpClient);
  private _http = inject(APIRequerimientoService);

  obtenerNumeros(term: string, fechaInicio: string, fechaFin: string): Observable<SugerenciaCorrelativo[]> {
    let queryParams = new HttpParams()
      .set('campo', TipoSugerencia.CORRELATIVO)
      .set('valor', term)
      .set('limite', 10)
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/sugerencias`, {
      params: queryParams
    }).pipe(map((response: any) => {
      return response as SugerenciaCorrelativo[]
    }));
  }

  obtenerTitulos(term: string, fechaInicio: string, fechaFin: string): Observable<SugerenciaTitulo[]> {
    let queryParams = new HttpParams().set('campo', TipoSugerencia.TITULO).set('valor', term).set('limite', 10).set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);

    return this.http.get(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/sugerencias`, {
      params: queryParams
    }).pipe(map((response: any) => {
      return response as SugerenciaTitulo[]
    }));
  }

  obtenerRequerimientosParaTabla(parametros: BuscarRequerimientoPorParametros): Observable<RespuestaPaginada<RequerimientoDto>>{
    let queryParams = new HttpParams();

    if (parametros.correlativo) {
      queryParams = queryParams.set('correlativo', parametros.correlativo);
    }

    if (parametros.titulo) {
      queryParams = queryParams.set('titulo', parametros.titulo);
    }

    const estadosSeparados = parametros.estados.split(',');

    if (parametros.estados) {
      estadosSeparados.forEach((estado) => {
        queryParams = queryParams.append('estados', estado);
      })
    }

    if (parametros.fechaInicio) {
      queryParams = queryParams.set('fechaInicio', parametros.fechaInicio);
    }

    if (parametros.fechaFin) {
      queryParams = queryParams.set('fechaFin', parametros.fechaFin);
    }


    queryParams = queryParams.set('limite', parametros.limite)
    .set('pagina', parametros.pagina);

    return this.http.get<RespuestaPaginada<RequerimientoDto>>(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/`, {
      params: queryParams
    });
  }

  obtenerRequerimientoPorId(id: string): Observable<RequerimientoDto> {
    return this._http.get<RequerimientoDto>(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/${id}`);
  }
}
