import { useEffect, useRef, useState } from 'react';

interface PixelGameProps {
  onScoreUpdate?: (score: number) => void;
}

interface Character {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  frame: number;
  direction: 'down' | 'up' | 'left' | 'right';
  isMoving: boolean;
}

export const PixelGame = ({ onScoreUpdate }: PixelGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  
  const characterRef = useRef<Character>({
    x: 400,
    y: 300,
    width: 32,
    height: 32,
    speed: 4,
    frame: 0,
    direction: 'down',
    isMoving: false
  });

  // Simple collectible items
  const collectiblesRef = useRef<Array<{ x: number; y: number; collected: boolean }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize collectibles
    collectiblesRef.current = Array.from({ length: 10 }, () => ({
      x: Math.random() * (canvas.width - 20) + 10,
      y: Math.random() * (canvas.height - 20) + 10,
      collected: false
    }));

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = () => {
      const character = characterRef.current;
      const keys = keysRef.current;

      // Clear canvas
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw parallax background layers
      drawParallaxBackground(ctx, canvas.width, canvas.height);

      // Update character movement
      character.isMoving = false;
      let newX = character.x;
      let newY = character.y;

      if (keys.has('arrowup') || keys.has('w')) {
        newY -= character.speed;
        character.direction = 'up';
        character.isMoving = true;
      }
      if (keys.has('arrowdown') || keys.has('s')) {
        newY += character.speed;
        character.direction = 'down';
        character.isMoving = true;
      }
      if (keys.has('arrowleft') || keys.has('a')) {
        newX -= character.speed;
        character.direction = 'left';
        character.isMoving = true;
      }
      if (keys.has('arrowright') || keys.has('d')) {
        newX += character.speed;
        character.direction = 'right';
        character.isMoving = true;
      }

      // Boundary checking
      if (newX >= 0 && newX <= canvas.width - character.width) {
        character.x = newX;
      }
      if (newY >= 0 && newY <= canvas.height - character.height) {
        character.y = newY;
      }

      // Update animation frame
      if (character.isMoving) {
        character.frame = (character.frame + 0.2) % 4;
      } else {
        character.frame = 0;
      }

      // Draw collectibles
      collectiblesRef.current.forEach((collectible) => {
        if (!collectible.collected) {
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(collectible.x, collectible.y, 16, 16);
          
          // Check collision with character
          if (
            character.x < collectible.x + 16 &&
            character.x + character.width > collectible.x &&
            character.y < collectible.y + 16 &&
            character.y + character.height > collectible.y
          ) {
            collectible.collected = true;
            const newScore = score + 10;
            setScore(newScore);
            onScoreUpdate?.(newScore);
          }
        }
      });

      // Draw character
      drawCharacter(ctx, character);

      // Draw UI
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 120, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px monospace';
      ctx.fillText(`Score: ${score}`, 20, 30);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [score, onScoreUpdate]);

  const drawParallaxBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Background layer 1 - sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Background layer 2 - distant mountains
    ctx.fillStyle = '#90EE90';
    for (let i = 0; i < width; i += 100) {
      const h = Math.sin(i * 0.01) * 50 + 100;
      ctx.fillRect(i, height - h, 100, h);
    }

    // Background layer 3 - trees
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < width; i += 80) {
      const x = i + (Math.sin(i * 0.02) * 20);
      drawSimpleTree(ctx, x, height - 80);
    }

    // Ground
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(0, height - 40, width, 40);
  };

  const drawSimpleTree = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 15, y + 20, 10, 20);
    
    // Leaves
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x, y, 40, 30);
  };

  const drawCharacter = (ctx: CanvasRenderingContext2D, character: Character) => {
    const { x, y, width, height, frame, direction, isMoving } = character;
    
    // Simple pixelated character
    ctx.fillStyle = '#FF6B6B'; // Body color
    ctx.fillRect(x + 8, y + 8, 16, 20);
    
    // Head
    ctx.fillStyle = '#FFE4B5';
    ctx.fillRect(x + 10, y + 2, 12, 12);
    
    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 12, y + 5, 2, 2);
    ctx.fillRect(x + 18, y + 5, 2, 2);
    
    // Arms and legs with animation
    ctx.fillStyle = '#FF6B6B';
    if (isMoving) {
      const offset = Math.sin(frame * 2) * 2;
      
      // Animated arms
      ctx.fillRect(x + 4, y + 12 + offset, 4, 8);
      ctx.fillRect(x + 24, y + 12 - offset, 4, 8);
      
      // Animated legs
      ctx.fillRect(x + 10, y + 24 + offset, 4, 8);
      ctx.fillRect(x + 18, y + 24 - offset, 4, 8);
    } else {
      // Static pose
      ctx.fillRect(x + 4, y + 12, 4, 8);
      ctx.fillRect(x + 24, y + 12, 4, 8);
      ctx.fillRect(x + 10, y + 24, 4, 8);
      ctx.fillRect(x + 18, y + 24, 4, 8);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-card rounded-lg p-4 border border-eco-accent/20">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          className="border border-eco-accent/30 rounded"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <div className="text-sm text-muted-foreground text-center">
        Use WASD or Arrow keys to move • Collect golden squares for points!
      </div>
    </div>
  );
};