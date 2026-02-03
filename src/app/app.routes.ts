import { Routes } from '@angular/router';
import { authGuard } from '../shared/guard/auth.guard';

export const appRoutes: Routes = [{
  data: { breadcrumb: 'Mis requerimientos'},
  path: '',
  canActivate:[authGuard],
  loadChildren: async () => (await import('./modules/requerimientos/requerimientos-detail.routes')).REQUERIMIENTO_ROUTES,
  loadComponent: async () => (await import('./layout/layout.component')).LayoutComponent,
},{
  data: { requiresCoordinadorProfile: true, },
  path: 'admin',
  canActivate:[authGuard],
  loadChildren: async () => (await import('./modules/admin/requerimiento-admin.routes')).REQUERIMIENTO_ADMIN_ROUTES,
  loadComponent: async () => (await import('./layout/layout.component')).LayoutComponent,
  },
];
