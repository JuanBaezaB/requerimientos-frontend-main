import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Validador personalizado
export function subNormaRequiredValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const norma = formGroup.get('norma')?.value;
    const subNorma = formGroup.get('subNorma')?.value;

    if (norma && !subNorma) {
      return {
        subNormaRequired: {
          message: 'Debe seleccionar una sub-norma si hay norma',
          normaSeleccionada: norma,
          subNormaSeleccionada: subNorma,
        },
      };
    }

    return null; // Sin errores
  };
}
