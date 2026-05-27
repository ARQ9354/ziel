import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables (such as GEMINI_API_KEY)
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy client setup to guarantee startup safety when key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in backend environment configs.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. App Summary API
app.post("/api/gemini/summarize", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!content && !title) {
      res.status(400).json({ error: "Missing document title or content" });
      return;
    }

    const ai = getAiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Summarize the following document titled "${title || 'Untitled'}". Provide a 1-2 sentence executive summary.\n\nContent:\n${content || '(Empty Document)'}`,
      config: {
        systemInstruction: "You are an expert workspace content summarizer. Keep summaries hyper-focused, brief, and objective.",
      }
    });

    res.json({ summary: result.text || "No summary could be obtained." });
  } catch (error: any) {
    console.error("Gemini summarize error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 2. Dynamic Tag & Property Suggestion API
app.post("/api/gemini/generate-tags", async (req, res) => {
  try {
    const { title, content } = req.body;
    const ai = getAiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Document Title: "${title || 'Untitled'}"\n\nContent:\n${content || '(Empty)'}\n\nGenerate 3-4 optimal organization tags.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "High relevancy keywords or tag recommendations.",
            },
            status: {
              type: Type.STRING,
              description: "Recommended status (e.g., 'Idea', 'In Progress', 'Done', 'Reference').",
            },
            score: {
              type: Type.NUMBER,
              description: "AI confidence score between 0 and 1."
            }
          },
          required: ["tags", "status"],
        }
      }
    });

    res.json(JSON.parse(result.text?.trim() || "{}"));
  } catch (error: any) {
    console.error("Gemini tags error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 3. Automated Knowledge Graph Link Suggestions API
app.post("/api/gemini/suggest-links", async (req, res) => {
  try {
    const { currentPage, otherPages } = req.body;
    if (!currentPage) {
      res.status(400).json({ error: "Missing source page data" });
      return;
    }

    const otherPagesText = (otherPages || [])
      .map((p: any) => `ID: "${p.id}", Title: "${p.title}", Concept preview: "${p.content?.substring(0, 200)}"`)
      .join("\n\n");

    const prompt = `Analyze current active page:
ID: "${currentPage.id}"
Title: "${currentPage.title}"
Content:
${currentPage.content || '(Empty)'}

Analyze available sibling pages to connect with:
${otherPagesText || ''}

Suggest 1 to 3 relevant knowledge links based on shared context or semantic overlaps. Provide an exact justification for each connection.`;

    const ai = getAiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a graph relationship and semantic linker. You recommend linkages between pages to establish transitive knowledge graphs.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              targetPageId: {
                type: Type.STRING,
                description: "The ID of the sibling page to connect with."
              },
              targetTitle: {
                type: Type.STRING,
                description: "The title of the sibling page."
              },
              reason: {
                type: Type.STRING,
                description: "A short, brilliant explanation of how linking them unlocks workspace associations."
              }
            },
            required: ["targetPageId", "targetTitle", "reason"]
          }
        }
      }
    });

    res.json({ suggestions: JSON.parse(result.text?.trim() || "[]") });
  } catch (error: any) {
    console.error("Gemini suggest-links error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 4. Copilot AI Interactive Workspace Q&A and Editor Assist
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, workspaceContext } = req.body;
    const ai = getAiClient();

    const systemPrompt = `You are "Aura - GraphNotion AI Workspace Copilot".
You assist users with writing, database organization, and transitive knowledge graphs.
Explain how linking documents (A -> B -> C means A connects transitive to C) helps build an elegant graph.

Current Workspace Context:
- Active pages/databases count: ${workspaceContext?.pagesCount || 0}
- Direct links established: ${workspaceContext?.linksCount || 0}
- Transitive linkages discovered: ${workspaceContext?.transitiveCount || 0}
- Active document: "${workspaceContext?.activePageTitle || 'None'}"

Be responsive, helpful, and concise. Format responses in beautiful markdown.`;

    // Map frontend chat history with roles structure
    const contents = (messages || []).map((m: any) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }]
    }));

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.json({ text: result.text || "I was unable to formulate a response. Please try again." });
  } catch (error: any) {
    console.error("Gemini Copilot chat error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// Configure Vite middleware or static serving
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GraphNotion Server] running on http://0.0.0.0:${PORT}`);
  });
}

configureServer().catch((err) => {
  console.error("Server boot failure:", err);
});
