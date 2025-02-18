import React, { useRef, useEffect, useReducer } from 'react'

/* ==============================
   Tipado y Reducer para estado global
   ============================== */
type GameStatus = 'playing' | 'gameover'

interface GameState {
  score: number
  status: GameStatus
}

type GameAction =
  | { type: 'INCREMENT_SCORE'; payload: number }
  | { type: 'RESET' }
  | { type: 'GAME_OVER' }

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INCREMENT_SCORE':
      return { ...state, score: action.payload }
    case 'RESET':
      return { score: 0, status: 'playing' }
    case 'GAME_OVER':
      return { ...state, status: 'gameover' }
    default:
      return state
  }
}

/* ==============================
      Tipado interno para la lógica del juego
      ============================== */
type Mode = 'bounce' | 'fall' | 'gameover'

interface Box {
  x: number
  y: number
  width: number
  color: string
}

interface InternalGame {
  boxes: Box[]
  debris: Box
  scrollCounter: number
  cameraY: number
  current: number
  mode: Mode
  xSpeed: number
  ySpeed: number
}

/* Constantes del juego */
const INITIAL_BOX_WIDTH = 200
const INITIAL_BOX_Y = 700
const BOX_HEIGHT = 50
const INITIAL_SPEED_Y = 5
const INITIAL_SPEED_X = 5
const MODES: { FALL: Mode; BOUNCE: Mode; GAMEOVER: Mode } = {
  FALL: 'fall',
  BOUNCE: 'bounce',
  GAMEOVER: 'gameover'
}

/* ==============================
      Hook personalizado con la lógica del juego
      ============================== */

export function useStackGame(
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const [gameState, dispatch] = useReducer(gameReducer, {
    score: 0,
    status: 'playing'
  })
  // Variables internas almacenadas en un ref para evitar re-renderizados
  const gameRef = useRef<InternalGame>({
    boxes: [],
    debris: { x: 0, y: 0, width: 0, color: 'white' },
    scrollCounter: 0,
    cameraY: 0,
    current: 1,
    mode: MODES.BOUNCE,
    xSpeed: INITIAL_SPEED_X,
    ySpeed: INITIAL_SPEED_Y
  })
  // Permite exponer la función de reinicio fuera del hook
  const restartRef = useRef<() => void>(() => {})

  useEffect(() => {
    let animationId: number
    const canvas = canvasRef.current
    if (canvas === null) return // Verifica que el canvas exista
    const ctx = canvas.getContext('2d')
    if (ctx === null) return // Verifica que el contexto exista

    const game = gameRef.current

    function createStepColor(step: number): string {
      if (step === 0) return 'white'
      const red = Math.floor(Math.random() * 255)
      const green = Math.floor(Math.random() * 255)
      const blue = Math.floor(Math.random() * 255)
      return `rgba(${red}, ${green}, ${blue}, 0.5)`
    }

    function updateCamera() {
      if (game.scrollCounter > 0) {
        game.cameraY++
        game.scrollCounter--
      }
    }

    function createNewBox() {
      const previousBox = game.boxes[game.current - 1]
      game.boxes[game.current] = {
        x: 0,
        y: (game.current + 10) * BOX_HEIGHT,
        width: previousBox.width,
        color: createStepColor(game.current)
      }
    }

    function init() {
      game.boxes = [
        {
          x: canvas.width / 2 - INITIAL_BOX_WIDTH / 2,
          y: 200,
          width: INITIAL_BOX_WIDTH,
          color: 'white'
        }
      ]
      game.debris = { x: 0, y: 0, width: 0, color: 'white' }
      game.scrollCounter = 0
      game.cameraY = 0
      game.current = 1
      game.mode = MODES.BOUNCE
      game.xSpeed = INITIAL_SPEED_X
      game.ySpeed = INITIAL_SPEED_Y
      dispatch({ type: 'RESET' })
      createNewBox()
    }

    function restart() {
      init()
      draw()
    }
    restartRef.current = restart

    function draw() {
      if (game.mode === MODES.GAMEOVER) return
      drawBackground()
      drawBoxes()
      drawDebris()

      if (game.mode === MODES.BOUNCE) {
        moveAndDetectCollision()
      } else if (game.mode === MODES.FALL) {
        updateFallMode()
      }

      game.debris.y -= game.ySpeed
      updateCamera()

      animationId = window.requestAnimationFrame(draw)
    }

    function drawBackground() {
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    function drawBoxes() {
      game.boxes.forEach((box) => {
        const newY = INITIAL_BOX_Y - box.y + game.cameraY
        ctx.fillStyle = box.color
        ctx.fillRect(box.x, newY, box.width, BOX_HEIGHT)
      })
    }

    function drawDebris() {
      const newY = INITIAL_BOX_Y - game.debris.y + game.cameraY
      ctx.fillStyle = game.debris.color
      ctx.fillRect(game.debris.x, newY, game.debris.width, BOX_HEIGHT)
    }

    function moveAndDetectCollision() {
      const currentBox = game.boxes[game.current]
      currentBox.x += game.xSpeed
      if (
        (game.xSpeed > 0 && currentBox.x + currentBox.width > canvas.width) ||
        (game.xSpeed < 0 && currentBox.x < 0)
      ) {
        game.xSpeed = -game.xSpeed
      }
    }

    function updateFallMode() {
      const currentBox = game.boxes[game.current]
      currentBox.y -= game.ySpeed
      const previousBoxY = game.boxes[game.current - 1].y + BOX_HEIGHT
      if (currentBox.y <= previousBoxY) {
        currentBox.y = previousBoxY
        handleBoxLanding()
      }
    }

    function handleBoxLanding() {
      const currentBox = game.boxes[game.current]
      const previousBox = game.boxes[game.current - 1]
      const diff = currentBox.x - previousBox.x
      if (Math.abs(diff) >= currentBox.width) {
        gameOver()
        return
      }
      if (currentBox.x > previousBox.x) {
        currentBox.width -= diff
      } else {
        currentBox.width += diff
        currentBox.x = previousBox.x
      }
      game.debris = {
        x:
          currentBox.x > previousBox.x
            ? currentBox.x + currentBox.width
            : currentBox.x,
        y: currentBox.y,
        width: diff,
        color: currentBox.color
      }
      game.current++
      game.scrollCounter = BOX_HEIGHT
      game.mode = MODES.BOUNCE
      dispatch({ type: 'INCREMENT_SCORE', payload: game.current - 1 })
      createNewBox()
    }

    function gameOver() {
      game.mode = MODES.GAMEOVER
      dispatch({ type: 'GAME_OVER' })
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = 'bold 30px Arial'
      ctx.fillStyle = 'white'
      ctx.textAlign = 'center'
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2)
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === ' ' && game.mode === MODES.BOUNCE) {
        game.mode = MODES.FALL
      }
    }

    function handlePointerDown() {
      if (game.mode === MODES.GAMEOVER) {
        restart()
      } else if (game.mode === MODES.BOUNCE) {
        game.mode = MODES.FALL
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    canvas.addEventListener('pointerdown', handlePointerDown)

    init()
    draw()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      window.cancelAnimationFrame(animationId)
    }
  }, [canvasRef])

  return { gameState, restart: restartRef.current }
}
