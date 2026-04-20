"use client"

import { useEffect, useRef } from "react"

interface Node {
x: number
y: number
vx: number
vy: number
radius: number
pulse: number
pulseSpeed: number
type: "data" | "hub" | "micro"
}

interface Particle {
progress: number
speed: number
fromIdx: number
toIdx: number
opacity: number
}

const VIOLET = "109, 40, 217"
const VIOLET_LIGHT = "124, 58, 237"
const VIOLET_BRIGHT = "139, 92, 246"

export default function AnimatedBg() {
const canvasRef = useRef<HTMLCanvasElement | null>(null)

useEffect(() => {
const canvas = canvasRef.current
if (!canvas) return

```
const ctx = canvas.getContext("2d")
if (!ctx) return

let animId = 0
let nodes: Node[] = []
let particles: Particle[] = []
let w = 0
let h = 0

function resize() {
  const canvas = canvasRef.current
  if (!canvas) return

  w = canvas.offsetWidth
  h = canvas.offsetHeight
  canvas.width = w
  canvas.height = h
  init()
}

function init() {
  const nodeCount = Math.min(Math.floor((w * h) / 14000), 55)
  nodes = []

  for (let i = 0; i < nodeCount; i++) {
    const type: Node["type"] =
      i < 4 ? "hub" : i < nodeCount * 0.35 ? "data" : "micro"

    nodes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: type === "hub" ? 5 : type === "data" ? 3 : 1.5,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.012 + Math.random() * 0.018,
      type,
    })
  }

  particles = []
  for (let i = 0; i < 18; i++) spawnParticle()
}

function spawnParticle() {
  if (nodes.length < 2) return

  const from = Math.floor(Math.random() * nodes.length)
  let to = Math.floor(Math.random() * nodes.length)

  while (to === from) {
    to = Math.floor(Math.random() * nodes.length)
  }

  particles.push({
    progress: 0,
    speed: 0.003 + Math.random() * 0.004,
    fromIdx: from,
    toIdx: to,
    opacity: 0.6 + Math.random() * 0.4,
  })
}

function getConnection(a: Node, b: Node) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function draw(time: number) {
  ctx.clearRect(0, 0, w, h)

  const bg = ctx.createRadialGradient(
    w * 0.55,
    h * 0.35,
    0,
    w * 0.55,
    h * 0.35,
    Math.max(w, h) * 0.9
  )
  bg.addColorStop(0, "rgba(245, 240, 255, 1)")
  bg.addColorStop(0.5, "rgba(250, 248, 255, 1)")
  bg.addColorStop(1, "rgba(255, 255, 255, 1)")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const orb1 = ctx.createRadialGradient(
    w * 0.72,
    h * 0.25,
    0,
    w * 0.72,
    h * 0.25,
    w * 0.42
  )
  orb1.addColorStop(0, `rgba(${VIOLET_BRIGHT}, 0.13)`)
  orb1.addColorStop(1, `rgba(${VIOLET}, 0.0)`)
  ctx.fillStyle = orb1
  ctx.fillRect(0, 0, w, h)

  const orb2 = ctx.createRadialGradient(
    w * 0.12,
    h * 0.72,
    0,
    w * 0.12,
    h * 0.72,
    w * 0.32
  )
  orb2.addColorStop(0, `rgba(${VIOLET_LIGHT}, 0.10)`)
  orb2.addColorStop(1, `rgba(${VIOLET}, 0.0)`)
  ctx.fillStyle = orb2
  ctx.fillRect(0, 0, w, h)

  for (const n of nodes) {
    n.x += n.vx
    n.y += n.vy
    n.pulse += n.pulseSpeed

    if (n.x < 0 || n.x > w) n.vx *= -1
    if (n.y < 0 || n.y > h) n.vy *= -1
  }

  const maxDist = w < 768 ? 160 : 220

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = getConnection(nodes[i], nodes[j])

      if (dist < maxDist) {
        const alpha = (1 - dist / maxDist) * 0.18
        ctx.beginPath()
        ctx.strokeStyle = `rgba(${VIOLET}, ${alpha})`
        ctx.lineWidth =
          nodes[i].type === "hub" || nodes[j].type === "hub" ? 1 : 0.5
        ctx.moveTo(nodes[i].x, nodes[i].y)
        ctx.lineTo(nodes[j].x, nodes[j].y)
        ctx.stroke()
      }
    }
  }

  for (const n of nodes) {
    const pulseScale = 1 + Math.sin(n.pulse) * 0.25
    const r = n.radius * pulseScale

    ctx.beginPath()
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2)

    if (n.type === "hub") {
      ctx.fillStyle = `rgba(${VIOLET}, 1)`
    } else if (n.type === "data") {
      ctx.fillStyle = `rgba(${VIOLET_LIGHT}, 0.95)`
    } else {
      ctx.fillStyle = `rgba(${VIOLET}, 0.4)`
    }

    ctx.fill()
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.progress += p.speed

    const from = nodes[p.fromIdx]
    const to = nodes[p.toIdx]

    if (!from || !to) {
      particles.splice(i, 1)
      continue
    }

    const px = from.x + (to.x - from.x) * p.progress
    const py = from.y + (to.y - from.y) * p.progress

    ctx.beginPath()
    ctx.arc(px, py, 3, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${VIOLET_BRIGHT}, ${p.opacity})`
    ctx.fill()

    if (p.progress >= 1) {
      particles.splice(i, 1)
      spawnParticle()
    }
  }

  animId = requestAnimationFrame(draw)
}

resize()

const ro = new ResizeObserver(() => resize())
ro.observe(canvas)

animId = requestAnimationFrame(draw)

return () => {
  cancelAnimationFrame(animId)
  ro.disconnect()
}
```

}, [])

return ( <canvas
   ref={canvasRef}
   className="absolute inset-0 w-full h-full"
 />
)
}
