import { Component, inject, Signal } from '@angular/core';
import { MatDialog, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DialogConfirmStore } from '../../../shared/store/dialog-confirm.store';
import { VisualizarDetalleStore } from '../../../shared/store/visualizar-requerimiento/visualizar-detalle.store';
import { ExitoRecordatorioDialogComponent } from '../exito-recordatorio-dialog/exito-recordatorio-dialog.component';
import { FalloEnviarRecordatorioDialogComponent } from '../fallo-enviar-recordatorio-dialog/fallo-enviar-recordatorio-dialog.component';

type ConfirmAlertData = {
  resultadoEnvio: Signal<'exito' | 'error' | null>;
  idRespuesta: string;
}

@Component({
  selector: 'app-confirm-alert-dialog',
  imports: [MatDialogContent, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './info-enviar-recordatorio-dialog.component.html',
  styleUrl: './info-enviar-recordatorio-dialog.component.scss',
})
export class InfoEnviarRecordatorioAlertComponent {
  readonly dialogStore = inject(DialogConfirmStore);
  private dialogRef = inject(MatDialogRef<InfoEnviarRecordatorioAlertComponent>);
  private dialog = inject(MatDialog);

  readonly store = inject(VisualizarDetalleStore);


  constructor() {}

  closeDialog() {
    this.dialogRef.close(false);
  }

  recordarALosCoordinados() {

    this.store.enviarRecordatorioAInteresados().then((resp) => {
      this.dialogRef.close(true);
      if (!resp) {
        this.dialog.open(FalloEnviarRecordatorioDialogComponent, {
          width: '395px',
          disableClose: true
        });
        return;
      }
      this.dialog.open(ExitoRecordatorioDialogComponent, {
        width: '395px',
        disableClose: true
      });
    })

  }
}
