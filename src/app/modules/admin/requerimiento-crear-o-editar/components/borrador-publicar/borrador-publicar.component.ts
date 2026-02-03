import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  input,
  output,
  runInInjectionContext,
  Signal,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RequerimientoService } from '../../../../../../shared/services/requerimientos.service';

import { CommonModule } from '@angular/common';
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { RequerimientoCrearOEditarStore } from '../../../../../../shared/store/requerimiento-admin/requerimiento-crear-o-editar.store';
import { BackDialogComponent } from '../../../../../components/back-dialog/back-dialog.component';
import { ErrorDialogComponent } from '../../../../../components/error-dialog/error-dialog.component';
import { LoadingDialogComponent } from '../../../../../components/loading-dialog/loading-dialog.component';
import { SuccessDialogComponent } from '../../../../../components/success-dialog/success-dialog.component';
import { WarningBackAlertComponent } from '../../../../../components/warning-back-alert/warning-back-alert.component';
import { PublishRequirementDialogComponent } from '../publish-requirement-dialog/publish-requirement-dialog.component';

@Component({
  selector: 'app-borrador-publicar',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatInputModule
],
  templateUrl: './borrador-publicar.component.html',
  styleUrl: './borrador-publicar.component.scss',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BorradorPublicarComponent {
  requerimientoService = inject(RequerimientoService);
  readonly router = inject(Router);
  readonly requerimientoCrearStore = inject(RequerimientoCrearOEditarStore);
  dialog = inject(MatDialog);

  correlativo = this.requerimientoCrearStore.correlativo;
  idRequerimiento = this.requerimientoCrearStore.idRequerimiento;

  public form = input.required<FormGroup>();

  public publishResult = output<{
    success: boolean;
    message: string;
    data?: any;
  }>();

  public isPublished = signal<boolean>(false);
  public borradorGuardado = signal<boolean>(false);

  public formValue!: Signal<any>;
  public canPublish!: Signal<boolean>;

  readonly seEstanSubiendoArchivos = computed(() => this.requerimientoCrearStore.seEstanSubiendoArchivos());

  readonly step3FaltanTitulos = signal(false);

  injector = inject(Injector);

  ngOnInit() {
    runInInjectionContext(this.injector, () => {
      this.formValue = toSignal(this.form().valueChanges, {
        initialValue: this.form().getRawValue(),
      });

      this.canPublish = computed(() => {
        const raw = this.formValue();
        const paso1Ok = this.form().get('step1')?.valid ?? false;

        const solicitud = raw.step2?.solicitud ?? '';
        const paso2Ok = solicitud.trim().length >= 3;

        const modo = raw.step3?.modo;
        let paso3Ok = false;
        if (modo === 'adjuntos') {
          const adjuntos = raw?.step3?.fileInputs || [];
          paso3Ok = adjuntos.every((f: any) => f.title?.trim() !== '' && f.fileName?.trim() !== '') && adjuntos.length > 0;
        } else if (modo === 'accion') {
          paso3Ok = this.form().get('step3.planAccion')?.valid ?? false;
        } else {
          paso3Ok = false;
        }

        const coordinados = raw?.step4?.coordinador || [];
        const coordinadoresOk =
          Array.isArray(coordinados) && coordinados.length > 0;

        // Falta agregar paso5Ok

        return paso1Ok && paso2Ok && paso3Ok && coordinadoresOk;
      });

      setTimeout(() => {
        this.form().updateValueAndValidity({ emitEvent: true });
      }, 1500)
    });

  }

  publicarRequerimiento(): void {
    this.openDialogSend();
  }

  openGuardarBorrador(): void {
    this.form().updateValueAndValidity({ onlySelf: false, emitEvent: true });
    const raw = this.form().getRawValue();

    const cleanedRaw = this.limpiarPathsDeArchivos(raw);

    const borradorDialogRef = this.dialog.open(BackDialogComponent, {
      disableClose: true,
      width: '395px',
    });

    borradorDialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) {
        return;
      }

      const loadingDialogRef = this.dialog.open(LoadingDialogComponent, {
        disableClose: true,
        width: '395px'
      });

      this.requerimientoCrearStore.guardarRequerimientoBorrador(this.idRequerimiento()!, cleanedRaw).subscribe((guardado) => {
          loadingDialogRef.close();
          if (guardado) {
            this.dialog.open(SuccessDialogComponent, {
              disableClose: true,
              width: '395px',
            });

            this.borradorGuardado.set(true);
            this.requerimientoCrearStore.marcarBorradorGuardado(true);

            if (cleanedRaw.step3.modo == null) {
              setTimeout(() => {
                this.requerimientoCrearStore.marcarBorradorGuardado(false);
              }, 1000);
            }
          } else {
            this.dialog.open(ErrorDialogComponent, {
              disableClose: true,
              width: '395px'
            })
          }
      })
    });
  }

  openDialogSend(): void {
    this.form().updateValueAndValidity({ onlySelf: false, emitEvent: true });
    const rawForm = this.form().getRawValue();

    const cleanedForm = this.limpiarPathsDeArchivos(rawForm)

    const dialogRef = this.dialog.open(PublishRequirementDialogComponent, {
      disableClose: true,
      width: '395px',
      data: {
        form: cleanedForm,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        if (result.success) {
          this.isPublished.set(true);
          this.form().get('step4')?.disable();
        }
        this.publishResult.emit(result);
      }
    });
  }

  volverAlInicio() {

    if (this.borradorGuardado()) {
      this.requerimientoCrearStore.limpiarRequerimiento();
      this.router.navigate(['/requerimiento/admin']);
      return;
    }

    const dialogRef = this.dialog.open(WarningBackAlertComponent, {
      disableClose: true,
      width: '395px',
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) {
        return;
      }

      this.requerimientoCrearStore.limpiarRequerimiento();
      this.router.navigate(['/requerimiento/admin']);
    });

  }

  private limpiarFakePath(path: string): string {
    return path.split(/(\\|\/)/g).pop() || path;
  }

  private limpiarPayload(obj: any): any{
    return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => {
        if (v === null || v === undefined) return false;
        if (Array.isArray(v)) return true;
        if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false;
        return true;
      })
      .map(([k, v]) => [
        k,
        Array.isArray(v)
          ? v.filter((item) => {
              if (typeof item !== 'object') return !!item;
              return Object.values(item).some((val) => val !== '' && val !== null && val !== undefined);
            })
          : typeof v === 'object' && !Array.isArray(v)
          ? this.limpiarPayload(v)
          : v,
      ])
  );
  }

  // Añade este método para limpiar todos los paths de archivos
  private limpiarPathsDeArchivos(formData: any): any {
      const cleaned = { ...formData };

      // Limpiar fileSolicitud del step2
      if (cleaned.step2?.fileSolicitud) {
        cleaned.step2.fileSolicitud = this.limpiarFakePath(cleaned.step2.fileSolicitud);
      }

      // Limpiar fileInputs del step3
      if (cleaned.step3?.fileInputs && Array.isArray(cleaned.step3.fileInputs)) {
        cleaned.step3.fileInputs = cleaned.step3.fileInputs.map((fileInput: any) => {
          if (fileInput.fileName) {
            return {
              ...fileInput,
              fileName: this.limpiarFakePath(fileInput.fileName)
            };
          }
          return fileInput;
        });
      }

      return cleaned;
  }

}


