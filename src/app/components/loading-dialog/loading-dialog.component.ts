import { Component } from '@angular/core';
import {
  MatDialogContent,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'loading-alert-component',
  imports: [
    MatDialogContent,
    MatProgressSpinnerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  templateUrl: './loading-dialog.component.html',
  styleUrl: './loading-dialog.component.scss',
})
export class LoadingDialogComponent {
  constructor(public dialogRef: MatDialogRef<LoadingDialogComponent>) {}

  closeDialog() {
    this.dialogRef.close(false);
  }

  cerrarYActualizarPaginaActual() {
    this.dialogRef.close(true);
  }
}
