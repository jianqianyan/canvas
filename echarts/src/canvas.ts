// 默认图标边距
const DEFAULT_CANVAS_PADDING = 20;
const DEFAULT_CTX_LINECAP = "round";
const DEFAULT_CTX_STROKESTYLE = "black";
const DEFAULT_CTX_LINEWIDTH = 1;
const DEFAULT_CTX_FONTWIDTH = 16;
const DEFAULT_CTX_FONTFAMILY = "serif";
const yAxisColor = "#e6ebf3";
const DEFAULT_COLOR = "#5470c6";

const yAxisList = [1, 5, 10, 20, 30, 50, 60, 100];

// 笔刷样式接口
interface CtxStyleOptions {
  lineCap?: CanvasLineCap;
  strokeStyle?: string;
  lineWidth?: number;
}

// 字体样式接口
interface CtxFontOptions {
  fontWidth?: number,
  fontFamily?: string
}

interface yAxis {
  type: string,
  min?: number,
  max?: number,
}

interface xAxis {
  type: string,
  data: Array<string | number>,
}

interface Point {
  x: number,
  y: number,
}

// 数据类型接口
export interface chartOptions {
  xAxis: xAxis,
  yAxis: yAxis,
  series: Array<{
    data: Array<number>,
    type: string
  }>,
  color?: Array<string>
}

export class MyCanvas {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  padding: number
  lineCap: string
  strokeStyle: string
  lineWidth: number
  fontFamily: string
  fontWidth: number
  startPoint: {
    x: number,
    y: number
  }
  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const dpr = window.devicePixelRatio || 1;
    this.ctx.scale(dpr, dpr);
    this.padding = DEFAULT_CANVAS_PADDING;

    this.width = width - 2 * this.padding;
    this.height = height - 2 * this.padding;
    this.startPoint = {
      x: this.padding,
      y: this.padding
    }

