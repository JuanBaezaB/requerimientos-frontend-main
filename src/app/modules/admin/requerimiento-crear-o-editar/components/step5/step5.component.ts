import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  input,
  OnInit,
  runInInjectionContext
} from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { CommonModule } from '@angular/common';
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { startWith } from 'rxjs';
import { RequerimientoCrearOEditarStore } from '../../../../../../shared/store/requerimiento-admin/requerimiento-crear-o-editar.store';


export enum TipoTitularesValues {
  TITULAR = 0b1000, // 8
  SUPLENTE = 0b0100, // 4
  FACTURACION = 0b0010, // 2
  GERENTE = 0b0001 // 1
}

export const TipoTitularesLabels = {
  [TipoTitularesValues.TITULAR]: 'Encargado titular',
  [TipoTitularesValues.SUPLENTE]: 'Encargado suplente',
  [TipoTitularesValues.FACTURACION]: 'Encargado facturación',
  [TipoTitularesValues.GERENTE]: 'Gerente General'
} as const;
@Component({
  selector: 'app-step5',
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
  templateUrl: './step5.component.html',
  styleUrl: './step5.component.scss',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step5Component implements OnInit {

  fb = inject(FormBuilder);
  injector = inject(Injector);
  requerimientoCrearStore = inject(RequerimientoCrearOEditarStore);
  public form = input.required<FormGroup>();

  readonly roles = Object.entries(TipoTitularesLabels).map(([value, label]) => ({
    value: Number(value),
    label
  }));

  constructor(){
    effect(() => {
      const detalle = this.requerimientoCrearStore.requerimientoDetalle();

      if (!detalle || detalle.notificaciones == null) return;

      const step5Group = this.form().get('step5') as FormGroup;
      const control = step5Group?.get('notificaciones');

      if (!control) return;

      if (typeof detalle.notificaciones === 'number') {
        const decoded = this.decodeBitmask(detalle.notificaciones);

        if (JSON.stringify(control.value) !== JSON.stringify(decoded)) {
          control.setValue(decoded, { emitEvent: false });
        }
      }
    });
  }

  ngOnInit(): void {
    const step5Group = this.form().get('step5') as FormGroup;
    const control = step5Group.get('notificaciones');
    if (!control) return;
    runInInjectionContext(this.injector, () => {
      // Escuchar valor inicial + futuros cambios
      control.valueChanges
        .pipe(startWith(control.value))
        .subscribe((value: any) => {
          if (typeof value === 'number') {
            const decoded = this.decodeBitmask(value);
            control.setValue(decoded, { emitEvent: false });
            return;
          }

          if (!value || (Array.isArray(value) && value.length === 0)) {
            control.setValue([TipoTitularesValues.TITULAR], { emitEvent: false });
            return;
          }

          if (Array.isArray(value)) {
            const ordered = [
              TipoTitularesValues.TITULAR,
              ...value.filter(v => v !== TipoTitularesValues.TITULAR)
            ];

            if (JSON.stringify(value) !== JSON.stringify(ordered)) {
              control.setValue(ordered, { emitEvent: false });
            }
          }
        });
    });
  }

  getSelectTriggerLabel(): string {
    const values: number[] = this.form().get('step5.notificaciones')?.value ?? [];

    if (values.length === 0) {
      return 'Seleccione';
    }

    const firstLabel = this.roles.find(r => r.value === values[0])?.label ?? '';

    if (values.length === 1) {
      return firstLabel;
    }

    const extraCount = values.length - 1;
    return `${firstLabel} (+${extraCount} seleccionado${extraCount > 1 ? 's' : ''})`;
  }
  get selectedRoles() {
    return this.form().get('notificaciones')?.value ?? [];
  }

  onSelectionChange(): void {
    const control = this.form().get('step5.notificaciones');
    const values: number[] = control?.value ?? [];

    if (!values.includes(TipoTitularesValues.TITULAR)) {
      const ordered = [
        TipoTitularesValues.TITULAR,
        ...values.filter(v => v !== TipoTitularesValues.TITULAR)
      ];
      control?.setValue(ordered, { emitEvent: false });
      return;
    }

    const ordered = [
      TipoTitularesValues.TITULAR,
      ...values.filter(v => v !== TipoTitularesValues.TITULAR)
    ];

    if (JSON.stringify(values) !== JSON.stringify(ordered)) {
      control?.setValue(ordered, { emitEvent: false });
    }
  }

  private decodeBitmask(bitmask: number): number[]{
    const selected: number[] = [];

    if (bitmask & TipoTitularesValues.TITULAR) {
      selected.push(TipoTitularesValues.TITULAR);
    }

    if (bitmask & TipoTitularesValues.SUPLENTE) {
      selected.push(TipoTitularesValues.SUPLENTE);
    }

    if (bitmask & TipoTitularesValues.FACTURACION) {
      selected.push(TipoTitularesValues.FACTURACION);
    }

    if (bitmask & TipoTitularesValues.GERENTE) {
      selected.push(TipoTitularesValues.GERENTE);
    }

    return selected;
  }

}


