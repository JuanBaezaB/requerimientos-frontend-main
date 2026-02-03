import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatDialog
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable, MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from "@angular/router";
import { CeldaInterface } from '../../../../shared/models/respuesta.model';
import { DialogConfirmStore } from '../../../../shared/store/dialog-confirm.store';
import { RequerimientoRespuestaStore } from "../../../../shared/store/requerimiento-admin/requerimiento-respuesta.store";
import { RespuestaStore, ResultadoCarga } from '../../../../shared/store/respuestas-requerimiento/respuestas.store';
import { ConfirmAlertDialogComponent } from '../../../components/confirm-alert/confirm-alert.component';
import { ConfirmRetryAlertDialogComponent } from '../../../components/confirm-retry-alert/confirm-retry-alert.component';
import { WarningAlertComponent } from '../../../components/warning-alert/warning-alert.component';
import { RequerimientosSckeletonComponent } from "../requerimientos-skeleton/requerimientos-skeleton.component";

export interface PlanAccion{
  id: number;
  titulo: string;
  fechaInicio: Date | null;
  fechaTermino: Date | null;
}

@Component({
  selector: 'app-requerimiento-detail',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatInputModule,
    MatTableModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    RequerimientosSckeletonComponent,
    DatePipe,
    MatDatepickerModule,
    CommonModule,
    MatDatepickerModule,
    MatTable,
    MatCheckboxModule,
  ],
  providers: [
    provideNativeDateAdapter(),
  ],
  templateUrl: './requerimientos-detail.component.html',
  styleUrl: './requerimientos-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequerimientosDetailComponent implements OnInit, OnDestroy{

  // Injects
  store = inject(RequerimientoRespuestaStore);
  respuestaStore = inject(RespuestaStore);
  dialogStore = inject(DialogConfirmStore);
  route = inject(ActivatedRoute);
  router = inject(Router);
  snackBar = inject(MatSnackBar);
  private _dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // Signals
  archivoSeleccionado = signal<File | null>(null);
  nombreArchivosPorOrden = signal<Record<string, string>>({});
  operacionExitosaVisible = signal(false);
  operacionErrorVisible = signal(false);
  subidaEnProgreso = signal(false);
  sePasoDeLaFecha = signal(false);
  archivoSolicitudNoExiste = signal(false);
  tipoRespuesta = signal<'archivos' | 'planAccion' | null>(null);
  mostrarErrorEnvio = signal(false);
  private formArrayVersion = signal(0);

  errorDescargaRequerimientoPorOrden = signal(false);

  dataSource = signal<FormArray>(this.fb.array([]));

  displayedColumns = signal<string[]>([]);


  resultadoEnvio = signal<'exito' | 'error' | null>(null);

  // Signals para guardar extensiones
  extensionesEsperadasPorOrden = signal<Record<string, string>>({});


  // Computeds
  idRespuesta = computed(() => this.route.snapshot.paramMap.get('id'));

  vencimientoExpirado = computed(() => {
    const fechaVencimiento = this.store.detalleRequerimiento()?.vencimiento;

    if (!fechaVencimiento) return false;

    const hoy = new Date();

    const vencimiento = new Date(fechaVencimiento);

    const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const vencimientoSinHora = new Date(vencimiento.getFullYear(), vencimiento.getMonth(), vencimiento.getDate());
    return hoySinHora > vencimientoSinHora;
  });

  private adjuntosValidos = computed(() => {
    const adjuntos = this.store.detalleRequerimiento()?.adjuntos ?? [];
    const totalAdjuntos = adjuntos.length;
    const exitos = this.respuestaStore.archivosCargadosExitosamente().length;

    if (totalAdjuntos === 0) return true;

    return totalAdjuntos === exitos;
  })

  private planAccionValido = computed(() => {
    this.formArrayVersion();

    const arr = this.formArray;
    if (arr.length === 0) return false;

    const todasFechasCompletas = arr.controls.every(fg => {
      const inicioCtrl = fg.get('Fecha_Inicio');
      const terminoCtrl = fg.get('Fecha_Termino');

      return inicioCtrl?.value && terminoCtrl?.value;
    });

    if (!todasFechasCompletas) return false;

    const todosValidos = arr.controls.every(fg => fg.valid);

    const cruceValido = this.validarCruceTabla();

    return todosValidos && cruceValido;
  });

  inputsDeshabilitados = computed(() => this.operacionExitosaVisible() || this.subidaEnProgreso() || this.vencimientoExpirado());
  enviandoSignal = computed(() => this.dialogStore.obtenerEstadoEnvio());



  constructor() {
    effect(() => {
      const respuesta = this.store.detalleRequerimiento();
      if (!respuesta) return;
      const adjuntos = this.store.detalleRequerimiento()?.adjuntos ?? [];

      const extensiones = adjuntos.reduce((acc, adjunto) => {
        acc[adjunto.orden] = adjunto.extension.toLowerCase();
        return acc;
      }, {} as Record<string, string>);

      this.extensionesEsperadasPorOrden.set(extensiones);
    });
    effect(() => {
      const resultado = this.dialogStore.obtenerResultadoEnvio();

      if (resultado === 'exito') {
        this.operacionExitosaVisible.set(true);
        this.dialogStore.reiniciarEstados();
      }

      if (resultado === 'error') {
        this.operacionErrorVisible.set(true);
        this.dialogStore.reiniciarEstados();
      }
    });

    effect(() => {
      const respuesta = this.store.detalleRequerimiento();
      if (!respuesta) return;

      const { adjuntos, celdas } = respuesta;

      if (adjuntos?.length > 0 && (!celdas || celdas.length === 0)) {
        this.tipoRespuesta.set('archivos');
      } else if (celdas?.length > 0 && (!adjuntos || adjuntos.length === 0)) {
        this.tipoRespuesta.set('planAccion');
      }
    });

    effect(() => {
      const req = this.store.detalleRequerimiento();
      if (!req) {
        return;
      }

      const columnas = req.formulario?.columnas?.filter(c => c.visible) ?? [];
      const celdas = req.celdas ?? [];

      const columnasNormalizadas = columnas.map(c => ({
        ...c,
        id: c.nombre
          .replace(/\s+/g, '_')         // espacios -> guion bajo
          .normalize('NFD')             // quita tildes
          .replace(/[\u0300-\u036f]/g, '')
      }));

      this.displayedColumns.set(columnasNormalizadas.map(c => c.nombre));

      const filasMap: Record<number, any> = {};
      celdas.forEach(c => {
        if (!filasMap[c.fila]) {
          filasMap[c.fila] = {};
        }

        const col = columnasNormalizadas.find(col => col.numero === c.columna);
        if (col) {
          filasMap[c.fila][col.id] = c.valor;
        }
      });

      const formGroups = Object.keys(filasMap).sort((a, b) => +a - +b).map(f => {
        const rowData = filasMap[+f];
        const controls: any = {};

        Object.keys(rowData).forEach(key => {
          const columna = columnasNormalizadas.find(c => c.id === key);


          if (columna && columna.tipo === 'date') {
            controls[key] = [rowData[key], Validators.required];
          } else {
            controls[key] = [rowData[key]];
          }
        });

        return this.fb.group(controls);
      });

      const formArray = this.fb.array(formGroups);

      this.dataSource.set(formArray);


      const sub = formArray.valueChanges.subscribe(() => this.actualizarHabilitados());

      this.destroyRef.onDestroy(() => sub.unsubscribe());

      this.actualizarHabilitados();
    });

    effect(() => {
      const { existe, data } = this.store.tieneRespuesta();

      if (!existe) {
        return;
      }

    });

    effect(() => {
      if (this.operacionExitosaVisible() || this.operacionErrorVisible()) {
        queueMicrotask(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        })
      }
    })
  }

  ngOnDestroy(): void {
    this.dialogStore.reiniciarEstados();
    this.respuestaStore.limpiarResultados();
  }

  ngOnInit(): void {
    this.store.obtenerDetalleRequerimientoPorId(this.idRespuesta()!);
  }


  columnaIds = computed(() => this.columnasPlanAccion().map(c => c.id))

  columnasPlanAccion = computed(() => {
    const detalle = this.store.detalleRequerimiento();

    if (!detalle?.formulario?.columnas) {
      return [];
    }

    return detalle.formulario.columnas.filter(c => c.visible).map(c => ({
      id: c.nombre.replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      nombre: c.nombre,
      tipo: c.tipo
    }));
  });

  botonEnviarDeshabilitado = computed(() => {
    if (this.tipoRespuesta() === 'archivos') {
      return !this.adjuntosValidos();
    }
    if (this.tipoRespuesta() === 'planAccion') {
      return !this.planAccionValido();
    }
    return true;
  });

  @ViewChild('fileInpuit') fileInput!: ElementRef;


  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event, orden: string) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.manejarArchivoSeleccionadoConOrden(input.files[0], orden);
      input.value = '';
    }
  }



  async descargarDocumentoSolicitud(id: string, tipo: string, orden?: string) {
    try {
      const urlDocumento = await this.store.obtenerUrlPrefirmadaDeSolicitudArchivoADescargar(id, tipo, orden);
      if (urlDocumento) {
        this.store.descargarArchivoSolicitudORequerimiento(
          urlDocumento
        ).then((archivo) => {
          if (archivo?.status != 200) {
            this.archivoSolicitudNoExiste.set(true);
            return;
          }
          this.archivoSolicitudNoExiste.set(false);
          return;
        });
      } else {
        this.archivoSolicitudNoExiste.set(true);
        return;
      }
    } catch (_) {
      this.archivoSolicitudNoExiste.set(true);
    }
  }

  async descargarDocumentoRequerimientoPorPosicion(id: string, tipo: string, orden: string) {
    try {
      const urlDocumento = await this.store.obtenerUrlPrefirmadaDeArchivoRequerimientoDescargar(id, tipo, orden);
      if (urlDocumento) {
        this.store.descargarArchivoSolicitudORequerimiento(
          urlDocumento
        ).then((archivo) => {
          if (!archivo) {
            this.errorDescargaRequerimientoPorOrden.set(true);
          }
        })
      }
    }catch(_){
        this.errorDescargaRequerimientoPorOrden.set(true);
    }
  }

  descargandoPorOrden(orden: string): boolean{
    return !!this.store.descargandoArchivoRequerimientoPorOrden()?.[orden];
  }

  async manejarArchivoSeleccionadoConOrden(file: File, orden: string) {
    if (!this.validarArchivo(file, orden)) return;

    this.subidaEnProgreso.set(true);

    const actuales = this.nombreArchivosPorOrden();
    this.nombreArchivosPorOrden.set({
      ...actuales, [orden]: file.name
    });


    try {
      await this.respuestaStore.obtenerUrlPrefirmadaParaCargarArchivo(this.idRespuesta()!, orden, file.name, file);
    } finally {
      this.subidaEnProgreso.set(false);
    }
  }

  progresoPorOrden(orden: string): number{
    return this.respuestaStore.progresoArchivoPorOrden()?.[orden] ?? 0;
  }

  subiendoPorOrden(orden: string): boolean{
    return !!this.respuestaStore.subiendoArchivoPorOrden()?.[orden];
  }

  mostrarExito(orden: string): boolean{
    return (this.respuestaStore.progresoArchivoPorOrden()?.[orden] === 100 && !this.respuestaStore.subiendoArchivoPorOrden()?.[orden]);
  }

  mostrarSpinnerCircular(orden: string): boolean{
    const cargandoUrl = this.respuestaStore.cargandoUrlArchivoPorOrden()?.[orden];
    const subiendo = this.respuestaStore.subiendoArchivoPorOrden()?.[orden];
    return !!(cargandoUrl || subiendo);
  }

  mostrarResultado(orden: string): ResultadoCarga | null{
    return this.respuestaStore.resultadoArchivoPorOrden()?.[orden] ?? null;
  }


  validarArchivo(file: File, orden: string): boolean{
    const { extension } = this.obtenerNombreYExtension(file.name);
    const extensionEsperada = this.extensionesEsperadasPorOrden()[orden];

    if (!extension || !extensionEsperada) {
      this.snackBar.open('No se puede validar la extensión esperada.', 'Cerrar', {
        duration: 4000,
        panelClass: 'toast-error'
      });
      return false;
    }


    if (extension !== extensionEsperada) {
      this.snackBar.open(`El archivo debe ser de tipo .${extensionEsperada}`, 'Cerrar', {
        duration: 4000,
        panelClass: 'toast-error'
      });
      return false;
    }
    return true;
  }


  irALaPantallaPrincipal() {
    this.respuestaStore.limpiarResultados();
    this.router.navigate(['/']);
  }

  cerrarErrorYReintentar() {
    this.mostrarErrorEnvio.set(false);
    this.dialogStore.setIdRespuesta(this.idRespuesta()!);

    if (this.tipoRespuesta() === 'planAccion') {
      const celdas = this.mapearCeldasDesdeFormulario();
      const columnas = this.columnasPlanAccion();
      this.respuestaStore.setCeldasParaEnvio(celdas, columnas);
    }

    this._dialog.open(ConfirmRetryAlertDialogComponent, {
      disableClose: true,
      width: '338px',
    });
  }

  mostrarToastErrorDescargaSolicitudORequerimiento() {
    this.snackBar.open('El documento no ha podido ser descargado, por favor intente nuevamente más tarde', 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'toast-error'
    });
  }

  volverConWarning() {
    this._dialog.open(WarningAlertComponent, {
      disableClose: true,
      width: '338px',
    });
  }

  enviarRespuestaACoordinador() {
    this.dialogStore.setIdRespuesta(this.idRespuesta()!);

    if (this.tipoRespuesta() === 'planAccion') {
      const celdas = this.mapearCeldasDesdeFormulario();
      const columnas = this.columnasPlanAccion();
      this.respuestaStore.setCeldasParaEnvio(celdas,columnas);
    }

    this._dialog.open(ConfirmAlertDialogComponent, {
      disableClose: true,
      width: '338px',
    });
  }

  enviarRespuestaACoordinadorNuevamente() {
    this.dialogStore.setIdRespuesta(this.idRespuesta()!);

    if (this.tipoRespuesta() === 'planAccion') {
      const celdas = this.mapearCeldasDesdeFormulario();
      const columnas = this.columnasPlanAccion();
      this.respuestaStore.setCeldasParaEnvio(celdas, columnas);
    }

    this._dialog.open(ConfirmRetryAlertDialogComponent, {
      disableClose: true,
      width: '338px',
    });
  }

  cerrarAlertaDeDescarga() {
    this.errorDescargaRequerimientoPorOrden.set(false);
  }

  volverAlAdministradorHome() {
    this.router.navigate(['/requerimiento/admin']);
  }

  private obtenerNombreYExtension(fileName: string): { nombre: string, extension: string} {
    const ultimoPunto = fileName.lastIndexOf('.');
    if(ultimoPunto === -1) {
      return { nombre: fileName, extension: '' };
    }
    return {
      nombre: fileName.substring(0, ultimoPunto),
      extension: fileName.substring(ultimoPunto + 1).toLowerCase()
    }
  }

  private actualizarHabilitados() {
    const arr = this.formArray;

    arr.controls.forEach((fg) => {
      const inicioCtrl = fg.get('Fecha_Inicio');
      const terminoCtrl = fg.get('Fecha_Termino');

      if (!inicioCtrl || !terminoCtrl) return;

      terminoCtrl.setValidators([
        Validators.required,
        control => {
          const inicio = inicioCtrl.value ? new Date(inicioCtrl.value) : null;
          const termino = control.value ? new Date(control.value) : null;
          if (inicio && termino && termino < inicio) {
            return { menorQueInicio: true };
          }
          return null;
        }
      ]);

      inicioCtrl.valueChanges.subscribe(() => {
        terminoCtrl.updateValueAndValidity({ emitEvent: false });
      });

      terminoCtrl.updateValueAndValidity({ emitEvent: false });
    });

    this.validarCruceTabla();

    this.formArrayVersion.update(v => v + 1);
  }

  private validarCruceTabla(): boolean {
    const arr = this.formArray;
    if (arr.length < 2) return true; // no aplica si hay solo una fila

    const ultimaFila = arr.at(arr.length - 1);
    const ultimaTerminoRaw = ultimaFila.get('Fecha_Termino')?.value;
    const ultimaTermino = ultimaTerminoRaw ? new Date(ultimaTerminoRaw) : null;

    if (!ultimaTermino) {
      return true; // si aún no se ingresó, no forzamos error
    }

    let fechaMaxAnterior: Date | null = null;

    for (let i = 0; i < arr.length - 1; i++) {
      const inicioRaw = arr.at(i).get('Fecha_Inicio')?.value;
      const terminoRaw = arr.at(i).get('Fecha_Termino')?.value;

      const inicio = inicioRaw ? new Date(inicioRaw) : null;
      const termino = terminoRaw ? new Date(terminoRaw) : null;

      if (inicio && (!fechaMaxAnterior || inicio > fechaMaxAnterior)) {
        fechaMaxAnterior = inicio;
      }
      if (termino && (!fechaMaxAnterior || termino > fechaMaxAnterior)) {
        fechaMaxAnterior = termino;
      }
    }

    if (fechaMaxAnterior && ultimaTermino < fechaMaxAnterior) {
      arr.setErrors({ ultimaNoEsMayor: true });
      return false;
    }

    arr.setErrors(null);
    return true;
  }

  dateFilter(group: FormGroup, colId: string) {
    return (date: Date | null): boolean => {
      if (!date) return false;

      if (colId === 'Fecha_Termino') {
        const inicioRaw = group.get('Fecha_Inicio')?.value;
        const inicio = inicioRaw ? new Date(inicioRaw) : null;

        if (inicio) {
          const inicioSinHora = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
          const dateSinHora = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          return dateSinHora >= inicioSinHora;
        }
      }

      return true;
    };
  }

  private filtrosCache = new WeakMap<FormGroup, Record<string, (d: Date | null) => boolean>>();

  getDateFilter(group: FormGroup, colId: string): (d: Date | null) => boolean {
  let map = this.filtrosCache.get(group);
  if (!map) {
    map = {};
    this.filtrosCache.set(group, map);
  }

  if (!map[colId]) {
    map[colId] = (date: Date | null): boolean => {
      if (!date) return false;

      if (colId === 'Fecha_Termino') {
        const inicioRaw = group.get('Fecha_Inicio')?.value;
        const inicio = inicioRaw ? new Date(inicioRaw) : null;

        if (inicio && date < inicio) {
          return false;
        }

        const arr = this.formArray;
        const isUltimaFila = group === arr.at(arr.length - 1);
        if (isUltimaFila) {
          let fechaMaxAnterior: Date | null = null;

          for (let i = 0; i < arr.length - 1; i++) {
            const inicioAnt = arr.at(i).get('Fecha_Inicio')?.value;
            const terminoAnt = arr.at(i).get('Fecha_Termino')?.value;

            const inicioDate = inicioAnt ? new Date(inicioAnt) : null;
            const terminoDate = terminoAnt ? new Date(terminoAnt) : null;

            if (inicioDate && (!fechaMaxAnterior || inicioDate > fechaMaxAnterior)) {
              fechaMaxAnterior = inicioDate;
            }
            if (terminoDate && (!fechaMaxAnterior || terminoDate > fechaMaxAnterior)) {
              fechaMaxAnterior = terminoDate;
            }
          }

          if (fechaMaxAnterior && date < fechaMaxAnterior) {
            return false; // bloquear en el calendario
          }
        }
      }

      return true;
    };
  }

  return map[colId];
}

  private mapearCeldasDesdeFormulario(): CeldaInterface[]{
    const columnas = this.columnasPlanAccion();
    const arr = this.formArray;

    const celdas: CeldaInterface[] = [];

    arr.controls.forEach((fg, filaIndex) => {
      columnas.forEach((columnas, colIndex) => {
        const valor = fg.get(columnas.id)?.value ?? null;

        celdas.push({
          fila: filaIndex + 1,
          columna: colIndex + 1,
          valor
        })
      })
    });

    return celdas;
  }

  get formArray(): FormArray {
    return this.dataSource();
  }
}
