import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { SegmentAdapter } from '../../app/modules/admin/requerimiento-crear-o-editar/adapter/segment.adapter';
import { environment } from '../environment/environment';

export interface SegmentsResponse {
  id: string;
  nombre: string;
  codigo: number;
}

@Injectable({ providedIn: 'root' })
export class SegmentService {
  private readonly http = inject(HttpClient);
  private readonly adapter = inject(SegmentAdapter);

  getSegments(): Observable<any> {
    return this.http.get(`${environment.omnidataUrl}/v1/segmentos`).pipe(
      map((response) => {
        return this.adapter.fromApi(response);
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      }),
    );
  }
}
