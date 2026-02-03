import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnDestroy,
  signal
} from '@angular/core';

import { NormasService } from '../../../../shared/services/normas.service';
import { Regulation, SubRegulation } from './interfaces/regulation';
import { subNormaRequiredValidator } from './utils/sub-norma.validator';

import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Step1Component } from './components/step1/step1.component';

import { toSignal } from '@angular/core/rxjs-interop';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import {
  InteresadoService,
  InteresadosResponse,
} from '../../../../shared/services/interesado.service';
import { SegmentService } from '../../../../shared/services/segmentos.service';
import { RequerimientoCrearOEditarStore } from '../../../../shared/store/requerimiento-admin/requerimiento-crear-o-editar.store';
import { RequerimientoVerComponent } from "../requerimiento-ver/requerimiento-ver.component";
import { BorradorPublicarComponent } from "./components/borrador-publicar/borrador-publicar.component";
import { Step2Component } from './components/step2/step2.component';
import { Step3Component } from './components/step3/step3.component';
import { Step4Component } from './components/step4/step4.component';
import { Step5Component } from './components/step5/step5.component';
import { Segment } from './interfaces/segment';
import { planAccionValidador } from './utils/plan-accion.validator';
import { tituloRequeridoSiArchivoValidator } from './utils/titulo-requerido-si-archivo.validator';

@Component({
  selector: 'app-requerimiento-crear',
  standalone: true,
  imports: [
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    Step1Component,
    MatProgressSpinnerModule,
    Step2Component,
    Step3Component,
    Step4Component,
    Step5Component,
    BorradorPublicarComponent,
    RouterModule,
    RequerimientoVerComponent,
    BorradorPublicarComponent
],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  templateUrl: './requerimiento-crear-o-editar.component.html',
  styleUrl: './requerimiento-crear-o-editar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequerimientoCrearComponent implements OnDestroy{
  normasService = inject(NormasService);
  segmentService = inject(SegmentService);
  interesadosService = inject(InteresadoService);
  requerimientoCrearStore = inject(RequerimientoCrearOEditarStore);
  router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly idRuta = toSignal(this.route.paramMap.pipe(map(params => params.get('id'))), { initialValue: null });

  readonly isEditing = signal(false);

  requerimientoForm: FormGroup;

  loadingData = signal<boolean>(false);
  regulations = signal<Regulation[]>([]);
  segments = signal<Segment[]>([]);
  interesados = signal<InteresadosResponse[]>([]);
  publishSuccess = signal<boolean>(false);
  errorInitialData = signal<boolean>(false);

  constructor(private fb: FormBuilder) {
    this.requerimientoForm = this.fb.group({
      idRequerimiento: ['', Validators.nullValidator],
      correlativo: ['', Validators.nullValidator],
      step1: this.fb.group(
        {
          titulo: [
            '',
            [
              Validators.required,
              Validators.maxLength(100),
              Validators.minLength(3),
            ],
          ],
          fechaVencimiento: [null as Date | null, Validators.required],
          referencia: [
            '',
            [
              Validators.required,
              Validators.maxLength(255),
              Validators.minLength(3),
            ],
          ],
          norma: [''],
          subNorma: [{value:'', disabled: true}, [Validators.required]],
        },
        { validators: [subNormaRequiredValidator()] },
      ),
      step2: this.fb.group({
        solicitud: [
          '',
          [
            Validators.required,
            Validators.maxLength(4000),
            Validators.minLength(3),
          ],
        ],
        fileSolicitud: ['', [Validators.nullValidator]],
        fileSolicitudName: ['',[Validators.nullValidator]]
      }),
      step3: this.fb.group({
        modo: [null],
        fileInputs: this.fb.array([
          this.createFileInput()
        ]),
        planAccion: this.fb.array([
          this.createRowInput()
        ],{ validators: [planAccionValidador()]}),
      },{validators: [tituloRequeridoSiArchivoValidator()]}),
      step4: this.fb.group({
        segmento: ['', []],
        coordinador: ['', [Validators.required]],
      }),
      step5: this.fb.group({
        notificaciones: []
      })
    });

    effect(() => {
      const id = this.idRuta();

      if (id) {
        const currentPath = this.route.snapshot.routeConfig?.path;

        if (currentPath?.startsWith('ver')) {
          this.requerimientoCrearStore.establecerIdRequerimiento(id);
          this.requerimientoCrearStore.cargarDetalleSoloVisualizacion(id);
        } else {
          this.isEditing.set(true);
          this.requerimientoCrearStore.establecerIdRequerimiento(id);
          this.requerimientoCrearStore.cargarDetalleRequerimiento(id);
        }
      } else {
        this.isEditing.set(false);
        this.requerimientoCrearStore.establecerIdRequerimiento(null);
      }
    });
  }
  ngOnDestroy(): void {
    this.requerimientoCrearStore.limpiarRequerimiento();
  }

  subnormas = signal<SubRegulation[]>([]);

  ngOnInit(): void {
    this.loadInitialData();
  }

  get fileInputsArray() {
    return this.requerimientoForm.get('step3.fileInputs') as FormArray;
  }

  createFileInput(): FormGroup {
    return this.fb.group({
      id: ['fileInput1'],
      title: ['', [Validators.required]],
      fileName: ['', [Validators.required]],
      extension: [''],
      fileUploaded: [false],
    }, {validators: [tituloRequeridoSiArchivoValidator()]});
  }

  createRowInput(): FormGroup{
    return this.fb.group({
      tituloPlan: [''],
      fechaInicioPlanAccion: [{value: null, disabled: true}],
      fechaTerminoPlanAccion: [{value: null, disabled: true}],
      seguimiento: [false],
    })
  }

  loadInitialData(): void {
    this.loadingData.set(true);
    this.errorInitialData.set(false);

    forkJoin({
      normas: this.normasService.enviarCoordinador(),
      segments: this.segmentService.getSegments(),
      interesados: this.interesadosService.getInteresado(),
    }).subscribe({
      next: ({ normas, segments, interesados }) => {
        this.loadingData.set(false);
        this.regulations.set(normas);
        this.segments.set(segments);
        this.interesados.set(interesados);
      },
      error: (error) => {
        this.loadingData.set(false);
        this.errorInitialData.set(true);
      },
    });
  }

  retryLoadData(): void {
    this.loadInitialData();
  }

  handlePublishResult(result: {
    success: boolean;
    message: string;
    data?: any;
  }): void {
    this.publishSuccess.set(result.success);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverAlAdministradorHome() {
    this.router.navigate(['/requerimiento/admin']);
  }
}
