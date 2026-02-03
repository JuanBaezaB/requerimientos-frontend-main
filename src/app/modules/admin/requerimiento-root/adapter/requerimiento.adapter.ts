import { RequerimientoVisualizarDto } from "../models/requerimiento-visualizar.dto";
import { RequerimientoVisualizarBusqueda } from "../models/requerimiento-visualizar.model";
import { RequerimientoDto } from "../models/requerimiento.dto";
import { RequerimientoBusqueda } from "../models/requerimiento.model";

export class RequerimientoAdapter{
  static fromApi(dto: RequerimientoDto): RequerimientoBusqueda{
    return {
      id: dto.id,
      noRequerimiento: dto.correlativo.toString(),
      titulo: dto.titulo,
      fechaDeVencimiento: dto.vencimiento,
      estado: dto.estado,
      respuesta: dto.respuesta,
      destinatarioId: dto.destinatarioId
    };
  }

  static fromApiList(dtos: RequerimientoDto[]): RequerimientoBusqueda[]{
    return dtos?.map(this.fromApi) ?? [];
  }
}


export class RequerimientoVisualizarAdapter{
  static fromApi(dto: RequerimientoVisualizarDto): RequerimientoVisualizarBusqueda{
    return {
      id: dto.id,
      noRequerimiento: dto.correlativo.toString(),
      titulo: dto.titulo,
      fechaDeVencimiento: dto.vencimiento,
      estado: dto.estado,
      respondidos: dto.respondidos,
      pendientes: dto.pendientes,
      total: dto.total,
      tipo: dto.tipo,
    };
  }

  static fromApiList(dtos: RequerimientoVisualizarDto[]): RequerimientoVisualizarBusqueda[]{
    return dtos?.map(this.fromApi) ?? [];
  }
}
