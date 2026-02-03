import { Injectable, signal } from "@angular/core";


@Injectable({ providedIn: 'root' })
export class RequerimientoAdminStateService{
  modo = signal<'administrar' | 'visualizar'>('administrar');
  setModo(value: 'administrar' | 'visualizar') {
    this.modo.set(value);
  }
}
