import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Dev-only middleware that mimics the Vercel serverless function at /api/estimate,
// so `npm run dev` gives a working AI endpoint without needing `vercel dev`.
function devApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: "dev-api-estimate",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/estimate", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");

          // ssrLoadModule transforms the TS and resolves from project root.
          const mod = await server.ssrLoadModule("/api/_core.ts");
          const result = await mod.estimateCalories(
            String(body.description ?? ""),
            env.ANTHROPIC_API_KEY,
          );
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        } catch (err) {
          const status = (err as { status?: number }).status;
          res.statusCode = typeof status === "number" ? status : 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      devApiPlugin(env),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icon-192.png", "icon-512.png"],
        manifest: {
          name: "Calorie Tracker",
          short_name: "Calories",
          description: "Log food in plain language; AI estimates the calories.",
          theme_color: "#16a34a",
          background_color: "#0b1120",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // Never cache the AI endpoint; always hit the network for estimates.
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^\/api\/.*/,
              handler: "NetworkOnly",
            },
          ],
        },
      }),
    ],
  };
});
