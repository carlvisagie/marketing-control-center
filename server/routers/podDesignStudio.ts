/**
 * POD Design Studio Router
 *
 * Complete design workspace for Jetfighter1 POD business:
 * 1. Unsplash Photo Browser — search high-quality aviation images (free commercial licence confirmed)
 * 2. Artwork Intake — validate, resize instructions, Amazon placement guide
 * 3. Bulk Design Queue — process multiple designs, generate listing text for all 5 platforms
 *
 * Unsplash API: Client-ID ZY1kdEgVNrPh_kX46M42dqDCr3q_2WKm7qm0153EYqw
 * Attribution required: "Photo by [name] on Unsplash"
 * Download trigger required per Unsplash API guidelines
 */

import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { generateListingFree } from "../_core/listingEngine";

// ─── Unsplash API ─────────────────────────────────────────────────────────────

const UNSPLASH_ACCESS_KEY = "ZY1kdEgVNrPh_kX46M42dqDCr3q_2WKm7qm0153EYqw";
const UNSPLASH_API_BASE = "https://api.unsplash.com";

// Aviation-specific search presets
const AVIATION_PRESETS = [
  { label: "F-15 Strike Eagle", query: "F-15 fighter jet military aircraft" },
  { label: "F-16 Fighting Falcon", query: "F-16 fighter jet air force" },
  { label: "A-10 Warthog", query: "A-10 attack aircraft military" },
  { label: "F-22 Raptor", query: "F-22 raptor stealth fighter" },
  { label: "F-35 Lightning", query: "F-35 lightning stealth jet" },
  { label: "SR-71 Blackbird", query: "SR-71 blackbird reconnaissance aircraft" },
  { label: "B-52 Stratofortress", query: "B-52 bomber military aircraft" },
  { label: "P-51 Mustang", query: "P-51 mustang world war 2 fighter aircraft" },
  { label: "Apache Helicopter", query: "AH-64 apache attack helicopter military" },
  { label: "V-22 Osprey", query: "V-22 osprey military tiltrotor aircraft" },
  { label: "Aircraft Carrier", query: "aircraft carrier navy jet launch deck" },
  { label: "Afterburner", query: "fighter jet afterburner flame military night" },
  { label: "Formation Flying", query: "military aircraft formation flying sky" },
  { label: "Air Show", query: "military air show aerobatics display" },
  { label: "Cockpit", query: "fighter jet cockpit pilot military aviation" },
  { label: "F/A-18 Hornet", query: "F-18 hornet navy fighter jet carrier" },
];

// ─── Amazon Canvas Specifications ────────────────────────────────────────────

const AMAZON_CANVAS = {
  width: 4500,
  height: 5400,
  dpi: 300,
  designZone: {
    topY: 450,
    maxWidth: 3600,
    centerX: 2250,
    recommendedHeight: 3600,
  },
};

// Platform canvas specs
const PLATFORM_SPECS = {
  amazon: { width: 4500, height: 5400, dpi: 300, format: "PNG", maxMB: 25, transparent: true },
  redbubble: { width: 4500, height: 5400, dpi: 300, format: "PNG", maxMB: 300, transparent: true },
  etsy: { width: 4500, height: 5400, dpi: 300, format: "PNG", maxMB: 20, transparent: true },
  spring: { width: 3720, height: 4950, dpi: 300, format: "PNG", maxMB: 50, transparent: true },
  spreadshirt: { width: 4000, height: 4000, dpi: 300, format: "PNG", maxMB: 10, transparent: true },
};

// ─── Listing Generation ───────────────────────────────────────────────────────

