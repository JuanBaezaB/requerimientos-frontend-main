import { Component, effect, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RequerimientoStore } from '../../../../../../shared/store/requerimiento-admin/requerimiento.store';


interface DialogData {
  correlativo: string
  id: string,
  nuevoVencimiento: string,
}

@Component({
  selector: 'app-confirm-alert-dialog',
  imports: [MatDialogContent, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './cambio-fecha-dialog.component.html',
  styleUrl: './cambio-fecha-dialog.component.scss',
})
export class CambioFechaDialogComponent {
  private dialogRef = inject(MatDialogRef<CambioFechaDialogComponent>);
  readonly store = inject(RequerimientoStore);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  correlativoActual = signal<string | null>(null);
  idRequerimientoActual = signal<string | null>(null);
  nuevaFechaActual = signal<string | null>(null);

  constructor() {
    this.correlativoActual.set(this.data.correlativo);
    this.idRequerimientoActual.set(this.data.id);
    this.nuevaFechaActual.set(this.data.nuevoVencimiento);
    effect(() => {
      const seCambio = this.store.seCambioFecha();

      if (seCambio != null) {
        this.dialogRef.close(!!seCambio);
      }
    })
  }

  noEnviarACoodinador() {
    this.dialogRef.close(false);
  }

  enviarACoordinador() {
    this.store.aplazarConNuevaFechaVencimiento(this.idRequerimientoActual()!, this.nuevaFechaActual()!);
  }
}
