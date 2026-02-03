import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from "@angular/forms";

export const rangoFechasValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!(control instanceof FormGroup)) return null;

  const inicio = control.get('fechaInicioPlanAccion')?.value;
  const termino = control.get('fechaTerminoPlanAccion')?.value;

  if (inicio && termino && new Date(inicio) > new Date(termino)) {
    return {
      rangoInvalido: 'La fecha de inicio no puede ser mayor que la fecha de término'
    }
  }
  return null;
}
