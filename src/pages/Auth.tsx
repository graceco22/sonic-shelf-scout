import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff, Shield } from "lucide-react";
import mascotImg from "@/assets/mascot.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back! 🛒");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen sky-gradient flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Mountain wave decoration */}
      <div className="mountain-wave" />

      <div className="w-full max-w-sm relative z-10">
        {/* Mascot */}
        <div className="text-center mb-6 animate-slide-up">
          <img
            src={mascotImg}
            alt="GroceryGuide mascot"
            className="w-28 h-28 mx-auto mb-3 animate-float"
          />
          <h1 className="text-3xl font-display font-bold text-foreground">GroceryGuide</h1>
          <p className="text-muted-foreground mt-1 font-body text-sm">Your smart grocery companion</p>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground font-body">Encrypted & private</span>
        </div>

        {/* Auth Card */}
        <div className="grocery-card animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <h2 className="text-lg font-display font-bold text-foreground mb-5 text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-body font-semibold text-foreground text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl border-border bg-background font-body"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-body font-semibold text-foreground text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-xl border-border bg-background font-body"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline font-body font-semibold"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground font-body animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <p>🔒 Secured with industry-standard encryption</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
