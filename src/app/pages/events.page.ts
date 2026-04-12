import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core'
import type { SafeResourceUrl } from '@angular/platform-browser'
import { DomSanitizer } from '@angular/platform-browser'
import type { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors } from '@angular/forms'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSnackBar } from '@angular/material/snack-bar'
import type { EventEntry, EventsDocument } from '../../types/events'
import type { PlaceSuggestion } from '../services/google-places.service'
import { GooglePlacesService } from '../services/google-places.service'
import { EventsService } from '../services/events.service'

type EventFormGroup = FormGroup<{
  id: FormControl<string>
  title: FormControl<string>
  description: FormControl<string>
  date: FormControl<string>
  startTime: FormControl<string>
  endTime: FormControl<string>
  locationQuery: FormControl<string>
  location: FormControl<string>
  locationPlaceId: FormControl<string>
  locationLat: FormControl<number | null>
  locationLng: FormControl<number | null>
  locationGoogleMapsUrl: FormControl<string>
  locationValidatedAt: FormControl<string>
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
                      <input
                        matInput
                        formControlName="locationQuery"
                        placeholder="Busca una dirección, ciudad o recinto en España"
                        [matAutocomplete]="locationAutocomplete"
                        (input)="onLocationQueryInput(eventGroup)"
                      />
                      <mat-autocomplete #locationAutocomplete="matAutocomplete" autoActiveFirstOption>
                        @for (
                          suggestion of getLocationSuggestions(eventGroup.controls.id.value);
                          track suggestion.placeId
                        ) {
                          <mat-option
                            [value]="suggestion.fullText"
                            (onSelectionChange)="
                              onLocationSuggestionChange($event.source.selected, eventGroup, suggestion)
                            "
                          >
                            <div class="flex flex-col py-1">
                              <span class="font-medium">{{ suggestion.primaryText }}</span>
                              @if (suggestion.secondaryText) {
                                <span class="text-muted-foreground text-xs">{{ suggestion.secondaryText }}</span>
                              }
                            </div>
                          </mat-option>
                        }
                      </mat-autocomplete>
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
                      <div class="flex flex-wrap items-center gap-3 text-sm">
                        @if (isSearchingLocation(eventGroup.controls.id.value)) {
                          <span class="text-primary">Buscando ubicaciones...</span>
                        } @else if (hasValidatedLocation(eventGroup)) {
                          <span
                            class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300"
                          >
                            Ubicación validada
                          </span>
                        } @else {
                          <span
                            class="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-300"
                          >
                            Debes seleccionar una sugerencia válida de Google Maps
                          </span>
                        }
                      </div>

                      @if (hasValidatedLocation(eventGroup)) {
                        <div class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                          <div class="space-y-2">
                            <p class="text-sm font-semibold">Dirección confirmada</p>
                            <p class="text-muted-foreground text-sm">{{ eventGroup.controls.location.value }}</p>
                            <a
                              class="text-primary text-sm font-semibold hover:underline"
                              [href]="eventGroup.controls.locationGoogleMapsUrl.value"
                              rel="noreferrer"
                              target="_blank"
                            >
                              Abrir en Google Maps
                            </a>
                          </div>

                          @if (getLocationEmbedUrl(eventGroup); as embedUrl) {
                            <iframe
                              class="min-h-52 w-full rounded-xl border border-white/10"
                              [src]="embedUrl"
                              loading="lazy"
                              referrerpolicy="no-referrer-when-downgrade"
                              title="Vista previa de la ubicación del evento"
                            ></iframe>
                          }
                        </div>
                      }

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

                      @if (eventGroup.hasError('locationNotValidated')) {
                        <p class="text-sm text-amber-300">
                          La ubicación debe seleccionarse desde las sugerencias de Google Maps antes de guardar.
                        </p>
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
  imports: [ReactiveFormsModule, MatAutocompleteModule, MatExpansionModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {
  readonly eventsService = inject(EventsService)
  private readonly formBuilder = inject(FormBuilder)
  private readonly googlePlaces = inject(GooglePlacesService)
  private readonly snackbar = inject(MatSnackBar)
  private readonly sanitizer = inject(DomSanitizer)
  readonly expandedEventId = signal<string | null>(null)
  readonly locationSuggestions = signal<Record<string, PlaceSuggestion[]>>({})
  readonly searchingLocations = signal<Record<string, boolean>>({})
  private readonly locationSearchTimers = new Map<string, ReturnType<typeof setTimeout>>()

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

  getLocationSuggestions(eventId: string) {
    return this.locationSuggestions()[eventId] ?? []
  }

  isSearchingLocation(eventId: string) {
    return this.searchingLocations()[eventId] ?? false
  }

  hasValidatedLocation(eventGroup: EventFormGroup) {
    return Boolean(
      eventGroup.controls.location.value.trim() &&
      eventGroup.controls.locationPlaceId.value.trim() &&
      eventGroup.controls.locationLat.value != null &&
      eventGroup.controls.locationLng.value != null &&
      eventGroup.controls.locationGoogleMapsUrl.value.trim(),
    )
  }

  getLocationEmbedUrl(eventGroup: EventFormGroup): SafeResourceUrl | null {
    const lat = eventGroup.controls.locationLat.value
    const lng = eventGroup.controls.locationLng.value

    if (lat == null || lng == null) {
      return null
    }

    const url = `https://www.google.com/maps?q=${String(lat)},${String(lng)}&z=15&output=embed`
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }

  onAddEvent() {
    const nextGroup = this.createEventGroup(this.getEmptyEvent())
    this.form.controls.events.push(nextGroup)
    this.expandedEventId.set(nextGroup.controls.id.value)
    this.form.markAsDirty()
  }

  onDeleteEvent(index: number) {
    const eventId = this.form.controls.events.at(index).controls.id.value
    this.form.controls.events.removeAt(index)
    this.form.markAsDirty()

    if (eventId) {
      this.clearLocationTimer(eventId)
      this.locationSuggestions.update((current) => ({ ...current, [eventId]: [] }))
      this.searchingLocations.update((current) => ({ ...current, [eventId]: false }))
    }

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

  onLocationQueryInput(eventGroup: EventFormGroup) {
    const eventId = eventGroup.controls.id.value
    const query = eventGroup.controls.locationQuery.value.trim()

    if (query !== eventGroup.controls.location.value) {
      this.clearValidatedLocation(eventGroup)
    }

    this.clearLocationTimer(eventId)

    if (query.length < 3) {
      this.locationSuggestions.update((current) => ({ ...current, [eventId]: [] }))
      this.searchingLocations.update((current) => ({ ...current, [eventId]: false }))
      return
    }

    this.searchingLocations.update((current) => ({ ...current, [eventId]: true }))

    const timer = setTimeout(() => {
      void this.googlePlaces
        .autocomplete(query)
        .then((suggestions) => {
          this.locationSuggestions.update((current) => ({ ...current, [eventId]: suggestions }))
        })
        .catch((error: unknown) => {
          this.locationSuggestions.update((current) => ({ ...current, [eventId]: [] }))
          this.snackbar.open((error as Error).message || 'No se pudo buscar la ubicación.', 'Cerrar', {
            duration: 4000,
          })
        })
        .finally(() => {
          this.searchingLocations.update((current) => ({ ...current, [eventId]: false }))
        })
    }, 300)

    this.locationSearchTimers.set(eventId, timer)
  }

  onLocationSuggestionChange(selected: boolean, eventGroup: EventFormGroup, suggestion: PlaceSuggestion) {
    if (!selected) {
      return
    }

    const eventId = eventGroup.controls.id.value
    this.searchingLocations.update((current) => ({ ...current, [eventId]: true }))

    void this.googlePlaces
      .getPlaceDetails(suggestion.placeId)
      .then((details) => {
        eventGroup.patchValue({
          locationQuery: details.label,
          location: details.label,
          locationPlaceId: details.placeId,
          locationLat: details.coordinates.lat,
          locationLng: details.coordinates.lng,
          locationGoogleMapsUrl: details.googleMapsUrl,
          locationValidatedAt: details.validatedAt,
        })
        this.locationSuggestions.update((current) => ({ ...current, [eventId]: [] }))
        eventGroup.markAsDirty()
      })
      .catch((error: unknown) => {
        this.clearValidatedLocation(eventGroup)
        this.snackbar.open((error as Error).message || 'No se pudo validar la ubicación.', 'Cerrar', {
          duration: 5000,
        })
      })
      .finally(() => {
        this.searchingLocations.update((current) => ({ ...current, [eventId]: false }))
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
    return this.formBuilder.group(
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
        locationQuery: this.formBuilder.nonNullable.control(event.location, [
          Validators.required,
          Validators.maxLength(160),
        ]),
        location: this.formBuilder.nonNullable.control(event.location),
        locationPlaceId: this.formBuilder.nonNullable.control(event.locationPlaceId ?? ''),
        locationLat: this.formBuilder.control(event.locationCoordinates?.lat ?? null),
        locationLng: this.formBuilder.control(event.locationCoordinates?.lng ?? null),
        locationGoogleMapsUrl: this.formBuilder.nonNullable.control(event.locationGoogleMapsUrl ?? ''),
        locationValidatedAt: this.formBuilder.nonNullable.control(event.locationValidatedAt ?? ''),
        featured: this.formBuilder.nonNullable.control(event.featured),
        ctaLabel: this.formBuilder.nonNullable.control(event.cta?.label ?? ''),
        ctaUrl: this.formBuilder.nonNullable.control(event.cta?.url ?? ''),
      },
      {
        validators: [ctaPairValidator, timeRangeValidator, locationValidationValidator],
      },
    ) as EventFormGroup
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
      locationPlaceId: event.locationPlaceId.trim(),
      locationGoogleMapsUrl: event.locationGoogleMapsUrl.trim(),
      locationValidatedAt: event.locationValidatedAt.trim(),
      featured: event.featured,
    }

    if (event.locationLat != null && event.locationLng != null) {
      normalizedEvent.locationCoordinates = {
        lat: event.locationLat,
        lng: event.locationLng,
      }
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

  private clearValidatedLocation(eventGroup: EventFormGroup) {
    eventGroup.patchValue(
      {
        location: '',
        locationPlaceId: '',
        locationLat: null,
        locationLng: null,
        locationGoogleMapsUrl: '',
        locationValidatedAt: '',
      },
      { emitEvent: false },
    )
  }

  private clearLocationTimer(eventId: string) {
    const timer = this.locationSearchTimers.get(eventId)

    if (timer) {
      clearTimeout(timer)
      this.locationSearchTimers.delete(eventId)
    }
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

function locationValidationValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as EventFormGroup
  const query = group.controls.locationQuery.value.trim()
  const location = group.controls.location.value.trim()
  const placeId = group.controls.locationPlaceId.value.trim()
  const mapsUrl = group.controls.locationGoogleMapsUrl.value.trim()
  const lat = group.controls.locationLat.value
  const lng = group.controls.locationLng.value

  if (!query) {
    return null
  }

  if (!location || !placeId || !mapsUrl || lat == null || lng == null) {
    return { locationNotValidated: true }
  }

  return null
}
