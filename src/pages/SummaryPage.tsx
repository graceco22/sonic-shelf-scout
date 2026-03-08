import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Sparkles, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import mascotImg from "@/assets/mascot.png";

type GroceryItem = {
  name: string;
  emoji: string;
  price: string;
};

const SummaryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const items: GroceryItem[] = location.state?.items || [];
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      navigate("/");
      return;
    }

    const fetchSummary = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("shopping-summary", {
          body: { items: items.map((i) => ({ name: i.name, price: i.price })) },
        });
        if (error) throw error;
        setSummary(data?.summary || "Summary unavailable.");
      } catch (err) {
        console.error("Shopping summary error:", err);
        const itemNames = items.map((i) => i.emoji + " " + i.name).join(", ");
        setSummary(
          `**Trip Summary**\n\nYou picked up: ${itemNames}.\n\n` +
            `• Great choices for a balanced diet!\n` +
            `• These items provide essential nutrients for your daily needs.\n\n` +
            `_AI insights temporarily unavailable._`
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [items, navigate]);

  const totalPrice = items.reduce((sum, item) => {
    const price = parseFloat(item.price.replace("$", ""));
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  return (
    <div className="min-h-screen sky-gradient relative overflow-hidden">
      <div className="mountain-wave" />

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 -mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/map")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>

      <main className="relative z-10 max-w-xl mx-auto px-4 pb-32 -mt-4">
        {/* Celebration */}
        <div className="text-center mb-6 animate-slide-up">
          <img src={mascotImg} alt="Mascot" className="w-50 h-40 mx-auto mb-3 animate-float" />
          <h2 className="text-2xl font-display font-bold text-foreground">Great Job!</h2>
          <p className="text-muted-foreground font-body text-sm mt-1">
            You collected all {items.length} items
          </p>
        </div>

        {/* Items recap */}
        <div className="grocery-card mb-4 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <h3 className="font-display font-bold text-foreground mb-3">Your Cart</h3>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-body text-foreground">
                  {item.emoji} {item.name}
                </span>
                <span className="text-sm text-muted-foreground font-body">{item.price}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
              <span className="font-display font-bold text-foreground">Total</span>
              <span className="font-display font-bold text-primary">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="grocery-card mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-foreground">AI Shopping Insights</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-body">Analyzing your shopping trip...</span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none font-body text-foreground">
              {summary.split("\n").map((line, i) => (
                <p
                  key={i}
                  className={`${line.startsWith("•") ? "ml-4" : ""} ${
                    line.startsWith("_") ? "text-muted-foreground italic text-xs" : ""
                  } ${line.startsWith("**") ? "font-display font-bold text-base mt-3" : ""} mb-1`}
                >
                  {line.replace(/\*\*/g, "").replace(/_/g, "")}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Home button */}
        <div className="text-center animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <Button variant="hero" size="lg" className="rounded-full px-10" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </main>
    </div>
  );
};

export default SummaryPage;
