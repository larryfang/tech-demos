import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { findFfmpeg } from "./deps"

const FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

const PREVIEWS = [
  {
    file: "launch-teaser.mp4",
    color: "0x0b1c33",
    text: "Launch teaser",
    width: 640,
    height: 360,
  },
  {
    file: "brand-film.mp4",
    color: "0x111111",
    text: "Brand film",
    width: 640,
    height: 360,
  },
  {
    file: "social-hook.mp4",
    color: "0x2a211c",
    text: "Social hook",
    width: 360,
    height: 640,
  },
]

function run(cmd: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit" })
    child.on("close", (code) => resolve(code ?? 1))
  })
}

const ffmpeg = findFfmpeg()
if (!ffmpeg) {
  console.log("ffmpeg not found — skipping fixture preview videos.")
  process.exit(0)
}

const outDir = path.join(process.cwd(), "public", "previews")
fs.mkdirSync(outDir, { recursive: true })

for (const item of PREVIEWS) {
  const dest = path.join(outDir, item.file)
  const size = `${item.width}x${item.height}`
  const code = await run(ffmpeg, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=${item.color}:s=${size}:d=1.2`,
    "-f",
    "lavfi",
    "-i",
    `testsrc=size=${size}:rate=12:duration=1.2`,
    "-filter_complex",
    `[1]format=yuva444p,colorchannelmixer=aa=0.16[ov];[0][ov]overlay,drawtext=fontfile=${FONT}:text='${item.text}':fontcolor=white:fontsize=28:x=(w-text_w)/2:y=(h-text_h)/2`,
    "-t",
    "1.2",
    "-pix_fmt",
    "yuv420p",
    "-an",
    dest,
  ])
  if (code !== 0) {
    console.error(`Failed to write ${item.file}`)
    process.exit(code)
  }
  console.log(`Wrote ${dest}`)
}
