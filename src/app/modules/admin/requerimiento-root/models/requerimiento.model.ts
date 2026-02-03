export interface RequerimientoBusqueda{
  id: string;
  noRequerimiento: string;
  titulo: string;
  fechaDeVencimiento: string;
  estado: string;
  respuesta?: string;
  destinatarioId?: string;
}
