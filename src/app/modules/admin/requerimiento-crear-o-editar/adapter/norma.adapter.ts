import { Injectable } from '@angular/core';
import { Regulation } from '../interfaces/regulation';

@Injectable({ providedIn: 'root' })
export class NormaAdapter {
  fromApi(data: any): Regulation[] {
    return data.map((item: any) => ({
      value: item.idNorma,
      label: `${item.articulo} ${item.cuerpoLegal}`,
      subNormas: item.subNormas.map((subItem: any) => ({
        value: subItem.idSubNorma,
        label: subItem.nombre,
      })),
    }));
  }
}
