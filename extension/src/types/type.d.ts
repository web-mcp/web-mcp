interface Element {
  __a11y?: {
    id: string
    inaccessible: boolean
    subtreeInaccessible: boolean
    role: string
    name: string
    disabled: boolean
  }
}

declare module "syn" {
  const click: (el: Element) => void
  const dblclick: (el: Element) => void
  const type: (el: Element, text: string) => void
  const key: (el: Element, key: string) => void
}
