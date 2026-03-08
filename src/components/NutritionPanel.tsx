import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NutritionPanelProps {
  itemId: string;
  itemName: string;
  itemEmoji: string;
  onContinue: () => void;
  isLastItem: boolean;
}

const NutritionPanel: React.FC<NutritionPanelProps> = ({
  itemId,
  itemName,
  itemEmoji,
  onContinue,
  isLastItem,
}) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("nutrition-analysis", {
          body: { itemName },
        });
        if (error) throw error;
        setAnalysis(data?.analysis || "Unable to analyze this item.");
      } catch (err) {
        console.error("Nutrition analysis error:", err);
        setAnalysis(
          `**${itemName}** is a nutritious food choice! Here are some general benefits:\n\n` +
          `• Great source of essential vitamins and minerals\n` +
          `• Supports a balanced, healthy diet\n` +
          `• Can be incorporated into many healthy recipes\n\n` +
          `_AI analysis temporarily unavailable._`
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [itemName]);

  return (
    <div className="w-full animate-slide-up">
      <div className="grocery-card mb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{itemEmoji}</span>
          <div>
            <h3 className="font-display font-bold text-xl text-foreground">
              {itemName} — Nutrition
            </h3>
            <div className="flex items-center gap-1 text-xs text-primary font-body">
              <Sparkles className="w-3 h-3" />
              Gemini AI-powered analysis
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-body">Analyzing...</span>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none font-body text-foreground">
            {analysis.split("\n").map((line, i) => (
              <p key={i} className={`${line.startsWith("•") ? "ml-4" : ""} ${line.startsWith("_") ? "text-muted-foreground italic text-xs" : ""} mb-1`}>
                {line.replace(/\*\*/g, "").replace(/_/g, "")}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <Button variant="hero" size="lg" className="rounded-full px-10" onClick={onContinue}>
          {isLastItem ? "Finish Shopping 🎉" : "Next Item"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default NutritionPanel;
