import type { AbstractControl } from '@angular/forms'

type ErrorMessageResolver = (errorValue: unknown, fieldLabel: string) => string

const DEFAULT_VALIDATION_MESSAGES: Partial<Record<string, ErrorMessageResolver>> = {
  required: (_errorValue, fieldLabel) => `Debe ingresar ${fieldLabel.toLowerCase()}`,
  email: () => 'Ingrese un correo electrónico válido',
  minlength: (errorValue, fieldLabel) => {
    const minLength = getNumericErrorProperty(errorValue, 'requiredLength')

    if (minLength === null) {
      return `${fieldLabel} no cumple el largo mínimo requerido`
    }

    return `${fieldLabel} debe tener al menos ${String(minLength)} caracteres`
  },
  maxlength: (errorValue, fieldLabel) => {
    const maxLength = getNumericErrorProperty(errorValue, 'requiredLength')

    if (maxLength === null) {
      return `${fieldLabel} supera el largo máximo permitido`
    }

    return `${fieldLabel} debe tener como máximo ${String(maxLength)} caracteres`
  },
  min: (errorValue, fieldLabel) => {
    const min = getNumericErrorProperty(errorValue, 'min')

    if (min === null) {
      return `${fieldLabel} está por debajo del mínimo permitido`
    }

    return `${fieldLabel} debe ser mayor o igual a ${String(min)}`
  },
  max: (errorValue, fieldLabel) => {
    const max = getNumericErrorProperty(errorValue, 'max')

    if (max === null) {
      return `${fieldLabel} supera el máximo permitido`
    }

    return `${fieldLabel} debe ser menor o igual a ${String(max)}`
  },
  pattern: () => 'El formato ingresado no es válido',
}

export function getValidationErrorMessage(
  control: AbstractControl | null | undefined,
  fieldLabel: string,
  customMessages: Partial<Record<string, ErrorMessageResolver>> = {},
): string {
  if (!control?.errors) {
    return ''
  }

  const errors = control.errors
  const firstErrorKey = Object.keys(errors)[0]

  if (!firstErrorKey) {
    return ''
  }

  const messageResolver = customMessages[firstErrorKey] ?? DEFAULT_VALIDATION_MESSAGES[firstErrorKey]

  if (messageResolver) {
    return messageResolver(errors[firstErrorKey], fieldLabel)
  }

  return `${fieldLabel} no es válido`
}

function getNumericErrorProperty(errorValue: unknown, property: string): number | null {
  if (!errorValue || typeof errorValue !== 'object') {
    return null
  }

  const value = (errorValue as Record<string, unknown>)[property]

  return typeof value === 'number' ? value : null
}
