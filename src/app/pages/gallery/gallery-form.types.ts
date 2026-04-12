import type { FormArray, FormControl, FormGroup } from '@angular/forms'

export type ActiveBreakpoint = 'default' | 'sm' | 'md'
export type SpanValue = 1 | 2

type SpanFormGroup = FormGroup<{
  default: FormControl<SpanValue>
  sm: FormControl<SpanValue>
  md: FormControl<SpanValue>
}>

export type GalleryImageFormGroup = FormGroup<{
  id: FormControl<string>
  src: FormControl<string>
  storagePath: FormControl<string>
  alt: FormControl<string>
  description: FormControl<string>
  colSpan: SpanFormGroup
  rowSpan: SpanFormGroup
  rotate: FormControl<number>
  featured: FormControl<boolean>
  order: FormControl<number>
}>

export type GalleryFormArray = FormArray<GalleryImageFormGroup>
