import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, LogOut, Check } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import mascotImg from "@/assets/mascot.png";

type GroceryItem = {
  id: string;
  name: string;
  emoji: string;
  aisle: string;
  price: string;
};

const GROCERY_ITEMS: GroceryItem[] = [
  { id: "carrots", name: "Carrot", emoji: "🥕", aisle: "Aisle 3", price: "$1.99" },
  { id: "eggs", name: "Eggs", emoji: "🥚", aisle: "Aisle 9", price: "$2.95" },
  { id: "milk", name: "Milk", emoji: "🥛", aisle: "Aisle 12", price: "$3.25" },
];

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
      <div className="min-h-screen sky-gradient flex items-center justify-center">
        <ShoppingCart className="w-12 h-12 text-primary animate-cart-bounce" />
      </div>
    );
  }

  return (
    <div className="min-h-screen sky-gradient relative overflow-hidden">
      {/* Logout button */}
      <div className="absolute top-4 right-4 z-20">
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      <main className="relative z-10 flex flex-col items-center px-4 pt-10 pb-32 max-w-lg mx-auto">
        {/* Title */}
        <h1 className="text-2xl font-display font-bold text-white text-center mb-4 animate-slide-up w-full max-w-xl whitespace-nowrap">
          Add groceries to your list!
        </h1>

        {/* Floating grocery emojis
        <br></br>
        <div className="relative w-full h-16 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <span className="absolute left-[5%] top-2 text-2xl animate-float" style={{ animationDelay: "0s" }}>🥬</span>
          <span className="absolute left-[22%] top-0 text-2xl animate-float" style={{ animationDelay: "0.3s" }}>🥚</span>
          <span className="absolute left-[42%] top-1 text-2xl animate-float" style={{ animationDelay: "0.6s" }}>🥛</span>
          <span className="absolute left-[62%] top-0 text-2xl animate-float" style={{ animationDelay: "0.9s" }}>🍎</span>
          <span className="absolute left-[80%] top-2 text-2xl animate-float" style={{ animationDelay: "1.2s" }}>🍖</span>
        </div> */}

        {/* Mascot with basket */}
        <div className="mb-1 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <img src={mascotImg} alt="Mascot" className="w-96 h-52 mx-auto mb-5 animate-float" />
        </div>

        {/* Next button */}
        <Button
          variant="hero"
          size="lg"
          className="rounded-full px-10 mb-8 animate-slide-up"
          style={{ animationDelay: "0.15s" }}
          onClick={() => navigate("/map")}
        >
          Next
        </Button>

        {/* Item List */}
        <div className="w-full animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-lg font-display font-bold text-white text-center mb-4">Item List</h2>

          <div className="space-y-3">
            {GROCERY_ITEMS.map((item) => (
              <div
                key={item.id}
                className="grocery-card flex items-center gap-4 p-4"
              >
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1">
                  <span className="font-display font-bold text-foreground">{item.name}</span>
                  <span className="text-sm text-muted-foreground font-body ml-2">
                    {item.aisle} · {item.price}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
