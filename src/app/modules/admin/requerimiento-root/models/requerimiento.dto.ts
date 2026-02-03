export interface RequerimientoDto{
  id: string;
  correlativo: number;
  titulo: string;
  vencimiento: string; // ISO date String
  estado: string;
  respuesta?: string;
  destinatarioId?: string;
}
