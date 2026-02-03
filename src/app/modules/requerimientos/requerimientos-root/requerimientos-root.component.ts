import { CommonModule } from "@angular/common";
import { Component, computed, HostListener, inject, signal, ViewChild } from "@angular/core";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatAutocompleteModule, MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatNativeDateModule, MatOptionSelectionChange } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelect, MatSelectChange, MatSelectModule } from "@angular/material/select";
import { RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged } from "rxjs";
import { EstadoRequerimiento } from "../../../../shared/entities/estados-enum";
import { SugerenciaCorrelativo } from "../../../../shared/entities/sugerencia-correlativo.entity";
import { SugerenciaTitulo } from "../../../../shared/entities/sugerencia-titulo.entity";
import { RequerimientoCoordinadoStore } from "../../../../shared/store/respuesta-coordinado/requerimiento-coordinado.store";
import { maxRangeValidator } from "../../admin/requerimiento-root/adapter/rango-maximo.validator";
import { RequerimientoFiltros } from "../../admin/requerimiento-root/requerimiento-root.component";
import { TablaRootVisualizarComponent } from "./tabla-coordinado-root/tabla-coordinado-root.component";

@Component({
  selector: 'app-requerimiento-coordinado-root',
  standalone: true,
  imports: [
    MatIconModule,
    RouterModule,
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
    TablaRootVisualizarComponent
],
  templateUrl: './requerimientos-root.component.html',
  styleUrl: './requerimientos-root.component.scss'
})
export class RequerimientoCoordinadoRootComponent{
  readonly store = inject(RequerimientoCoordinadoStore);

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
      inicio: new FormControl<Date>(this.store.rangoInicio(), { nonNullable: true, validators:[Validators.required]}),
      fin: new FormControl<Date>(this.store.rangoFin(), { nonNullable: true, validators:[Validators.required]}),
    },{validators: [maxRangeValidator(2)]}),
  });

  @ViewChild('numeroAutoTrigger') autoTrigger!: MatAutocompleteTrigger;
  @ViewChild('tituloAutoTrigger') tituloAutoTrigger!: MatAutocompleteTrigger;
  @ViewChild('estadoSelect') estadoSelect!: MatSelect;


  readonly ESTADOS: ReadonlyArray<string> = [EstadoRequerimiento.PUBLICADO, EstadoRequerimiento.CERRADO];

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

  get todosSeleccionados(): boolean{
    const v = this.estadoCtrl.value || [];
    return this.ESTADOS.every(s => v.includes(s));
  }

  get estadoDisplay(): string{
    return (this.estadoCtrl.value || []).filter(v => v !== '__ALL__').map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
  }

  get opcionesNumero(): SugerenciaCorrelativo[]{
    return this.store.opcionesNumero();
  }

  get opcionesTitulo(): SugerenciaTitulo[]{
    return this.store.opcionesTitulo();
  }

  mostrarWarning = computed(() => {
    return this.mostroBusqueda() && this.store.requerimientos().length === 0
  });

  get noHayResultados(): boolean {
    return this.store.requerimientos().length === 0;
  }



  onToggleTodos(ev: MatOptionSelectionChange): void{
    if (!ev.isUserInput) return;

    if (this.todosSeleccionados) {
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

    this.store.rehidratarFiltrosCoordinado();

    this.inicializarFiltrosDesdeStore();

    this.store.buscarConFiltrosCoordinado(); // Hacer la busqueda automática al entrar.

    // Buscar por numero de requerimiento
    this.filtersGroup.get('noRequerimiento')!.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe((term) => {
      if (typeof term === 'string' && term.length >= 3) {
        this.store.obtenerNumerosCoordinado(term, this.store.startAt().toISOString(),this.store.endAt().toISOString()).subscribe(result => {

          this.store.setOpcionesNumeroCoordinado(result);

          if (result.length > 0) {
            setTimeout(() => this.autoTrigger.openPanel(), 0);
          } else {
            this.autoTrigger.closePanel();
          }
        });
      } else {
        this.store.setOpcionesNumeroCoordinado([]);
        this.autoTrigger.closePanel();
      }
    });

    // Buscar por titulo
    this.filtersGroup.get('titulo')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe((titulo) => {
      if (typeof titulo === 'string' && titulo.length >= 3) {
        this.store.obtenerTitulosCoordinado(titulo, this.store.startAt().toISOString(), this.store.endAt().toISOString()).subscribe(result => {
          this.store.setOpcionesTituloCoordinado(result);
          result.length > 0 ? setTimeout(() => this.tituloAutoTrigger.openPanel(), 0) : this.tituloAutoTrigger.closePanel();
        });
      } else {
        this.store.setOpcionesTituloCoordinado([]);
        this.tituloAutoTrigger.closePanel();
      }
    });
  }

  onSelectNumero(valor: string) {
    this.filtersGroup.get('noRequerimiento')!.setValue(valor, {emitEvent: false});
    this.store.setOpcionesNumeroCoordinado([]);
    this.autoTrigger.closePanel();
  }

  onSelectTitulo(valor: string) {
    this.filtersGroup.get('titulo')!.setValue(valor), {emitEvent: false};
    this.store.setOpcionesTituloCoordinado([]);
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
    this.store.setRangoFechasCoordinado(inicio ?? null as any, fin ?? null as any);
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

    this.store.setFiltrosCoordinado({
      numeroTerm: filtros.noRequerimiento || '',
      tituloTerm: filtros.titulo || '',
      estados: filtros.estados,
      rangoInicio: inicio, // Usar fechas originales sin modificar
      rangoFin: fin,       // Usar fechas originales sin modificar
      resetPage: true
    });

    const interesadoId = sessionStorage.getItem('interesado_id');
    this.store.obtenerRequerimientoPorFiltrosCoordinado(
      fechaInicioISO,  // Usar las copias modificadas para el ISO
      fechaFinISO,     // Usar las copias modificadas para el ISO
      filtros.estados ?? [],
      interesadoId!,
      filtros.noRequerimiento || undefined,
      filtros.titulo || undefined,
      this.store.metadata().itemsPerPage,
      1
    );
  }

  private inicializarFiltrosDesdeStore() {
    this.filtersGroup.patchValue({
      noRequerimiento: this.store.numeroTerm() || '',
      titulo: this.store.tituloTerm() || '',
      estados: this.store.estados() || [],
      rangoFechas: {
        inicio: this.store.rangoInicio(),
        fin: this.store.rangoFin(),
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
