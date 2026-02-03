import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  ViewChild
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import {
  MatDatepickerModule,
  MatDateRangePicker,
} from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { RequerimientoService } from '../../../../../../shared/services/requerimientos.service';
import { RequerimientoCrearOEditarStore } from '../../../../../../shared/store/requerimiento-admin/requerimiento-crear-o-editar.store';
import { Regulation, SubRegulation } from '../../interfaces/regulation';

@Component({
  selector: 'app-step1',
  imports: [
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    MatProgressSpinnerModule,
],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  templateUrl: './step1.component.html',
  styleUrl: './step1.component.scss',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step1Component {
  private destroy$ = new Subject<void>();

  // Inject
  private _snackBar = inject(MatSnackBar);
  readonly requerimientoService = inject(RequerimientoService);
  readonly requerimientoCrearStore = inject(RequerimientoCrearOEditarStore);

  // Signals
  public form = input.required<FormGroup>();
  public subnormas = signal<SubRegulation[]>([]);
  public mostrarBannerExito = signal<boolean>(false);
  public regulations = input.required<Regulation[]>();

  // Variables
  private datosPrecargados = false;
  public minDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  @ViewChild('picker') picker!: MatDateRangePicker<Date>;

  constructor() {

    // Banner de exito solo en crear
    effect(() => {
      const loading = this.requerimientoCrearStore.isLoadingCrear();
      const c = this.requerimientoCrearStore.correlativo();
      const isEdit = this.requerimientoCrearStore.modoEdicion();

      if (!isEdit && !loading && c != null) {
        this.mostrarBannerExito.set(true);
        setTimeout(() => this.entendido(), 5000);
      }
    });

    effect(() => {
      if (this.requerimientoCrearStore.tieneCorrelativo()) {
        this.form().get('step1')?.enable();
        this.form().get('step1.titulo')?.enable();
      } else {
        this.form().get('step1')?.disable();
        this.form().get('step1.titulo')?.enable();
      }

      const norma = this.form().get('step1.norma')?.value;
      this.handleNormaChange(norma, this.form().get('step1.subNorma'));
    });

    effect(() => {
      const detalle = this.requerimientoCrearStore.requerimientoDetalle();

      if (detalle && !this.datosPrecargados) {
        this.datosPrecargados = true;

        const normaEncontrada = this.regulations().find(r => r.label === detalle.norma);
        let subNormaEncontrada = null;

        if (normaEncontrada) {
          this.subnormas.set(normaEncontrada.subNormas ?? []);

          subNormaEncontrada = normaEncontrada.subNormas?.find(
            sn => sn.label.toLowerCase() === detalle.subNorma?.toLocaleLowerCase()
          );

        }

        this.form().patchValue(
            {
              step1: {
                titulo: detalle.titulo,
                referencia: detalle.referencia,
                fechaVencimiento: detalle.vencimiento ? detalle.vencimiento : null,
                norma: normaEncontrada ?? null,
                subNorma: subNormaEncontrada ?? null,
              },
          }, { emitEvent: false });

        this.handleNormaChange(normaEncontrada, this.form().get('step1.subNorma'), true);
      }
    })
  }

  entendido() {
    this.mostrarBannerExito.set(false);
  }

  ngOnInit(): void {
    if (!this.requerimientoCrearStore.modoEdicion()) {
      this.requerimientoCrearStore.limpiarRequerimiento();
    }

    const normaControl = this.form().get('step1.norma');
    const subNormaControl = this.form().get('step1.subNorma');

    normaControl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((norma) => {
      this.handleNormaChange(norma, subNormaControl);
    });
  }

  private handleNormaChange(norma: any, subNormaControl: any, isPrecarga = false) {
    if (!norma) {
      this.subnormas.set([]);
      subNormaControl?.reset(null);
      subNormaControl?.disable();
      return;
    }

    const selectedNorma = this.regulations().find(
      (regulation) => regulation.value === norma.value,
    );

    this.subnormas.set(selectedNorma?.subNormas ?? []);

    if (!isPrecarga) {
      subNormaControl?.reset(null);
    }

    selectedNorma ? subNormaControl?.enable() : subNormaControl?.disable();
  }


  openDatePicker() {
    this.picker.open();
  }

  crearNuevoRequerimientoPorTitulo() {

    const titulo = this.form().get('step1.titulo')?.value?.trim();

    if (!titulo) {
      this._snackBar.open('Debe ingresar un título para continuar', 'Aceptar', { duration: 3000 });
      return;
    }

    this.requerimientoCrearStore.crearRequerimiento(titulo);

  }
  limpiarInputNuevoRequerimiento() {
    this.form().get('step1.titulo')?.reset('');
  }

  compareByValue = (o1: any, o2: any) => {
    return o1 && o2 ? o1.value === o2.value : o1 === o2;
  }
}
