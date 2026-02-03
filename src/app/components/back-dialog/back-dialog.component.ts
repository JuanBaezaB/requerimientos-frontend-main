import { Component, inject } from '@angular/core';
import { MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-dialog',
  imports: [MatDialogContent, MatIconModule],
  templateUrl: './back-dialog.component.html',
  styleUrl: './back-dialog.component.scss',
})
export class BackDialogComponent {
  readonly dialogRef = inject(MatDialogRef<BackDialogComponent>);
  readonly router = inject(Router);

  closeDialog(): void {
    this.dialogRef.close(false);
  }

  acceptAndNavigate(): void {
    // Cerrar el diálogo
    this.dialogRef.close(true);

  }
}
