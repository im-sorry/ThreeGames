class Xiaoxiaole {
  constructor(canvasId){
    this.canvas = document.getElementById(canvasId)
    this.ctx = this.canvas.getContext('2d')
    this.width = this.canvas.width = window.innerWidth
    this.height = this.canvas.height = window.innerHeight
    this.cardNum = 20
    this.cardRect = {
      width: 30,
      height: 30
    }
    Xiaoxiaole.cardRect = this.cardRect
    this.startX = (this.width - this.cardRect.width * this.cardNum) / 2
    this.startY = (this.height - this.cardRect.height * this.cardNum) / 2
    Xiaoxiaole.startX = this.startX
    Xiaoxiaole.startY = this.startY
    this.animationDuration = 2
    this.is_waiting_clear = false
    this.block_r = this.cardRect.height / 2 - 2
    this.Block = class {
      constructor(r, color, ctx, i, j) {
        this.color = color
        this.r = r
        this.ctx = ctx
        this.clearColor = {
          ...this.color,
          A: 0.4
        }
        this.i = i
        this.j = j
        this.animationDuration = 1000
        this.disappearStep = (1 - 0.01) / (this.animationDuration / (1000 / 60))
        this.A = 1
        this.downStep = 0
      }
      get colorString() {
        return JSON.stringify(this.color)
      }
      computePosition() {
        return {
          x: Xiaoxiaole.startX + (this.i + 0.5) * Xiaoxiaole.cardRect.width,
          y: Xiaoxiaole.startY + (this.j + 0.5) * Xiaoxiaole.cardRect.height
        }
      }
      draw() {
        this.clearRect()
        const color = this.color
        const {x, y} = this.computePosition()
        // const color = this.is_waiting_clear ? this.clearColor : this.color
        Xiaoxiaole.drawCircle(x, y, this.r, this.ctx, {...color, A: this.A}, 'fill')
      }
      clearRect() {
        const {x, y} = this.computePosition()
        Xiaoxiaole.drawCircle(x, y, this.r, this.ctx, {R: 0, G: 0, B: 0, A: 1}, 'fill')
      }
      wait2clear() {
        this.is_waiting_clear = true
      }
      disappear() {
        this.A -= this.disappearStep
        this.draw()
        if (this.A <= 0.01) return true
        return false
      }
      addDownStep() {
        if (this.is_waiting_clear) return
        this.downStep ++
        this.j ++
        this.y += 30
      }
      itsme() {
        this.clearRect()
        this.r -= 3
        this.draw()
      }
      recovery() {
        this.clearRect()
        this.r += 3
        this.draw()
      }
    }
    this.blocks = []
    this.signBlockSet = new Set()
    this.signBlocks = []
    this.state = {
      status: 0, // 0 init; 1 click once; 2 click twice
      first: null,
      second: null
    }
  }
  drawCheckerboard() {
    let startX = this.startX,
      startY = this.startY,
      lengthX = this.cardNum * this.cardRect.width,
      lengthY = this.cardNum * this.cardRect.height
    for(let i = 0; i <= this.cardNum; i++) {
      Xiaoxiaole.drawLine(this.ctx, startX, startY + i * this.cardRect.height, startX + lengthX,  startY + i * this.cardRect.height)
      Xiaoxiaole.drawLine(this.ctx, startX + i * this.cardRect.width, this.startY, startX + i * this.cardRect.width, this.startY + lengthY)
    }
  }
  clearCheckerBoard() {
    let startX = this.startX,
      startY = this.startY,
      lengthX = this.cardNum * this.cardRect.width,
      lengthY = this.cardNum * this.cardRect.height
    Xiaoxiaole.drawRect(this.ctx, startX, startY, lengthX, lengthY)
    this.drawCheckerboard()
  }
  signBlock() {
    this.signBlockSet = new Set()
    const work = (...blocks) => {
      if (new Set(blocks.map(b => b.colorString)).size === 1) {
        blocks.forEach(b => {
          b.wait2clear()
          this.signBlockSet.add(b)
        })
      }
    }
    for(let j = 0; j < this.cardNum; j ++) {
      for(let i = 0; i < this.cardNum; i++) {
        if (this.blocks[j][i + 1] && this.blocks[j][i + 2]) {
          work(this.blocks[j][i], this.blocks[j][i + 1], this.blocks[j][i + 2])
        }
        if (this.blocks[j][i - 1] && this.blocks[j][i - 2]) {
          work(this.blocks[j][i], this.blocks[j][i - 1], this.blocks[j][i - 2])
        }
        if (this.blocks[j + 1] && this.blocks[j + 2] && this.blocks[j + 1][i] && this.blocks[j + 2][i]) {
          work(this.blocks[j][i], this.blocks[j + 1][i], this.blocks[j + 2][i])
        }
        if (this.blocks[j - 1] && this.blocks[j - 1][i] && this.blocks[j - 2] && this.blocks[j - 2][i]) {
          work(this.blocks[j][i], this.blocks[j - 1][i], this.blocks[j - 2][i])
        }
      }
    }
    return this.signBlockSet.size > 0
  }
  produceBlocks() {
    for(let i = 0; i < this.cardNum; i ++) {
      this.blocks[i] = []
      for(let j = 0; j < this.cardNum; j++) {
        const block = new this.Block(this.block_r, this.getColor(), this.ctx, j, i)
        this.blocks[i].push(block)
        block.draw()
      }
    }
  }
  async disappear() {
    this.signBlocks = [...this.signBlockSet]
    await new Promise(resolve => {
      let timer = setInterval(() => {
        for(let b of this.signBlockSet) {
          if(b.disappear()) this.signBlockSet.delete(b)
        }
        if(!this.signBlockSet.size) {
          clearInterval(timer)
          resolve()
        }
      }, 1000 / 60)
    })
  }
  async down() {
    this.signBlocks.forEach(b => {
      let i = b.i, j = b.j
      this.blocks[j][i] = null
      for(let x = j; x >=0; x --) {
        this.blocks[x][i] && (this.blocks[x][i].addDownStep())
      }
    })
    this.signBlocks = []
    let newBlocks = Array(this.cardNum).fill(null)
    for(let i = 0; i < newBlocks.length; i++) {
      newBlocks[i] = Array(this.cardNum).fill(null)
    }
    for(let j = 0; j < this.cardNum; j++) {
      for(let i = 0; i < this.cardNum; i++) {
        if (this.blocks[j][i]){
          const newJ = this.blocks[j][i].j
          newBlocks[newJ][i] = this.blocks[j][i]
        }
      }
    }
    this.blocks = newBlocks
    this.clearCheckerBoard()
    newBlocks.forEach(i => i.forEach(j => j && j.draw()))
  }
  fillBlock() {
    for(let j = 0; j < this.cardNum; j++) {
      for(let i = 0; i < this.cardNum; i++) {
        if (!this.blocks[j][i]){
          const block = new this.Block(this.block_r, this.getColor(), this.ctx, i, j)
          this.blocks[j][i] = block
          block.draw()
        }
      }
    }
  }
  getColor() {
    const colors = [
      {R: 255, G: 0, B: 0, A: 1},
      {R: 0, G: 255, B: 0, A: 1},
      {R: 250, G: 150, B: 155, A: 1},
      {R: 255, G: 255, B: 0, A: 1},
      {R: 0, G: 255, B: 255, A: 1},
      // {R: 255, G: 0, B: 255, A: 1},
    ]
    return colors[Xiaoxiaole.getRandomNumber(0, colors.length)]
  }
  async run() {
    this.drawCheckerboard()
    this.produceBlocks()
    this.main()
  }
  async main() {
    while(this.signBlock()) {
      await this.disappear()
      this.down()
      this.fillBlock()
    }
    this.state.status = 0
    this.registerEvent()
  }
  checkUsefulClick(e) {
    let startX = this.startX,
      startY = this.startY,
      endX = this.cardNum * this.cardRect.width + startX,
      endY = this.cardNum * this.cardRect.height + startY
    if (e.x < startX || e.x > endX) return false
    if (e.y < startY || e.y > endY) return false
    return true
  }
  getPosition(e) {
    return {
      i: Math.floor((e.x - this.startX) / this.cardRect.width),
      j: Math.floor((e.y - this.startY) / this.cardRect.height)
    }
  }
  isNear(b1, b2) {
    if (b1.i === b2.i && Math.abs(b1.j - b2.j) === 1) return true
    if (b1.j === b2.j && Math.abs(b1.i - b2.i) === 1) return true
    return false
  }
  exchangePosition(b1, b2) {
    const i1 = b1.i, i2 = b2.i, j1 = b1.j, j2 = b2.j
    b1.i = i2
    b1.j = j2
    b2.i = i1
    b2.j = j1
    this.blocks[j1][i1] = b2
    this.blocks[j2][i2] = b1
    b1.draw()
    b2.draw()
  }
  handleEvent = (e) => {
    if (this.checkUsefulClick(e)) {
      const {i, j} = this.getPosition(e)
      if (this.state.status === 0) {
        this.state.status = 1
        this.state.first = this.blocks[j][i]
        this.state.first.itsme()
      } else if (this.state.status === 1) {
        if (this.isNear(this.state.first, this.blocks[j][i])) {
          this.state.second = this.blocks[j][i]
          this.state.second.itsme()
          this.exchangePosition(this.state.first, this.state.second)
          if (this.signBlock()) {
            this.unregistryEvent()
            this.state.first.recovery()
            this.state.second.recovery()
            this.main()
          } else {
            setTimeout(() => {
              this.state.status = 0
              this.state.first.recovery()
              this.state.second.recovery()
              this.exchangePosition(this.state.first, this.state.second)
            }, 500);
          }
        }
      }
    }
  }
  registerEvent() {
    window.addEventListener('click', this.handleEvent)
  }
  unregistryEvent() {
    window.removeEventListener('click', this.handleEvent)
  }
  static drawLine(ctx, startX, startY, endX, endY) {
    ctx.save()
    ctx.strokeStyle = `rgba(255,255,0,1)`
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    ctx.restore()
  }
  static drawRect(ctx, x, y, width, height, {R, G, B, A} = {R: 0, G: 0, B: 0, A: 1}, type = 'fill') {
    ctx.save()
    ctx.strokeStyle = `rgba(${R}, ${G}, ${B}, ${A})`
    ctx.fillStyle = `rgba(${R}, ${G}, ${B}, ${A})`
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    if (typeof ctx[type] === 'function') {
      ctx[type]()
    }
    ctx.restore()
  }
  static getRandomNumber(start, end) {
    return Math.floor(Math.random() * (end - start) + start)
  }
  static getRGB() {
    let R = Xiaoxiaole.getRandomNumber(150, 250)
    let G = Xiaoxiaole.getRandomNumber(150, 250)
    let B = Xiaoxiaole.getRandomNumber(150, 250)
    return { R, G, B }
  }
  static fillStar(
    startX,
    startY,
    r,
    ctx,
    { R = 250, G = 250, B = 200, A = 1 } = {}
  ) {
    Xiaoxiaole.drawStar(startX, startY, r, ctx, { R, G, B, A }, 'fill')
  }
  static strokeStar(
    startX,
    startY,
    r,
    ctx,
    { R = 250, G = 250, B = 200, A = 1 } = {}
  ) {
    Xiaoxiaole.drawStar(startX, startY, r, ctx, { R, G, B, A }, 'stroke')
  }
  static drawStar(
    startX,
    startY,
    r,
    ctx,
    { R = 250, G = 250, B = 200, A = 1 } = {},
    type = 'stroke'
  ) {
    ctx.save()
    ctx.beginPath()
    ctx.translate(startX, startY)
    ctx.fillStyle = `rgba(${R},${G},${B},${A})`
    ctx.strokeStyle = `rgba(${R},${G},${B},${A})`
    ctx.moveTo(r, 0)
    for (let i = 0; i < 9; i++) {
      ctx.rotate(Math.PI / 5)
      if (i % 2 == 0) {
        ctx.lineTo((r / 0.525731101) * 0.200811205, 0)
      } else {
        ctx.lineTo(r, 0)
      }
    }
    ctx.closePath()
    if (typeof ctx[type] === 'function') {
      ctx[type]()
    }
    ctx.restore()
  }
  static strokeCircle(
    startX,
    startY,
    r,
    ctx,
    { R = 255, G = 255, B = 255, A = 1 } = {}
  ) {
    Xiaoxiaole.drawCircle(startX, startY, r, ctx, { R, G, B, A }, 'stroke')
  }
  static fillCircle(
    startX,
    startY,
    r,
    ctx,
    { R = 255, G = 255, B = 255, A = 1 } = {}
  ) {
    Xiaoxiaole.drawCircle(startX, startY, r, ctx, { R, G, B, A }, 'fill')
  }
  static drawCircle(
    startX,
    startY,
    r,
    ctx,
    { R = 255, G = 255, B = 255, A = 1 } = {},
    type
  ) {
    ctx.save()
    ctx.strokeStyle = `rgba(${R}, ${G}, ${B}, ${A})`
    ctx.fillStyle = `rgba(${R}, ${G}, ${B}, ${A})`
    ctx.beginPath()
    ctx.arc(startX, startY, r, 0, Math.PI * 2, true)
    if (typeof ctx[type] === 'function') {
      ctx[type]()
    }
    ctx.restore()
  }
  static strokeHeart(
    startX,
    startY,
    r,
    ctx,
    { R = 200, G = 0, B = 0, A = 1 } = {}
  ) {
    Xiaoxiaole.drawHeart(startX, startY, r, ctx, { R, G, B, A }, 'stroke')
  }
  static fillHeart(
    startX,
    startY,
    r,
    ctx,
    { R = 200, G = 0, B = 0, A = 1 } = {}
  ) {
    Xiaoxiaole.drawHeart(startX, startY, r, ctx, { R, G, B, A }, 'fill')
  }
  static drawHeart(
    startX,
    startY,
    r,
    ctx,
    { R = 200, G = 0, B = 0, A = 1 } = {},
    type
  ) {
    let radian = 0 
    let radianStep = Math.PI / 180
    r = Xiaoxiaole.getHeartR(r)
    ctx.save()
    ctx.beginPath()
    ctx.translate(startX, startY)
    ctx.moveTo(Xiaoxiaole.getHeartX(radian, r), Xiaoxiaole.getHeartY(radian, r))
    while (radian <= Math.PI * 2) {
      radian += radianStep
      let X = Xiaoxiaole.getHeartX(radian, r)
      let Y = Xiaoxiaole.getHeartY(radian, r)
      ctx.lineTo(X, Y)
    }
    ctx.strokeStyle = `rgba(${R},${G},${B},${A})`
    ctx.fillStyle = `rgba(${R},${G},${B},${A})`
    if (typeof ctx[type] === 'function') {
      ctx[type]()
    }
    ctx.restore()
  }
  static getHeartX(radian, r) {
    return r * (16 * Math.pow(Math.sin(radian), 3))
  }
  static getHeartY(radian, r) {
    return (
      -r *
      (13 * Math.cos(radian) -
        5 * Math.cos(2 * radian) -
        2 * Math.cos(3 * radian) -
        Math.cos(4 * radian))
    )
  }
  static getHeartR(value) {
    return value / 13
  }
  getRandomXYList(maxValue, span, num) {
    let startXList = []
    let rangeList = []

    function checkIsIn(value, rangeList) {
      for (let range of rangeList) {
        if (value >= range[0] && value <= range[1]) return true
      }
      return false
    }
    while (startXList.length < num) {
      let startX = Xiaoxiaole.getRandomNumber(0, maxValue)
      if (checkIsIn(startX, rangeList)) {
        continue
      }
      startXList.push(startX)
      rangeList.push([startX - span, startX + span * 2])
    }
    return startXList
  }
}