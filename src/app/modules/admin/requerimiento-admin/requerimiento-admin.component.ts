import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
  ViewChild
} from '@angular/core';


import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';


import {
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  MatOptionSelectionChange,
  provideNativeDateAdapter
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelect, MatSelectChange, MatSelectModule } from '@angular/material/select';

import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { EstadoRequerimiento } from '../../../../shared/entities/estados-enum';
import { SugerenciaCorrelativo } from '../../../../shared/entities/sugerencia-correlativo.entity';
import { SugerenciaTitulo } from '../../../../shared/entities/sugerencia-titulo.entity';
import { RequerimientoStore } from '../../../../shared/store/requerimiento-admin/requerimiento.store';
import { maxRangeValidator } from '../requerimiento-root/adapter/rango-maximo.validator';
import { TablaRootComponent } from '../requerimiento-root/components/tabla-root/tabla-root.component';
import { RequerimientoFiltros } from '../requerimiento-root/requerimiento-root.component';

@Component({
  selector: 'app-requerimiento-admin-root',
  standalone: true,
  imports: [
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    MatProgressSpinnerModule,
    RouterModule, CommonModule,
    MatAutocompleteModule,
    TablaRootComponent
],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  templateUrl: './requerimiento-admin.component.html',
  styleUrl: './requerimiento-admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequerimientoAdminComponent {
  requerimientoStore = inject(RequerimientoStore);

  mostroBusqueda = signal(false);

  private lastScrollTop = 0;
  private readonly threshold = 2;

  public filtersGroup: FormGroup<{
    noRequerimiento: FormControl<string>;
    titulo: FormControl<string>;
    estados: FormControl<string[]>;
    rangoFechas: FormGroup<{
      inicio: FormControl<Date>;
      fin: FormControl<Date>;
    }>;
  }> = new FormGroup({
    noRequerimiento: new FormControl<string>('', { nonNullable: true, validators: [Validators.pattern(/^\d*$/)] }),
    titulo: new FormControl<string>('', { nonNullable: true}),
    estados: new FormControl<string[]>([], { nonNullable: true }),
    rangoFechas: new FormGroup({
      inicio: new FormControl<Date>(this.requerimientoStore.rangoInicio(), { nonNullable: true, validators:[Validators.required]}),
      fin: new FormControl<Date>(this.requerimientoStore.rangoFin(), { nonNullable: true, validators:[Validators.required]}),
    },{validators: [maxRangeValidator(2)]}),
  });

  @ViewChild('numeroAutoTrigger') autoTrigger!: MatAutocompleteTrigger;
  @ViewChild('tituloAutoTrigger') tituloAutoTrigger!: MatAutocompleteTrigger;
  @ViewChild('estadoSelect') estadoSelect!: MatSelect;


  readonly ESTADOS: ReadonlyArray<string> = [EstadoRequerimiento.PUBLICADO, EstadoRequerimiento.BORRADOR, EstadoRequerimiento.CERRADO];

  endDateFilter = (d: Date | null): boolean => {
    if (!d) return true;

    const hoy = new Date();

    // Limitar inicio: no más de 2 años atrás
    const limiteMin = new Date(hoy);
    limiteMin.setFullYear(hoy.getFullYear() - 2);

    // Limitar fin: no más de 2 años después del inicio
    const inicio = this.rangoFechas.get('inicio')!.value as Date | null;
    if (inicio) {
      const limiteMax = new Date(inicio);
      limiteMax.setFullYear(inicio.getFullYear() + 2);
      return d >= limiteMin && d <= limiteMax;
    }

    // Si aún no hay inicio, solo aplico el límite mínimo global
    return d >= limiteMin;
  }

  get estadoCtrl(): FormControl<string[]>{
    return this.filtersGroup.get('estados') as FormControl<string[]>;
  }

  get isAllSelected(): boolean{
    const v = this.estadoCtrl.value || [];
    return this.ESTADOS.every(s => v.includes(s));
  }

  get estadoDisplay(): string{
    return (this.estadoCtrl.value || []).filter(v => v !== '__ALL__').map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
  }

  get opcionesNumero(): SugerenciaCorrelativo[]{
    return this.requerimientoStore.opcionesNumero();
  }

  get opcionesTitulo(): SugerenciaTitulo[]{
    return this.requerimientoStore.opcionesTitulo();
  }

  mostrarWarning = computed(() => {
    return this.mostroBusqueda() && this.requerimientoStore.requerimientos().length === 0
  });

  get noHayResultados(): boolean {
    return this.requerimientoStore.requerimientos().length === 0;
  }



  onToggleTodos(ev: MatOptionSelectionChange): void{
    if (!ev.isUserInput) return;

    if (this.isAllSelected) {
      this.estadoCtrl.setValue([]);
    } else {
      this.estadoCtrl.setValue(['__ALL__',...this.ESTADOS]);
    }
  }

  get rangoFechas() {
    return this.filtersGroup.get('rangoFechas') as FormGroup;
  }

  requerimientos = new FormControl<string[]>([], [Validators.required]);

  ngOnInit(): void {

    this.requerimientoStore.rehidratarFiltros();

    this.inicializarFiltrosDesdeStore();

    this.requerimientoStore.buscarConFiltros(); // Hacer la busqueda automática al entrar.

    // Buscar por numero de requerimiento
    this.filtersGroup.get('noRequerimiento')!.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe((term) => {
      if (typeof term === 'string' && term.length >= 3) {
        this.requerimientoStore.obtenerNumeros(term, this.requerimientoStore.startAt().toISOString(),this.requerimientoStore.endAt().toISOString()).subscribe(result => {

          this.requerimientoStore.setOpcionesNumero(result);

          if (result.length > 0) {
            setTimeout(() => this.autoTrigger.openPanel(), 0);
          } else {
            this.autoTrigger.closePanel();
          }
        });
      } else {
        this.requerimientoStore.setOpcionesNumero([]);
        this.autoTrigger.closePanel();
      }
    });

    // Buscar por titulo
    this.filtersGroup.get('titulo')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe((titulo) => {
      if (typeof titulo === 'string' && titulo.length >= 3) {
        this.requerimientoStore.obtenerTitulos(titulo, this.requerimientoStore.startAt().toISOString(), this.requerimientoStore.endAt().toISOString()).subscribe(result => {
          this.requerimientoStore.setOpcionesTitulo(result);
          result.length > 0 ? setTimeout(() => this.tituloAutoTrigger.openPanel(), 0) : this.tituloAutoTrigger.closePanel();
        });
      } else {
        this.requerimientoStore.setOpcionesTitulo([]);
        this.tituloAutoTrigger.closePanel();
      }
    });
  }

  onSelectNumero(valor: string) {
    this.filtersGroup.get('noRequerimiento')!.setValue(valor, {emitEvent: false});
    this.requerimientoStore.setOpcionesNumero([]);
    this.autoTrigger.closePanel();
  }

  onSelectTitulo(valor: string) {
    this.filtersGroup.get('titulo')!.setValue(valor), {emitEvent: false};
    this.requerimientoStore.setOpcionesTitulo([]);
    this.tituloAutoTrigger.closePanel();
  }




  onChangeEstado(e: MatSelectChange): void{
    let vals: string[] = (e.value as string[]) ?? [];

    vals = vals.filter(v => v !== '__ALL__' && v !== '');

    vals = Array.from(new Set(vals));

    if(this.ESTADOS.every(s => vals.includes(s))) {
      this.estadoCtrl.setValue(['__ALL__',...this.ESTADOS],{emitEvent: false});
    } else {
      this.estadoCtrl.setValue(vals, { emitEvent: false });
    }
  }

  onChangeFecha(): void{
    this.rangoFechas.updateValueAndValidity();
    const { inicio, fin } = this.rangoFechas.value;
    this.requerimientoStore.setRangoFechas(inicio ?? null as any, fin ?? null as any);
  }



  soloNumeros(event: KeyboardEvent) {
    const char = event.key;

    if (!/^[0-9]$/.test(char) && !['Backspace','ArrowLeft','ArrowRight','Tab','Delete'].includes(char)) {
      event.preventDefault();
    }
  }

  onSubmit() {
    this.mostroBusqueda.set(true);

    const filtros: RequerimientoFiltros = this.filtersGroup.getRawValue();

    const inicio = filtros.rangoFechas.inicio;
    const fin = filtros.rangoFechas.fin;

    if (!inicio || !fin) {
      this.rangoFechas.markAllAsTouched();
      this.rangoFechas.updateValueAndValidity();
      return;
    }

    // SOLUCIÓN: Crear copias de las fechas sin mutar las originales
    const fechaInicio = new Date(inicio.getTime()); // Crear copia usando getTime()
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaInicioISO = fechaInicio.toISOString();

    const fechaFin = new Date(fin.getTime()); // Crear copia usando getTime()
    fechaFin.setHours(23, 59, 59, 999);
    const fechaFinISO = fechaFin.toISOString();

    // limpiar estado
    if (!filtros.estados || filtros.estados.length === 0) {
      delete (filtros as any).estado;
    } else {
      filtros.estados = filtros.estados.filter(v => v !== '__ALL__');
      if (filtros.estados.length === 0) delete (filtros as any).estado;
    }

    this.requerimientoStore.setFiltros({
      numeroTerm: filtros.noRequerimiento || '',
      tituloTerm: filtros.titulo || '',
      estados: filtros.estados,
      rangoInicio: inicio, // Usar fechas originales sin modificar
      rangoFin: fin,       // Usar fechas originales sin modificar
      resetPage: true
    });

    this.requerimientoStore.obtenerRequerimientoPorFiltros(
      fechaInicioISO,  // Usar las copias modificadas para el ISO
      fechaFinISO,     // Usar las copias modificadas para el ISO
      filtros.estados ?? [],
      filtros.noRequerimiento || undefined,
      filtros.titulo || undefined,
      this.requerimientoStore.metadata().itemsPerPage,
      1
    );
  }

  private inicializarFiltrosDesdeStore() {
    this.filtersGroup.patchValue({
      noRequerimiento: this.requerimientoStore.numeroTerm() || '',
      titulo: this.requerimientoStore.tituloTerm() || '',
      estados: this.requerimientoStore.estados() || [],
      rangoFechas: {
        inicio: this.requerimientoStore.rangoInicio(),
        fin: this.requerimientoStore.rangoFin(),
      }
    }, { emitEvent: false });
  }
  @HostListener('window:scroll', [])
  onWindowsScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const diff = Math.abs(scrollTop - this.lastScrollTop);

    if (diff >= this.threshold && this.estadoSelect?.panelOpen) {
      this.estadoSelect.close();
    }

    this.lastScrollTop = scrollTop;
  }

}
