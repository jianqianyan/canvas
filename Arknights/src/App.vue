<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import kazimierz from './assets/logo-kazimierz.png'
import rhine from './assets/logo-rhine.png'
import rhodes from './assets/logo-rhodes.png'
import victoria from './assets/logo-victoria.png'
import yan from './assets/logo-yan.png'
const logoList = reactive([
  { label: 'kazimierz', url: kazimierz },
  { label: 'rhine', url: rhine },
  { label: 'rhodes', url: rhodes },
  { label: 'victoria', url: victoria },
  { label: 'yan', url: yan }
])

// 设置画布大小
const width = 400,
  height = 400

// 设置粒子动画时长
const animateTime = 30
const opacityStep = 1 / animateTime

/** 中心影响的半径 */
const Radius = 40

/** 排斥/吸引 力度 */
const Inten = 0.95

// 获取canvas画布
const canvas = ref<HTMLCanvasElement | null>(null)

/** canvas实体对象 */
let particleCanvas = ref<ParticleCanvas>()

// 获取上下文
let context = ref<CanvasRenderingContext2D | null>(null)

// 标记激活logo
let activeLogo = ref<{ name: string; src: string }>()

/** 存储由logos生成的logoImg对象 */
const logoImgs = reactive<LogoImg[]>([])

// 粒子类
class Particle {
  x: number // 粒子x轴初始位置
  y: number // 粒子y轴初始位置
  totalx: number // 粒子x轴目标位置
  totaly: number // 粒子y轴目标位置
  time: number // 粒子移动耗时
  r: number // 粒子的半径
  color: number[] // 粒子的颜色
  opacity: number // 粒子的透明度
  mx?: number // 粒子x轴需要移动的距离
  my?: number // 粒子y轴需要移动的距离
  vx?: number // 粒子x轴移动速度
  vy?: number // 粒子y轴移动速度
  constructor(totalx: number, totaly: number, time: number, color: number[]) {
    this.x = (Math.random() * width) >> 0
    this.y = (Math.random() * height) >> 0
    this.totalx = totalx
    this.totaly = totaly
    this.time = time
    this.r = 1.2
    this.color = [...color]
    this.opacity = 0
  }
  // 在画布中绘制粒子
  draw() {
    context.value!.fillStyle = `rgba(${this.color.toString()})`
    context.value!.fillRect(this.x, this.y, this.r * 2, this.r * 2)
    context.value!.fill()
  }
  // 更新粒子
  update(mouseX?: number, mouseY?: number) {
    this.mx = this.totalx - this.x
    this.my = this.totaly - this.y
    this.vx = this.mx / this.time
    this.vy = this.my / this.time

    if (mouseX && mouseY) {
      let dx = mouseX - this.x
      let dy = mouseY - this.y
      let distance = Math.sqrt(dx ** 2 + dy ** 2)
      let disPercent = Radius / distance
      disPercent = disPercent > 7 ? 7 : disPercent
      let angle = Math.atan2(dx, dy)
      let cos = Math.cos(angle)
      let sin = Math.sin(angle)
      let repX = cos * disPercent * -Inten
      let repY = sin * disPercent * -Inten
      this.vx += repX
      this.vy += repY
    }
    this.x += this.vx
    this.y += this.vy
    if (this.opacity < 1) this.opacity += opacityStep
  }
  // 切换粒子
  change(x: number, y: number, color: number[]) {
    this.totalx = x
    this.totaly = y
    this.color = [...color]
  }
}

// logo 图片类
class LogoImg {
  src: string
  name: string
  particleData: Particle[]
  constructor(src: string, name: string) {
    this.src = src
    this.name = name
    this.particleData = []
    let img = new Image()
    img.src = src
    img.onload = () => {
      // 创建一个空的canvas
      const tmp_canvas = document.createElement('canvas')
      const tmp_ctx = tmp_canvas.getContext('2d')
      const imgW = width
      const imgH = ~~(width * (img.height / img.width))
      tmp_canvas.width = imgW
      tmp_canvas.height = imgH
      tmp_ctx?.drawImage(img, 0, 0, imgW, imgH)
      const imgData = tmp_ctx?.getImageData(0, 0, imgW, imgH).data
      tmp_ctx?.clearRect(0, 0, width, height)

      // 筛选像素点
      for (let y = 0; y < imgH; y += 5) {
        for (let x = 0; x < imgW; x += 5) {
          const index = (x + y * imgH) * 4
          const r = imgData![index]
          const g = imgData![index + 1]
          const b = imgData![index + 2]
          const a = imgData![index + 3]
          const sum = r + g + b + a
          if (sum >= 100) {
            const particle = new Particle(x, y, animateTime, [r, g, b, a])
            this.particleData.push(particle)
          }
        }
      }
    }
  }
}

