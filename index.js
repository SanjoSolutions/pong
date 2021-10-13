class Entity {
  constructor(position, size) {
    this.position = position
    this.size = size
  }
}

class Bar extends Entity {
  static WIDTH = 16
  static HEIGHT = 3 * 16
  static STEP_SIZE = 1

  constructor(position) {
    super(position, { width: Bar.WIDTH, height: Bar.HEIGHT })
  }
}

class Ball extends Entity {
  static WIDTH = 16
  static HEIGHT = 16
  static MOVE_STEP = 0.5

  constructor(position, angle) {
    super(position, { width: Ball.WIDTH, height: Ball.HEIGHT })
    this.angle = angle ?? 0
  }

  get radius() {
    return 0.5 * this.size.width
  }
}

function main() {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 480
  document.body.appendChild(canvas)
  const context = canvas.getContext('2d')

  const bars = [
    new Bar({ x: 0, y: 0 }),
    new Bar({ x: canvas.width - Bar.WIDTH, y: 0 })
  ]
  const initialBallPosition = { x: 0.5 * canvas.width, y: 0.5 * canvas.height }
  const ball = new Ball(
    { ...initialBallPosition },
    0.25 * Math.PI
  )

  const Keys = {
    Up: 1,
    Down: 2
  }

  const keyMappings = new Map([
    [
      'Xbox 360 Wired Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)',
      new Map([
        [Keys.Up, gamepad => gamepad.buttons[12].pressed],
        [Keys.Down, gamepad => gamepad.buttons[13].pressed]
      ])
    ],
    [
      'Xbox 360 Controller (XInput STANDARD GAMEPAD)',
      new Map([
        [Keys.Up, gamepad => gamepad.buttons[12].pressed],
        [Keys.Down, gamepad => gamepad.buttons[13].pressed]
      ])
    ],
    [
      'Fighting Stick mini 4 (Vendor: 0f0d Product: 0088)',
      new Map([
        [Keys.Up, gamepad => gamepad.axes[9] === -1],
        [Keys.Down, gamepad => gamepad.axes[9] === 0.14285719394683838]
      ])
    ]
  ])

  let gamepadIndexes = [null, null]

  window.addEventListener('gamepadconnected', function (event) {
    const gamepad = event.gamepad
    if (keyMappings.has(gamepad.id)) {
      const index = gamepadIndexes.indexOf(null)
      if (index !== -1) {
        gamepadIndexes[index] = gamepad.index
      }
    } else {
      console.error(`Key mapping for Gamepad "${gamepad.id}" missing.`)
    }
  })

  window.addEventListener('gamepaddisconnected', function (event) {
    for (let index = 0; index < gamepadIndexes.length; index++) {
      if (gamepadIndexes[index] === event.gamepad.index) {
        gamepadIndexes[index] = null
      }
    }
  })

  function render() {
    renderBackground()
    renderBars(bars)
    renderBall(ball)
  }

  function renderBackground() {
    context.fillStyle = 'black'
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  function renderBars(bars) {
    bars.forEach(renderBar)
  }

  function renderBar(bar) {
    context.fillStyle = 'white'
    context.fillRect(
      bar.position.x,
      bar.position.y,
      bar.size.width,
      bar.size.height
    )
  }

  function renderBall(ball) {
    context.strokeStyle = 'white'
    context.beginPath()
    context.arc(
      ball.position.x,
      ball.position.y,
      ball.radius,
      0,
      2 * Math.PI
    )
    context.fill()
  }

  function onTick() {
    move()
    collision()
    reset()
    render()

    scheduleNextTick()
  }

  function move() {
    moveBars(bars)
    moveBall(ball)
  }

  function moveBars(bars) {
    moveBar0(bars[0])
    moveBar1(bars[1], ball)
  }

  function moveBar0(bar) {
    const gamepadIndex = gamepadIndexes[0]
    moveBarManually(bar, ball, gamepadIndex)
  }

  function moveBar1(bar, ball) {
    const gamepadIndex = gamepadIndexes[1]
    if (gamepadIndex !== null) {
      moveBar1Manually(bar, ball)
    } else {
      moveBar1Automatically(bar, ball)
    }
  }

  function moveBar1Manually(bar, ball) {
    const gamepadIndex = gamepadIndexes[1]
    moveBarManually(bar, ball, gamepadIndex)
  }

  function moveBarManually(bar, ball, gamepadIndex) {
    if (gamepadIndex !== null) {
      const gamepad = navigator.getGamepads()[gamepadIndex]
      const newBarPosition = { ...bar.position }
      const buttons = gamepad.buttons
      const keyMapping = keyMappings.get(gamepad.id)
      if (keyMapping.get(Keys.Down)(gamepad)) {
        newBarPosition.y += Bar.STEP_SIZE
      }
      if (keyMapping.get(Keys.Up)(gamepad)) {
        newBarPosition.y -= Bar.STEP_SIZE
      }
      newBarPosition.y = Math.min(
        Math.max(0, newBarPosition.y),
        canvas.height - bar.size.height
      )
      bar.position = newBarPosition
    }
  }

  function moveBar1Automatically(bar, ball) {
    let y = bar.position.y
    const barCenterY = y + 0.5 * Bar.HEIGHT
    if (ball.position.y > barCenterY) {
      y += Bar.STEP_SIZE
    } else if (ball.position.y < barCenterY) {
      y -= Bar.STEP_SIZE
    }
    y = Math.min(
      Math.max(0, y),
      canvas.height - bar.size.height
    )
    bar.position.y = y
  }

  function moveBall(ball) {
    ball.position.x += Ball.MOVE_STEP * Math.cos(ball.angle)
    ball.position.y += Ball.MOVE_STEP * Math.sin(ball.angle)
  }

  function collision() {
    ballCollision(ball)
  }

  function ballCollision(ball) {
    if (isBallIntersectingBar0(ball)) {
      if (ball.angle <= Math.PI) {
        ball.angle = 0.5 * Math.PI - (ball.angle - 0.5 * Math.PI)
      } else {
        ball.angle = 1.5 * Math.PI + (ball.angle - Math.PI)
      }
    } else if (isBallIntersectingBar1(ball)) {
      if (ball.angle <= Math.PI) {
        ball.angle = Math.PI - ball.angle
      } else {
        ball.angle = 1.5 * Math.PI - (ball.angle - 1.5 * Math.PI)
      }
    } else if (ball.position.y - ball.radius < 0) {
      ball.angle = 0.5 * Math.PI + (ball.angle - Math.PI)
    } else if (ball.position.y + ball.radius > canvas.height - 1) {
      ball.angle = 1.5 * Math.PI + ball.angle
    }
  }

  function isBallIntersectingBar0(ball) {
    const bar = bars[0]
    return (
      ball.position.x - ball.radius <= bar.position.x + bar.size.width &&
      ball.position.y >= bar.position.y &&
      ball.position.y <= bar.position.y + bar.size.height
    )
  }

  function isBallIntersectingBar1(ball) {
    const bar = bars[1]
    return (
      ball.position.x + ball.radius >= bar.position.x &&
      ball.position.y >= bar.position.y &&
      ball.position.y <= bar.position.y + bar.size.height
    )
  }

  function intersects(a, b) {
    return (
      a.position.x >= b.position.x &&
      a.position.x <= b.position.x + b.size.width &&
      a.position.y >= b.position.y &&
      a.position.y <= b.position.y + b.size.height
    )
  }

  function reset() {
    if (
      ball.position.x - ball.radius < 0 ||
      ball.position.x + ball.radius >= canvas.width
    ) {
      ball.position = { ...initialBallPosition }
    }
  }

  function scheduleNextTick() {
    requestAnimationFrame(onTick)
  }

  scheduleNextTick()
}

main()
