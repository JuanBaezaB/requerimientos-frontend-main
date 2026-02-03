import { Routes } from "@angular/router";

export const REQUERIMIENTO_ROUTES: Routes = [{
  path: 'mis_requerimientos',
  loadComponent: () => import('./requerimientos-root/requerimientos-root.component').then((m) => m.RequerimientoCoordinadoRootComponent),
},{
  path: 'detail/:id',
  data: { breadcrumb: 'Detalle' },
  loadComponent: () => import('./requerimientos-detail/requerimientos-detail.component').then((m) => m.RequerimientosDetailComponent),
}];
