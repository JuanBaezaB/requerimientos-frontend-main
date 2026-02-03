import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { RequerimientoAdminStateService } from "../../../../../../shared/services/requerimiento-admin-state.service";


@Component({
  selector: 'app-toggle-requerimiento-admin',
  imports: [
    MatButtonToggleModule,
    ReactiveFormsModule,
  ],
  templateUrl: './toggle-requerimiento-admin.component.html',
  styleUrl: './toggle-requerimiento-admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleRequerimientoAdminComponent implements OnInit{
  private router = inject(Router);
  private state = inject(RequerimientoAdminStateService);

  fontStyleControl = new FormControl<'administrar' | 'visualizar'>('administrar');

  ngOnInit(): void {

    const initialUrl = this.router.url;
    const initialModo = initialUrl.includes('visualizar') ? 'visualizar' : 'administrar';
    this.fontStyleControl.setValue(initialModo, { emitEvent: false });
    this.state.setModo(initialModo);

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const url = this.router.url;
      const modo = url.includes('visualizar') ? 'visualizar' : 'administrar';
      this.fontStyleControl.setValue(modo, { emitEvent: false });
      this.state.setModo(modo);
    });

    this.fontStyleControl.valueChanges.subscribe((value) => {
      if (!value) {
        return;
      }
      this.state.setModo(value);
      const route = value === 'administrar' ? '/requerimiento/admin/administrar' : '/requerimiento/admin/visualizar';
      this.router.navigate([route]);
    })
  }
}
