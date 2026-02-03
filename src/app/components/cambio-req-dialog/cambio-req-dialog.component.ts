import { Component } from '@angular/core';
import {
  MatDialogContent,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'cambio-req-dialog-component',
  imports: [
    MatDialogContent,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  templateUrl: './cambio-req-dialog.component.html',
  styleUrl: './cambio-req-dialog.component.scss',
})
export class CambioReqDialogComponent {
  constructor(public dialogRef: MatDialogRef<CambioReqDialogComponent>) {}

  closeDialog() {
    this.dialogRef.close(false);
  }

  cambiarOpcion() {
    this.dialogRef.close(true);
  }
}
