import { Injectable } from '@angular/core';
import { Regulation } from '../interfaces/regulation';
import { Segment } from '../interfaces/segment';

@Injectable({ providedIn: 'root' })
export class SegmentAdapter {
  fromApi(data: any): Segment[] {
    return data.map((item: any) => ({
      codigo: item.codigo,
      nombre: item.nombre,
    }));
  }
}
