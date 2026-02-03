import { Component, inject, signal } from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RequerimientoService } from '../../../../../../shared/services/requerimientos.service';
import { RequerimientoCrearOEditarStore } from '../../../../../../shared/store/requerimiento-admin/requerimiento-crear-o-editar.store';

interface DialogData {
  form: any;
}

interface DialogResult {
  success: boolean;
  message?: string;
  data?: any;
}

@Component({
  selector: 'app-publish-requirement-dialog',
  imports: [MatDialogContent, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './publish-requirement-dialog.component.html',
  styleUrl: './publish-requirement-dialog.component.scss',
})
export class PublishRequirementDialogComponent {
  readonly requerimientoService = inject(RequerimientoService);
  readonly requerimientoCrearStore = inject(RequerimientoCrearOEditarStore);
  readonly dialogRef = inject(MatDialogRef<PublishRequirementDialogComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  public loading = signal<boolean>(false);
  public error = signal<boolean>(false);

  idRequerimiento = this.requerimientoCrearStore.idRequerimiento;

  publishRequirement() {
    this.loading.set(true)
    this.error.set(false);

    this.requerimientoCrearStore
      .publicarRequerimientoConBorrador(this.idRequerimiento()!, this.data.form)
      .subscribe({
        next: (ok) => {
          this.loading.set(false);
          if (ok) {
            this.dialogRef.close({
              success: true,
              message: 'Requerimiento publicado exitosamente',
            } as DialogResult);
          } else {
            this.error.set(true);
          }
        },
        error: () => {
          this.loading.set(false);
          this.error.set(true);
        },
      });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  getFileName(filePath: string): string {
    if (!filePath) return '';

    // Primero extraer el nombre del archivo del path (maneja tanto / como \)
    const fileName = filePath.split(/[/\\]/).pop() || '';

    // Luego remover la extensión
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
  }

  getExtension(fileName: string): string {
    return fileName.split('.').pop() || '';
  }
}
