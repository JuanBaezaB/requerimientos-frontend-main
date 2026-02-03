import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../environment/environment';

export interface InteresadosResponse {
  id: string;
  rutEmpresa: string;
  nombreFantasia: string;
  interesadoSegmento?: InteresadoSegmento[];
}

export interface InteresadoSegmento {
  id: string;
  segmento: Segmento;
}

export interface Segmento {
  id: string;
  nombre: string;
  codigo: number;
}

@Injectable({ providedIn: 'root' })
export class InteresadoService {
  private readonly http = inject(HttpClient);

  getInteresado(segmentos?: number[]): Observable<any> {
    let params = new HttpParams();

    if (segmentos && segmentos.length > 0) {
      segmentos.forEach((segmento) => {
        params = params.append('segmentos', segmento.toString());
      });
    }

    return this.http
      .get(`${environment.omnidataUrl}/v1/interesados`, { params })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => error);
        }),
      );
  }
}
