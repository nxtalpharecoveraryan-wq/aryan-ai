const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    // Test endpoint
    if (url.pathname === "/" && request.method === "GET") {
      return new Response("ARYAN AI API is online 🚀", {
        status: 200,
        headers: corsHeaders
      });
    }

    // Gemini endpoint
    if (url.pathname !== "/ask") {
      return new Response("Not Found", {
        status: 404,
        headers: corsHeaders
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders
      });
    }

    try {
      const body = await request.json();
      const message = String(body.message || "").trim();

      if (!message) {
        return new Response(
          JSON.stringify({ error: "Message is required" }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          }
        );
      }

      const prompt = `
You are ARYAN AI, a helpful personal AI assistant.

Rules:
- Answer clearly and naturally.
- Keep normal answers reasonably concise.
- You can answer in Hindi, Hinglish, or English depending on the user's language.
- Do not claim to have performed an action if you did not actually perform it.
- The user is speaking to you through a voice assistant, so make responses easy to listen to.

User message:
${message}
`;

      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await geminiResponse.json();

      if (!geminiResponse.ok) {
        return new Response(
          JSON.stringify({
            error: data?.error?.message || "Gemini API error"
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          }
        );
      }

      const reply =
        data?.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("")
          .trim() ||
        "Sorry, I could not generate a response.";

      return new Response(
        JSON.stringify({ reply }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Server error",
          details: error.message
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
  }
};
