import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from "@angular/forms";

export function maxRangeValidator(maxYears: number): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    if (!(group instanceof FormGroup)) return null;

    const inicio = group.get('inicio')?.value as Date | null;
    const fin = group.get('fin')?.value as Date | null;

    if (!inicio || !fin) return null; // no validamos hasta tener ambas

    // Diferencia en milisegundos -> años aprox
    const diffMs = Math.abs(fin.getTime() - inicio.getTime());
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365);

    return diffYears > maxYears ? { maxRange: true } : null;
  };
}
