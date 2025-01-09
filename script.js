const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

const score = document.querySelector('#score')

const INITIAL_BOX_WIDTH = 200
const INITIAL_BOX_Y = 700

const BOX_HEIGHT = 50
const INITIAL_SPEED_Y = 5
const INITIAL_SPEED_X = 5

const MODES = {
  FALL: 'fall',
  BOUNCE: 'bounce',
  GAMEOVER: 'gameover'
}

let boxes = []
let debris = { x: 0, y: 0, width: 0, color: 'white' }
let scrollCounter, cameraY, current, mode, xSpeed, ySpeed

function createStepColor(step) {
  if (step === 0) return 'white'

  const red = Math.floor(Math.random() * 255)
  const green = Math.floor(Math.random() * 255)
  const blue = Math.floor(Math.random() * 255)

  return `rgb(${red}, ${green}, ${blue})`
}

function updateCamera() {
  if (scrollCounter > 0) {
    cameraY += 1
    scrollCounter--
  }
}

function init() {
  boxes = [
    {
      x: canvas.width / 2 - INITIAL_BOX_WIDTH / 2,
      y: 200,
      width: INITIAL_BOX_WIDTH,
      color: 'white'
    }
  ]
  debris = { x: 0, y: 0, width: 0, color: 'white' }
  scrollCounter = 0
  cameraY = 0
  current = 1
  mode = MODES.BOUNCE
  xSpeed = INITIAL_SPEED_X
  ySpeed = INITIAL_SPEED_Y
  score.textContent = current - 1

  createNewBox()
}

function restart() {
  init()
  draw()
}

function draw() {
  if (mode === MODES.GAMEOVER) return

  drawBackground()
  drawBoxes()
  drawDebris()

  if (mode === MODES.BOUNCE) {
    moveAndDetectCollision()
  } else if (mode === MODES.FALL) {
    updateFallMode()
  }

  debris.y -= ySpeed
  updateCamera()

  window.requestAnimationFrame(draw)
}

function drawBackground() {
  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function drawBoxes() {
  boxes.forEach((box) => {
    const { x, y, width, color } = box
    const newY = INITIAL_BOX_Y - y + cameraY

    ctx.fillStyle = color
    ctx.fillRect(x, newY, width, BOX_HEIGHT)
  })
}

function drawDebris() {
  const { x, y, width, color } = debris
  const newY = INITIAL_BOX_Y - y + cameraY

  ctx.fillStyle = color
  ctx.fillRect(x, newY, width, BOX_HEIGHT)
}

function createNewBox() {
  boxes[current] = {
    x: 0,
    y: (current + 10) * BOX_HEIGHT,
    width: boxes[current - 1].width,
    color: createStepColor(current)
  }
}

function moveAndDetectCollision() {
  const currentBox = boxes[current]
  currentBox.x += xSpeed

  const isMovingRight = xSpeed > 0
  const isMovingLeft = xSpeed < 0

  const hasHitRightSide = currentBox.x + currentBox.width > canvas.width

  const hasHitLeftSide = currentBox.x < 0

  if ((isMovingRight && hasHitRightSide) || (isMovingLeft && hasHitLeftSide)) {
    xSpeed = -xSpeed
  }
}

function updateFallMode() {
  const currentBox = boxes[current]
  currentBox.y -= ySpeed

  const postionPreviousBox = boxes[current - 1].y + BOX_HEIGHT

  if (currentBox.y === postionPreviousBox) {
    handleBoxLanding()
  }
}

function handleBoxLanding() {
  const currentBox = boxes[current]
  const previousBox = boxes[current - 1]

  const difference = currentBox.x - previousBox.x

  if (Math.abs(difference) >= currentBox.width) {
    gameOver()
    return
  }

  adjustCurrentBox(difference)
  createNewDebris(difference)

  //   xSpeed += xSpeed > 0 ? 1 : -1
  current++
  scrollCounter = BOX_HEIGHT
  mode = MODES.BOUNCE

  score.textContent = current - 1

  createNewBox()
}

function adjustCurrentBox(difference) {
  const currentBox = boxes[current]
  const previousBox = boxes[current - 1]

  if (currentBox.x > previousBox.x) {
    currentBox.width -= difference
  } else {
    currentBox.width += difference
    currentBox.x = previousBox.x
  }
}

function createNewDebris(difference) {
  const currentBox = boxes[current]
  const previousBox = boxes[current - 1]

  const debrisX =
    currentBox.x > previousBox.x
      ? currentBox.x + currentBox.width
      : currentBox.x

  debris = {
    x: debrisX,
    y: currentBox.y,
    width: difference,
    color: currentBox.color
  }
}

function gameOver() {
  mode = MODES.GAMEOVER

  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.font = 'bold 30px Arial'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2)
}

document.addEventListener('keydown', (event) => {
  if (event.key === ' ' && mode === MODES.BOUNCE) {
    mode = MODES.FALL
  }
})

canvas.onpointerdown = () => {
  if (mode === MODES.GAMEOVER) {
    restart()
  } else if (mode === MODES.BOUNCE) {
    mode = MODES.FALL
  }
}

restart()
