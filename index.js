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

  let gamepadIndex = null

  window.addEventListener('gamepadconnected', function (event) {
    if (gamepadIndex === null) {
      gamepadIndex = event.gamepad.index
    }
  })

  window.addEventListener('gamepaddisconnected', function (event) {
    if (gamepadIndex === event.gamepad.index) {
      gamepadIndex = null
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
    if (gamepadIndex !== null) {
      const gamepad = navigator.getGamepads()[gamepadIndex]
      const newBar0Position = { ...bar.position }
      const buttons = gamepad.buttons
      if (buttons[13].pressed) {
        newBar0Position.y += Bar.STEP_SIZE
      }
      if (buttons[12].pressed) {
        newBar0Position.y -= Bar.STEP_SIZE
      }
      newBar0Position.y = Math.min(
        Math.max(0, newBar0Position.y),
        canvas.height - bar.size.height
      )
      bar.position = newBar0Position
    }
  }

  function moveBar1(bar, ball) {
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
