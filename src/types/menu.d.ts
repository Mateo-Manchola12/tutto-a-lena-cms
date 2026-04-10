interface MenuItem {
  id: string
  name: string
  description: string
  price?: number
  ingredients: string[]
  tags: MenuTag['id'][]
}

interface MenuTag {
  id: string
  name: string
  emoji: string
}

interface MenuCategory {
  id: string
  name: string
  emoji: string
  description: string
  products: MenuItem[]
}

interface Menu {
  id: string
  categories: MenuCategory[]
  tags: MenuTag[]
}
