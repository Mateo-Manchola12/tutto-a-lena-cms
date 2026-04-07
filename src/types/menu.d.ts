interface MenuItem {
  id: string
  name: string
  description: string
  price?: number
  category: MenuCategory
  image?: string
  ingredients?: string[]
  tags?: MenuTag[]
}

interface MenuTag {
  name: string
  label: string
  emoji: string
}

interface MenuCategory {
  name: string
  label: string
  emoji: string
  description: string
}
