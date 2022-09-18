function createElement(tag, setting) {
  const element = document.createElement(tag)
  const width = `${parseInt(setting.width)}px`
  const height = `${parseInt(setting.height)}px`

  element.id = setting.id

  element.style.width = width
  element.style.height = height

  element.style.position = setting.position

  setting.openTo.appendChild(element)

  return element
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min) + 1) + min
}

class StyleManager {
  constructor(element) {
    this.element = element
  }

  get source() {
    return this.element.style
  }

  set(styles) {
    const styleKeys = Object.keys(styles)

    for (const styleKey of styleKeys) {
      if (typeof this.source[styleKey] === 'undefined') continue
      
      this.source[styleKey] = styles[styleKey]
    }
  }

  reset(key) {
    this.source[key] = "none"
  }
}

class ContextManager {
  constructor(context) {
    this.source = context

    this.x = 0
    this.y = 0

    this.width = 0
    this.height = 0

    this.active = false
    this.save = false
  }

  getTextMetrics(text) {
    return this.source.measureText(text)
  }

  getTextWidth(text) {
    const metrics = this.getTextMetrics(text)
    
    return metrics.width
  }

  getTextHeight(text) {
    const metrics = this.getTextMetrics(text)
    
    return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
  }

  start(x, y, save = true) {
    this.x = x
    this.y = y
    
    this.active = true
    this.save = save

    this.save && this.source.save()

    return this
  }
  
  rect(width, height, type = "fill") {
    if (!type.match(/fill|stroke/)) return this
    
    this.source[`${type}Rect`](this.x, this.y, width, height)

    return this
  }

  circle(radius, type = "fill") {
    this.source.beginPath()
    this.source.arc(this.x, this.y, radius, 0, 2 * Math.PI)
    this.source.closePath()

    if (!type.match(/fill|stroke/)) return this
    
    this.source[type]()

    return this
  }

  font(font) {
    this.source.font = font
    
    return this
  }

  text(text, type = "fill") {
    if (!type.match(/fill|stroke/)) return this

    this.source[`${type}Text`](text, this.x, this.y)

    return this
  }

  rotate(degree, anchorX, anchorY) {
    this.source.translate(anchorX, anchorY)

    this.source.rotate(degree)

    return this
  }

  align(align) {
    this.source.textAlign = align

    return this
  }

  alpha(alpha) {
    this.source.globalAlpha = alpha

    return this
  }

  color(fill = "#000000", stroke) {
    this.source.fillStyle = fill

    if (stroke) {
      this.source.strokeStyle = stroke
    }
    
    return this
  }

  lineWidth(width) {
    this.source.lineWidth = width

    return this
  }

  doFill() {
    this.source.fill()
    
    return this
  }

  doStroke() {
    this.source.stroke()
    
    return this
  }
  
  stop() {
    this.reset()
  }

  reset() {
    this.save && this.source.restore()
    
    this.x = 0
    this.y = 0

    this.width = 0
    this.height = 0

    this.active = false
    this.save = false
  }
}

class Ticker {
  constructor() {
    this.functions = {}
  }

  add(_function) {
    const id = randInt(7e9, 10e9)
    
    this.functions[id] = _function

    return id
  }

  remove(id) {
    delete this.functions[id]
  }

  update() {
    const functions = Object.values(this.functions)

    for (const _function of functions) {
      _function()
    }
    
    requestAnimationFrame(this.update.bind(this))
  }
  
  start() {
    this.update()
  }
}

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }

    set(x, y) {
        this.x = x
        this.y = y
    }

    add(vector) {
        this.x += vector.x
        this.y += vector.y
    }

    sub(vector) {
        this.x -= vector.x
        this.y -= vector.y
    }

    mult(scalar) {
        this.x *= scalar
        this.y *= scalar
    }

    div(divisor) {
        this.x /= divisor
        this.y /= divisor
    }

    mulScalar(vector) {
        const x = this.x * vector.x
        const y = this.y * vector.y
        const result = x + y

        return result
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    normalize() {
        const len = this.length()
        const vx = this.x / len
        const vy = this.y / len

        return new Vector(vx, vy)
    }

    projection(vector) {
        const E = vector.normalize()
        const scalar = this.mulScalar(vector)

        E.mult(scalar)

        return E
    }

    reset() {
        this.x = 0
        this.y = 0
    }
}

