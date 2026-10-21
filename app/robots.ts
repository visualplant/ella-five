import type { MetadataRoute } from "next";
import { SITE } from "@/lib/data";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/confirm", "/unsubscribe"] }, { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Amazonbot", "meta-externalagent", "DuckAssistBot", "MistralAI-User", "cohere-ai", "Bytespider"], allow: ["/", "/llms.txt", "/llms-full.txt", "/lists.json"], disallow: ["/api/", "/confirm", "/unsubscribe"] }], host: SITE, sitemap: `${SITE}/sitemap.xml` };
}
