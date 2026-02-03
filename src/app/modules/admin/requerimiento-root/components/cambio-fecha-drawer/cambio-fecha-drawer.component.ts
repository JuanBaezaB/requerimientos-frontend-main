import { DatePipe, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  OnChanges,
  OnInit,
  output,
  Renderer2,
  signal,
  ViewChild
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  NgForm,
  ReactiveFormsModule
} from '@angular/forms';

import {
  DateAdapter,
  ErrorStateMatcher,
  MAT_DATE_LOCALE,
  provideNativeDateAdapter
} from '@angular/material/core';
import {
  MatDatepickerModule,
  MatDateRangePicker,
} from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RequerimientoStore } from '../../../../../../shared/store/requerimiento-admin/requerimiento.store';
import { CambioFechaDialogComponent } from '../cambio-fecha-dialog/cambio-fecha-dialog.component';

export class CustomErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null,
  ): boolean {
    return !!(
      (form?.hasError('rangeToLong') && control?.value) ||
      (form?.hasError('endDateRequired') && control?.value)
    );
  }
}

@Component({
  selector: 'app-cambio-fecha-drawer',
  imports: [
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './cambio-fecha-drawer.component.html',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  styleUrl: './cambio-fecha-drawer.component.scss',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CambioFechaDrawerComponenta implements OnInit, OnChanges {
  readonly store = inject(RequerimientoStore);
  dialog = inject(MatDialog);

  private document = inject(DOCUMENT);

  public drawerOpen = input.required<boolean>();
  public dataElement = input.required<any>();
  public drawerClosed = output();
  public isInitialized = signal(false);
  private idRequerimiento = signal<string | null>('');
  private correlativo = signal<string | null>('');

  public tituloRequerimiento = signal<string>('');
  numeroRequerimiento = signal<string>('');
  fechaVecimientoActual = signal<Date | null>(null);
  fechaVisualActual = signal<string | null>(null);
  fechaMinimaLimiteActual = signal<Date | null>(null);
  nuevaFecha = signal<Date | null>(null);

  private renderer = inject(Renderer2);
  private dateAdapter = inject<DateAdapter<Date>>(DateAdapter);

  private originalDate: Date | null = null;

  errorStateMatcher = new CustomErrorStateMatcher();

  readonly date = new FormGroup(
    {
      start: new FormControl<Date | null>(null),
    },
  );

  @ViewChild('picker') picker!: MatDateRangePicker<Date>;

  constructor() {
    effect(() => {
      const cambio = this.store.seCambioFecha();

      if (!cambio) return;

      if (cambio) {
        this.fechaVecimientoActual.set(this.nuevaFecha());
      }
    })
  }

  ngOnChanges() {
    if (this.drawerOpen()) {
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
      if (this.dataElement()?.fechaDeVencimiento) {
        const fecha = this.dataElement().fechaDeVencimiento;
        const fechaLimite = new Date(fecha.setDate(fecha.getDate() + 1));

        this.numeroRequerimiento.set(this.dataElement().noRequerimiento);
        this.tituloRequerimiento.set(this.dataElement().titulo);

        // Normalizamos la hora a medianoche local para evitar saltos
        const fechaLocal = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - 1);

        this.fechaVecimientoActual.set(fechaLocal);

        this.idRequerimiento.set(this.dataElement().id);
        this.correlativo.set(this.dataElement().noRequerimiento);

        this.fechaMinimaLimiteActual.set(fechaLimite);
        this.dateAdapter.setLocale('es');
      }
    } else {
      this.renderer.removeStyle(document.body, 'overflow');
    }
  }

  fechaCambio(): boolean{
    const nueva = this.date.get('start')?.value;
    return (nueva && this.originalDate && nueva.getTime() !== this.originalDate.getTime())!;
  }

  dateFilter = (d: Date | null): boolean => {
    if (!d) return false;
    if (!this.originalDate) return true;

    const fechaActual = new Date(this.originalDate);
    fechaActual.setHours(0, 0, 0, 0);
    return d >= fechaActual;
  }

  ngOnInit(): void {
    this.setupOverlayZIndex();

    setTimeout(() => {
      this.isInitialized.set(true);
    }, 100);
  }

  private setupOverlayZIndex(): void {
    const overlayContainer = this.document.querySelector(
      '.cdk-overlay-container',
    );

    if (overlayContainer) {
      this.renderer.setStyle(overlayContainer, 'z-index', '9999');
    } else {
      const style = this.renderer.createElement('style');
      style.type = 'text/css';
      style.textContent = `
        .cdk-overlay-container {
          z-index: 9999 !important;
        }
      `;
      this.renderer.appendChild(this.document.head, style);
    }
  }

  openDatePicker() {
    this.picker.open();
  }

  nuevaFechaSeleccionada(fecha: Date | null) {
    const nuevaFechaFinal = new Date(fecha!).setHours(23, 59, 59, 0);
    this.nuevaFecha.set(new Date(nuevaFechaFinal));
  }

  closeDrawer() {
    this.drawerClosed.emit();
    this.renderer.removeStyle(document.body, 'overflow');
    this.store.limpiarCambioFecha();
    this.store.buscarConFiltros();
  }

  async submitForm() {
    const actualizarFechaModal = await this.dialog.open(CambioFechaDialogComponent, {
      disableClose: true,
      width: '395px',
      data: {
        id: this.idRequerimiento(),
        correlativo: this.correlativo(),
        nuevoVencimiento: this.nuevaFecha()?.toISOString(),
      }
    });

    actualizarFechaModal.afterClosed().subscribe((actualizar) => {
      if (!actualizar) {
        return;
      }
    });
  }

  limpiarCambioFecha() {
    this.store.limpiarCambioFecha();
  }
}
