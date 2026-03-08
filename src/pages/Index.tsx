import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, LogOut, MapPin } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ShoppingCart className="w-12 h-12 text-primary animate-cart-bounce" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">GroceryGuide</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-body hidden sm:block">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8 animate-slide-up">
          <h2 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome to Your Smart Grocery Trip! 🥕
          </h2>
          <p className="text-muted-foreground font-body text-lg">
            Let us guide you through the store to find eggs, carrots & milk
          </p>
        </div>

        {/* Shopping List Preview */}
        <div className="grocery-card mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h3 className="font-display font-bold text-lg text-foreground mb-4">📋 Today's Shopping List</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <span className="text-3xl">🥚</span>
              <span className="font-body font-semibold text-foreground text-sm">Eggs</span>
              <span className="text-xs text-muted-foreground">Aisle 3</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <span className="text-3xl">🥕</span>
              <span className="font-body font-semibold text-foreground text-sm">Carrots</span>
              <span className="text-xs text-muted-foreground">Produce</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted">
              <span className="text-3xl">🥛</span>
              <span className="font-body font-semibold text-foreground text-sm">Milk</span>
              <span className="text-xs text-muted-foreground">Dairy</span>
            </div>
          </div>
        </div>

        {/* Start Shopping Button */}
        <div className="text-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Button
            variant="hero"
            size="lg"
            className="rounded-2xl px-10 py-6 text-lg"
            onClick={() => navigate("/map")}
          >
            <MapPin className="w-5 h-5 mr-2" />
            Start Shopping Trip
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
