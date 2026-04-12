import { Injectable } from '@angular/core'
import { environment } from '../../environments/environment'

export interface PlaceSuggestion {
  placeId: string
  primaryText: string
  secondaryText: string
  fullText: string
}

export interface PlaceDetails {
  label: string
  placeId: string
  coordinates: {
    lat: number
    lng: number
  }
  googleMapsUrl: string
  validatedAt: string
}

interface AutocompleteApiResponse {
  suggestions?: {
    placePrediction?: {
      placeId?: string
      text?: { text?: string }
      structuredFormat?: {
        mainText?: { text?: string }
        secondaryText?: { text?: string }
      }
    }
  }[]
}

interface PlaceDetailsApiResponse {
  id?: string
  formattedAddress?: string
  location?: {
    latitude?: number
    longitude?: number
  }
  googleMapsUri?: string
}

@Injectable({
  providedIn: 'root',
})
export class GooglePlacesService {
  private readonly apiKey = environment.googleMaps.apiKey
  private readonly countryCode = environment.googleMaps.countryCode

  async autocomplete(input: string): Promise<PlaceSuggestion[]> {
    const query = input.trim()

    if (query.length < 3) {
      return []
    }

    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': [
          'suggestions.placePrediction.placeId',
          'suggestions.placePrediction.text.text',
          'suggestions.placePrediction.structuredFormat.mainText.text',
          'suggestions.placePrediction.structuredFormat.secondaryText.text',
        ].join(','),
      },
      body: JSON.stringify({
        input: query,
        includedRegionCodes: [this.countryCode],
        languageCode: 'es',
        regionCode: this.countryCode,
      }),
    })

    if (!response.ok) {
      throw new Error('No se pudieron obtener sugerencias de ubicación desde Google Maps.')
    }

    const data = (await response.json()) as AutocompleteApiResponse

    return (data.suggestions ?? [])
      .map((suggestion) => suggestion.placePrediction)
      .filter((prediction): prediction is NonNullable<typeof prediction> => Boolean(prediction?.placeId))
      .map((prediction) => ({
        placeId: prediction.placeId ?? '',
        primaryText: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? '',
        secondaryText: prediction.structuredFormat?.secondaryText?.text ?? '',
        fullText: prediction.text?.text ?? prediction.structuredFormat?.mainText?.text ?? '',
      }))
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'id,formattedAddress,location,googleMapsUri',
      },
    })

    if (!response.ok) {
      throw new Error('No se pudo validar la ubicación seleccionada.')
    }

    const data = (await response.json()) as PlaceDetailsApiResponse
    const lat = data.location?.latitude
    const lng = data.location?.longitude

    if (!data.id || !data.formattedAddress || lat == null || lng == null || !data.googleMapsUri) {
      throw new Error('Google Maps devolvió una ubicación incompleta. Prueba con otra opción.')
    }

    return {
      label: data.formattedAddress,
      placeId: data.id,
      coordinates: {
        lat,
        lng,
      },
      googleMapsUrl: data.googleMapsUri,
      validatedAt: new Date().toISOString(),
    }
  }
}
