import { defineConfig } from "tsup"

export default defineConfig({
  dts: true,
  external: [],
  format: ["esm"],
  noExternal: ["syn"],
})
