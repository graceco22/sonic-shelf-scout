import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { items } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const itemList = items.map((i: { name: string; price: string }) => `${i.name} (${i.price})`).join(", ");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a friendly nutritionist and grocery shopping advisor. The user just completed a grocery shopping trip. Respond with EXACTLY these two sections, using this format:\n\n**Nutritional Facts**\n• [Nutrient]: [Amount or benefit] — from [item]\n(List 6-8 key vitamins, minerals, protein, fiber, etc. that the purchased items provide. Be specific with nutrient names and which item they come from.)\n\n**Suggested Additions**\n• [Item emoji] [Item name] — [reason why it complements what they bought]\n(Suggest 4-5 grocery items they should add next time to round out their nutrition or make complete meals. Focus on what's missing from their cart.)\n\nRules:\n- Use • for every bullet point\n- Keep each bullet to one line\n- No intro or outro text, jump straight into the first heading\n- Be specific and practical, not generic\n- Keep total response under 250 words\n\nHere's what I bought: ${itemList}. Give me the nutritional facts and suggestions.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "Summary unavailable.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("shopping-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
