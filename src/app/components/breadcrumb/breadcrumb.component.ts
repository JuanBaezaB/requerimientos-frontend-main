import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { filter } from 'rxjs';
import { RequerimientoAdminStateService } from '../../../shared/services/requerimiento-admin-state.service';
import { RequerimientoCrearOEditarStore } from '../../../shared/store/requerimiento-admin/requerimiento-crear-o-editar.store';
import { RequerimientoVisualizarTablaStore } from '../../../shared/store/requerimiento-admin/requerimiento-visualizar.store';
import { RequerimientoStore } from '../../../shared/store/requerimiento-admin/requerimiento.store';
import { RequerimientoCoordinadoStore } from '../../../shared/store/respuesta-coordinado/requerimiento-coordinado.store';
import { BackDialogComponent } from '../back-dialog/back-dialog.component';

interface IBreadCrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent implements OnInit {
  dialog = inject(MatDialog);
  readonly requerimientoStore = inject(RequerimientoStore);
  readonly requerimientoCrearOEditarStore = inject(RequerimientoCrearOEditarStore);
  readonly requerimientoVisualizarStore = inject(RequerimientoVisualizarTablaStore);
  readonly requerimientoCoordinadoStore = inject(RequerimientoCoordinadoStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private state = inject(RequerimientoAdminStateService);

  public breadcrumbs = signal<IBreadCrumb[]>([]);

  constructor() {
    effect(() => {
      const modo = this.state.modo();
      this.updateBreadcrumbs(modo);
    })
  }
  ngOnInit(): void {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.updateBreadcrumbs();
    })

    this.updateBreadcrumbs(this.state.modo());
  }

  onHomeClick(event: Event): void {
    event.preventDefault();
    this.limpiarMemoria();
    this.router.navigate(['/']);
  }

  private updateBreadcrumbs(modo?: 'administrar' | 'visualizar'): void {
    const crumbs = this.createBreadcrumbs(this.route.root);
    const currentModo = modo ?? this.state.modo();

    if (crumbs.length > 0) {
      const last = crumbs[crumbs.length - 1];
      if (last.label === 'Administrar requerimientos' || last.label === 'Visualizar requerimientos') {
        last.label = currentModo === 'visualizar' ? 'Visualizar requerimientos' : 'Administrar requerimientos';
      }
    }

    this.breadcrumbs.set(crumbs);
  }

  private createBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: IBreadCrumb[] = [],
  ): IBreadCrumb[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url
        .map((segment) => segment.path)
        .join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const breadcrumbLabel = child.snapshot.data['breadcrumb'];
      if (breadcrumbLabel) {

        const parts = breadcrumbLabel.split('/').map((p: any) => p.trim());

        if (parts.length > 1) {
          parts.forEach((part: any, index: any) => {
            if (breadcrumbs.some((b) => b.label === part)) {
              return;
            }

            let targetUrl = '';
            switch (index) {
              case 0: // "Requerimiento"
                targetUrl = '/requerimiento/admin/administrar';
                break;
              case 1: // "Visualizar detalle"
                const routeId = route.root.firstChild?.firstChild?.snapshot.paramMap.get('id') ?? sessionStorage.getItem('visualizar-detalle-id');
                targetUrl = routeId ? `/requerimiento/admin/detalle/${routeId}` : '/requerimiento/admin/detalle'; // base sin id
                break;
              default:
                targetUrl = url;
                break;
            }

            breadcrumbs.push({
              label: part,
              url: targetUrl
            });
          });
        } else {
          breadcrumbs.push({ label: breadcrumbLabel, url });
        }
      }

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  openBackDialog(): void {
    const dialogRef = this.dialog.open(BackDialogComponent, {
      disableClose: true,
      width: '395px',
    });
  }

  private limpiarMemoria() {
    this.requerimientoStore.limpiarFiltros();
    this.requerimientoVisualizarStore.limpiarFiltros();
    this.requerimientoCoordinadoStore.limpiarEstadoStore();
  }

  onBreadcrumbClick(event: Event, breadcrumb: IBreadCrumb): void {
  event.preventDefault();

  // inferir desde la URL actual si estamos en un detalle de visualización o en un detalle de administrar
  const currentUrl = this.router.url || '';
  const estoyEnDetalleVisualizar = currentUrl.includes('/requerimiento/admin/detalle/');
  const estoyEnDetalleAdministrar = currentUrl.includes('/requerimiento/admin/ver/');

    if (breadcrumb.label === 'Mis requerimientos') {
      this.router.navigate(['/requerimiento/mis_requerimientos']);
      return;
    }

  // Si el usuario clickea sobre "Requerimientos" o cualquiera de las variantes del label,
  // priorizamos la inferencia por URL (más confiable que el estado si éste puede estar desincronizado).
  if (
    breadcrumb.label === 'Requerimientos' ||
    breadcrumb.label === 'Administrar requerimientos' ||
    breadcrumb.label === 'Visualizar requerimientos' ||
    breadcrumb.label === 'Mis requerimientos'
  ) {
    let destino: string;

    if (estoyEnDetalleVisualizar) {
      destino = '/requerimiento/admin/visualizar';
    } else if (estoyEnDetalleAdministrar) {
      destino = '/requerimiento/admin/administrar';
    } else {
      // fallback al estado (por si se está en la lista ya)
      const modoActual = this.state.modo();
      destino = modoActual === 'visualizar' ? '/requerimiento/admin/visualizar' : '/requerimiento/admin/administrar';
    }

    this.router.navigate([destino]);
    return;
  }

  // resto de breadcrumbs con URL explícita (detalle, editar, etc.)
  if (breadcrumb.url) {
    this.router.navigate([breadcrumb.url]);
  }
}

}
