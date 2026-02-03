import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from "@angular/forms";

export function planAccionValidador(): ValidatorFn{
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) {
      return null;
    }

    const rows = control.controls;

    const invalidRow = rows.some(row => {
      const titulo = row.get('tituloPlan')?.value ?? '';
      return titulo.trim().length === 0; // vacío o solo espacios
    });

    return invalidRow ? { tituloPlanInvalido: true } : null;
  }
}
