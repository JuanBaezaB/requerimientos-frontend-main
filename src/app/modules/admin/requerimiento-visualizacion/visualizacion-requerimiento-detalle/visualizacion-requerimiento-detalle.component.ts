
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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

import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RespuestaRequerimiento } from '../../../../../shared/entities/respuesta-enum';
import { VisualizarDetalleStore } from '../../../../../shared/store/visualizar-requerimiento/visualizar-detalle.store';
import { VisualizarRespuestaStore } from '../../../../../shared/store/visualizar-requerimiento/visualizar-respuesta.store';
import { maxRangeValidator } from '../../requerimiento-root/adapter/rango-maximo.validator';
import { InfoEnviarRecordatorioAlertComponent } from './../../../../components/info-enviar-recordatorio-dialog/info-enviar-recordatorio-dialog.component';
import { HeaderDetalleInfoComponent } from "./header-detalle-info/header-detalle-info.component";
import { TablaDetalleVisualizacionComponent } from "./tabla-detalle-visualizacion/tabla-detalle-visualizacion.component";


export interface VisualizarDetalleFiltro{
  coordinados: string[];
  respuestas: string[];
  rangoFechas: {
    inicio: Date;
    fin: Date;
  }
}

@Component({
  selector: 'app-visualizacion-requerimiento-detalle',
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
    HeaderDetalleInfoComponent,
    TablaDetalleVisualizacionComponent,

],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  templateUrl: './visualizacion-requerimiento-detalle.component.html',
  styleUrl: './visualizacion-requerimiento-detalle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualizacionRequerimientoDetalleComponent {
    private _dialog = inject(MatDialog);
  visualizarDetalleStore = inject(VisualizarDetalleStore);
  visualizarRespuestaStore = inject(VisualizarRespuestaStore);
    detalleVisualizar = signal(this.visualizarDetalleStore.obtenerDetalleDelRequerimientoVisualizar());
    private route = inject(ActivatedRoute);

  mostroBusqueda = signal(false);
  seleccionadosIds = signal<string[]>([]);
  seleccionadosValidos = signal<number>(0);


    private lastScrollTop = 0;
    private readonly threshold = 2;

    public filtersGroup: FormGroup<{
      coordinados: FormControl<string[]>;
      respuestas: FormControl<string[]>;
      rangoFechas: FormGroup<{
        inicio: FormControl<Date>;
        fin: FormControl<Date>;
      }>;
    }> = new FormGroup({
      coordinados: new FormControl<string[]>([], { nonNullable: true}),
      respuestas: new FormControl<string[]>([], { nonNullable: true }),
      rangoFechas: new FormGroup({
        inicio: new FormControl<Date>(this.visualizarDetalleStore.rangoInicio(), { nonNullable: true, validators:[Validators.required]}),
        fin: new FormControl<Date>(this.visualizarDetalleStore.rangoFin(), { nonNullable: true, validators:[Validators.required]}),
      },{validators: [maxRangeValidator(2)]}),
    });

    @ViewChild('respuestaSelect') respuestaSelect!: MatSelect;
    @ViewChild('coordinadosSelect') coordinadosSelect!: MatSelect;

    readonly RESPUESTAS: ReadonlyArray<string> = [RespuestaRequerimiento.SI, RespuestaRequerimiento.NO];

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

    get respuestaCtrl(): FormControl<string[]>{
      return this.filtersGroup.get('respuestas') as FormControl<string[]>;
    }

    get coordinadosCtrl(): FormControl<string[]>{
      return this.filtersGroup.get('coordinados') as FormControl<string[]>;
    }

    get todosSeleccionados(): boolean{
      const v = this.respuestaCtrl.value || [];
      return this.RESPUESTAS.every(s => v.includes(s));
    }

    get respuestaDisplay(): string{
      return (this.respuestaCtrl.value || []).filter(v => v !== '__ALL__').map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
    }

    get coordinadosDisplay(): string{
      const seleccionados = this.coordinadosCtrl.value ?? [];
      const lista = this.visualizarDetalleStore.listaInteresados() ?? [];

      if (seleccionados.length == 0) return 'Seleccionar coordinados';

      const todosIds = lista.map(l => l.id);
      const todosSeleccionados = todosIds.length > 0 && todosIds.every(id => seleccionados.includes(id));

      if (seleccionados.includes('__ALL__') || todosSeleccionados) {
        return 'Todos';
      }

      const nombres = lista.filter(c => seleccionados.includes(c.id)).map(c => c.nombreFantasia);

      if (nombres.length === 1) {
        return nombres[0];
      }

      if (nombres.length === 2) {
        return `${nombres[0]} (+1 coordinado)`;
      }

      return `${nombres[0]} (+${nombres.length - 1} coordinados)`;
    }

    mostrarWarning = computed(() => {
      return this.mostroBusqueda() && this.visualizarDetalleStore.listaInteresados().length === 0
    });

    get noHayResultados(): boolean {
      return this.visualizarDetalleStore.listaInteresados().length === 0;
    }

    onToggleRespuestas(ev: MatOptionSelectionChange): void{
      if (!ev.isUserInput) return;

      if (this.todosSeleccionados) {
        this.respuestaCtrl.setValue([]);
      } else {
        this.respuestaCtrl.setValue(['__ALL__',...this.RESPUESTAS]);
      }
    }

    onToggleCoordinados(ev: MatOptionSelectionChange): void{
      if (!ev.isUserInput) return;

      const lista = this.visualizarDetalleStore.listaInteresados() ?? [];
      const todosIds = lista.map(c => c.id);

      if (this.todosCoordinadosSeleccionados()) {
        this.coordinadosCtrl.setValue([], { emitEvent: false });
      } else {
        this.coordinadosCtrl.setValue(['__ALL__', ...todosIds], { emitEvent: false });
      }
    }


    private todosCoordinadosSeleccionados(): boolean{
      const lista = this.visualizarDetalleStore.listaInteresados() ?? [];
      const seleccionados = this.coordinadosCtrl.value ?? [];

      const todosIds = lista.map(c => c.id);

      return todosIds.length > 0 && todosIds.every(id => seleccionados.includes(id))
    }

    get rangoFechas() {
      return this.filtersGroup.get('rangoFechas') as FormGroup;
    }

    constructor() {
      effect(() => {
        const paramId = this.route.snapshot.paramMap.get('id');
        this.visualizarDetalleStore.obtenerListaDeInteresados(paramId!);
      });
    }

    ngOnInit(): void {

      this.visualizarDetalleStore.rehidratarFiltros();

      this.inicializarFiltrosDesdeStore();

      this.visualizarDetalleStore.buscarConFiltros(); // Hacer la busqueda automática al entrar.
    }

    // Alerta para enviar a coordinado
    enviarRecordatorioAlert() {
      this._dialog.open(InfoEnviarRecordatorioAlertComponent, {
        width: '395px',
        disableClose: true
      })
    }

    onChangeCoordinados(e: MatSelectChange): void{
      let vals: string[] = (e.value as string[]) ?? [];

      vals = vals.filter(v => v !== '__ALL__' && v !== '');


      const lista = this.visualizarDetalleStore.listaInteresados() ?? [];
      const todosIds = lista.map(c => c.id);

      if (todosIds.length > 0 && todosIds.every(id => vals.includes(id))) {
        this.coordinadosCtrl.setValue(['__ALL__', ...todosIds], { emitEvent: false });
      } else {
        this.coordinadosCtrl.setValue(vals, { emitEvent: false });
      }

      vals = Array.from(new Set(vals));
    }

    onChangeRespuestas(e: MatSelectChange): void{
      let vals: string[] = (e.value as string[]) ?? [];

      vals = vals.filter(v => v !== '__ALL__' && v !== '');

      vals = Array.from(new Set(vals));

      if(this.RESPUESTAS.every(s => vals.includes(s))) {
        this.respuestaCtrl.setValue(['__ALL__',...this.RESPUESTAS],{emitEvent: false});
      } else {
        this.respuestaCtrl.setValue(vals, { emitEvent: false });
      }
    }

    onChangeFecha(): void{
      this.rangoFechas.updateValueAndValidity();
      const { inicio, fin } = this.rangoFechas.value;
      this.visualizarDetalleStore.setRangoFechas(inicio ?? null as any, fin ?? null as any);
    }


    onSubmit() {
      this.mostroBusqueda.set(true);

      const filtros: VisualizarDetalleFiltro = this.filtersGroup.getRawValue();

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
      if (!filtros.respuestas || filtros.respuestas.length === 0) {
        delete (filtros as any).estado;
      } else {
        filtros.respuestas = filtros.respuestas.filter(v => v !== '__ALL__');
        if (filtros.respuestas.length === 0) delete (filtros as any).estado;
      }



      // SETEAR Filtros para Coordinados en el STORE
      this.visualizarDetalleStore.setFiltros({
        listaIdsInteresados: filtros.coordinados,
        rangoInicio: inicio, // Usar fechas originales sin modificar
        rangoFin: fin,       // Usar fechas originales sin modificar
      });

      this.visualizarDetalleStore.obtenerInteresadosPorFiltros(
        fechaInicioISO,
        fechaFinISO,
        filtros.respuestas,
        filtros.coordinados,
      );
    }

    private inicializarFiltrosDesdeStore() {
      // this.filtersGroup.patchValue({
      //   coordinados: this.visualizarDetalleStore.listaInteresados() || [],
      //   respuestas: this.visualizarDetalleStore.respuestas() || [],
      //   rangoFechas: {
      //     inicio: this.visualizarDetalleStore.rangoInicio(),
      //     fin: this.visualizarDetalleStore.rangoFin(),
      //   }
      // }, { emitEvent: false });
    }


  onSelectionChange(event: { ids: string[];  validCount: number}): void{
    this.seleccionadosIds.set(event.ids);
    this.seleccionadosValidos.set(event.validCount);
    }

  onDescargarArchivos(): void{
    const ids = this.seleccionadosIds();
    if (ids.length === 0) {
      return
    }
    this.visualizarRespuestaStore.obtenerUrlPrefirmadaDeCoordinadosSeleccionados(ids);
  }

    @HostListener('window:scroll', [])
    onWindowsScroll() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const diff = Math.abs(scrollTop - this.lastScrollTop);

      if (diff >= this.threshold && this.respuestaSelect?.panelOpen) {
        this.respuestaSelect.close();
      }

      this.lastScrollTop = scrollTop;
    }
}
