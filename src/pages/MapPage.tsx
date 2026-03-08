import { useState, useEffect, useCallback } from "react";
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
      <div className="mountain-wave" />

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="font-display font-bold text-foreground text-lg">Store Map</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleVoiceGuidance}
          disabled={isVoicePlaying}
          className="text-muted-foreground"
        >
          <Volume2 className={`w-4 h-4 ${isVoicePlaying ? "animate-pulse-dot" : ""}`} />
        </Button>
      </div>

      <main className="relative z-10 max-w-xl mx-auto px-4 pb-32">
        {allCollected && !showNutrition ? (
          <div className="text-center py-12 animate-slide-up">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">All Items Collected!</h2>
            <p className="text-muted-foreground font-body mb-6">Great job on your healthy grocery run!</p>
            <Button variant="hero" className="rounded-full px-10" onClick={() => navigate("/summary", { state: { items: ITEMS.map(i => ({ name: i.name, emoji: i.emoji, price: i.price })) } })}>
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
            <div className="grocery-card mb-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentItem?.emoji}</span>
                  <div>
                    <h3 className="font-display font-bold text-foreground">{currentItem?.name}</h3>
                    <p className="text-sm text-muted-foreground font-body">{currentItem?.aisle}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground font-body">{currentItem?.price}</span>
              </div>
            </div>

            {/* Map */}
            <div className="grocery-card mb-4 p-2 overflow-hidden animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <StoreMapSVG
                cartPosition={cartPosition}
                targetItem={currentItem}
                items={ITEMS}
                collectedItems={collectedItems}
                isMoving={isMoving}
              />
            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-center mb-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
              {arrived ? (
                <Button variant="hero" size="lg" className="rounded-full px-8" onClick={handleCollect}>
                  Collect {currentItem?.emoji} {currentItem?.name}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <>
                  <Button variant="hero" size="lg" className="rounded-full px-8" onClick={handleStart} disabled={isMoving}>
                    <Play className="w-4 h-4 mr-1" /> Start
                  </Button>
                  <Button variant="secondary" size="lg" className="rounded-full px-8" onClick={handleStop} disabled={!isMoving}>
                    <Square className="w-4 h-4 mr-1" /> Stop
                  </Button>
                </>
              )}
            </div>

            {/* Item List */}
            <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-lg font-display font-bold text-foreground text-center mb-1">Item List</h2>
              <p className="text-sm text-muted-foreground font-body text-center mb-3">
                {collectedItems.length}/{ITEMS.length} collected
              </p>
              <div className="space-y-3">
                {ITEMS.map((item) => {
                  const isCollected = collectedItems.includes(item.id);
                  return (
                    <div key={item.id} className={`grocery-card flex items-center gap-4 p-4 ${isCollected ? "opacity-60" : ""}`}>
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1">
                        <span className="font-display font-bold text-foreground">{item.name}</span>
                        <span className="text-sm text-muted-foreground font-body ml-2">{item.aisle} · {item.price}</span>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCollected ? "bg-primary text-primary-foreground" : "bg-primary/10 border-2 border-primary/30"}`}>
                        <Check className="w-4 h-4" />
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
