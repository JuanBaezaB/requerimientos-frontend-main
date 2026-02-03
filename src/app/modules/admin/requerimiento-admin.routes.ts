import { Routes } from "@angular/router";

export const REQUERIMIENTO_ADMIN_ROUTES: Routes = [
  {
    data: { breadcrumb: 'Requerimientos'},
    path: '',
    loadComponent: () => import('./requerimiento-root/requerimiento-root.component').then((m) => m.RequerimientoRootComponent),
    children: [
      {
        path: '',
        redirectTo: 'administrar',
        pathMatch: 'full',
      },
      {
        data: { breadcrumb: 'Administrar requerimientos'},
        path: 'administrar',
        loadComponent: () => import('./requerimiento-admin/requerimiento-admin.component').then((m) => m.RequerimientoAdminComponent),
      },
      {
        data: { breadcrumb: 'Visualizar requerimientos'},
        path: 'visualizar',
        loadComponent: () =>
          import('./requerimiento-visualizacion/visualizacion-requerimiento-root/visualizacion-requerimiento-root.component')
            .then((m) => m.RequerimientoVisualizarComponent),
      },
    ]
  },{
    data: { breadcrumb: 'Requerimientos / Administrar requerimientos / Crear' },
    path: 'crear',
    loadComponent: () => import('./requerimiento-crear-o-editar/requerimiento-crear-o-editar.component').then((m) => m.RequerimientoCrearComponent),
  },
  {
    data: { breadcrumb: 'Requerimientos / Administrar requerimientos / Editar' },
    path: 'editar/:id',
    loadComponent: () => import('./requerimiento-crear-o-editar/requerimiento-crear-o-editar.component').then((m) => m.RequerimientoCrearComponent),
  },
  {
    data: { breadcrumb: 'Requerimientos / Administrar requerimientos / Detalle' },
    path: 'ver/:id',
    loadComponent: () => import('./requerimiento-ver/requerimiento-ver.component').then((m) => m.RequerimientoVerComponent),
  }, {
    data: { breadcrumb: 'Requerimientos / Visualizar detalle' },
    path: 'detalle/:id',
    loadComponent: () => import('./requerimiento-visualizacion/visualizacion-requerimiento-detalle/visualizacion-requerimiento-detalle.component').then((m) => m.VisualizacionRequerimientoDetalleComponent),
  }, {
    data: { breadcrumb: 'Requerimientos / Visualizar detalle / Respuesta coordinado' },
    path: 'detalle/respuesta/:id',
    loadComponent: () => import('./requerimiento-visualizacion/visualizacion-respuesta/visualizacion-respuesta.component').then((m) => m.VisualizacionRespuestaComponent),
  }];
