interface Syn {
  click: (el: Element) => void
  dblclick: (el: Element) => void
  type: (el: Element, text: string) => void
  key: (el: Element, key: string) => void
}

export function createSyn(): Syn {
  const syn = require("syn")
  return syn || (window as any).syn
}
