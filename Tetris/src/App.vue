<script setup lang="ts">
import { ref, onMounted, markRaw } from 'vue'
const canvas = ref<HTMLCanvasElement | null>(null)

let particleCanvas = ref<ParticleCanvas>()
let width = 450
let height = 600
let space = 50
let fallTime = 200

class Block {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

class ActiveBlock {
  x: number
  y: number
  left: number
  right: number
  type: number
  friendBlock: Block[]
  color: string
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.type = Math.floor(Math.random() * 4)
    this.friendBlock = []
    switch (this.type) {
      case 0:
        this.friendBlock.push(new Block(x - 1, y))
        this.friendBlock.push(new Block(x + 1, y))
        this.friendBlock.push(new Block(x + 2, y))
        break
      case 1:
        this.friendBlock.push(new Block(x - 1, y))
        this.friendBlock.push(new Block(x, y + 1))
        this.friendBlock.push(new Block(x + 1, y + 1))
        break
      case 2:
        this.friendBlock.push(new Block(x + 1, y))
        this.friendBlock.push(new Block(x, y + 1))
        this.friendBlock.push(new Block(x - 1, y + 1))
        break
      case 3:
        this.friendBlock.push(new Block(x + 1, y))
        this.friendBlock.push(new Block(x, y + 1))
        this.friendBlock.push(new Block(x + 1, y + 1))
        break
    }
    this.left = this.right = this.x
    this.getBoundary()
    this.color = this.getRandomColor()
  }
  getBoundary() {
    this.left = this.right = this.x
    this.friendBlock.map(item => {
      this.left = Math.min(this.left, item.x)
      this.right = Math.max(this.right, item.x)
    })
  }
  turnLeft() {
    // 左移
    this.left--
    this.x--
    this.friendBlock.map(item => {
      item.x--
    })
  }
  turnRight() {
    // 右移
    this.right++
    this.x++
    this.friendBlock.map(item => {
      item.x++
    })
  }
  turnDown() {
    // 下移
    this.y++
    this.friendBlock.map(item => {
      item.y++
    })
  }
  getRandomColor() {
    const letters = "0123456789ABCDEF"
    let color = "#"
    for (let i = 0; i < 6; ++i) {
      color += letters[Math.floor(Math.random() * 16)]
    }
    return color
  }
}

class ParticleCanvas {
  canvasEle: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  mapHeight: number
  mapWidth: number
  space: number
  coutX: number
  coutY: number
  map: any[]
  time: any
  frameFlag: boolean
  activeBlock: ActiveBlock
  constructor(target: HTMLCanvasElement) {
    this.canvasEle = target;
    this.ctx = target.getContext('2d') as CanvasRenderingContext2D
    this.canvasEle.width = this.canvasEle.clientWidth
    this.canvasEle.height = this.canvasEle.clientHeight
    this.mapHeight = height
    this.mapWidth = width
    this.space = space
    this.coutX = this.mapWidth / this.space
    this.coutY = this.mapHeight / this.space
    this.map = new Array(this.coutX).fill(null).map(() => new Array(this.coutY).fill(null))
    this.time = false
    this.activeBlock = new ActiveBlock(2, 0)
    this.frameFlag = true
    // 监听键盘事件
    document.onkeydown = (e) => {
      if (this.activeBlock) {
        switch (e.key) {
          case 'a': case 'A':
            if (this.activeBlock.left > 0) {
              this.activeBlock.turnLeft()
            }
            break
          case 'd': case 'D':
            if (this.activeBlock.right < this.coutX - 1) {
              this.activeBlock.turnRight()
            }
            break
        }
      }
    }
  }
  drawCanvas() {
    if (!this.frameFlag) {
      console.log('game over')
      return
    }
    // 绘制背景
    this.ctx.save()
    this.ctx.fillStyle = '#fff'
    this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight)
    this.ctx.restore();

    // 移动的方块自然落下
    if (!this.time) {
      this.time = true
      setTimeout(() => {
        this.time = false
        // 边界判断
        let checkBoundary = (blocks: Array<Block>) => {
          for (let i = 0; i < blocks.length; ++i) {
            if (blocks[i].y == this.coutY - 1) {
              return true;
            }
            if (this.map[blocks[i].x][blocks[i].y + 1]) {
              return true;
            }
          }
          return false;
        }
        if (checkBoundary(this.activeBlock.friendBlock) ||
          this.activeBlock.y == this.coutY - 1 ||
          this.map[this.activeBlock.x][this.activeBlock.y + 1]) {
          // 终止条件
          if (this.activeBlock.y == 0) this.frameFlag = false

          this.map[this.activeBlock.x][this.activeBlock.y] = this.activeBlock.color
          this.activeBlock.friendBlock.map(item => {
            if (item.y == 0) this.frameFlag = false
            this.map[item.x][item.y] = this.activeBlock.color
          })
          this.activeBlock = new ActiveBlock(2, -1)
        }
        // 消除判断
        for (let i = 0; i < this.coutY; ++i) {
          let cout = 0;
          for (let j = 0; j < this.coutX; ++j) {
            if (this.map[j][i]) cout++
          }
          if (cout === this.coutX) {
            this.clearLine(i);
            i--;
          }
        }

        this.activeBlock.turnDown()
      }, fallTime)
    }

    // 绘制正在移动方块
    // 绘制核心块
    this.drawBlock(this.activeBlock.x, this.activeBlock.y, this.activeBlock.color)
    // 绘制他的好友块
    this.activeBlock.friendBlock.map(item => {
      this.drawBlock(item.x, item.y, this.activeBlock.color)
    })

    // 绘制已经存在的块
    for (let i = 0; i < this.coutX; ++i) {
      for (let j = 0; j < this.coutY; ++j) {
        if (this.map[i][j]) {
          this.drawBlock(i, j, this.map[i][j]);
        }
      }
    }

    // 绘制网格
    this.ctx.save()
    this.ctx.lineWidth = 2
    this.ctx.translate(0.5, 0.5);
    this.ctx.strokeStyle = '#000'
    this.ctx.strokeRect(0, 0, this.mapWidth, this.mapHeight)
    this.ctx.lineWidth = 1
    for (let i = 0; i <= this.mapWidth; i += this.space) {
      this.ctx.beginPath()
      this.ctx.moveTo(i, 0)
      this.ctx.lineTo(i, this.mapHeight)
      this.ctx.stroke()
    }
    for (let j = 0; j <= this.mapHeight; j += this.space) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, j)
      this.ctx.lineTo(this.mapWidth, j)
      this.ctx.stroke()
    }
    this.ctx.restore();

    if (this.frameFlag)
      window.requestAnimationFrame(() => this.drawCanvas())
  }
  drawBlock(x: number, y: number, color: string) {
    this.ctx.save()
    this.ctx.fillStyle = color
    this.ctx.fillRect(x * this.space, y * this.space, space, space)
    this.ctx.restore();
  }
  clearLine(y: number) {
    for (let i = y; i > 1; --i) {
      for (let j = 0; j < this.coutX; ++j) {
        this.map[j][i] = this.map[j][i - 1]
      }
    }
    for (let i = 0; i < this.coutX; ++i) {
      this.map[i][0] = null
    }
  }
}
onMounted(() => {
  if (canvas.value) {
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
.canvas-box {
  width: 100%;
  min-width: 600px;
  height: 750px;
}
</style>
