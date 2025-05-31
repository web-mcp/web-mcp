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
    const isEditable = (current as HTMLElement).contentEditable == "true"

    const a11y = current.__a11y
    const id = a11y?.id || generateId()
    current.__a11y = {
      id: id,
      role: getRole(current) || (isEditable ? "textbox" : undefined),
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
  if (node.nodeName == "NOSCRIPT" || node.nodeName == "#comment") {
    return ""
  }

  if (node.nodeType != node.ELEMENT_NODE) {
    return node.textContent.trim()
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
  const { id, name, role } = el.__a11y || {}

  const attrs: Record<string, string> = {
    id: id,
  }

  switch (nodeName) {
    case "A":
      // attrs.href = el.getAttribute("href")
      break
    case "DIV":
      if (role == "textbox") {
        attrs["role"] = "textbox"
        attrs["aria-label"] = name
      } else if (role) {
        attrs["role"] = role
      }
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

export function queryRef(ref: string) {
  if (!ref) return null

  const id = ref.startsWith("#") ? ref.slice(1) : ref
  const el = idMap.get(id)
  if (el) {
    return el
  }

  const el2 = document.querySelector(ref)
  if (el2) {
    return el2
  }

  throw Error("Element not found: " + ref)
}
