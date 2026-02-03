
export interface PublicarRespuesta{
  interesadoId: string;
}

export interface PublicarAdjunto{
  id?: string;
  nombre: string;
  extension: string;
  orden: number;
  titulo?: string;
  path?: string;
}

export interface PublicarCelda{
  fila: number;
  columna: number;
  valor?: string;
}

export interface PublicarRequerimientoRequest{
  titulo: string;
  vencimiento: string; // ISO date
  solicitud: string;
  referencia: string;
  correlativo: number;
  tipo: string | null;
  formulario: { id: string };
  subNorma: string | null;
  norma: string | null;
  destinatarios: PublicarRespuesta[];
  adjuntoSolicitud?: PublicarAdjunto;
  adjuntos?: PublicarAdjunto[];
  celdas?: PublicarCelda[];
  notificaciones: number;
}
