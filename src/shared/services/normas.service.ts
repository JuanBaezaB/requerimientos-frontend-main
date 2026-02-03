import {
    HttpClient,
    HttpErrorResponse
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { NormaAdapter } from '../../app/modules/admin/requerimiento-crear-o-editar/adapter/norma.adapter';
import { Regulation } from '../../app/modules/admin/requerimiento-crear-o-editar/interfaces/regulation';
import { environment } from '../environment/environment';

export interface NormasResponse {
  idNorma: number;
  descripcion: string;
  articulo: string;
  cuerpoLegal: string;
  subNormas: SubNorma[];
}

export interface SubNorma {
  idSubNorma: number;
  idDepartamento: number;
  nombre: string;
  numeral: string;
  periodicidad: Periodicidad;
}

export type Periodicidad = 'Anual' | 'Mensual';

@Injectable({ providedIn: 'root' })
export class NormasService {
  private readonly http = inject(HttpClient);
  private readonly adapter = inject(NormaAdapter);

  enviarCoordinador(): Observable<Regulation[]> {
    return this.http.get<NormasResponse[]>(`${environment.normaUrl}`).pipe(
      map((response) => {
        return this.adapter.fromApi(response);
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      }),
    );
  }
}
