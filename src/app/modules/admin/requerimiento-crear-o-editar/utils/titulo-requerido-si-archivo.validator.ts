import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function tituloRequeridoSiArchivoValidator(): ValidatorFn{
  return (control: AbstractControl): ValidationErrors | null => {
    const fileName = control.get('fileName')?.value?.trim();
    const title = control.get('title')?.value?.trim();

    if (fileName && !title) {
      return {
        tituloRequerido: true
      }
    }
    return null;
  }
}
