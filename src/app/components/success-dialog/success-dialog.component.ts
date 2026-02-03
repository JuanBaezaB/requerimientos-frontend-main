import { Component } from '@angular/core';
import {
  MatDialogContent,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'success-alert-component',
  imports: [
    MatDialogContent,
    MatProgressSpinnerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  templateUrl: './success-dialog.component.html',
  styleUrl: './success-dialog.component.scss',
})
export class SuccessDialogComponent {
  constructor(public dialogRef: MatDialogRef<SuccessDialogComponent>) {}

  closeDialog() {
    this.dialogRef.close(false);
  }

  cerrarAlerta() {
    this.dialogRef.close(true);
  }
}
