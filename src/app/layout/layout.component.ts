import { Component } from "@angular/core";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { BreadcrumbComponent } from "../components/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, BreadcrumbComponent],
  templateUrl: './layout.component.html',
  styleUrl:'./layout.component.scss'
})
export class LayoutComponent{
  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        window.scrollTo({ top: 0 });
      }
    });
  }
}
