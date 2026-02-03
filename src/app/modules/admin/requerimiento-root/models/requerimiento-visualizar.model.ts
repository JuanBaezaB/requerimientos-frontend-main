export interface RequerimientoVisualizarBusqueda{
  id: string;
  noRequerimiento: string;
  titulo: string;
  fechaDeVencimiento: string;
  estado: string;
  respondidos: number;
  pendientes: number;
  total: number;
  tipo: string;
}

export interface RequerimientoVisualizarDetalle{
  id: string;
  interesadoId: string;
  nombre: string;
  rut: string;
  todoId: string;
  respuestas: RespuestaDetalle[]
}

export interface RespuestaDetalle{
  id: string;
  fecha: Date;
}
export interface DetalleVerRespuesta{
  id: string;
  rut: string;
  nombre: string;
  numeroRequerimiento: string;
  fechaVencimiento: string;
  tipoRespuesta: string;
  titulo: string;
  destinatarioId: string;
}
