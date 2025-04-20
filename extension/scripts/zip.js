import fs from "fs"
import archiver from "archiver"
import { createRequire } from "module"
import { resolve } from "path"

const browser = process.env.BROWSER || "chrome"
const outdir = resolve(import.meta.dirname, `../dist/${browser}`)

const require = createRequire(import.meta.url)
const manifest = require(resolve(outdir, "manifest.json"))
const fileName = `web-mcp-${browser}-${manifest.version}.zip`
const output = fs.createWriteStream(`package/${fileName}`)
const archive = archiver("zip", {
  zlib: { level: 9 },
})

// listen for all archive data to be written
// 'close' event is fired only when a file descriptor is involved
output.on("close", function () {
  console.log(archive.pointer() + " total bytes")
  console.log(
    "archiver has been finalized and the output file descriptor has closed."
  )
})

// This event is fired when the data source is drained no matter what was the data source.
// It is not part of this library but rather from the NodeJS Stream API.
// @see: https://nodejs.org/api/stream.html#stream_event_end
output.on("end", function () {
  console.log("Data has been drained")
})

// good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on("warning", function (err) {
  if (err.code === "ENOENT") {
    // log warning
    console.warn(err)
  } else {
    // throw error
    throw err
  }
})

// good practice to catch this error explicitly
archive.on("error", function (err) {
  throw err
})

// fs.rmSync("dist/.vite", { recursive: true })

archive.pipe(output)
archive.directory(outdir, false)

// finalize the archive (ie we are done appending files but streams have to finish yet)
// 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
archive.finalize()
