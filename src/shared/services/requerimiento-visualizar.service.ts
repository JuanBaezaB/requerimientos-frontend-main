import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RequerimientoDto } from './../../app/modules/admin/requerimiento-root/models/requerimiento.dto';

import { map, Observable } from 'rxjs';
import { RequerimientoVisualizarDto } from '../../app/modules/admin/requerimiento-root/models/requerimiento-visualizar.dto';
import { SugerenciaCorrelativo } from '../entities/sugerencia-correlativo.entity';
import { SugerenciaTitulo } from '../entities/sugerencia-titulo.entity';
import { environment } from '../environment/environment';

enum TipoSugerencia{
  CORRELATIVO = 'correlativo',
  TITULO = 'titulo'
}

enum TipoRequerimiento{
  VIS = 'VIS'
}

export interface PaginacionMetadataVisualizar{
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export interface RespuestaPaginadaVisualizar<T>{
  data: T[];
  metadata: PaginacionMetadataVisualizar;
}

export interface BuscarRequerimientoPorParametrosVisualizar{
  correlativo: string;
  titulo: string;
  estados: string;
  fechaInicio: string;
  fechaFin: string;
  limite: number;
  pagina: number;
  estadisticas: boolean;
  accion: string;
}

@Injectable({ providedIn: 'root' })
export class RequerimientoFiltrosVisualizarService {
  private readonly http = inject(HttpClient);

  obtenerTitulosParaVisualizar(term: string, fechaInicio: string, fechaFin: string): Observable<SugerenciaTitulo[]> {
    let queryParams = new HttpParams().set('campo', TipoSugerencia.TITULO).set('valor', term).set('limite', 10).set('fechaInicio', fechaInicio).set('fechaFin', fechaFin).set('accion','VIS');

    return this.http.get(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/sugerencias`, {
      params: queryParams
    }).pipe(map((response: any) => {
      return response as SugerenciaTitulo[]
    }));
  }

    obtenerNumerosParaVisualizar(term: string, fechaInicio: string, fechaFin: string): Observable<SugerenciaCorrelativo[]> {
      let queryParams = new HttpParams()
        .set('campo', TipoSugerencia.CORRELATIVO)
        .set('valor', term)
        .set('limite', 10)
        .set('fechaInicio', fechaInicio)
        .set('fechaFin', fechaFin).set('accion','VIS');

      return this.http.get(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/sugerencias`, {
        params: queryParams
      }).pipe(map((response: any) => {
        return response as SugerenciaCorrelativo[]
      }));
    }
  obtenerRequerimientosParaTablaVisualizar(parametros: BuscarRequerimientoPorParametrosVisualizar): Observable<RespuestaPaginadaVisualizar<RequerimientoDto>>{
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

    if (parametros.estadisticas) {
      queryParams = queryParams.set('estadisticas', true);
    }

    if (parametros.accion) {
      queryParams = queryParams.set('accion', TipoRequerimiento.VIS);
    }


    queryParams = queryParams.set('limite', parametros.limite)
    .set('pagina', parametros.pagina);

    return this.http.get<RespuestaPaginadaVisualizar<RequerimientoVisualizarDto>>(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/`, {
      params: queryParams
    });
  }
}
