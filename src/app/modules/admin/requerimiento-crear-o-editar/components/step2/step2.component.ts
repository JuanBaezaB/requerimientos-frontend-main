import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RequerimientoService } from '../../../../../../shared/services/requerimientos.service';

import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RequerimientoCrearOEditarStore } from '../../../../../../shared/store/requerimiento-admin/requerimiento-crear-o-editar.store';
import { BackDialogComponent } from '../../../../../components/back-dialog/back-dialog.component';

@Component({
  selector: 'app-step2',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './step2.component.html',
  styleUrl: './step2.component.scss',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step2Component {
  requerimientoService = inject(RequerimientoService);
  requerimientoCrearStore = inject(RequerimientoCrearOEditarStore);

  idRequerimiento = this.requerimientoCrearStore.idRequerimiento;

  dialog = inject(MatDialog);

  public form = input.required<FormGroup>();
  fileName = signal<string>('Sin archivo seleccionado');
  uploadProgress = signal<number>(0);
  isUploading = signal<boolean>(false);
  uploadComplete = signal<boolean>(false);
  uploadError = signal<boolean>(false);
  loadingUpdate = signal<boolean>(false);

  readonly seEstanSubiendoArchivos = computed(() => this.requerimientoCrearStore.seEstanSubiendoArchivos());

  constructor() {
    effect(() => {
      if (this.requerimientoCrearStore.tieneCorrelativo()) {
        this.form().get('step2')?.enable();
      } else {
        this.form().get('step2')?.disable();
      }
    });

    effect(() => {
      const detalle = this.requerimientoCrearStore.requerimientoDetalle();

      if (detalle) {

        if (detalle.solicitud) {
          this.form().get('step2.solicitud')?.patchValue(detalle.solicitud);
        }

        if (detalle.adjuntoSolicitud) {
          const fullName = `${detalle.adjuntoSolicitud.nombre}.${detalle.adjuntoSolicitud.extension}`;
          this.fileName.set(fullName);
          this.uploadComplete.set(true);
          this.uploadProgress.set(100);

          this.form().get('step2.fileSolicitudName')?.patchValue(fullName, { emitEvent: false });
        }
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.fileName.set(file.name);

      this.form().get('step2.fileSolicitudName')?.setValue(file.name);

      this.uploadFile(file);
    }
  }

  private uploadFile(file: File): void {
    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.uploadComplete.set(false);
    this.uploadError.set(false);
    this.requerimientoCrearStore.subiendoArchivosALaNube(true);

    const { cleanFileName, extension: fileExtension } = this.getFileNameAndExtension(file.name);

    this.requerimientoService
      .obtenerUrlPrefirmada(this.idRequerimiento()!, {
        action: 'PUT',
        orden: '1',
        tipo: 'REQ',
        archivo: cleanFileName,
        extension: fileExtension,
      })
      .subscribe({
        next: (response) => {
          this.uploadToS3(response.url, file);
        },
        error: () => {
          this.isUploading.set(false);
          this.uploadError.set(true);
        },
      });
  }

  private getFileNameAndExtension(fileName: string): { cleanFileName: string; extension: string } {
    const lastDotIndex = fileName.lastIndexOf('.');

    if (lastDotIndex === -1) {
      return {
        cleanFileName: fileName,
        extension: ''
      };
    }

    return {
      cleanFileName: fileName.substring(0, lastDotIndex),
      extension: fileName.substring(lastDotIndex + 1)
    }
  }

  private uploadToS3(presignedUrl: string, file: File): void {
    this.requerimientoService.subirArchivo(presignedUrl, file).subscribe({
      next: (event) => {
        if (event.type === 'progress') {
          this.uploadProgress.set(event.value);
        } else if (event.type === 'complete') {
          this.handleUploadSuccess();
          this.finalizarSubidaArchivo();
        }
      },
      error: () => {
        this.finalizarSubidaArchivo();
      },
    });
  }

  private finalizarSubidaArchivo() {
    this.requerimientoCrearStore.subiendoArchivosALaNube(false);
  }

  private handleUploadSuccess(): void {
    this.isUploading.set(false);
    this.uploadComplete.set(true);
    this.uploadProgress.set(100);

    this.form().get('step2.fileSolicitud')?.markAsTouched();
  }

  openBackDialog(): void {
    this.dialog.open(BackDialogComponent, {
      disableClose: true,
      width: '395px',
    });
  }

}
