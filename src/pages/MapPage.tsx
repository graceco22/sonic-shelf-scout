import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Square, ChevronRight, ArrowLeft, Volume2, Check } from "lucide-react";
import { toast } from "sonner";
import StoreMapSVG from "@/components/StoreMapSVG";
import NutritionPanel from "@/components/NutritionPanel";

type GroceryItem = {
  id: string;
  name: string;
  emoji: string;
  aisle: string;
  price: string;
  x: number;
  y: number;
};

const ITEMS: GroceryItem[] = [
  { id: "carrots", name: "Carrot", emoji: "🥕", aisle: "Aisle 3", price: "$1.99", x: 100, y: 280 },
  { id: "eggs", name: "Eggs", emoji: "🥚", aisle: "Aisle 9", price: "$2.95", x: 350, y: 120 },
  { id: "milk", name: "Milk", emoji: "🥛", aisle: "Aisle 12", price: "$3.25", x: 450, y: 320 },
];

const CART_START = { x: 50, y: 50 };

type Point = { x: number; y: number };

// Aisle shelf boundaries (obstacles)
const AISLES = [
  { x1: 140, x2: 178 },
  { x1: 250, x2: 288 },
  { x1: 360, x2: 398 },
];

const TOP_CORRIDOR_Y = 40;
const BOTTOM_CORRIDOR_Y = 360;

function pathCrossesAisle(fromX: number, toX: number): boolean {
  const minX = Math.min(fromX, toX);
  const maxX = Math.max(fromX, toX);
  return AISLES.some((a) => minX < a.x2 && maxX > a.x1);
}

function computePath(from: Point, to: Point): Point[] {
  if (pathCrossesAisle(from.x, to.x)) {
    const topDist = Math.abs(from.y - TOP_CORRIDOR_Y) + Math.abs(to.y - TOP_CORRIDOR_Y);
    const bottomDist = Math.abs(from.y - BOTTOM_CORRIDOR_Y) + Math.abs(to.y - BOTTOM_CORRIDOR_Y);
    const corridorY = topDist <= bottomDist ? TOP_CORRIDOR_Y : BOTTOM_CORRIDOR_Y;
    return [
      { x: from.x, y: corridorY },
      { x: to.x, y: corridorY },
      to,
    ];
  }
  if (Math.abs(from.x - to.x) > 2) {
    return [{ x: to.x, y: from.y }, to];
  }
  return [to];
}

