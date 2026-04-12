export interface GalleryImageSpan {
  default: 1 | 2
  sm: 1 | 2
  md: 1 | 2
}

export interface GalleryImage {
  id: string
  /** URL pública (Storage download URL o path local como /images/...) */
  src: string
  /** Ruta en Firebase Storage (vacío '' para imágenes demo sin Storage) */
  storagePath: string
  alt: string
  description: string
  colSpan: GalleryImageSpan
  rowSpan: GalleryImageSpan
  /** Rotación en grados (−3 a +3), asignada aleatoriamente al crear */
  rotate: number
  featured: boolean
  order: number
}

export interface GalleryDocument {
  images: GalleryImage[]
}
