import syn from "syn"
import { querySelector, snapshot } from "./snapshot"
import { TextResult } from "@/utils/tools"

export async function page_snapshot(selector?: string) {
  const el = querySelector(selector) || document.body
  const html = await snapshot(el)
  return TextResult(html)
}

export async function click(selector: string) {
  const el = querySelector(selector)
  syn.click(el)
  return TextResult("done")
}

export async function dblclick(selector: string) {
  const el = querySelector(selector)
  syn.dblclick(el)
  return TextResult("done")
}

export async function type(selector: string, text: string) {
  const el = querySelector(selector)
  syn.type(el, text)
  return TextResult("done")
}

export async function press_key(selector: string, key: string) {
  const el = querySelector(selector)
  syn.key(el, key)
  return TextResult("done")
}
