import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';

@Component({
  selector: 'app-sin-resultado',
  standalone: true,
  imports: [
  ],
  templateUrl: './sin-resultado.component.html',
  styleUrl: './sin-resultado.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SinResultadoComponent {
}
