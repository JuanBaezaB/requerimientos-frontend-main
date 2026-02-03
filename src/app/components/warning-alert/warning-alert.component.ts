import { Component, inject } from '@angular/core';
import {
  MatDialogContent,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { RespuestaStore } from '../../../shared/store/respuestas-requerimiento/respuestas.store';

@Component({
  selector: 'warning-alert-component',
  imports: [
    MatDialogContent,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
  ],
  templateUrl: './warning-alert.component.html',
  styleUrl: './warning-alert.component.scss',
})
export class WarningAlertComponent {
  private router = inject(Router);
  private respuestaStore = inject(RespuestaStore);
  constructor(public dialogRef: MatDialogRef<WarningAlertComponent>) {}

  closeDialog() {
    this.dialogRef.close();
  }

  irALaPantallaPrincipal() {
    this.dialogRef.close();
    this.respuestaStore.limpiarResultados();
    this.router.navigate(['/']);
  }
}
