import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Play, Square, ChevronRight, ArrowLeft, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StoreMapSVG from "@/components/StoreMapSVG";
import NutritionPanel from "@/components/NutritionPanel";

type GroceryItem = {
  id: string;
  name: string;
  emoji: string;
  aisle: string;
  x: number;
  y: number;
};

const ITEMS: GroceryItem[] = [
  { id: "eggs", name: "Eggs", emoji: "🥚", aisle: "Aisle 3", x: 350, y: 120 },
  { id: "carrots", name: "Carrots", emoji: "🥕", aisle: "Produce", x: 100, y: 280 },
  { id: "milk", name: "Milk", emoji: "🥛", aisle: "Dairy", x: 450, y: 320 },
];

const CART_START = { x: 50, y: 50 };

const MapPage = () => {
  const navigate = useNavigate();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [cartPosition, setCartPosition] = useState(CART_START);
  const [arrived, setArrived] = useState(false);
  const [collectedItems, setCollectedItems] = useState<string[]>([]);
  const [showNutrition, setShowNutrition] = useState<string | null>(null);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  const currentItem = ITEMS[currentItemIndex];
  const allCollected = collectedItems.length === ITEMS.length;

  // Animate cart movement
  useEffect(() => {
    if (!isMoving || !currentItem) return;

    const target = { x: currentItem.x, y: currentItem.y };
    const speed = 2;

    const interval = setInterval(() => {
      setCartPosition((prev) => {
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < speed) {
          setIsMoving(false);
          setArrived(true);
          toast.success(`Found ${currentItem.emoji} ${currentItem.name}!`);
          return target;
        }

        return {
          x: prev.x + (dx / dist) * speed,
          y: prev.y + (dy / dist) * speed,
        };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isMoving, currentItem]);

  const handleStart = () => {
    if (!currentItem) return;
    setIsMoving(true);
    setArrived(false);
  };

  const handleStop = () => {
    setIsMoving(false);
  };

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
          body: JSON.stringify({
            itemName: currentItem.name,
            aisle: currentItem.aisle,
          }),
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="font-display font-bold text-foreground text-lg">Store Map</h1>
        <div className="flex items-center gap-1 text-sm text-muted-foreground font-body">
          <ShoppingCart className="w-4 h-4" />
          {collectedItems.length}/{ITEMS.length}
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-4">
        {allCollected && !showNutrition ? (
          <div className="text-center py-12 animate-slide-up">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">All Items Collected!</h2>
            <p className="text-muted-foreground font-body mb-6">
              Great job! You've built a healthy grocery list.
            </p>
            <Button variant="hero" onClick={() => navigate("/")}>
              Back to Home
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
            <div className="grocery-card mb-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentItem?.emoji}</span>
                  <div>
                    <h3 className="font-display font-bold text-foreground">{currentItem?.name}</h3>
                    <p className="text-sm text-muted-foreground font-body">{currentItem?.aisle}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVoiceGuidance}
                  disabled={isVoicePlaying}
                  className="rounded-xl"
                >
                  <Volume2 className={`w-4 h-4 ${isVoicePlaying ? "animate-pulse-dot" : ""}`} />
                  {isVoicePlaying ? "Speaking..." : "Voice Guide"}
                </Button>
              </div>
            </div>

            {/* Map */}
            <div className="grocery-card mb-4 p-2 overflow-hidden">
              <StoreMapSVG
                cartPosition={cartPosition}
                targetItem={currentItem}
                items={ITEMS}
                collectedItems={collectedItems}
                isMoving={isMoving}
              />
            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
              {arrived ? (
                <Button variant="hero" size="lg" className="rounded-2xl px-8" onClick={handleCollect}>
                  Collect {currentItem?.emoji} {currentItem?.name}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="hero"
                    size="lg"
                    className="rounded-2xl px-8"
                    onClick={handleStart}
                    disabled={isMoving}
                  >
                    <Play className="w-4 h-4 mr-1" /> Start
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="rounded-2xl px-8"
                    onClick={handleStop}
                    disabled={!isMoving}
                  >
                    <Square className="w-4 h-4 mr-1" /> Stop
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MapPage;