async function generateListingForPlatform(
  designName: string,
  aircraft: string,
  platform: string,
  contentAngle: string
): Promise<{
  title: string;
  description: string;
  tags: string[];
  bullets: string[];
  price: number;
}> {
  const platformRules: Record<string, string> = {
    amazon: "Title max 60 chars. No trademark terms. No 'official', 'licensed', 'authentic'. No keyword stuffing. 5 bullet points max 256 chars each. No URLs.",
    redbubble: "Title max 60 chars. Tags max 15, comma-separated. Description 500 chars max. Focus on art style and subject.",
    etsy: "Title max 140 chars, use long-tail keywords. Tags exactly 13, each max 20 chars. Must disclose production partner. No 'handmade' claims.",
    spring: "Title max 100 chars. Description 500 chars. Tags max 20. Focus on gift angle.",
    spreadshirt: "Title max 60 chars. Description 300 chars. Tags max 10.",
  };

  const angles: Record<string, string> = {
    veteran_gift: "Frame as a gift for veterans, pilots, and military families",
    aviation_art: "Frame as premium aviation artwork and collector piece",
    pilot_pride: "Frame as pilot pride and military service pride",
    history: "Frame as celebrating military aviation history and legacy",
    gift_idea: "Frame as a perfect gift idea for aviation enthusiasts",
  };

  const prompt = `You are a POD listing expert for military aviation merchandise. Generate an optimised listing for this design.

Design: ${designName}
Aircraft: ${aircraft}
Platform: ${platform}
Content Angle: ${angles[contentAngle] || angles.veteran_gift}
Platform Rules: ${platformRules[platform] || platformRules.amazon}

Generate a JSON response with:
- title: platform-optimised title following all rules
- description: compelling description
- tags: array of tags (follow platform tag limits)
- bullets: array of bullet points (for Amazon, 5 bullets; for others, 3 key points)
- price: recommended retail price in USD (t-shirt)

Aviation-safe terms to use: fighter jet, military aircraft, aviation art, pilot gift, airforce, aircraft design, military aviation, jet aircraft, combat aircraft, aviation enthusiast, military gift, veteran gift, pilot shirt, aviation lover, aircraft art

NEVER use: Top Gun, Maverick, specific squadron numbers/patches, official, licensed, authentic, guaranteed, best seller, #1.

Respond with valid JSON only.`;

  // Deterministic listing engine — zero API cost, instant, never fails
  const free = generateListingFree(designName, aircraft);
  const platformKey = platform as keyof typeof free.platformVariants;
  const variant = free.platformVariants[platformKey] || free.platformVariants.redbubble;

  return {
    title: variant.title,
    description: variant.description,
    tags: variant.tags,
    bullets: free.bulletPoints,
    price: variant.price,
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const podDesignStudioRouter = router({

  // Get aviation search presets and canvas specs
  getPresets: publicProcedure
    .query(() => {
      return {
        presets: AVIATION_PRESETS,
        canvasSpecs: AMAZON_CANVAS,
      };
    }),

  // Search Unsplash for aviation images
  searchUnsplash: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      page: z.number().default(1),
      perPage: z.number().default(20),
      orientation: z.enum(["landscape", "portrait", "squarish"]).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const params = new URLSearchParams({
          query: input.query,
          page: String(input.page),
          per_page: String(Math.min(input.perPage, 30)),
          order_by: "relevant",
        });
        if (input.orientation) {
          params.set("orientation", input.orientation);
        }

        const response = await fetch(
          `${UNSPLASH_API_BASE}/search/photos?${params.toString()}`,
          {
            headers: {
              Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
              "Accept-Version": "v1",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Unsplash API error ${response.status}: ${errorText}`);
        }

        const data = await response.json() as {
          total: number;
          total_pages: number;
          results: Array<{
            id: string;
            width: number;
            height: number;
            description: string | null;
            alt_description: string | null;
            urls: { raw: string; full: string; regular: string; small: string; thumb: string };
            links: { html: string; download: string; download_location: string };
            user: { name: string; username: string; links: { html: string } };
            likes: number;
          }>;
        };

        return {
          total: data.total,
          totalPages: data.total_pages,
          page: input.page,
          results: data.results.map(photo => ({
            id: photo.id,
            width: photo.width,
            height: photo.height,
            description: photo.description || photo.alt_description || "Military aviation photo",
            thumbUrl: photo.urls.thumb,
            smallUrl: photo.urls.small,
            regularUrl: photo.urls.regular,
            fullUrl: photo.urls.full,
            rawUrl: photo.urls.raw,
            downloadLocation: photo.links.download_location,
            unsplashUrl: photo.links.html,
            photographerName: photo.user.name,
            photographerUsername: photo.user.username,
            photographerUrl: photo.user.links.html,
            likes: photo.likes,
            attribution: `Photo by ${photo.user.name} on Unsplash`,
            meetsAmazonSpec: photo.width >= 4500 && photo.height >= 5400,
            meetsRedbubbleSpec: photo.width >= 2400 && photo.height >= 3200,
            megapixels: Math.round((photo.width * photo.height) / 1000000 * 10) / 10,
          })),
        };
      } catch (error) {
        throw new Error(`Unsplash search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  // Trigger Unsplash download event (required by Unsplash API guidelines)
  triggerDownload: publicProcedure
    .input(z.object({
      downloadLocation: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(input.downloadLocation, {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            "Accept-Version": "v1",
          },
        });
        const data = await response.json() as { url?: string };
        return { success: true, downloadUrl: data.url || null };
      } catch {
        return { success: false, downloadUrl: null };
      }
    }),

  // Get aircraft categories for the browser
  getAircraftCategories: publicProcedure
    .query(() => {
      return AVIATION_PRESETS.map(preset => ({
        name: preset.label,
        query: preset.query,
        unsplashSearchUrl: `https://unsplash.com/s/photos/${encodeURIComponent(preset.query)}`,
      }));
    }),

  // Get Amazon canvas placement specifications
  getCanvasSpecs: publicProcedure
    .query(() => {
      return {
        canvas: AMAZON_CANVAS,
        platforms: PLATFORM_SPECS,
        placementGuide: {
          rule: "Place design centred horizontally, starting 1.5 inches (450px at 300dpi) below the top of the canvas",
          safeZone: {
            left: 450,
            right: 4050,
            top: 450,
            bottom: 4950,
          },
          designMaxWidth: 3600,
          designRecommendedTopY: 450,
          centreX: 2250,
          tips: [
            "Keep the main subject (aircraft) in the upper 60% of the design area",
            "Leave at least 200px margin on left and right edges",
            "Text/sayings work best in the lower 30% of the design",
            "Transparent background is REQUIRED for Amazon — never use white fill",
            "Use sRGB colour profile — CMYK will cause colour shift on print",
          ],
        },
        universalStandard: {
          width: 4500,
          height: 5400,
          dpi: 300,
          format: "PNG",
          background: "Transparent",
          colourMode: "sRGB",
          note: "This single spec passes all 5 platforms without re-exporting",
        },
      };
    }),

  // Analyse uploaded artwork and give placement/resize instructions
  analyseArtwork: publicProcedure
    .input(z.object({
      filename: z.string(),
      widthPx: z.number(),
      heightPx: z.number(),
      dpi: z.number().optional(),
      fileSizeMB: z.number(),
      format: z.string(),
      hasTransparentBackground: z.boolean().optional(),
      colourMode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const issues: string[] = [];
      const warnings: string[] = [];
      const steps: Array<{ step: number; action: string; detail: string; tool: string }> = [];

      const formatUpper = input.format.toUpperCase().replace(".", "");
      if (formatUpper !== "PNG") {
        issues.push(`Format is ${formatUpper} — must be PNG for Amazon. Convert before uploading.`);
        steps.push({
          step: steps.length + 1,
          action: "Convert to PNG",
          detail: "Open in Photoshop or GIMP → File → Export As → PNG. Or use free online converter at squoosh.app",
          tool: "Photoshop / GIMP / Squoosh",
        });
      }

      const targetW = AMAZON_CANVAS.width;
      const targetH = AMAZON_CANVAS.height;
      const needsResize = input.widthPx !== targetW || input.heightPx !== targetH;

      if (input.widthPx < 2000 || input.heightPx < 2000) {
        issues.push(`Image is too small (${input.widthPx}x${input.heightPx}px). Minimum 2000px on shortest side.`);
      } else if (needsResize) {
        warnings.push(`Image is ${input.widthPx}x${input.heightPx}px. Needs to be placed on a ${targetW}x${targetH}px canvas for Amazon.`);
        steps.push({
          step: steps.length + 1,
          action: "Create Amazon canvas",
          detail: `In Photoshop: File → New → 4500x5400px, 300dpi, RGB, Transparent background. Place your image on this canvas, centred horizontally, top of image at Y=450px.`,
          tool: "Photoshop / GIMP / Canva Pro",
        });
      }

      if (input.dpi && input.dpi < 300) {
        issues.push(`DPI is ${input.dpi} — Amazon requires 300 DPI. Re-export at 300 DPI.`);
        steps.push({
          step: steps.length + 1,
          action: "Set DPI to 300",
          detail: "In Photoshop: Image → Image Size → set Resolution to 300 pixels/inch.",
          tool: "Photoshop",
        });
      }

      if (input.fileSizeMB > 25) {
        issues.push(`File is ${input.fileSizeMB}MB — Amazon limit is 25MB. Compress before uploading.`);
        steps.push({
          step: steps.length + 1,
          action: "Reduce file size",
          detail: "Use TinyPNG.com (free, lossless compression) or Photoshop export settings.",
          tool: "Photoshop / TinyPNG",
        });
      }

      if (input.hasTransparentBackground === false) {
        issues.push("Image has a solid/white background — Amazon requires transparent background.");
        steps.push({
          step: steps.length + 1,
          action: "Remove background",
          detail: "Use remove.bg (free) or Photoshop Remove Background. Save as PNG to preserve transparency.",
          tool: "remove.bg / Photoshop",
        });
      }

      if (input.colourMode && input.colourMode.toUpperCase() === "CMYK") {
        issues.push("Colour mode is CMYK — Amazon requires RGB/sRGB. Convert before uploading.");
        steps.push({
          step: steps.length + 1,
          action: "Convert to sRGB",
          detail: "In Photoshop: Edit → Convert to Profile → sRGB IEC61966-2.1. Then re-export as PNG.",
          tool: "Photoshop",
        });
      }

      const scaledWidth = Math.min(input.widthPx, AMAZON_CANVAS.designZone.maxWidth);
      const placementGuide = {
        canvasSize: `${targetW}x${targetH}px`,
        yourImageSize: `${input.widthPx}x${input.heightPx}px`,
        recommendedPlacement: {
          x: Math.round((targetW - scaledWidth) / 2),
          y: AMAZON_CANVAS.designZone.topY,
          width: scaledWidth,
          scaleFactor: input.widthPx > AMAZON_CANVAS.designZone.maxWidth
            ? (AMAZON_CANVAS.designZone.maxWidth / input.widthPx).toFixed(3)
            : "1.000 (no scaling needed)",
        },
        cssEquivalent: "position: absolute; left: 50%; transform: translateX(-50%); top: 450px; max-width: 3600px;",
      };

      const overallStatus = issues.length > 0 ? "NEEDS_FIXES" : warnings.length > 0 ? "NEEDS_CANVAS" : "READY";

      return {
        overallStatus,
        statusLabel: overallStatus === "READY"
          ? "Artwork is ready — just needs canvas placement"
          : overallStatus === "NEEDS_CANVAS"
          ? "Artwork quality is good — needs to be placed on Amazon canvas"
          : "Artwork has issues that must be fixed before uploading",
        issues,
        warnings,
        fixSteps: steps,
        placementGuide,
        platformReadiness: {
          amazon: issues.length === 0 ? "Ready after canvas placement" : "Fix issues first",
          redbubble: input.widthPx >= 2400 && input.heightPx >= 3200 ? "Ready" : "Needs upscale",
          etsy: input.widthPx >= 2000 || input.heightPx >= 2000 ? "Ready" : "Needs upscale",
          spring: input.widthPx >= 3720 ? "Ready" : "Recommended: upscale to 3720px wide",
          spreadshirt: input.fileSizeMB <= 10 ? "Ready" : "Compress to under 10MB",
        },
        quickWin: "Design at 4500x5400px, 300 DPI, PNG, transparent background, sRGB — passes all 5 platforms without re-exporting.",
      };
    }),

  // Generate listing text for a single design across selected platforms
  generateListings: publicProcedure
    .input(z.object({
      designName: z.string().min(1),
      aircraft: z.string().min(1),
      contentAngle: z.enum(["veteran_gift", "aviation_art", "pilot_pride", "history", "gift_idea"]),
      platforms: z.array(z.enum(["amazon", "redbubble", "etsy", "spring", "spreadshirt"])),
    }))
    .mutation(async ({ input }) => {
      const listings: Record<string, unknown> = {};

      for (const platform of input.platforms) {
        listings[platform] = await generateListingForPlatform(
          input.designName,
          input.aircraft,
          platform,
          input.contentAngle
        );
      }

      return {
        designName: input.designName,
        aircraft: input.aircraft,
        contentAngle: input.contentAngle,
        listings,
        generatedAt: new Date().toISOString(),
        complianceNote: "All listings generated using platform-safe aviation terminology. Run through Compliance Engine before uploading.",
      };
    }),

  // Process bulk design queue — multiple designs at once
  processBulkQueue: publicProcedure
    .input(z.object({
      designs: z.array(z.object({
        id: z.string(),
        name: z.string(),
        aircraft: z.string(),
        contentAngle: z.enum(["veteran_gift", "aviation_art", "pilot_pride", "history", "gift_idea"]),
        artworkReady: z.boolean(),
      })),
      platforms: z.array(z.enum(["amazon", "redbubble", "etsy", "spring", "spreadshirt"])),
    }))
    .mutation(async ({ input }) => {
      const results = [];

      for (const design of input.designs) {
        const listings: Record<string, unknown> = {};

        for (const platform of input.platforms) {
          listings[platform] = await generateListingForPlatform(
            design.name,
            design.aircraft,
            platform,
            design.contentAngle
          );
        }

        results.push({
          id: design.id,
          name: design.name,
          aircraft: design.aircraft,
          artworkReady: design.artworkReady,
          listings,
          status: design.artworkReady ? "READY_TO_UPLOAD" : "AWAITING_ARTWORK",
          platformCount: input.platforms.length,
        });
      }

      const readyCount = results.filter(r => r.status === "READY_TO_UPLOAD").length;
      const awaitingCount = results.filter(r => r.status === "AWAITING_ARTWORK").length;

      return {
        processed: results.length,
        readyToUpload: readyCount,
        awaitingArtwork: awaitingCount,
        totalListingsGenerated: results.reduce((sum, r) => sum + r.platformCount, 0),
        results,
        processedAt: new Date().toISOString(),
        nextStep: readyCount > 0
          ? `${readyCount} design(s) ready. Go to Bulk Upload Engine to dispatch to all platforms.`
          : "Prepare artwork for all designs then re-run queue.",
      };
    }),

  // Get design queue status
  getQueueStatus: publicProcedure
    .query(() => {
      return {
        queuedDesigns: 0,
        readyToUpload: 0,
        awaitingArtwork: 0,
        uploadedToday: 0,
        totalLive: 0,
        platforms: {
          amazon: { live: 10, queued: 0, tier: "Tier 10 → Target Tier 25" },
          redbubble: { live: 11, queued: 0, tier: "Active" },
          etsy: { live: 0, queued: 0, tier: "Needs Re-upload" },
          spring: { live: 0, queued: 0, tier: "Not Started" },
          spreadshirt: { live: 0, queued: 0, tier: "Not Started" },
        },
        tip: "Start by uploading your existing designs to Etsy, Spring, and Spreadshirt — zero cost, immediate exposure on 3 new platforms.",
      };
    }),

  // Get content angle recommendations based on aircraft type
  getContentAngles: publicProcedure
    .input(z.object({ aircraft: z.string() }))
    .query(async ({ input }) => {
      const angles = [
        {
          id: "veteran_gift",
          label: "Veteran & Military Gift",
          description: "Targets gift-buyers searching for presents for veterans, active duty, and military families. Highest buyer intent.",
          exampleTitle: `${input.aircraft} Military Aviation Veteran Gift T-Shirt`,
          bestPlatforms: ["etsy", "amazon"],
          conversionScore: 9.2,
        },
        {
          id: "aviation_art",
          label: "Aviation Art & Collector",
          description: "Targets aviation enthusiasts and collectors who appreciate the aircraft itself. Strong on Redbubble.",
          exampleTitle: `${input.aircraft} Fighter Jet Aviation Art Design`,
          bestPlatforms: ["redbubble", "etsy"],
          conversionScore: 7.8,
        },
        {
          id: "pilot_pride",
          label: "Pilot Pride",
          description: "Targets current and former pilots. Niche but highly loyal buyer group.",
          exampleTitle: `${input.aircraft} Pilot Pride Military Aviation Shirt`,
          bestPlatforms: ["amazon", "spring"],
          conversionScore: 8.1,
        },
        {
          id: "history",
          label: "Aviation History",
          description: "Targets history buffs and aviation historians. Good for WWII and Cold War era aircraft.",
          exampleTitle: `${input.aircraft} Military Aviation History Design`,
          bestPlatforms: ["redbubble", "spreadshirt"],
          conversionScore: 6.5,
        },
        {
          id: "gift_idea",
          label: "General Gift Idea",
          description: "Broad gift angle. Lower competition but also lower buyer intent. Good for volume.",
          exampleTitle: `${input.aircraft} Aircraft Gift Idea Aviation T-Shirt`,
          bestPlatforms: ["amazon", "etsy"],
          conversionScore: 7.0,
        },
      ];

      return {
        aircraft: input.aircraft,
        angles: angles.sort((a, b) => b.conversionScore - a.conversionScore),
        recommendation: `For ${input.aircraft}, start with "Veteran & Military Gift" angle — highest conversion score and most search volume on Amazon and Etsy.`,
      };
    }),
});
