import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core'
import type { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors } from '@angular/forms'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'
import type { EventEntry, EventsDocument } from '../../types/events'
import { EventsService } from '../services/events.service'

type EventFormGroup = FormGroup<{
  id: FormControl<string>
  title: FormControl<string>
  description: FormControl<string>
  date: FormControl<string>
  startTime: FormControl<string>
  endTime: FormControl<string>
  location: FormControl<string>
  featured: FormControl<boolean>
  ctaLabel: FormControl<string>
  ctaUrl: FormControl<string>
}>

type EventsPageFormGroup = FormGroup<{
  events: FormArray<EventFormGroup>
}>

@Component({
  selector: 'app-events',
  template: `
    @if (eventsService.loading()) {
      <div class="flex h-full w-full items-center justify-center">
        <div
          class="border-primary border-r-primary-active size-20 animate-spin rounded-full border-4 border-t-transparent"
        ></div>
      </div>
    } @else if (eventsService.eventsData()) {
      <form class="relative mx-auto flex max-w-7xl flex-col gap-6 pb-10" [formGroup]="form">
        <div
          class="from-primary/10 absolute inset-0 -z-10 rounded-3xl bg-linear-to-br via-transparent to-transparent blur-3xl"
        ></div>

        <header
          class="from-surface-light to-surface/80 rounded-2xl border border-white/10 bg-linear-to-br p-6 shadow-xl"
        >
          <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-2">
              <h1 class="font-display text-3xl leading-tight font-bold lg:text-4xl">Eventos</h1>
              <p class="text-muted-foreground max-w-2xl text-sm">
                Gestiona eventos itinerantes, fechas, ubicaciones y CTA desde el CMS para que el front publique la
                versión más reciente desde Firestore.
              </p>
            </div>

            <div class="flex items-center gap-3">
              <span
                class="bg-primary/15 text-primary border-primary/30 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
              >
                @if (form.dirty && form.valid) {
                  <i class="mat-icon mr-1 text-sm leading-none">check_circle</i>
                  Borrador listo
                } @else if (form.dirty && form.invalid) {
                  <i class="mat-icon mr-1 text-sm leading-none">error</i>
                  Hay errores en el formulario
                } @else {
                  <i class="mat-icon mr-1 text-sm leading-none">check</i>
                  Sin cambios por guardar
                }
              </span>

              <button class="button min-w-44" type="button" (click)="onSave()" [disabled]="!form.dirty || form.invalid">
                Guardar Cambios
              </button>
            </div>
          </div>
        </header>

        <section class="from-surface-light to-surface rounded-2xl border border-white/10 bg-linear-to-b p-5 shadow-lg">
          <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-1">
              <h2 class="text-2xl font-bold">Listado de eventos</h2>
              <p class="text-muted-foreground text-sm">
                Cada guardado genera un nuevo borrador versionado en Firestore y el front lo publicará cuando lances el
                build.
              </p>
            </div>

            <button class="button" type="button" (click)="onAddEvent()">Nuevo evento</button>
          </div>

          @if (!eventControls().length) {
            <div
              class="bg-surface-dark/50 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 p-10 text-center"
            >
              <i class="mat-icon text-primary text-5xl">event_available</i>
              <div class="space-y-1">
                <h3 class="text-xl font-semibold">No hay eventos cargados</h3>
                <p class="text-muted-foreground max-w-lg text-sm">
                  Crea el primer evento para que la landing pueda renderizarlo desde la base de datos.
                </p>
              </div>
            </div>
          } @else {
            <mat-accordion class="w-full space-y-4">
              @for (eventGroup of eventControls(); track eventGroup.controls.id.value; let index = $index) {
                <mat-expansion-panel
                  [expanded]="expandedEventId() === eventGroup.controls.id.value"
                  (opened)="expandedEventId.set(eventGroup.controls.id.value)"
                  (closed)="onPanelClosed(eventGroup.controls.id.value)"
                >
                  <mat-expansion-panel-header>
                    <mat-panel-title>{{ eventGroup.controls.title.value || 'Nuevo evento' }}</mat-panel-title>
                    <mat-panel-description>
                      {{ eventGroup.controls.date.value || 'Sin fecha' }} ·
                      {{ eventGroup.controls.location.value || 'Sin ubicación' }}
                    </mat-panel-description>
                    <button
                      type="button"
                      class="m-2 flex cursor-pointer items-center justify-center rounded-md p-1 text-red-400 hover:bg-red-500/10"
                      aria-label="Eliminar evento"
                      (click)="$event.stopPropagation(); onDeleteEvent(index)"
                    >
                      <i class="mat-icon">delete</i>
                    </button>
                  </mat-expansion-panel-header>

                  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2" [formGroup]="eventGroup">
                    <mat-form-field class="xl:col-span-2">
                      <mat-label>Título</mat-label>
                      <input matInput formControlName="title" placeholder="Noche de vinos italianos" />
                    </mat-form-field>

                    <mat-form-field class="xl:col-span-2">
                      <mat-label>Descripción</mat-label>
                      <textarea
                        matInput
                        formControlName="description"
                        rows="4"
                        placeholder="Describe la experiencia, el formato y el valor del evento"
                      ></textarea>
                    </mat-form-field>

                    <mat-form-field>
                      <mat-label>Fecha</mat-label>
                      <input matInput type="date" formControlName="date" />
                    </mat-form-field>

                    <mat-form-field>
                      <mat-label>Ubicación</mat-label>
                      <input matInput formControlName="location" placeholder="Restaurante X, Alicante" />
                    </mat-form-field>

                    <mat-form-field>
                      <mat-label>Hora de inicio</mat-label>
                      <input matInput type="time" formControlName="startTime" />
                    </mat-form-field>

                    <mat-form-field>
                      <mat-label>Hora de fin</mat-label>
                      <input matInput type="time" formControlName="endTime" />
                    </mat-form-field>

                    <mat-form-field>
                      <mat-label>Texto del CTA</mat-label>
                      <input matInput formControlName="ctaLabel" placeholder="Reservar plaza" />
                    </mat-form-field>

                    <mat-form-field>
                      <mat-label>URL del CTA</mat-label>
                      <input matInput formControlName="ctaUrl" placeholder="/contacto o https://..." />
                    </mat-form-field>

                    <div class="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 xl:col-span-2">
                      <label class="flex items-center gap-3 text-sm font-medium">
                        <input type="checkbox" [formControl]="eventGroup.controls.featured" />
                        Mostrar como evento destacado
                      </label>

                      @if (eventGroup.hasError('ctaIncomplete')) {
                        <p class="text-sm text-amber-300">Completa ambos campos del CTA o déjalos vacíos.</p>
                      }

                      @if (eventGroup.hasError('invalidTimeRange')) {
                        <p class="text-sm text-amber-300">La hora de fin debe ser posterior a la hora de inicio.</p>
                      }
                    </div>
                  </div>
                </mat-expansion-panel>
              }
            </mat-accordion>
          }
        </section>
      </form>
    }
  `,
  imports: [ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {
  readonly eventsService = inject(EventsService)
  private readonly formBuilder = inject(FormBuilder)
  private readonly snackbar = inject(MatSnackBar)
  readonly expandedEventId = signal<string | null>(null)

  readonly form: EventsPageFormGroup = this.formBuilder.group({
    events: this.formBuilder.array<EventFormGroup>([]),
  })

  constructor() {
    effect(() => {
      const eventsData = this.eventsService.eventsData()

      if (!eventsData) {
        return
      }

      this.buildForm(eventsData)
    })
  }

  eventControls() {
    return this.form.controls.events.controls
  }

  onAddEvent() {
    const nextGroup = this.createEventGroup(this.getEmptyEvent())
    this.form.controls.events.push(nextGroup)
    this.expandedEventId.set(nextGroup.controls.id.value)
    this.form.markAsDirty()
  }

  onDeleteEvent(index: number) {
    this.form.controls.events.removeAt(index)
    this.form.markAsDirty()

    if (!this.form.controls.events.length) {
      this.expandedEventId.set(null)
    }
  }

  onPanelClosed(id: string) {
    if (this.expandedEventId() === id) {
      this.expandedEventId.set(null)
    }
  }

  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      this.snackbar.open('Corrige los errores del formulario antes de guardar', 'Cerrar', {
        duration: 4000,
      })
      return
    }

    const updatedData: EventsDocument = {
      events: this.form.controls.events.getRawValue().map((event) => this.normalizeEvent(event)),
    }

    this.eventsService
      .saveEventsData(updatedData)
      .then(() => {
        this.form.markAsPristine()
        this.snackbar.open('Eventos actualizados exitosamente', 'Cerrar', {
          duration: 3000,
        })
      })
      .catch((error: unknown) => {
        this.snackbar.open((error as Error).message || 'Error al guardar los eventos', 'Cerrar', {
          duration: 5000,
        })
      })
  }

  private buildForm(data: EventsDocument) {
    this.form.controls.events.clear()

    for (const event of data.events) {
      this.form.controls.events.push(this.createEventGroup(event))
    }

    this.expandedEventId.set(
      this.form.controls.events.length ? this.form.controls.events.at(0).controls.id.value : null,
    )
    this.form.markAsPristine()
  }

  private createEventGroup(event: EventEntry): EventFormGroup {
    return this.formBuilder.nonNullable.group(
      {
        id: this.formBuilder.nonNullable.control(event.id),
        title: this.formBuilder.nonNullable.control(event.title, [Validators.required, Validators.maxLength(120)]),
        description: this.formBuilder.nonNullable.control(event.description, [
          Validators.required,
          Validators.maxLength(600),
        ]),
        date: this.formBuilder.nonNullable.control(event.date, [Validators.required]),
        startTime: this.formBuilder.nonNullable.control(event.startTime, [Validators.required]),
        endTime: this.formBuilder.nonNullable.control(event.endTime ?? ''),
        location: this.formBuilder.nonNullable.control(event.location, [
          Validators.required,
          Validators.maxLength(160),
        ]),
        featured: this.formBuilder.nonNullable.control(event.featured),
        ctaLabel: this.formBuilder.nonNullable.control(event.cta?.label ?? ''),
        ctaUrl: this.formBuilder.nonNullable.control(event.cta?.url ?? ''),
      },
      {
        validators: [ctaPairValidator, timeRangeValidator],
      },
    )
  }

  private getEmptyEvent(): EventEntry {
    return {
      id: this.generateId(),
      title: '',
      description: '',
      date: this.getTodayDate(),
      startTime: '19:00',
      location: '',
      featured: false,
    }
  }

  private normalizeEvent(event: EventFormGroup['getRawValue'] extends () => infer TValue ? TValue : never): EventEntry {
    const title = event.title.trim()
    const description = event.description.trim()
    const location = event.location.trim()
    const endTime = event.endTime.trim()
    const ctaLabel = event.ctaLabel.trim()
    const ctaUrl = event.ctaUrl.trim()

    const normalizedEvent: EventEntry = {
      id: event.id,
      title,
      description,
      date: event.date,
      startTime: event.startTime,
      location,
      featured: event.featured,
    }

    if (endTime) {
      normalizedEvent.endTime = endTime
    }

    if (ctaLabel && ctaUrl) {
      normalizedEvent.cta = {
        label: ctaLabel,
        url: ctaUrl,
      }
    }

    return normalizedEvent
  }

  private generateId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return `event-${crypto.randomUUID().slice(0, 8)}`
    }

    return `event-${String(Date.now())}`
  }

  private getTodayDate() {
    return new Date().toISOString().slice(0, 10)
  }
}

function ctaPairValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as EventFormGroup
  const ctaLabel = group.controls.ctaLabel.value.trim()
  const ctaUrl = group.controls.ctaUrl.value.trim()

  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
    return { ctaIncomplete: true }
  }

  return null
}

function timeRangeValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as EventFormGroup
  const startTime = group.controls.startTime.value
  const endTime = group.controls.endTime.value

  if (!startTime || !endTime) {
    return null
  }

  if (endTime <= startTime) {
    return { invalidTimeRange: true }
  }

  return null
}
