import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Volume2, Check } from "lucide-react";
import { toast } from "sonner";
import NutritionPanel from "@/components/NutritionPanel";
import mascotImg from "@/assets/mascot.png";

type GroceryItem = {
  id: string;
  name: string;
  emoji: string;
  aisle: string;
  price: string;
};

const ITEMS: GroceryItem[] = [
  { id: "carrots", name: "Carrot", emoji: "🥕", aisle: "Aisle 3", price: "$1.99" },
  { id: "eggs", name: "Eggs", emoji: "🥚", aisle: "Aisle 9", price: "$2.95" },
  { id: "milk", name: "Milk", emoji: "🥛", aisle: "Aisle 12", price: "$3.25" },
];

const MapPage = () => {
  const navigate = useNavigate();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [collectedItems, setCollectedItems] = useState<string[]>([]);
  const [showNutrition, setShowNutrition] = useState<string | null>(null);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  const currentItem = ITEMS[currentItemIndex];
  const allCollected = collectedItems.length === ITEMS.length;

  // Simulate navigation
  useEffect(() => {
    if (!isNavigating) return;
    const timer = setTimeout(() => {
      setIsNavigating(false);
      setArrived(true);
      toast.success(`Found ${currentItem?.emoji} ${currentItem?.name}!`);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isNavigating, currentItem]);

  const handleStart = () => {
    setIsNavigating(true);
    setArrived(false);
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

      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>

      {/* Voice guide */}
      <div className="absolute top-4 right-4 z-20">
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

      <main className="relative z-10 flex flex-col items-center px-4 pt-14 pb-32 max-w-md mx-auto">
        {allCollected && !showNutrition ? (
          <div className="text-center py-12 animate-slide-up">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">All Items Collected!</h2>
            <p className="text-muted-foreground font-body mb-6">Great job on your healthy grocery run!</p>
            <Button variant="hero" className="rounded-full px-10" onClick={() => navigate("/")}>
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
            {/* Heading */}
            <h1 className="text-2xl font-display font-bold text-primary text-center mb-2 animate-slide-up">
              {isNavigating ? "Let's find your\ngroceries!" : arrived ? `Found ${currentItem?.emoji}!` : "Press Start and\nwe'll guide you!"}
            </h1>

            {/* Current target icon */}
            {currentItem && !arrived && (
              <div className="w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center mb-4 animate-slide-up" style={{ animationDelay: "0.05s" }}>
                <span className="text-2xl">{currentItem.emoji}</span>
              </div>
            )}

            {/* Aisle visualization */}
            <div className="w-full max-w-[280px] h-48 relative mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              {/* Aisle walls */}
              <div className="absolute left-4 top-0 bottom-0 w-16 bg-muted/60 rounded-lg" />
              <div className="absolute right-4 top-0 bottom-0 w-16 bg-muted/60 rounded-lg" />

              {/* Mascot walking */}
              <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-[2500ms] ease-in-out ${isNavigating ? "top-4" : "bottom-4"}`}>
                <img
                  src={mascotImg}
                  alt="Guide mascot"
                  className={`w-24 h-24 ${isNavigating ? "animate-cart-bounce" : "animate-float"}`}
                />
              </div>

              {/* Target item at top of aisle */}
              {currentItem && (
                <div className={`absolute top-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center transition-opacity ${isNavigating || arrived ? "opacity-100" : "opacity-60"}`}>
                  <span className="text-lg">{currentItem.emoji}</span>
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.15s" }}>
              {arrived ? (
                <Button variant="hero" size="lg" className="rounded-full px-10" onClick={handleCollect}>
                  Collect {currentItem?.emoji} {currentItem?.name}
                </Button>
              ) : (
                <Button
                  variant="hero"
                  size="lg"
                  className="rounded-full px-10"
                  onClick={handleStart}
                  disabled={isNavigating}
                >
                  {isNavigating ? "Finding..." : "Start"}
                </Button>
              )}
            </div>

            {/* Item List */}
            <div className="w-full animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-lg font-display font-bold text-foreground text-center mb-1">Item List</h2>
              <p className="text-sm text-muted-foreground font-body text-center mb-4">Up Next</p>

              <div className="space-y-3">
                {ITEMS.map((item) => {
                  const isCollected = collectedItems.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`grocery-card flex items-center gap-4 p-4 ${isCollected ? "opacity-60" : ""}`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1">
                        <span className="font-display font-bold text-foreground">{item.name}</span>
                        <span className="text-sm text-muted-foreground font-body ml-2">
                          {item.aisle} · {item.price}
                        </span>
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
