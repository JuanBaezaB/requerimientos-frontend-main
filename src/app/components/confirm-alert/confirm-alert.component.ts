import { Component, inject, signal, Signal } from '@angular/core';
import { MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DialogConfirmStore } from '../../../shared/store/dialog-confirm.store';
import { RespuestaStore } from '../../../shared/store/respuestas-requerimiento/respuestas.store';

type ConfirmAlertData = {
  resultadoEnvio: Signal<'exito' | 'error' | null>;
  idRespuesta: string;
}

@Component({
  selector: 'app-confirm-alert-dialog',
  imports: [MatDialogContent, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './confirm-alert.component.html',
  styleUrl: './confirm-alert.component.scss',
})
export class ConfirmAlertDialogComponent {
  readonly dialogStore = inject(DialogConfirmStore);
  readonly respuestaStore = inject(RespuestaStore);
  private dialogRef = inject(MatDialogRef<ConfirmAlertDialogComponent>);

  idRespuesta = this.dialogStore.obtenerIrDespuesta();

  enviandoRespuesta = signal(false);

  constructor() {}

  closeDialog() {
    this.dialogRef.close();
  }

  public async enviarAlCoordinador(): Promise<void> {
    const payload = this.respuestaStore.adjuntosOCeldasParaEnviar();

    this.enviandoRespuesta.set(true);
    this.dialogRef.close();
    this.dialogStore.setIniciandoEnvioSolicitud();

    try {
      const respuesta = await this.respuestaStore.enviarRespuestaAlCoordinador(payload);
      this.respuestaStore.limpiarResultados();
      if (respuesta) {
        this.dialogStore.setResultadoEnvio('exito');
      } else {
        this.dialogStore.setResultadoEnvio('error');
      }
    } catch (_) {
      this.dialogStore.setResultadoEnvio('error');
    } finally {
      this.dialogRef.close();
    }
  }
}
