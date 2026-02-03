import { Component } from '@angular/core';
import {
  MatDialogContent,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-fallo-enviar-recordatorio-dialog',
  imports: [
    MatDialogContent,
    MatProgressSpinnerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  templateUrl: './fallo-enviar-recordatorio-dialog.component.html',
  styleUrl: './fallo-enviar-recordatorio-dialog.component.scss',
})
export class FalloEnviarRecordatorioDialogComponent {
  constructor(public dialogRef: MatDialogRef<FalloEnviarRecordatorioDialogComponent>) {}

  cerrarAlerta() {
    this.dialogRef.close(false);
  }

  reintentarEnvio() {
    this.dialogRef.close(true);
  }

}
