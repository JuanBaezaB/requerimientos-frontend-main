import { Component, inject } from '@angular/core';
import { MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DialogConfirmStore } from '../../../shared/store/dialog-confirm.store';


@Component({
  selector: 'app-exito-recordatorio-dialog',
  imports: [MatDialogContent, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './exito-recordatorio-dialog.component.html',
  styleUrl: './exito-recordatorio-dialog.component.scss',
})
export class ExitoRecordatorioDialogComponent {
  readonly dialogStore = inject(DialogConfirmStore);
  private dialogRef = inject(MatDialogRef<ExitoRecordatorioDialogComponent>);

  constructor() {}

  closeDialog() {
    this.dialogRef.close(false);
  }

  cerrarAlerta() {
    this.dialogRef.close(true);
  }
}
