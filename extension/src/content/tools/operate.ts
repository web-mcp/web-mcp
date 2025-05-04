import { createSyn } from "@web-mcp/syn"
import { queryRef, snapshot } from "./snapshot"
import { TextResult } from "@/utils/tools"

let syn: ReturnType<typeof createSyn>
export function getSyn(): typeof syn {
  if (!syn) {
    syn = createSyn()
  }
  return syn
}

export async function page_snapshot(ref?: string) {
  const el = queryRef(ref) || document.body
  const html = await snapshot(el)
  return TextResult(html)
}

export async function click(ref: string) {
  const syn = getSyn()
  const el = queryRef(ref)
  syn.click(el)
  return TextResult("done")
}

export async function dblclick(ref: string) {
  const syn = getSyn()
  const el = queryRef(ref)
  syn.dblclick(el)
  return TextResult("done")
}

export async function type(ref: string, text: string) {
  const syn = getSyn()
  const el = queryRef(ref)

  let node = el as HTMLElement
  // while (node.childElementCount == 1) {
  //   const child = node.firstElementChild as HTMLElement
  //   if (child.isContentEditable && child.nodeName !== "BR") {
  //     node = child
  //     continue
  //   }
  //   break
  // }

  // const value = node.contentEditable
  // node.contentEditable = "true"
  syn.type(node, text)
  // node.contentEditable = value
  return TextResult("done")
}

export async function press_key(ref: string, key: string) {
  const syn = getSyn()
  const el = queryRef(ref)
  syn.key(el, key)
  return TextResult("done")
}
