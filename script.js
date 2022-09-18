(function() {
  const tool = new GameTool()
  const app = new tool.App({
    width: window.innerWidth,
    height: window.innerHeight
  })

  class Player {
    constructor() {
      this.circles = 0

      this.addedCircles = 1
    }

    onClick() {
      this.circles += this.addedCircles
    }

    upgrade_addedCircles() {
      this.addedCircles += 1
    }

    upgrade_circleSpeed() {
      innerCircle.speedReduce -= .5
      innerCircle.speedUp = circle.scale / innerCircle.speedReduce
    }

    upgrade(type) {
      this[`upgrade_${type}`]()
    }
  }

  const player = new Player()

  class CirclesIndicator extends tool.Physics {
    constructor() {
      super()

      this.width = 0
      this.height = 0

      this.size = 35
      this.font = "Arial"

      this.content = ""
    }

    get x() {
      this.width = app.context.getTextWidth(this.content)

      return circle.x - this.width * 2
    }

    get y() {
      this.height = app.context.getTextHeight(this.content)

      return circle.y + this.height
    }

    updateContent() {
      this.content = player.circles
    }

    draw() {
      app.context.start(this.x, this.y)
        .color("#68ac8c")
        .font(`${this.size}px ${this.font}`)
        .text(this.content)
        .stop()
    }

    update() {
      this.updateContent()

      this.draw()
    }
  }

  const circlesIndicator = new CirclesIndicator()

  class Circle extends tool.Physics {
    constructor() {
      super()

      this.scale = 150
    }

    get x() {
      return this.position.x
    }

    get y() {
      return this.position.y
    }

    anchorToCenter() {
      this.position = new tool.Vector(app.width / 2, app.height / 2)
    }

    draw() {
      app.context.start(this.x, this.y)
        .lineWidth(2)
        .color(null, "#68ac8c")
        .circle(this.scale, "stroke")
        .stop()
    }

    update() {
      this.anchorToCenter()

      this.draw()
    }
  }

  const circle = new Circle()

  class InnerCircle extends tool.Physics {
    constructor() {
      super()

      this.scale = 0
      this.alpha = .1

      this.speedReduce = 25
      this.speedUp = circle.scale / this.speedReduce

      this.active = false
      this.reduceActive = false
    }

    get x() {
      return circle.x
    }

    get y() {
      return circle.y
    }

    resetScale() {
      this.scale = 0

      if (this.active) this.stopUpdateScale()
    }

    startUpdateScale() {
      this.active = true
    }

    stopUpdateScale() {
      this.active = false
    }

    resetReduce() {
      this.reduceActive = false

      player.onClick()
    }

    updateScale() {
      if (this.scale >= circle.scale) {
        this.reduceActive = true
      }

      if (this.active && !this.reduceActive) {
        this.scale += this.speedUp
      } else if (this.reduceActive) {
        if (this.scale <= 0) {
          this.resetReduce()

          return this.resetScale()
        }

        this.scale -= this.speedUp
      } else {
        this.resetScale()
      }
    }

    draw() {
      app.context.start(this.x, this.y)
        .alpha(this.alpha)
        .color("#68ac8c")
        .circle(this.scale)
        .stop()
    }

    update() {
      this.updateScale()

      if (this.scale <= 0) {
        this.scale = 0
      }

      if (this.scale >= circle.scale) {
        this.scale = circle.scale
      }
      
      this.draw()
    }
  }

  const innerCircle = new InnerCircle()

  window.addEventListener("mouseup", () => {
    if (!app.input.mouse.active) return void 0
    
    innerCircle.startUpdateScale()
  })

  let upgradeButtonsLength = 0

  class UpgradeButton extends tool.Physics {
    static width = 115
    static height = 40
    static offsetX = 5

    constructor(offset, content, price, maxPrice, priceReduce, type) {
      super(upgradeButtonsLength * UpgradeButton.width + offset)

      this.content = content
      this.price = price
      this.maxPrice = maxPrice
      this.type = type
      this.priceReduce = priceReduce

      this.active = false

      this.maxPriceColor = "#acac68"
      this.maxPriceTextColor = "#86894d"
      this.textColor = "#4d8977"
      this.color = "#68ac8c"
      this.hoverColor = "#71a28b"

      upgradeButtonsLength++
    }

    get x() {
      return this.position.x
    }

    get y() {
      return this.position.y
    }

    get isMouseHover() {
      if (!upgradesApp.input.mouse.active) return false
      
      if (upgradesApp.input.mouse.x >= this.x && upgradesApp.input.mouse.x <= this.x + UpgradeButton.width) {
        if (upgradesApp.input.mouse.y >= this.y && upgradesApp.input.mouse.y <= this.y + UpgradeButton.height) {
          
          return true
        }
      }

      return false
    }

    get isMouseDown() {
      if (!this.isMouseHover || this.active) return false

      if (upgradesApp.input.mouse.down) {
        return true
      }

      return false
    }

    get isMaxPrice() {
      return this.price >= this.maxPrice
    }

    get upgradeTypeValue() {
      return this.content === "Click" ? player.addedCircles : this.content === "Speed" ? innerCircle.speedUp : "?"
    }

    setCanBuyColors() {
      this.textColor = "#4d8977"
      this.color = "#68ac8c"
      this.hoverColor = "#71a28b"
    }

    setCantBuyColors() {
      this.textColor = "#894d4d"
      this.color = "#ac6868"
      this.hoverColor = "#a27171"
    }

    onClick() {
      if (!this.isMouseDown) return void 0

      this.active = true

      player.upgrade(this.type)

      player.circles -= this.price

      this.price += Math.floor(this.price / this.priceReduce)
    }

    drawRect() {
      upgradesApp.context.start(this.x, this.y)
        .color(this.isMaxPrice ? this.maxPriceColor : this.isMouseHover ? this.hoverColor : this.color)
        .rect(UpgradeButton.width, UpgradeButton.height)
        .stop()
    }

    drawContent() {
      const offsetX = 5
      const offsetY = 18

      let fixedUpgradeValue = parseFloat(this.upgradeTypeValue).toFixed(2)

      fixedUpgradeValue = fixedUpgradeValue.toString()
      
      fixedUpgradeValue = fixedUpgradeValue.split(".")[1] === "00" ? fixedUpgradeValue.split(".")[0] : fixedUpgradeValue
      
      upgradesApp.context.start(this.x + offsetX, this.y + offsetY)
        .color(this.isMaxPrice ? this.maxPriceTextColor : this.textColor)
        .align("left")
        .font(`bold 14px Arial`)
        .text(`${this.content} > ${fixedUpgradeValue}`)
        .stop()
    }

    drawPrice() {
      const offsetX = 5
      const offsetY = 18 + 14
      
      upgradesApp.context.start(this.x + offsetX, this.y + offsetY)
        .color(this.isMaxPrice ? this.maxPriceTextColor : this.textColor)
        .align("left")
        .font(`bold 14px Arial`)
        .text(`Price ${this.price}`)
        .stop()
    }

    update() {
      this.drawRect()

      this.drawContent()

      this.drawPrice()

      if (!this.isMaxPrice) {
        if (player.circles >= this.price) {
          this.onClick()

          this.setCanBuyColors()
        } else {
          this.setCantBuyColors()
        }
      }

      if (this.active && upgradesApp.input.mouse.up) {
        this.active = false
      }
    }
  }

  const upgradeButtons = [
    new UpgradeButton(0, "Click", 25, Infinity, 7, "addedCircles"),
    new UpgradeButton(UpgradeButton.offsetX, "Speed", 55, 4895, 10, "circleSpeed")
  ]

  const upgradesApp = new tool.App({
    id: "upgrades-canvas",
    width: (upgradeButtons.length * UpgradeButton.width) + ((upgradeButtons.length - 1) * UpgradeButton.offsetX),
    height: UpgradeButton.height
  })

  upgradesApp.style.set({
    top: `0px`,
    left: `${window.innerWidth / 2 - upgradesApp.width / 2}px`
  })

  window.addEventListener("resize", () => {
    app.setSize(window.innerWidth, window.innerHeight)

    upgradesApp.style.set({
      top: `0px`,
      left: `${window.innerWidth / 2 - upgradesApp.width / 2}px`
    })
  })

  upgradesApp.ticker.add(() => {
    for (const upgradeButton of upgradeButtons) {
      upgradeButton.update()
    }
  })

  app.ticker.add(() => {
    app.context.start(0, 0).color("#1a1a1a").rect(app.width, app.height).stop()

    innerCircle.update()

    circle.update()

    circlesIndicator.update()
  })
})()