    this.lineCap = DEFAULT_CTX_LINECAP;
    this.strokeStyle = DEFAULT_CTX_STROKESTYLE;
    this.lineWidth = DEFAULT_CTX_LINEWIDTH;
    this.fontFamily = DEFAULT_CTX_FONTFAMILY;
    this.fontWidth = DEFAULT_CTX_FONTWIDTH;

  }
  setStartPoing() {
    this.startPoint = {
      x: this.padding,
      y: this.padding
    }
  }
  setWidth() {
    this.width = this.canvas.width - 2 * this.padding;
  }
  setHeight() {
    this.height = this.canvas.height - 2 * this.padding;
  }
  setCtxStyle(options: CtxStyleOptions) {
    const { lineCap, strokeStyle, lineWidth } = options;
    this.ctx.lineCap = lineCap as CanvasLineCap || this.lineCap;
    this.ctx.strokeStyle = strokeStyle || this.strokeStyle;
    this.ctx.lineWidth = lineWidth || this.lineWidth;

    this.lineCap = this.ctx.lineCap
    this.strokeStyle = this.ctx.strokeStyle
    this.lineWidth = this.ctx.lineWidth
  }
  setCtxFont(options: CtxFontOptions) {
    const { fontFamily, fontWidth } = options;
    const ctxFontFamily = fontFamily || this.fontFamily;
    const ctxFontWidth = fontWidth || this.fontWidth;

    this.ctx.font = `${ctxFontWidth}px ${ctxFontFamily}`;

    this.fontFamily = ctxFontFamily;
    this.fontWidth = ctxFontWidth;
  }
  // 绘制Y轴
  drawYaxle(min: number, max: number) {
    // 绘制普通y轴
    // this.ctx.beginPath();
    // this.setCtxStyle({ lineCap: "round", strokeStyle: "black", lineWidth: 1 });
    // this.ctx.moveTo(this.startPoint.x, this.startPoint.y);
    // this.ctx.lineTo(this.startPoint.x, this.height + this.padding);
    // this.ctx.stroke();
    // this.ctx.closePath();

    const stepNum = 5;
    const step = (max - min) / stepNum;

    for (let i = 0; i <= stepNum; ++i) {
      // 生成的text不会和线条对齐 我们需要下移一点文字的高度
      // 先计算出文字的高度
      const textMsg = this.ctx.measureText(String(max - step * i));
      const height = textMsg.actualBoundingBoxAscent + textMsg.actualBoundingBoxDescent

      this.ctx.beginPath();
      this.setCtxStyle({ lineCap: "round", strokeStyle: "black", lineWidth: 1 });
      this.ctx.fillText(String(max - step * i), this.startPoint.x, this.startPoint.y + this.height / stepNum * i + height / 4);
      this.ctx.stroke();
      this.ctx.closePath();

      this.ctx.beginPath();
      this.setCtxStyle({ strokeStyle: yAxisColor })
      this.ctx.moveTo(this.startPoint.x + textMsg.width + 4, this.startPoint.y + this.height / stepNum * i);
      this.ctx.lineTo(this.startPoint.x + this.width, this.startPoint.y + this.height / stepNum * i);
      this.ctx.stroke();
      this.ctx.closePath();
    }
  }
  // 绘制X轴
  drawXaxle() {
    this.ctx.beginPath();
    this.setCtxStyle({ lineCap: "round", strokeStyle: "black", lineWidth: 1 });
    this.ctx.moveTo(this.startPoint.x, this.height + this.padding);
    this.ctx.lineTo(this.startPoint.x + this.width, this.height + this.padding);
    this.ctx.stroke();
    this.ctx.closePath();
  }
  drawAxis() {
    // this.drawXaxle();
  }
  // 绘制折线图
  drawLineChart(xAxis: xAxis, yAxis: yAxis, data: Array<number>, color: string) {
    const dataMin = Math.min(...data);
    let max = yAxis.max;
    let min = yAxis.min;

    if (!max) {
      max = Math.max(...data);
      let i = 0;
      // 希望折线图尽可能美观
      for (i = 0; i < yAxisList.length; ++i) {
        if (yAxisList[i] * 5 >= max) {
          max = yAxisList[i] * 5;
          break;
        }
      }
    }
    if (!min && dataMin >= 0) {
      min = 0;
    } else if (!min && dataMin) {
      min = dataMin
    }
    this.drawYaxle(min as number, max);

    // 将所有的点转换为在图上的位置
    const pointList: Array<Point> = [];
    for (let i = 0; i < data.length; ++i) {
      const step = this.width / xAxis.data.length;
      const point = {
        x: this.startPoint.x + step / 2 + step * i,
        y: this.startPoint.y + this.height - this.height * data[i] / max,
      }
      pointList.push(point);
    }

    // 连线
    const style = {
      strokeStyle: color
    }
    for (let i = 1; i < pointList.length; ++i) {
      this.drawLine(pointList[i], pointList[i - 1], style);
    }
  }

  drawLine(beginPoint: Point, endPoint: Point, style: CtxStyleOptions) {
    this.ctx.beginPath();
    this.setCtxStyle(style);
    this.ctx.moveTo(beginPoint.x, beginPoint.y);
    this.ctx.lineTo(endPoint.x, endPoint.y);
    this.ctx.stroke();
    this.ctx.closePath();
  }

  setOption(option: chartOptions) {
    const { xAxis, yAxis, series, color } = option;
    series.map((item, index) => {
      let chartsColor = DEFAULT_COLOR;
      if (color && color.length >= index) {
        chartsColor = color[index];
      }
      switch (item.type) {
        case 'line':
          this.drawLineChart(xAxis, yAxis, item.data, chartsColor)
      }
    })
  }
}

export const canvasInit = (containerName: string) => {
  const container: HTMLDivElement = document.querySelector(containerName) as HTMLDivElement;
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  // if (!canvas) {
  //   // 处理 canvas 为空的情况
  //   throw new Error('Canvas not found');
  // }
  // if (!(canvas instanceof HTMLCanvasElement)) {
  //   // 处理 canvas 不是 HTMLCanvasElement 的情况
  //   throw new Error('Element is not a Canvas');
  // }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = container.clientWidth * dpr;
  canvas.height = container.clientHeight * dpr;
  canvas.style.width = container.clientWidth + "px";
  canvas.style.height = container.clientHeight + "px";

  return new MyCanvas(canvas, container.clientWidth, container.clientHeight);
};

