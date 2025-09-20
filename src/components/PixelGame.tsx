import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, Recycle, TreePine, Droplets } from 'lucide-react';

interface PixelGameProps {
  onScoreUpdate?: (score: number) => void;
}

interface TeacherMessage {
  message: string;
  timestamp: number;
  character: string;
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
  const [teacherMessage, setTeacherMessage] = useState<TeacherMessage | null>(null);
  const [showTeacher, setShowTeacher] = useState(false);
  const [gameLevel, setGameLevel] = useState(1);
  const lastScoreMilestone = useRef(0);
  
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

  // Environmental collectible items with types
  const collectiblesRef = useRef<Array<{ 
    x: number; 
    y: number; 
    collected: boolean; 
    type: 'tree' | 'water' | 'recycle' | 'energy';
    icon: string;
    color: string;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize environmental collectibles
    const collectibleTypes = [
      { type: 'tree' as const, icon: '🌳', color: '#228B22' },
      { type: 'water' as const, icon: '💧', color: '#1E90FF' },
      { type: 'recycle' as const, icon: '♻️', color: '#32CD32' },
      { type: 'energy' as const, icon: '☀️', color: '#FFD700' }
    ];
    
    collectiblesRef.current = Array.from({ length: 12 }, () => {
      const typeData = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
      return {
        x: Math.random() * (canvas.width - 40) + 20,
        y: Math.random() * (canvas.height - 80) + 40,
        collected: false,
        ...typeData
      };
    });

    // Initialize teacher welcome
    getTeacherMessage('welcome');

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
          // Draw collectible with environmental theme
          ctx.fillStyle = collectible.color;
          ctx.fillRect(collectible.x, collectible.y, 20, 20);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '16px Arial';
          ctx.fillText(collectible.icon, collectible.x + 2, collectible.y + 16);
          
          // Check collision with character
          if (
            character.x < collectible.x + 20 &&
            character.x + character.width > collectible.x &&
            character.y < collectible.y + 20 &&
            character.y + character.height > collectible.y
          ) {
            collectible.collected = true;
            const newScore = score + 15;
            setScore(newScore);
            onScoreUpdate?.(newScore);
            
            // Trigger teacher message for collection
            getTeacherMessage('collection_tip', newScore, collectible.type);
            
            // Check for score milestones
            if (newScore >= lastScoreMilestone.current + 50) {
              lastScoreMilestone.current = Math.floor(newScore / 50) * 50;
              setTimeout(() => getTeacherMessage('score_milestone', newScore), 2000);
            }
          }
        }
      });

      // Draw character
      drawCharacter(ctx, character);

      // Draw enhanced UI
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(10, 10, 180, 60);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Score: ${score}`, 20, 30);
      ctx.font = '14px Arial';
      ctx.fillText(`Level: ${gameLevel}`, 20, 50);
      ctx.fillText(`🌱 Eco-Warrior Mode`, 20, 65);
      
      // Draw teacher character indicator
      if (showTeacher) {
        ctx.fillStyle = 'rgba(76, 175, 80, 0.9)';
        ctx.fillRect(canvas.width - 80, 10, 70, 50);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial';
        ctx.fillText('🌱', canvas.width - 70, 35);
        ctx.font = '12px Arial';
        ctx.fillText('Eco Teacher', canvas.width - 75, 50);
      }

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

  const getTeacherMessage = async (action: string, currentScore?: number, gameEvent?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('eco-teacher', {
        body: { action, score: currentScore || score, gameEvent }
      });
      
      if (error) throw error;
      
      setTeacherMessage(data);
      setShowTeacher(true);
      
      // Auto-hide after 8 seconds
      setTimeout(() => setShowTeacher(false), 8000);
    } catch (error) {
      console.error('Teacher message error:', error);
      // Fallback message
      setTeacherMessage({
        message: "Keep going, eco-warrior! Every action counts for our planet! 🌍",
        character: 'eco-teacher',
        timestamp: Date.now()
      });
      setShowTeacher(true);
      setTimeout(() => setShowTeacher(false), 5000);
    }
  };

  const getRandomTip = () => {
    getTeacherMessage('random_tip');
  };

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
    <div className="flex flex-col space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="bg-card rounded-lg p-4 border border-eco-accent/20">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={600} 
              className="border border-eco-accent/30 rounded"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="text-sm text-muted-foreground text-center mt-2">
            Use WASD or Arrow keys to move • Collect environmental items! 🌍
          </div>
        </div>
        
        {/* Teacher Panel */}
        <div className="w-80">
          <Card className="border-eco-primary/20 bg-gradient-to-br from-eco-light/10 to-eco-surface/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-eco-primary to-eco-secondary rounded-full flex items-center justify-center text-2xl">
                  🌱
                </div>
                <div>
                  <h3 className="font-semibold text-eco-primary">Eco Teacher</h3>
                  <p className="text-xs text-muted-foreground">Your Environmental Guide</p>
                </div>
              </div>
              
              {teacherMessage && (
                <div className="bg-background/50 rounded-lg p-3 mb-4 min-h-[100px] border border-eco-accent/20">
                  <p className="text-sm leading-relaxed">{teacherMessage.message}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Button 
                  onClick={getRandomTip} 
                  size="sm" 
                  variant="outline"
                  className="w-full border-eco-accent/30 hover:bg-eco-light/10"
                >
                  <Leaf className="w-4 h-4 mr-2" />
                  Get Eco Tip
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-eco-light/10 rounded border border-eco-accent/20">
                    <TreePine className="w-5 h-5 mx-auto text-eco-primary mb-1" />
                    <p className="text-xs font-medium">Trees</p>
                    <p className="text-xs text-muted-foreground">🌳 = 15pts</p>
                  </div>
                  <div className="text-center p-2 bg-eco-light/10 rounded border border-eco-accent/20">
                    <Droplets className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                    <p className="text-xs font-medium">Water</p>
                    <p className="text-xs text-muted-foreground">💧 = 15pts</p>
                  </div>
                  <div className="text-center p-2 bg-eco-light/10 rounded border border-eco-accent/20">
                    <Recycle className="w-5 h-5 mx-auto text-green-500 mb-1" />
                    <p className="text-xs font-medium">Recycle</p>
                    <p className="text-xs text-muted-foreground">♻️ = 15pts</p>
                  </div>
                  <div className="text-center p-2 bg-eco-light/10 rounded border border-eco-accent/20">
                    <div className="w-5 h-5 mx-auto bg-yellow-500 rounded-full mb-1 flex items-center justify-center text-xs">☀️</div>
                    <p className="text-xs font-medium">Energy</p>
                    <p className="text-xs text-muted-foreground">☀️ = 15pts</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};