// 画布类
class ParticleCanvas {
  canvasEle: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  ParticleArr: Particle[]
  mouseX?: number
  mouseY?: number
  constructor(target: HTMLCanvasElement) {
    this.canvasEle = target
    this.ctx = target.getContext('2d') as CanvasRenderingContext2D
    this.width = target.width
    this.height = target.height
    this.ParticleArr = []
    this.canvasEle.addEventListener('mousemove', (e) => {
      const { left, top } = this.canvasEle.getBoundingClientRect()
      const { clientX, clientY } = e
      this.mouseX = clientX - left
      this.mouseY = clientY - top
    })
    this.canvasEle.onmouseleave = () => {
      this.mouseX = 0
      this.mouseY = 0
    }
  }
  // 改变图片
  changeImg(img: LogoImg) {
    if (this.ParticleArr.length) {
      let newPrtArr = img.particleData
      let newLen = newPrtArr.length
      let arr = this.ParticleArr
      let oldLen = arr.length

      for (let idx = 0; idx < newLen; idx++) {
        const { totalx, totaly, color } = newPrtArr[idx]
        if (arr[idx]) {
          arr[idx].change(totalx, totaly, color)
        } else {
          arr[idx] = new Particle(totalx, totaly, animateTime, color)
        }
      }

      if (newLen < oldLen) this.ParticleArr = arr.splice(0, newLen)
      arr = this.ParticleArr
      let tmp_len = arr.length
      while (tmp_len) {
        let randomIdx = ~~(Math.random() * tmp_len--)
        let randomPrt = arr[randomIdx]
        let { totalx: tx, totaly: ty, color } = randomPrt

        randomPrt.totalx = arr[tmp_len].totalx
        randomPrt.totaly = arr[tmp_len].totaly
        randomPrt.color = arr[tmp_len].color
        arr[tmp_len].totalx = tx
        arr[tmp_len].totaly = ty
        arr[tmp_len].color = color
      }
    } else {
      this.ParticleArr = img.particleData.map(
        (item) => new Particle(item.totalx, item.totaly, animateTime, item.color)
      )
    }
  }
  drawCanvas() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.ParticleArr.forEach((particle) => {
      particle.update(this.mouseX, this.mouseY)
      particle.draw()
    })
    window.requestAnimationFrame(() => this.drawCanvas())
  }
}

function clickLogo(prt_canvas: ParticleCanvas, logoItem: LogoImg) {
  prt_canvas.changeImg(logoItem)
  activeLogo.value = logoItem
}

for (let item of logoList) {
  logoImgs.push(new LogoImg(item.url, item.label))
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
    <canvas width="400" height="400" ref="canvas"></canvas>
    <ul class="login-options-container">
      <li
        v-for="logoItem in logoImgs"
        :class="['logo-item', activeLogo === logoItem && 'active']"
        :key="logoItem.name"
        @click="clickLogo(particleCanvas as ParticleCanvas, logoItem)"
      >
        <img :src="logoItem.src" alt="" />
        <span>{{ logoItem.name }}</span>
      </li>
    </ul>
  </div>
</template>

<style lang="less">
body {
  background: black;
}
.canvas-box {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
}
canvas {
  margin: auto;
}
.login-options-container {
  display: flex;
  justify-content: space-around;
  height: 15vw;
  max-width: 80vw;
  border-radius: 8px;
  padding: 10px;
  margin: 0 auto;
  margin-top: 5vw;
  box-shadow: 0px 0px 5px #614949;
  .logo-item {
    list-style: none;
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    img {
      height: 90%;
    }
    &.active {
      transition: 0.3s linear;
      background-color: rgb(116, 116, 116);
    }
  }
}
</style>