const MapPage = () => {
  const navigate = useNavigate();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [cartPosition, setCartPosition] = useState(CART_START);
  const [arrived, setArrived] = useState(false);
  const [collectedItems, setCollectedItems] = useState<string[]>([]);
  const [showNutrition, setShowNutrition] = useState<string | null>(null);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [waypoints, setWaypoints] = useState<Point[]>([]);
  const [waypointIndex, setWaypointIndex] = useState(0);

  const currentItem = ITEMS[currentItemIndex];
  const allCollected = collectedItems.length === ITEMS.length;

  // Preview path when not moving
  const previewPath = useMemo(() => {
    if (isMoving || !currentItem || arrived || collectedItems.includes(currentItem.id)) return [];
    return computePath(cartPosition, { x: currentItem.x, y: currentItem.y });
  }, [isMoving, currentItem, arrived, collectedItems, cartPosition]);

  const displayPath = isMoving ? waypoints.slice(waypointIndex) : previewPath;

  useEffect(() => {
    if (!isMoving || waypoints.length === 0) return;
    const target = waypoints[waypointIndex];
    if (!target) return;
    const speed = 2;
    const interval = setInterval(() => {
      setCartPosition((prev) => {
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < speed) {
          if (waypointIndex < waypoints.length - 1) {
            setWaypointIndex((i) => i + 1);
          } else {
            setIsMoving(false);
            setArrived(true);
            toast.success(`Found ${currentItem!.emoji} ${currentItem!.name}!`);
          }
          return target;
        }
        return {
          x: prev.x + (dx / dist) * speed,
          y: prev.y + (dy / dist) * speed,
        };
      });
    }, 16);
    return () => clearInterval(interval);
  }, [isMoving, waypointIndex, waypoints, currentItem]);

  const handleStart = () => {
    if (!currentItem) return;
    const path = computePath(cartPosition, { x: currentItem.x, y: currentItem.y });
    setWaypoints(path);
    setWaypointIndex(0);
    setIsMoving(true);
    setArrived(false);
  };

  const handleStop = () => setIsMoving(false);

  const handleCollect = () => {
    if (!currentItem) return;
    setCollectedItems((prev) => [...prev, currentItem.id]);
    setShowNutrition(currentItem.id);
    setArrived(false);
  };

  const handleNextItem = () => {
    setShowNutrition(null);
    if (currentItemIndex < ITEMS.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);
      setArrived(false);
    }
  };

  const handleVoiceGuidance = async () => {
    if (!currentItem || isVoicePlaying) return;
    setIsVoicePlaying(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-guidance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ itemName: currentItem.name, aisle: currentItem.aisle }),
        }
      );
      if (!response.ok) throw new Error("Voice guidance failed");
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsVoicePlaying(false);
      await audio.play();
    } catch (err) {
      console.error("Voice guidance error:", err);
      toast.error("Voice guidance unavailable");
      setIsVoicePlaying(false);
    }
  };

  return (
    <div className="min-h-screen sky-gradient relative overflow-hidden">
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-5 py-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm font-body">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {/* <h1 className="font-display font-bold text-white text-base tracking-wide">Store Map</h1> */}
        <button
          onClick={handleVoiceGuidance}
          disabled={isVoicePlaying}
          className="text-white/80 hover:text-white transition-colors disabled:opacity-40"
        >
          <Volume2 className={`w-4 h-4 ${isVoicePlaying ? "animate-pulse-dot" : ""}`} />
        </button>
      </div>

      <main className="relative z-10 max-w-xl mx-auto px-5 pb-28">
        {allCollected && !showNutrition ? (
          <div className="text-center py-16 animate-slide-up">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-display font-bold text-white mb-1">All Items Collected!</h2>
            <p className="text-white/60 font-body text-sm mb-8">Great job on your healthy grocery run</p>
            <Button variant="hero" className="rounded-full px-10 shadow-lg" onClick={() => navigate("/summary", { state: { items: ITEMS.map(i => ({ name: i.name, emoji: i.emoji, price: i.price })) } })}>
              View Shopping Summary
            </Button>
          </div>
        ) : showNutrition ? (
          <NutritionPanel
            itemId={showNutrition}
            itemName={ITEMS.find((i) => i.id === showNutrition)?.name || ""}
            itemEmoji={ITEMS.find((i) => i.id === showNutrition)?.emoji || ""}
            onContinue={handleNextItem}
            isLastItem={currentItemIndex === ITEMS.length - 1}
          />
        ) : (
          <>
            {/* Current Target */}
            <div className="grocery-card mb-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">{currentItem?.emoji}</span>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground text-sm">{currentItem?.name}</h3>
                    <p className="text-xs text-muted-foreground font-body">{currentItem?.aisle}</p>
                  </div>
                </div>
                <span className="text-xs font-body font-semibold text-foreground">{currentItem?.price}</span>
              </div>
            </div>

            {/* Map */}
            <div className="grocery-card mb-3 p-1.5 overflow-hidden animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <StoreMapSVG
                cartPosition={cartPosition}
                targetItem={currentItem}
                items={ITEMS}
                collectedItems={collectedItems}
                isMoving={isMoving}
                pathPoints={displayPath}
              />
            </div>

            {/* Controls */}
            <div className="flex gap-2.5 justify-center mb-5 animate-slide-up" style={{ animationDelay: "0.15s" }}>
              {arrived ? (
                <Button variant="hero" size="lg" className="rounded-full px-8 shadow-md" onClick={handleCollect}>
                  Collect {currentItem?.emoji} {currentItem?.name}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <>
                  <Button variant="hero" size="lg" className="rounded-full px-8 shadow-md" onClick={handleStart} disabled={isMoving}>
                    <Play className="w-4 h-4 mr-1" /> Start
                  </Button>
                  <Button variant="secondary" size="lg" className="rounded-full px-8" onClick={handleStop} disabled={!isMoving}>
                    <Square className="w-4 h-4 mr-1" /> Stop
                  </Button>
                </>
              )}
            </div>

            {/* Progress bar */}
            <div className="mb-4 animate-slide-up" style={{ animationDelay: "0.18s" }}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-body font-semibold text-white/80">Progress</span>
                <span className="text-xs font-body text-white/60">{collectedItems.length}/{ITEMS.length}</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(collectedItems.length / ITEMS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Item List */}
            <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-sm font-display font-semibold text-white/90 mb-2">Shopping List</h2>
              <div className="space-y-2">
                {ITEMS.map((item) => {
                  const isCollected = collectedItems.includes(item.id);
                  return (
                    <div key={item.id} className={`grocery-card flex items-center gap-3 p-3 ${isCollected ? "opacity-50" : ""}`}>
                      <span className="text-lg">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-display font-semibold text-foreground text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground font-body ml-1.5">{item.aisle}</span>
                      </div>
                      <span className="text-xs font-body text-muted-foreground mr-2">{item.price}</span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isCollected ? "bg-primary text-white" : "border border-border"}`}>
                        {isCollected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MapPage;
