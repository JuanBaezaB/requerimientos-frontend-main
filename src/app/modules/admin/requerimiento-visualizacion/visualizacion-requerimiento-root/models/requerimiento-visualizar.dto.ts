export interface RequerimientoDto{
  id: string;
  correlativo: number;
  titulo: string;
  vencimiento: string; // ISO date String
  estado: string;
  respondidos: number;
  pendientes: number;
  total: number;
}
