import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

interface HttpOptions {
  headers?: HttpHeaders;
  params?: HttpParams;
}

@Injectable({ providedIn: 'root' })
export class APIRequerimientoService {
  private readonly _http = inject(HttpClient);

  /**
   * GET request unico de recurso por el identificador definido
   * @param {string} endpoint - API Endpoint
   * @param {HttpParams} [params] - Optional query parameters
   * @returns {Observable<T>} Devuelve un observable obtenido del recurso
   */

  public getById<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this._http
      .get<T>(endpoint, this._createOptions({ params }))
      .pipe(catchError(this._handleError));
  }

  /**
   * GET request para obtener multiples recursos
   * @param {string} endpoint - API Endpoint
   * @param {HttpParams} [params] - Optional query parameters
   * @returns {Observable<T>} Un observable del recurso solicitado
   */
  public get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this._http
      .get<T>(endpoint, this._createOptions({ params }))
      .pipe(catchError(this._handleError));
  }

  /**
   * POST Request para crear un nuevo recurso
   * @param {string} endpoint - API Endpoint
   * @params {T} [body] - Payload a enviar en el body
   * @param {HttpOptions} [options] - Configuracion de requests options
   * @returns {Observable<T>} Un observable del recurso creado
   */
  public post<T, V>(
    endpoint: string,
    body?: T,
    options?: HttpOptions,
  ): Observable<V> {
    return this._http
      .post<V>(endpoint, body, this._createOptions(options))
      .pipe(catchError(this._handleError));
  }

  /**
   * PUT request para actualizar completamente un resource
   * @param {string} endpoint - API endpoint
   * @param {T} [body] - Payload a enviar en el request body
   * @param {HttpOptions} [options] - Request configuration options
   * @returns {Observable<T>} An observable of the updated resource
   */
  public put<T, V>(
    endpoint: string,
    body?: T,
    options?: HttpOptions,
  ): Observable<V> {
    return this._http
      .put<V>(endpoint, body, this._createOptions(options))
      .pipe(catchError(this._handleError));
  }

  /**
   * PATCH request para actualizar parcialmente un recurso
   * @param {string} endpoint - API endpoint del recurso
   * @param {T} [body] - Payload a enviar en el request body
   * @param {HttpOptions} [options] - Configuracion de request options
   * @returns {Observable<T>} Un observable del recurso actualizado
   */
  public patch<T>(
    endpoint: string,
    body?: T,
    options?: HttpOptions,
  ): Observable<T> {
    return this._http
      .patch<T>(endpoint, body, this._createOptions(options))
      .pipe(catchError(this._handleError));
  }

  /**
   * DELETE request para remover un recurso
   * @param {string} endpoint - API endpoint para eliminar recurso
   * @param {HttpOptions} [options] - Configuracion de request options
   * @returns {Observable<T>} Observable de la respuesta del recurso eliminado
   */
  public delete<T>(endpoint: string, options?: HttpOptions): Observable<T> {
    return this._http
      .delete<T>(endpoint, this._createOptions(options))
      .pipe(catchError(this._handleError));
  }

  private _createOptions(options?: HttpOptions): HttpOptions {
    return {
      headers: options?.headers,
      params: options?.params,
    };
  }

  private _handleError(error: unknown) {
    return throwError(() => error);
  }
}
