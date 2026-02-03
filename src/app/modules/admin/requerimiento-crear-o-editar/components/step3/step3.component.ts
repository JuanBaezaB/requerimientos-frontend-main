import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { RequerimientoService } from '../../../../../../shared/services/requerimientos.service';

import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RequerimientoCrearOEditarStore } from '../../../../../../shared/store/requerimiento-admin/requerimiento-crear-o-editar.store';
import { BackDialogComponent } from '../../../../../components/back-dialog/back-dialog.component';
import { CambioReqDialogComponent } from '../../../../../components/cambio-req-dialog/cambio-req-dialog.component';


interface FileUploadState {
  isUploading: boolean;
  uploadProgress: number;
  uploadComplete: boolean;
  uploadError: boolean;
}

interface OpcionPaso3{
  value: string;
  label: string;
}

interface ColumnaTabla{
  id: number;
  titulo?: string;
  fechaInicio: Date | null;
  fechaTermino: Date | null;
  seguimiento: boolean;
}

@Component({
  selector: 'app-step3',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatProgressBarModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    CommonModule,
    MatTableModule,
    MatDatepickerModule,
    MatCheckboxModule,
],
  templateUrl: './step3.component.html',
  styleUrl: './step3.component.scss',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step3Component {

  private cdr = inject(ChangeDetectorRef);

  // Columnas de la tabla
  columnasVisibles = [
    'item',
    'titulo',
    'fechaInicio',
    'fechaTermino',
    'seguimiento',
    'accion'
  ]

  selectValueVisual = signal<OpcionPaso3 | null>(null);

  dataSource = signal<ColumnaTabla[]>([{ id: 1, titulo: '', fechaInicio: null, fechaTermino: null, seguimiento: false }]);

  readonly selectFijo = signal(false);

  requerimientoService = inject(RequerimientoService);
  readonly requerimientoCrearStore = inject(RequerimientoCrearOEditarStore);
  dialog = inject(MatDialog);

  public form = input.required<FormGroup>();

  public fileUploadStates = signal<FileUploadState[]>([]);

  idRequerimiento = this.requerimientoCrearStore.idRequerimiento;

  readonly seEstanSubiendoArchivos = computed(() => this.requerimientoCrearStore.seEstanSubiendoArchivos());

  readonly borradorGuardado = computed(() => this.requerimientoCrearStore.borradorGuardado());

  readonly selectDisableRequerimiento = computed(() => !this.requerimientoCrearStore.tieneCorrelativo());

  modoVisual = computed(() => {
    return this.selectValueVisual()?.value || this.seleccionPaso3()?.value;
  });

  opcionesPaso3: OpcionPaso3[] = [
    {
      value: 'adjuntos',
      label:'Archivos adjuntos'
    },
    {
      value: 'accion',
      label:'Plan de acción'
    },
  ]

  get planAccionControls() {
    return [...this.planAccionArray.controls];
  }

  get planAccionArray(): FormArray {
    return this.form().get('step3.planAccion') as FormArray;
  }

  private createPlanAccionRow(): FormGroup{
    return this.fb.group({
      tituloPlan: [''],
      fechaInicioPlanAccion: [{value: null, disabled: true}],
      fechaTerminoPlanAccion: [{value: null, disabled: true}],
      seguimiento: [false],
    });
  }

  seleccionPaso3 = signal<OpcionPaso3 | null>(null);

  modoSeleccionado = computed(() => this.seleccionPaso3()?.value);

  seleccionOpcionPaso3(valor: OpcionPaso3 | null) {

    if (this.compararOpciones(valor, this.seleccionPaso3())) {
      return;
    }

    this.seleccionPaso3.set(valor);

    this.form().get('step3.modo')?.setValue(valor?.value || null);

    const fileInputs = this.form().get('step3.fileInputs') as FormArray;
    const planAccion = this.form().get('step3.planAccion') as FormArray;
    fileInputs.clear();
    planAccion.clear();

    if (valor?.value === 'accion') {
      planAccion.push(this.createPlanAccionRow());
      this.resetFileUploadStates(0);
    } else if (valor?.value === 'adjuntos') {
      fileInputs.push(this.createEmptyFileInput());
      this.resetFileUploadStates(fileInputs.length);
    }

    this.cdr.markForCheck();
  }

  readonly selectDisabled = computed(() => {
    const tieneCorrelativo = this.requerimientoCrearStore.tieneCorrelativo();
    const detalle = this.requerimientoCrearStore.requerimientoDetalle();
    const seGuardoBorrador = this.requerimientoCrearStore.seGuadoBorrador();
    if (!detalle) {
      if (!tieneCorrelativo) {
        return true;
      }
    }

    if (detalle) {

      const tieneTipo = detalle.tipo !== null
      const estaIndefindo = detalle.tipo === undefined;
      const modo = this.modoVisual();

      if (tieneTipo && !estaIndefindo) {
        return true;
      }

      if (tieneTipo && estaIndefindo && modo == undefined) {
        return false;
      }

      if (!tieneTipo && !seGuardoBorrador) {
        return false;
      }

      if (tieneTipo && seGuardoBorrador) {
        return true;
      }

      if (modo && seGuardoBorrador) {
        return true;
      }
    }

    return false;
  });

  constructor(private fb: FormBuilder) {
    effect(() => {
      if (this.requerimientoCrearStore.tieneCorrelativo()) {
        this.form().get('step3')?.enable();
      } else {
        this.form().get('step3')?.disable();
      }
    });

    effect(() => {
      const detalle = this.requerimientoCrearStore.requerimientoDetalle();

      if (!detalle) return;

      const fileInputs = this.form().get('step3.fileInputs') as FormArray;
      const planAccion = this.form().get('step3.planAccion') as FormArray;

      fileInputs.clear();
      planAccion.clear();

      const modo = this.mapTipoModo(detalle.tipo);
      const opcionSeleccionada = this.opcionesPaso3.find(o => o.value === modo) ?? null;

      // this.seleccionPaso3.set(this.opcionesPaso3.find(o => o.value === modo) ?? null);
      this.seleccionPaso3.set(opcionSeleccionada);
      this.selectValueVisual.set(opcionSeleccionada);

      this.form().get('step3.modo')?.setValue(modo);

      if (modo === 'adjuntos') {
        this.seleccionPaso3.set(this.opcionesPaso3.find(o => o.value === 'adjuntos')!);
        this.form().get('step3.modo')?.setValue('adjuntos');
        const states: FileUploadState[] = [];

        if (detalle.adjuntos && detalle.adjuntos.length > 0) {
          detalle.adjuntos!.forEach((adjunto) => {

            const hasFile = !!adjunto.nombre && !!adjunto.extension;
            const fullName = hasFile ? `${adjunto.nombre}.${adjunto.extension}` : "";

            const fileInput = this.fb.group({
              id: [adjunto.id],
              title: [adjunto.titulo, [Validators.required]],
              fileName: [fullName],
              extension: [adjunto.extension ?? ""],
              fileUploaded: hasFile
            });
            fileInputs.push(fileInput);

            states.push({
              isUploading: false,
              uploadProgress: hasFile ? 100 : 0,
              uploadComplete: hasFile,
              uploadError: false
            });
          });
          this.fileUploadStates.set(states);
        } else {
          fileInputs.push(this.createEmptyFileInput());
          states.push({
              isUploading: false,
              uploadProgress: 0,
              uploadComplete: false,
              uploadError: false
            });
        }

      } else if (modo === 'accion') {
        this.seleccionPaso3.set(this.opcionesPaso3.find(o => o.value === 'accion')!);
        this.form().get('step3.modo')?.setValue('accion');

        const rows = Math.max(...detalle.celdas!.map(c => c.fila));
        for (let i = 1; i <= rows; i++){
          const rowCeldas = detalle.celdas!.filter(c => c.fila === i);
          const rowGroup = this.fb.group({
            tituloPlan: [rowCeldas.find(c => c.columna === 2)?.valor ?? ''],
            fechaInicioPlanAccion: [null],
            fechaTerminoPlanAccion: [null],
            seguimiento: [rowCeldas.find(c => c.columna === 5)?.valor === 'true'],
          })
          planAccion.push(rowGroup);
        }
      } else {
        fileInputs.push(this.createEmptyFileInput());
        planAccion.push(this.createPlanAccionRow());
        this.seleccionPaso3.set(null);
        this.form().get('step3.modo')?.setValue(null);
      }
    });
  }

  get fileInputGroups(): FormGroup[]{
    return this.fileInputsArray.controls as FormGroup[];

  }

  get fileInputsArray(): FormArray {
    return (this.form().get('step3.fileInputs') as FormArray) ?? this.fb.array([]);
  }

  compararOpciones(o1: OpcionPaso3 | null, o2: OpcionPaso3 | null): boolean{
    // return o1?.value === o2?.value;
    if (o1 === o2) return true;
    if (o1 === null || o2 === null) return false;
    return o1.value === o2.value;
  }

  ngOnInit() {
    const fileInputs = this.form().get('step3.fileInputs') as FormArray;
    if (fileInputs.length === 0) {
      fileInputs.push(this.createEmptyFileInput());
    }
    this.initializeUploadStates();
  }

  private initializeUploadStates(): void {

    const fileInputs = this.form().get('step3.fileInputs') as FormArray | null;

    if (!fileInputs) {
      this.fileUploadStates.set([]);
      return;
    }

    const states: FileUploadState[] = [];
    for (let i = 0; i < this.fileInputsArray.length; i++) {
      states.push({
        isUploading: false,
        uploadProgress: 0,
        uploadComplete: false,
        uploadError: false,
      });
    }
    this.fileUploadStates.set(states);
  }

  addFileInput(): void {
    const newId = `fileInput${this.fileInputsArray.length + 1}`;
    const fileInputGroup = this.fb.group({
      id: [newId],
      title: ['',[Validators.required]],
      fileName: ['', [Validators.required]],
      extension:[''],
      fileUploaded: [false],
    });

    this.fileInputsArray.push(fileInputGroup);

    const currentStates = this.fileUploadStates();
    currentStates.push({
      isUploading: false,
      uploadProgress: 0,
      uploadComplete: false,
      uploadError: false,
    });
    this.fileUploadStates.set([...currentStates]);
  }

  private uploadFile(file: File, index: number): void {

    this.requerimientoCrearStore.subiendoArchivosALaNube(true);

    this.updateUploadState(index, {
      isUploading: true,
      uploadProgress: 0,
      uploadComplete: false,
      uploadError: false,
    });

    const { cleanFileName, extension: fileExtension } = this.getFileNameAndExtension(file.name);
    // Paso 1: Obtener URL prefirmada
    this.requerimientoService
      .obtenerUrlPrefirmada(this.idRequerimiento()!, {
        action: 'PUT',
        orden: (index + 1).toString(),
        tipo: 'REQ',
        archivo: cleanFileName,
        extension: fileExtension,
      })
      .subscribe({
        next: (response) => {
          this.uploadToS3(response.url, file, index);
        },
        error: (error) => {
          this.finalizarSubidaArchivo();
        },
      });
  }

  private finalizarSubidaArchivo() {
    this.requerimientoCrearStore.subiendoArchivosALaNube(false);
  }

  private getFileNameAndExtension(fileName: string): { cleanFileName: string; extension: string } {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return { cleanFileName: fileName, extension: '' };
    }

    return {
      cleanFileName: fileName.substring(0, lastDotIndex),
      extension: fileName.substring(lastDotIndex + 1),
    };
  }

  private uploadToS3(presignedUrl: string, file: File, index: number): void {
    this.requerimientoService.subirArchivo(presignedUrl, file).subscribe({
      next: (event) => {
        if (event.type === 'progress') {
          this.updateUploadState(index, {
            ...this.fileUploadStates()[index],
            uploadProgress: event.value,
          });
        } else if (event.type === 'complete') {
          this.handleUploadSuccess(index);
          this.finalizarSubidaArchivo();
        }
      },
      error: (error) => {
        this.finalizarSubidaArchivo();
      },
    });
  }

  private handleUploadSuccess(index: number): void {
    this.updateUploadState(index, {
      isUploading: false,
      uploadProgress: 100,
      uploadComplete: true,
      uploadError: false,
    });

    // Marcar como subido en el FormGroup
    const fileInputGroup = this.fileInputsArray.at(index) as FormGroup;

    fileInputGroup.patchValue({
      fileUploaded: true
    });
  }

  private updateUploadState(
    index: number,
    newState: Partial<FileUploadState>,
  ): void {
    const currentStates = [...this.fileUploadStates()];
    currentStates[index] = { ...currentStates[index], ...newState };
    this.fileUploadStates.set(currentStates);
  }

  canAddNewFile(): boolean {

    const lastIndex = this.fileInputsArray.length - 1;
    if (lastIndex < 0) return true;

    const lastFileState = this.fileUploadStates()[lastIndex];
    const lastFileGroup = this.fileInputsArray.at(lastIndex) as FormGroup;

    const fileUploaded = lastFileGroup?.get('fileUploaded')?.value;
    const titleValid = lastFileGroup?.get('title')?.valid;

    return ((lastFileState.uploadComplete && fileUploaded && titleValid) || (fileUploaded && titleValid));
  }

  isAnyFileUploading(): boolean {
    return this.fileUploadStates().some((state) => state.isUploading);
  }

  onFileSelectedMultiple(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileInputGroup = this.fileInputsArray.at(index) as FormGroup;

      const { extension } = this.getFileNameAndExtension(file.name);
      fileInputGroup.patchValue({ fileName: file.name, extension, fileUploaded: false });
      this.uploadFile(file, index);
    }
  }

  removeFileInput(index: number): void {
    if (this.fileInputsArray.length > 1) {
      this.fileInputsArray.removeAt(index); // Eliminar el grupo del FormArray

      const currentState = [...this.fileUploadStates()];
      currentState.splice(index, 1);
      this.fileUploadStates.set(currentState);
    }
  }

  openBackDialog(): void {
    const dialogRef = this.dialog.open(BackDialogComponent, {
      disableClose: true,
      width: '395px',
    });
  }

  // Lógica de tabla
  agregarFila() {
    this.planAccionArray.push(this.createPlanAccionRow());
  }

  eliminarFila(index: number) {
    this.planAccionArray.removeAt(index);
  }

  getCeldasFromPlanAccion(): any[]{
    const celdas: any[] = [];

    this.planAccionControls.forEach((group, rowIndex) => {
      const row = group.value;

      celdas.push({
        fila: rowIndex + 1,
        columna: 1,
        valor: (rowIndex + 1).toString()
      });

      celdas.push({
        fila: rowIndex + 1,
        columna: 2,
        valor: row.tituloPlan || ''
      });

      // Fecha inicio
      celdas.push({
        fila: rowIndex + 1,
        columna: 3,
      });

      // Fecha fin
      celdas.push({
        fila: rowIndex + 1,
        columna: 4,
      });

      // Fecha inicio
      celdas.push({
        fila: rowIndex + 1,
        columna: 5,
        valor: String(row.seguimiento ?? false)
      });
    })

    return celdas;
  }

  onOptionChange(nuevaOpcion: OpcionPaso3 | null) {
    const opcionActual = this.seleccionPaso3();

    if (this.compararOpciones(nuevaOpcion, opcionActual)) {
      return;
    }

    this.selectValueVisual.set(nuevaOpcion);

    const tieneArchivos = this.fileInputGroups.some(group => {
      return group.get('title')?.value?.trim() || group.get('fileName')?.value?.trim()
    });

    const tieneCeldas = this.planAccionControls.some(group => {
      return group.get('tituloPlan')?.value?.trim() || group.get('seguimiento')?.value == true
    });

    const hayDatos = tieneArchivos || tieneCeldas;

    if (hayDatos) {
      const dialogRef = this.dialog.open(CambioReqDialogComponent, {
        disableClose: true,
        width: '395px',
      });


      dialogRef.afterClosed().subscribe((confirmado: boolean) => {
        if (confirmado) {
          this.aplicarCambioOpcion(nuevaOpcion);
        } else {
          this.selectValueVisual.set(opcionActual);
          this.cdr.markForCheck();
        }
      });
    } else {
      this.aplicarCambioOpcion(nuevaOpcion);
    }
  }

  private aplicarCambioOpcion(nuevaOpcion: OpcionPaso3 | null) {
    this.seleccionPaso3.set(nuevaOpcion),
    this.actualizarFormularioSegunOpcion(nuevaOpcion);
  }

  private actualizarFormularioSegunOpcion(opcion: OpcionPaso3 | null) {
    this.form().get('step3.modo')?.setValue(opcion?.value || null);

    const fileInputs = this.form().get('step3.fileInputs') as FormArray;
    const planAccion = this.form().get('step3.planAccion') as FormArray;

    fileInputs.clear();
    planAccion.clear();

    if (opcion?.value === 'accion') {
      planAccion.push(this.createPlanAccionRow());
      this.resetFileUploadStates(0);
    } else if (opcion?.value === 'adjuntos') {
      fileInputs.push(this.createEmptyFileInput());
      this.resetFileUploadStates(fileInputs.length);
    }

    this.cdr.markForCheck();
  }

  private createEmptyFileInput(): FormGroup{
    const newId = `fileInputs${this.fileInputsArray.length + 1}`;
    return this.fb.group({
      id: [newId],
      title: ['', [Validators.required]],
      fileName: ['', [Validators.required]],
      extension: [''],
      fileUploaded: [false]
    })
  }

  private mapTipoModo(tipo: string | null | undefined) {
    if (tipo === "Plan de Acción") {
      return 'accion'
    }

    if (tipo === "Con archivos adjuntos") {
      return 'adjuntos'
    }

    return null;
  }

  private resetFileUploadStates(count: number) {
    const states: FileUploadState[] = [];
    for (let i = 0; i < count; i++) {
      states.push({
        isUploading: false,
        uploadProgress: 0,
        uploadComplete: false,
        uploadError: false
      });
    }

    this.fileUploadStates.set(states);
  }
}
