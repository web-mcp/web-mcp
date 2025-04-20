import * as esbuild from "esbuild"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import fs from "fs-extra"
import { config } from "dotenv"
import chokidar from "chokidar"
import manifest, { browser } from "./src/manifest"
// const isWatch = process.argv.includes("--watch")
// const isToPublic = process.argv.includes("--public")

config()
const __DEV__ = process.env.NODE_ENV === "development"
const __FIREFOX__ = process.env.BROWSER === "firefox"

const workingDir = resolve(dirname(fileURLToPath(import.meta.url)))
const outdir = `./dist/${browser}`
const port = 5172

const ctx = await esbuild.context({
  absWorkingDir: resolve(dirname(fileURLToPath(import.meta.url))),
  entryPoints: {
    "js/bg": "./src/bg/index.ts",
    "js/content-main": "./src/content/main.ts",
    "js/content": "./src/content/index.tsx",
  },
  bundle: true,
  metafile: true,
  minify: __FIREFOX__ || __DEV__ ? false : true,
  format: "iife",
  outdir: outdir,
  alias: {
    "@": "./src/",
  },
  define: {
    __DEV__: JSON.stringify(__DEV__),
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
    "process.env.BROWSER": JSON.stringify(process.env.BROWSER || "chrome"),
    "process.env.GA_MEASUREMENT_ID": JSON.stringify(
      process.env.GA_MEASUREMENT_ID || ""
    ),
    "process.env.GA_API_SECRET": JSON.stringify(
      process.env.GA_API_SECRET || ""
    ),
  },
  pure: __DEV__ ? [] : ["console.log"],
})

if (__DEV__) {
  await ctx.watch()
  // chokidar.watch("./public/**").on("change", () => {
  //   fs.copy("./public/", "./dist/")
  // })
  await fs.copy("./public/", outdir)
  await stubHtml()
  console.log("Esbuild watching...")
} else {
  const result = await ctx.rebuild()
  ctx.dispose()

  await fs.mkdirp("./docs/report/")
  await fs.writeFile(
    "./docs/report/meta.json",
    JSON.stringify(result.metafile, null, 2)
  )
}

// await fs.copy("./public/", "./dist/")
await fs.outputFile(
  `${outdir}/manifest.json`,
  JSON.stringify(manifest, null, 2)
)

async function stubHtml() {
  const names = ["popup", "options", "offscreen", "dev"]
  for (const name of names) {
    let html = await fs.readFile("./" + name + ".html", "utf-8")
    html = html
      .replace(/\.\/src\//, `http://localhost:${port}/src/`)
      .replace(
        '<div id="app"></div>',
        '<div id="app">Vite server did not start</div>'
      )
      .replace(
        "<head>",
        `<head>
<script type="module" src="http://localhost:${port}/scripts/hmr.js"></script>
`
      )

    await fs.writeFile(`${outdir}/${name}.html`, html)
  }
}
