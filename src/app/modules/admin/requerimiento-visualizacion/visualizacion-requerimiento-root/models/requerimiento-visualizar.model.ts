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
