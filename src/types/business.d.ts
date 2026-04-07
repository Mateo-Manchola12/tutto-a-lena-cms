export interface Business {
  name: string
  description: string
  phone: {
    display: string
    href: string
    raw: string
  }
  email: {
    display: string
    href: string
  }
  whatsapp: {
    display: string
    href: string
    raw: string
  }
  hours: {
    Lunes: {
      open: string
      close: string
    }
    Martes: {
      open: string
      close: string
    }
    Miércoles: {
      open: string
      close: string
    }
    Jueves: {
      open: string
      close: string
    }
    Viernes: {
      open: string
      close: string
    }
    Sábado: {
      open: string
      close: string
    }
    Domingo: {
      open: string
      close: string
    }
  }
  website: {
    domain: string
    url: string
  }
  socialProfiles: string[]
  cta: {
    menu: string
    catering: string
    events: string
    contact: string
    location: string
    gallery: string
    home: string
    whatsappMessages: {
      default: string
      catering: string
      events: string
      general: string
      booking: string
      inquiry: string
    }
  }
  priceRange: string
  foundedYear: number
}