class Physics {
  constructor(x = 0, y = 0, mass = 5, time = 0.9) {
    this.mass = mass
    this.time = time
        
    this.position = new Vector(x, y)
    this.velocity = new Vector()
    this.acceleration = new Vector()
    this.force = new Vector()
  }
  
  physicsUpdate() {
    this.force.div(this.mass)
    
    this.acceleration.add(this.force)
    this.acceleration.mult(this.time)
    
    this.velocity.add(this.acceleration)
    this.velocity.mult(this.time)
    
    this.position.add(this.velocity)
  }
}

class Input {
  constructor(element) {
    this.element = element
    
    this.mouse = {
      x: 0,
      y: 0,
      down: false,
      up: false,
      active: false
    }
  }

  setMouseX(x) {
    this.mouse.x = x
  }

  setMouseY(y) {
    this.mouse.y = y
  }

  setMouseActive(active) {
    this.mouse.active = active
  }

  setMouseDown(active) {
    this.mouse.down = active
  }
  setMouseUp(active) {
    this.mouse.up = active
  }

  onMouseMove() {
    this.setMouseX(event.layerX)
    this.setMouseY(event.layerY)
  }

  onMouseEnter() {
    this.setMouseActive(true)
  }

  onMouseLeave() {
    this.setMouseActive(false)
  }

  onMouseDown() {
    this.setMouseDown(true)
    this.setMouseUp(false)
  }

  onMouseUp() {
    this.setMouseUp(true)
    this.setMouseDown(false)
  }

  init() {
    this.element.addEventListener("mousemove", this.onMouseMove.bind(this))

    this.element.addEventListener("mouseenter", this.onMouseEnter.bind(this))
    
    this.element.addEventListener("mouseleave", this.onMouseLeave.bind(this))

    this.element.addEventListener("mousedown", this.onMouseDown.bind(this))

    this.element.addEventListener("mouseup", this.onMouseUp.bind(this))
  }
}

class App {
  constructor({ id, width, height, openTo, position }) {
    this.setting = {
      id: id || "default-canvas",
      width: width || 400,
      height: height || 400,
      openTo: openTo || document.body,
      position: position || "absolute"
    }

    this.canvas = createElement("canvas", this.setting)

    this.canvas.width = this.setting.width
    this.canvas.height = this.setting.height
    
    this.sourceContext = this.canvas.getContext("2d")

    this.context = new ContextManager(this.sourceContext)
    
    this.style = new StyleManager(this.canvas)

    this.sourceStyle = this.canvas.style

    this.ticker = new Ticker()

    this.ticker.start()

    this.input = new Input(this.canvas)

    this.input.init()
  }

  get width() {
    return this.canvas.width
  }

  get height() {
    return this.canvas.height
  }

  set width(width) {
    this.canvas.width = width
    
    this.style.set({
      width: `${parseInt(width)}px`,
    })
  }

  set height(height) {
    this.canvas.height = height
    
    this.style.set({
      height: `${parseInt(height)}px`,
    })
  }

  setSize(width, height) {
    this.width = width
    this.height = height
  }
}

class KeyBoard {
  constructor() {
    this.keys = {}
  }

  onDown() {
    window.addEventListener("keydown", (event) => {
      this.keys[event.code] = true
    })
  }

  onUp() {
    window.addEventListener("keyup", (event) => {
      this.keys[event.code] = false
    })
  }

  init() {
    this.onDown()
    this.onUp()
  }
}

class MATH {
  constructor() {
    this.PI2M = Math.PI * 2
    this.PI2D = Math.PI / 2
  }

  add(key, value) {
    this[key] = value
  }

  remove(key) {
    delete this[key]
  }
}

class Conductor {
  constructor() {
    this.App = App
    this.Vector = Vector
    this.Physics = Physics

    this.math = new MATH()
    this.keyboard = new KeyBoard()
    
    this.keyboard.init()
  }
}

class GameTool extends Conductor {
  constructor() {
    super()
    
  }
}