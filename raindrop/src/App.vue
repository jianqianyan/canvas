<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 获取canvas画布
const canvas = ref<HTMLCanvasElement | null>(null)

/** canvas实体对象 */
let particleCanvas = ref<ParticleCanvas>()

// 获取上下文
let context = ref<CanvasRenderingContext2D | null>(null)

// 重力
let gravity = 0.8
let speedx = 0
let maxspeedx = 0
// 鼠标重力范围
let mouseDis = 35
// 每次加入的雨滴数量
let lineNum = 3

// 雨滴类
class line {
  speed: number
  die: boolean
  posx: number
  posy: number
  h: number
  color: string
  constructor(e: number) {
    let temp = 0.25 * (50 + Math.random() * 100)
    this.speed = 5.5 * (Math.random() * 6 + 3)
    this.die = false
    this.posx = e
    this.posy = -50
    this.h = temp
    this.color = 'rgb(255,255,255)'
  }
}
// 水珠类
class drop {
  posx: number
  posy: number
  vx: number
  vy: number
  radius: number
  die: boolean
  constructor(x: number, y: number, vx: number, vy: number) {
    this.posx = x
    this.posy = y
    this.vx = vx
    this.vy = vy
    this.radius = Math.random() * 1.5 + 1
    this.die = false
  }
}
// 画布类
class ParticleCanvas {
  canvasEle: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  backgroundColor: string
  dropList: drop[]
  lineList: line[]
  mouseX: number
  mouseY: number
  constructor(target: HTMLCanvasElement) {
    this.canvasEle = target
    this.ctx = target.getContext('2d') as CanvasRenderingContext2D
    this.backgroundColor = '#000'
    this.dropList = []
    this.lineList = []
    this.mouseX = 0
    this.mouseY = 0
    this.canvasEle.width = this.canvasEle.clientWidth
    this.canvasEle.height = this.canvasEle.clientHeight
    this.canvasEle.addEventListener('mousemove', (e) => {
      const { left, top } = this.canvasEle.getBoundingClientRect()
      const { clientX, clientY } = e
      this.mouseX = clientX - left
      this.mouseY = clientY - top
      maxspeedx = (this.mouseX - this.canvasEle.clientWidth / 2) / (this.canvasEle.clientWidth / 2)
    })
    this.canvasEle.onmouseleave = () => {
      this.mouseX = 0
      this.mouseY = 0
    }
  }
  drawCanvas() {
    // 对已经存在的水珠进行更新
    if (this.dropList.length > 0) {
      this.dropList.map((drop) => {
        drop.vx = drop.vx + speedx / 2
        drop.posx = drop.posx + drop.vx

        drop.vy = drop.vy + gravity
        drop.posy = drop.posy + drop.vy

        let dis = Math.sqrt((drop.posx - this.mouseX) ** 2 + (drop.posy - this.mouseY) ** 2)
        if (dis <= mouseDis) {
          let angle = Math.atan2(this.mouseX - drop.posy, this.mouseY - drop.posy)
          let force = 1 - dis / 100
          drop.vx = -Math.cos(angle) * force * 10 * gravity * 10
          if (drop.vx > 0) drop.vx += 3
          else drop.vx -= 3
          drop.vy = -Math.sin(angle) * force * 10 * gravity * 10
        }
        if (drop.posy > this.canvasEle.clientHeight) {
          drop.die = true
        }
      })
    }
    // 删除飞出屏幕的水珠
    for (let i = this.dropList.length - 1; i >= 0; --i) {
      if (this.dropList[i].die) {
        this.dropList.splice(i, 1)
      }
    }
    speedx = speedx + (maxspeedx - speedx) / 50
    for (let i = 0; i < lineNum; ++i) {
      this.lineList.push(
        new line(Math.random() * 2 * this.canvasEle.width - 0.5 * this.canvasEle.width)
      )
    }
    let endLine = this.canvasEle.clientHeight - (Math.random() * this.canvasEle.clientHeight) / 5
    // 对已经存在的雨滴进行更新
    this.lineList.map((line) => {
      let dis = Math.sqrt(
        (line.posx + speedx * line.h - this.mouseX) ** 2 + (line.posy + line.h - this.mouseY) ** 2
      )
      if (dis < mouseDis) {
        line.die = true
        let angle = Math.atan2(this.mouseY - line.posy, this.mouseX - line.posx)
        let force = 1 - dis / 100
        let vx = -Math.cos(angle) * force * 10 * gravity * 10
        let vy = -Math.sin(angle) * force * 10 * gravity * 10
        let maxi = Math.floor(Math.random() * 5 + 5)
        for (let i = 0; i < maxi; ++i) {
          this.dropList.push(new drop(line.posx + speedx * line.h, line.posy + line.h, vx, vy))
        }
      }
      if (line.posy + line.h > endLine) {
        line.die = true
        this.dropList.push(
          new drop(
            line.posx + speedx * line.h,
            line.posy + line.h,
            (Math.random() - 0.5) * 8,
            Math.random() * -6 - 3
          )
        )
      }
      if (line.posy >= this.canvasEle.clientHeight) {
        line.die = true
      } else {
        line.posx = line.posx + line.speed * speedx
        line.posy = line.posy + line.speed
      }
    })
    // 删除飞出屏幕的雨滴
    for (let i = this.lineList.length - 1; i >= 0; --i) {
      if (this.lineList[i].die) {
        this.lineList.splice(i, 1)
      }
    }
    this.ctx.save()
    this.ctx.fillStyle = this.backgroundColor
    this.ctx.fillRect(0, 0, this.canvasEle.width, this.canvasEle.height)
    this.ctx.restore()
    // 绘制雨滴
    this.lineList.map((line) => {
      this.ctx.save()
      this.ctx.strokeStyle = line.color
      this.ctx.beginPath()
      this.ctx.moveTo(line.posx, line.posy)
      this.ctx.lineTo(line.posx + line.h * speedx, line.posy + line.h)
      this.ctx.stroke()
      this.ctx.restore()
    })
    // 绘制水珠
    this.ctx.save()
    this.ctx.lineWidth = 1
    this.ctx.strokeStyle = '#fff'
    this.dropList.map((drop) => {
      this.ctx.beginPath()
      this.ctx.arc(drop.posx, drop.posy, drop.radius, Math.random() * Math.PI * 2, 1 * Math.PI)
      this.ctx.stroke()
    })
    this.ctx.restore()
    window.requestAnimationFrame(() => this.drawCanvas())
  }
}

onMounted(() => {
  if (canvas.value) {
    context.value = canvas.value.getContext('2d')
    particleCanvas.value = new ParticleCanvas(canvas.value)
    particleCanvas.value.drawCanvas()
  }
})
</script>

<template>
  <div class="canvas-box">
    <canvas id="canvas" ref="canvas" style="position: absolute; height: 100%; width: 100%"></canvas>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
}
.canvas-box {
  width: 1000px;
  height: 600px;
}
</style>
