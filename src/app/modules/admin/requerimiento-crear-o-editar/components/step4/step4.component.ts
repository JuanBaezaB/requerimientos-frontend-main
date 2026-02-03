import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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
import { InteresadosResponse } from '../../../../../../shared/services/interesado.service';
import { RequerimientoCrearOEditarStore } from '../../../../../../shared/store/requerimiento-admin/requerimiento-crear-o-editar.store';
import { Segment } from '../../interfaces/segment';

@Component({
  selector: 'app-step4',
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
  templateUrl: './step4.component.html',
  styleUrl: './step4.component.scss',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step4Component {
  requerimientoService = inject(RequerimientoService);
  readonly router = inject(Router);
  readonly requerimientoCrearStore = inject(RequerimientoCrearOEditarStore);
  dialog = inject(MatDialog);

  correlativo = this.requerimientoCrearStore.correlativo;
  idRequerimiento = this.requerimientoCrearStore.idRequerimiento;

  public form = input.required<FormGroup>();
  public segments = input.required<Segment[]>();
  public coordinados = input.required<InteresadosResponse[]>();
  public publishResult = output<{
    success: boolean;
    message: string;
    data?: any;
  }>();

  public isPublished = signal<boolean>(false);
  public borradorGuardado = signal<boolean>(false);
  private selectedSegmentsSignal = signal<Segment[]>([]);

  private manuallySelectedCoordinados = signal<InteresadosResponse[]>([]);
  private isUpdatingFromSegments = false;

  public formValue!: Signal<any>;
  public canPublish!: Signal<boolean>;

  readonly seEstanSubiendoArchivos = computed(() => this.requerimientoCrearStore.seEstanSubiendoArchivos());

  readonly step3FaltanTitulos = signal(false);

  constructor() {
    this.requerimientoCrearStore.obtenerInteresadosDelRequerimiento();

    effect(() => {
      if (this.requerimientoCrearStore.tieneCorrelativo()) {
        this.form().get('step4')?.enable();
      } else {
        this.form().get('step4')?.disable();
      }
    });

    effect(() => {

      const interesados = this.requerimientoCrearStore.destinatariosPorId();

      if (interesados && interesados.length > 0) {
        const interesadosIds = interesados.map(i => i.id);

        const preselected = this.coordinados().filter((c) => interesadosIds.includes(c.id))

        if (preselected.length > 0) {
          this.form().get('step4.coordinador')?.setValue(preselected, { emitEvent: true });
          this.manuallySelectedCoordinados.set(preselected);
        }
      }
    });


  }


  filteredCoordinados = computed(() => {
    const selectedSegs = this.selectedSegmentsSignal();

    if (!selectedSegs || selectedSegs.length === 0) {
      return this.coordinados();
    }

    const selectedSegmentCodes = selectedSegs.map((seg: Segment) => seg.codigo);

    return this.coordinados().filter((coordinado) => {
      return coordinado.interesadoSegmento?.some((interesadoSeg) =>
        selectedSegmentCodes.includes(interesadoSeg.segmento.codigo),
      );
    });
  });

  injector = inject(Injector);

  ngOnInit() {
    runInInjectionContext(this.injector, () => {
      this.formValue = toSignal(this.form().valueChanges, {
        initialValue: this.form().getRawValue(),
      });
    });


    const initialSegments = this.form().get('step4.segmento')?.value || [];
    this.selectedSegmentsSignal.set(initialSegments);

    this.form()
      .get('step4.segmento')
      ?.valueChanges.subscribe((selectedSegments: Segment[]) => {
        this.selectedSegmentsSignal.set(selectedSegments || []);
        this.updateCoordinadosFromSegments(selectedSegments || []);
      });

    this.form()
      .get('step4.coordinador')
      ?.valueChanges.subscribe((selectedCoordinados: InteresadosResponse[]) => {
        if (!this.isUpdatingFromSegments) {
          this.handleManualCoordinadoChange(selectedCoordinados || []);
        }
      });
  }

  private updateCoordinadosFromSegments(selectedSegments: Segment[]): void {
    this.isUpdatingFromSegments = true;

    const currentManualCoordinados = this.manuallySelectedCoordinados();
    let finalCoordinados: InteresadosResponse[] = [...currentManualCoordinados];

    if (selectedSegments.length > 0) {
      const selectedSegmentCodes = selectedSegments.map(
        (seg: Segment) => seg.codigo,
      );

      const coordinadosFromSegments = this.coordinados().filter(
        (coordinado) => {
          return coordinado.interesadoSegmento?.some((interesadoSeg) =>
            selectedSegmentCodes.includes(interesadoSeg.segmento.codigo),
          );
        },
      );

      const combinedCoordinados = [...currentManualCoordinados];

      coordinadosFromSegments.forEach((coordinado) => {
        const exists = combinedCoordinados.find((c) => c.id === coordinado.id);
        if (!exists) {
          combinedCoordinados.push(coordinado);
        }
      });

      finalCoordinados = combinedCoordinados;
    }

    this.form()
      .get('step4.coordinador')
      ?.setValue(finalCoordinados, { emitEvent: false });

    setTimeout(() => {
      this.isUpdatingFromSegments = false;
    }, 0);
  }

  private handleManualCoordinadoChange(
    selectedCoordinados: InteresadosResponse[],
  ): void {
    const selectedSegments = this.selectedSegmentsSignal();

    if (selectedSegments.length === 0) {
      this.manuallySelectedCoordinados.set(selectedCoordinados);
      return;
    }

    const selectedSegmentCodes = selectedSegments.map(
      (seg: Segment) => seg.codigo,
    );

    const coordinadosFromSegments: InteresadosResponse[] = [];
    const manualCoordinados: InteresadosResponse[] = [];

    selectedCoordinados.forEach((coordinado) => {
      const belongsToSelectedSegments = coordinado.interesadoSegmento?.some(
        (interesadoSeg) =>
          selectedSegmentCodes.includes(interesadoSeg.segmento.codigo),
      );

      if (belongsToSelectedSegments) {
        coordinadosFromSegments.push(coordinado);
      } else {
        manualCoordinados.push(coordinado);
      }
    });

    this.manuallySelectedCoordinados.set(manualCoordinados);
  }

}


