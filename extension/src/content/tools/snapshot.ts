import {
  getRole,
  isDisabled,
  computeAccessibleName,
  computeAccessibleDescription,
  isInaccessible,
  isSubtreeInaccessible,
} from "dom-accessibility-api"

const idMap: Map<string, Element> = new Map()

export async function snapshot(node: Element) {
  const t0 = Date.now()
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT)

  let current = node
  let count = 0
  while (current) {
    if (count++ % 300 == 0) {
      await new Promise((r) => requestAnimationFrame(r))
    }

    const inaccessible = isInaccessible(current)
    const subtreeInaccessible = isSubtreeInaccessible(current)
    const disabled = isDisabled(current)

    const a11y = current.__a11y
    const id = a11y?.id || generateId()
    current.__a11y = {
      id: id,
      role: getRole(current),
      name: computeAccessibleName(current),
      // desc: computeAccessibleDescription(current),
      disabled,
      inaccessible,
      subtreeInaccessible,
    }

    idMap.set(id, current)

    if (inaccessible || subtreeInaccessible) {
      current = (walker.nextSibling() || walker.nextNode()) as Element
      continue
    }

    current = walker.nextNode() as Element
  }

  console.log("snapshot: ", node, Date.now() - t0)

  const t1 = Date.now()
  const html = accessibleHtml(node)

  console.log("html: ", html, Date.now() - t1)

  return html
}

function accessibleHtml(node: Node): string {
  if (node.nodeType != node.ELEMENT_NODE) {
    return node.textContent.trim()
  }

  if (node.nodeName == "NOSCRIPT") {
    return ""
  }

  const el = node as Element
  const { inaccessible, subtreeInaccessible, role, name } = el.__a11y || {}

  // const inaccessible = isInaccessible(el)
  // const subtreeInaccessible = isSubtreeInaccessible(el)
  if (inaccessible || subtreeInaccessible) {
    return ""
  }

  // const role = getRole(el)
  // const name = computeAccessibleName(el)
  const innerHtml = accessibleInnerHtml(el)

  if (role || name) {
    const tag = node.nodeName.toLowerCase()
    const attrs = attributes(el, innerHtml)
    return `<${tag}${attrs ? ` ${attrs} ` : ""}>${innerHtml || name}</${tag}>`
  }
  return innerHtml
}

function attributes(el: Element, innerHtml: string) {
  const { nodeName } = el
  const { id, name } = el.__a11y || {}

  const attrs: Record<string, string> = {
    id: id,
  }

  switch (nodeName) {
    case "A":
      // attrs.href = el.getAttribute("href")
      break
  }

  return Object.entries(attrs)
    .filter(([k, v]) => v)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ")
}

function accessibleInnerHtml(node: Node): string {
  if (node.nodeType != node.ELEMENT_NODE) {
    return node.textContent.trim()
  }

  return Array.from(node.childNodes)
    .map((n) => accessibleHtml(n))
    .join("")
}

let id = 0

function generateId() {
  id++
  return `:${id.toString(36)}`
}

export function querySelector(selector: string) {
  if (!selector) return null

  if (selector.match(/^#.+$/)) {
    const id = selector.slice(1)
    return idMap.get(id)
  }
  throw Error("Not supported yet")
}
