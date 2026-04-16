/**
 * OG Card Image Generation
 * Returns a 1200×630 PNG for sharing expert picks on social media.
 * GET /api/og/pick/:id → PNG (expert portrait, team logos, pick, confidence)
 */

import { Router } from "express";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { db } from "../db";
import { eq } from "drizzle-orm";

const router = Router();

let fontData: ArrayBuffer | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData;
  const resp = await fetch(
    "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_fjbvMwCp50KnMa0ZL7SUc.woff2"
  );
  fontData = await resp.arrayBuffer();
  return fontData;
}

function teamLogo(code: string, sport: string = "mlb") {
  const c = code.toUpperCase() === "WAS" ? "wsh" : code.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/${sport}/500/scoreboard/${c}.png`;
}

router.get("/api/og/pick/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { expertPicks, expertAnalysts } = await import("@shared/schema");
    const [pick] = await db
      .select()
      .from(expertPicks)
      .where(eq(expertPicks.id, id))
      .limit(1);
    if (!pick) return res.status(404).json({ error: "Pick not found" });

    const [expert] = await db
      .select()
      .from(expertAnalysts)
      .where(eq(expertAnalysts.id, pick.expertId))
      .limit(1);

    const expertName = expert?.name || pick.expertId;
    const expertAvatar = expert?.avatar || "";
    const isUrl = expertAvatar.startsWith("/") || expertAvatar.startsWith("http");
    const avatarSrc = isUrl
      ? (expertAvatar.startsWith("/") ? `https://clearedgesports.ai${expertAvatar}` : expertAvatar)
      : "";

    const confidence = pick.confidence || 0;
    const confColor = confidence >= 75 ? "#22c55e" : confidence >= 50 ? "#eab308" : "#71717a";

    // Parse team codes from gameId (format: "2026-04-15_NYY@BOS")
    const parts = (pick.gameId || "").split("_")[1]?.split("@") || [];
    const awayCode = parts[0] || "";
    const homeCode = parts[1] || "";

    const font = await getFont();

    const svg = await satori(
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "column",
            width: 1200,
            height: 630,
            background: "linear-gradient(135deg, #0f0f11 0%, #1a1a1e 100%)",
            fontFamily: "Inter",
            color: "#e4e4e7",
            padding: "48px 56px",
          },
          children: [
            // Top bar: ClearEdge branding
            {
              type: "div",
              props: {
                style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
                children: [
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", alignItems: "center", gap: 12 },
                      children: [
                        { type: "div", props: { style: { fontSize: 28, fontWeight: 700, color: "#eab308" }, children: "ClearEdge Sports" } },
                        { type: "div", props: { style: { fontSize: 16, color: "#71717a" }, children: "Expert Pick" } },
                      ],
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex", alignItems: "center", gap: 8, padding: "6px 16px",
                        background: `${confColor}22`, border: `1px solid ${confColor}55`, borderRadius: 20,
                      },
                      children: [
                        { type: "div", props: { style: { fontSize: 20, fontWeight: 700, color: confColor }, children: `${confidence}%` } },
                        { type: "div", props: { style: { fontSize: 14, color: "#a1a1aa" }, children: "confidence" } },
                      ],
                    },
                  },
                ],
              },
            },
            // Main content row
            {
              type: "div",
              props: {
                style: { display: "flex", flex: 1, gap: 40, alignItems: "center" },
                children: [
                  // Left: avatar + expert name
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", flexDirection: "column", alignItems: "center", width: 180, gap: 12 },
                      children: [
                        avatarSrc
                          ? { type: "img", props: { src: avatarSrc, width: 120, height: 120, style: { borderRadius: "50%", border: "3px solid #eab30840" } } }
                          : { type: "div", props: { style: { width: 120, height: 120, borderRadius: "50%", background: "#27272a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }, children: expertAvatar || "🎯" } },
                        { type: "div", props: { style: { fontSize: 20, fontWeight: 600, textAlign: "center" }, children: expertName } },
                      ],
                    },
                  },
                  // Right: pick details
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", flexDirection: "column", flex: 1, gap: 16 },
                      children: [
                        // Team matchup with logos
                        {
                          type: "div",
                          props: {
                            style: { display: "flex", alignItems: "center", gap: 16 },
                            children: [
                              awayCode ? { type: "img", props: { src: teamLogo(awayCode, pick.sport || "mlb"), width: 56, height: 56 } } : null,
                              { type: "div", props: { style: { fontSize: 22, color: "#71717a" }, children: awayCode } },
                              { type: "div", props: { style: { fontSize: 18, color: "#52525b" }, children: "@" } },
                              { type: "div", props: { style: { fontSize: 22, color: "#71717a" }, children: homeCode } },
                              homeCode ? { type: "img", props: { src: teamLogo(homeCode, pick.sport || "mlb"), width: 56, height: 56 } } : null,
                            ].filter(Boolean),
                          },
                        },
                        // Selection
                        { type: "div", props: { style: { fontSize: 36, fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }, children: pick.selection } },
                        // Rationale
                        {
                          type: "div",
                          props: {
                            style: { fontSize: 18, color: "#a1a1aa", lineHeight: 1.5, maxHeight: 108, overflow: "hidden" },
                            children: pick.rationale?.slice(0, 200) || "",
                          },
                        },
                        // Meta: pick type + date
                        {
                          type: "div",
                          props: {
                            style: { display: "flex", gap: 16, marginTop: 8 },
                            children: [
                              { type: "div", props: { style: { fontSize: 14, color: "#52525b", textTransform: "uppercase", letterSpacing: 1 }, children: pick.pickType || "moneyline" } },
                              { type: "div", props: { style: { fontSize: 14, color: "#52525b" }, children: pick.gameDate || "" } },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      } as any,
      {
        width: 1200,
        height: 630,
        fonts: [{ name: "Inter", data: font, weight: 400, style: "normal" }],
      }
    );

    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
    const png = resvg.render().asPng();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.end(png);
  } catch (err) {
    console.error("OG card error:", err);
    res.status(500).json({ error: "Failed to generate OG card" });
  }
});

export default router;
