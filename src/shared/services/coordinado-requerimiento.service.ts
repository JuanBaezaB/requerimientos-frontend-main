import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  map,
  Observable
} from 'rxjs';
import { APIRequerimientoService } from '../../api/api.tramite-inverso.service';
import { RequerimientoVisualizarDto } from '../../app/modules/admin/requerimiento-root/models/requerimiento-visualizar.dto';
import { RequerimientoDto } from '../../app/modules/admin/requerimiento-root/models/requerimiento.dto';
import { SugerenciaCorrelativo } from '../entities/sugerencia-correlativo.entity';
import { SugerenciaTitulo } from '../entities/sugerencia-titulo.entity';
import { environment } from '../environment/environment';
import { BuscarRequerimientoPorParametrosVisualizar, RespuestaPaginadaVisualizar } from './requerimiento-visualizar.service';
import { TipoSugerencia } from './requerimientos-filtros.service';

@Injectable({ providedIn: 'root' })
export class CoordinadoRequerimientoService {
  private readonly http = inject(HttpClient);
  private _http = inject(APIRequerimientoService);

  // Servicios asociados al coordinado, requerimiento y sugerencias
  /**
   * función para obtener los requerimientos por el id del interesado
   * @param interesadoId
   * @returns
   */
  obtenerRequerimientosParaTablaVisualizarCoordinado(parametros: BuscarRequerimientoPorParametrosVisualizar, interesadoId: string): Observable<RespuestaPaginadaVisualizar<RequerimientoDto>>{
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
        queryParams = queryParams.set('accion', 'ADM');
      }


      queryParams = queryParams.set('interesadoId', interesadoId).set('limite', parametros.limite)
        .set('pagina', parametros.pagina);



      return this.http.get<RespuestaPaginadaVisualizar<RequerimientoVisualizarDto>>(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/`, {
        params: queryParams
      });
    }

  /**
   * función para obtener numeros asociados al interesado coordinado
   * @param term : palabra a buscar por el coordinado interesado
   * @param fechaInicio : fecha de inicio de la busqueda
   * @param fechaFin : fecha de fin de la busqueda
   * @returns array de SugerenciaCorrelativo
   */
  obtenerNumerosPorIdInteresado(term: string, fechaInicio: string, fechaFin: string, interesadoId: string): Observable<SugerenciaCorrelativo[]> {
      let queryParams = new HttpParams()
        .set('campo', TipoSugerencia.CORRELATIVO)
        .set('valor', term)
        .set('limite', 10)
        .set('fechaInicio', fechaInicio)
        .set('fechaFin', fechaFin)
        .set('interesadoId', interesadoId);

      return this.http.get(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/sugerencias`, {
        params: queryParams
      }).pipe(map((response: any) => {
        return response as SugerenciaCorrelativo[]
      }));
    }

  /**
   * función para obtener titulos asociados al interesado coordinado
   * @param term : numero a buscar para el coordiando intersado
   * @param fechaInicio : fecha de inicio de la busqueda
   * @param fechaFin : fecha fin de la busqueda
   * @returns array de SugerenciaTitulo[]
   */
    obtenerTitulosPorIdInteresado(term: string, fechaInicio: string, fechaFin: string, interesadoId: string): Observable<SugerenciaTitulo[]> {
      let queryParams = new HttpParams().set('campo', TipoSugerencia.TITULO).set('valor', term).set('limite', 10).set('fechaInicio', fechaInicio).set('fechaFin', fechaFin).set('interesadoId', interesadoId);

      return this.http.get(`${environment.aplicativoConfig.privateUrl}/${environment.aplicativoConfig.contexts[0]}/v1/requerimientos/sugerencias`, {
        params: queryParams
      }).pipe(map((response: any) => {
        return response as SugerenciaTitulo[]
      }));
    }
}
