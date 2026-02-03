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
  templateUrl: './error-dialog.component.html',
  styleUrl: './error-dialog.component.scss',
})
export class ErrorDialogComponent {
  constructor(public dialogRef: MatDialogRef<ErrorDialogComponent>) {}

  closeDialog() {
    this.dialogRef.close(false);
  }

  cerrarAlerta() {
    this.dialogRef.close(true);
  }
}
