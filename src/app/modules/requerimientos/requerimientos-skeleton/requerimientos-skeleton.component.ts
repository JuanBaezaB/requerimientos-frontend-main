import { Component } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { NgxSkeletonLoaderComponent } from "ngx-skeleton-loader";
import { XlsComponent } from "../../../icons/xls.component";

@Component({
  selector: 'app-requerimiento-skeleton',
  standalone: true,
  imports: [
    MatIconModule,
    XlsComponent,
    NgxSkeletonLoaderComponent
],
  templateUrl: './requerimientos-skeleton.component.html',
  styleUrl: './requerimientos-skeleton.component.scss'
})
export class RequerimientosSckeletonComponent{
}
