import { Component } from '@angular/core';
import {
  MatDialogContent,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'warning-back-alert-component',
  imports: [
    MatDialogContent,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  templateUrl: './warning-back-alert.component.html',
  styleUrl: './warning-back-alert.component.scss',
})
export class WarningBackAlertComponent {
  constructor(public dialogRef: MatDialogRef<WarningBackAlertComponent>) {}

  closeDialog() {
    this.dialogRef.close(false);
  }

  irALaPantallaPrincipal() {
    this.dialogRef.close(true);
  }
}
