
export interface RespuestaRequerimiento{
  id: string;
  fecha: Date;
  interesadoId: string;
  requerimiento: Requerimiento;
  adjuntos: Adjunto[];
}

export interface RespuestaRequerimientoNuevo{
  id: string;
  vencimiento: Date;
  titulo: string;
  tipo: string;
  subNorma: string;
  solicitud: string;
  referencia: string;
  publicacion: string;
  plazos?: Plazo[];
  notificaciones: number;
  norma: string;
  formulario: Formulario;
  estado: string;
  destinatarios?: DestinatarioNuevo[];
  correlativo: number;
  celdas: Celda[];
  adjuntos: Adjunto[];
  adjuntoSolicitud: Adjunto;
}

export interface UltimaRespuestaDestinatario{
  id: string;
  fecha: Date;
  destinatario: DestinatarioNuevo;
  adjuntos: Adjunto[];
  celdas: Celda[];
}


export interface DestinatarioNuevo{
  id: string;
  interesadoId: string;
  respuestas?: any[];
  todoId: string;
}

export interface Formulario{
  id: string;
  nombre: string;
  columnas: Columna[]
}

export interface Columna{
  id: string;
  nombre: string;
  numero: number;
  tipo: string;
  respuesta: boolean;
  visible: boolean;
}

export interface Plazo{
  id: string;
  fechaVencimiento: Date;
  version: number;
}

export interface RespuestaRequerimientoResponse{
  id: string;
  fecha: Date;
  interesadoId: string;
  requerimiento: Requerimiento;
  adjuntos: Adjunto[];
}

export interface Adjunto{
  id: string;
  nombre: string;
  extension: string;
  orden: string;
  path: string;
  titulo: string;
}

export interface Celda{
  id: string;
  fila: number;
  columna: number;
  valor: string;
}

export interface Destinatario{
  id: string;
  fecha: Date;
  interesadoId: string;
}

export interface Formulario{
  id: string;
  nombre: string;
  columnas: Columna[];
}

export interface Requerimiento{
  id: string;
  correlativo: number;
  titulo: string;
  referencia: string;
  solicitud: string;
  norma: string;
  tipo: string;
  subNorma: string;
  vencimiento: Date;
  adjuntoSolicitud: Adjunto;
  adjuntos: Adjunto[];
  destinatarios: Destinatario[]; // se cambia a destinatarios
  formulario: Formulario;
  celdas: Celda[];
  notificaciones: number;
}


export interface CeldaInterface{
  fila: number;
  columna: number;
  valor: string | number | boolean | Date | null;
}
