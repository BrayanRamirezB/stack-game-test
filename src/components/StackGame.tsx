import { useRef, type FC } from 'react'
import { useStackGame } from '@/hooks/useStackGame'

const StackGame: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { gameState, restart } = useStackGame(canvasRef)

  return (
    <div className='text-neutral-100 flex flex-col items-center justify-center relative gap-y-4'>
      <div className='flex justify-center items-center text-lg font-semibold backdrop-blur-md shadow-md border-0 rounded-lg bg-neutral-100/10 px-4 py-2 w-fit hover:scale-105 transition-transform duration-300 cursor-default'>
        Puntuación: {gameState.score}
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={600}
        className='backdrop-blur-md border-0 rounded-xl shadow-lg bg-neutral-100/10 cursor-pointer'
      />
      {gameState.status === 'gameover' && (
        <button
          onClick={restart}
          className='px-4 py-2 w-full backdrop-blur-md shadow-lg border-0 text-neutral-100 bg-red-500/50 hover:bg-red-600/50 rounded-xl cursor-pointer transition-transform duration-300 hover:-translate-y-1'
        >
          Reiniciar
        </button>
      )}
    </div>
  )
}

export default StackGame
