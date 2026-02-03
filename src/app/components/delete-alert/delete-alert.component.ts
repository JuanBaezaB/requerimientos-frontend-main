import { Component, inject } from '@angular/core';
import {
  MatDialogContent,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'warning-alert-component',
  imports: [
    MatDialogContent,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  templateUrl: './delete-alert.component.html',
  styleUrl: './delete-alert.component.scss',
})
export class DeleteAlertComponent {
  private router = inject(Router);
  constructor(public dialogRef: MatDialogRef<DeleteAlertComponent>) {}

  closeDialog() {
    this.dialogRef.close(false);
  }

  cerrarYActualizarPaginaActual() {
    this.dialogRef.close(true);
  }
}
