import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { ToggleRequerimientoAdminComponent } from './widgets/toggle-requerimiento-admin/toggle-requerimiento-admin.component';


import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';


import {
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  provideNativeDateAdapter
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

export interface RequerimientoFiltros{
  noRequerimiento: string;
  titulo: string;
  estados: string[];
  rangoFechas: {
    inicio: Date;
    fin: Date;
  }
}

@Component({
  selector: 'app-requerimiento-crear',
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
    ToggleRequerimientoAdminComponent
],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  templateUrl: './requerimiento-root.component.html',
  styleUrl: './requerimiento-root.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequerimientoRootComponent {

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  selectedView = signal<'administrar' | 'visualizar'>('administrar');


  onSelectionChange(view: 'administrar' | 'visualizar'): void {
    this.selectedView.set(view);
    this.router.navigate([view], {
      relativeTo: this.route,
      replaceUrl: true,
    });
  }

  crearNuevoRequerimiento() {
    this.router.navigate(['/requerimiento/admin/crear']);
  }
}
