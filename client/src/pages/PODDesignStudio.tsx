import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search, Upload, List, ExternalLink, Download, CheckCircle,
  AlertTriangle, XCircle, Info, Plus, Trash2, Zap, Image, Palette
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  description: string;
  thumbUrl: string;
  smallUrl: string;
  regularUrl: string;
  fullUrl: string;
  rawUrl: string;
  downloadLocation: string;
  unsplashUrl: string;
  photographerName: string;
  photographerUsername: string;
  photographerUrl: string;
  likes: number;
  attribution: string;
  meetsAmazonSpec: boolean;
  meetsRedbubbleSpec: boolean;
  megapixels: number;
}

interface BulkDesign {
  id: string;
  name: string;
  aircraft: string;
  contentAngle: "veteran_gift" | "aviation_art" | "pilot_pride" | "history" | "gift_idea";
  artworkReady: boolean;
}

const PLATFORMS = ["amazon", "redbubble", "etsy", "spring", "spreadshirt"] as const;
type Platform = typeof PLATFORMS[number];

const PLATFORM_COLORS: Record<Platform, string> = {
  amazon: "bg-orange-100 text-orange-800 border-orange-200",
  redbubble: "bg-red-100 text-red-800 border-red-200",
  etsy: "bg-amber-100 text-amber-800 border-amber-200",
  spring: "bg-green-100 text-green-800 border-green-200",
  spreadshirt: "bg-blue-100 text-blue-800 border-blue-200",
};

const CONTENT_ANGLES = [
  { id: "veteran_gift", label: "Veteran & Military Gift", score: 9.2 },
  { id: "aviation_art", label: "Aviation Art & Collector", score: 7.8 },
  { id: "pilot_pride", label: "Pilot Pride", score: 8.1 },
  { id: "history", label: "Aviation History", score: 6.5 },
  { id: "gift_idea", label: "General Gift Idea", score: 7.0 },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PODDesignStudio() {
  const [activeTab, setActiveTab] = useState<"browser" | "intake" | "bulk">("browser");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Design Studio</h1>
            <p className="text-sm text-gray-400">Find photos · Validate artwork · Generate listings · Queue for upload</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1">
          {[
            { id: "browser", label: "Photo Browser", icon: Search },
            { id: "intake", label: "Artwork Intake", icon: Upload },
            { id: "bulk", label: "Bulk Queue", icon: List },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "browser" && <PhotoBrowserTab />}
        {activeTab === "intake" && <ArtworkIntakeTab />}
        {activeTab === "bulk" && <BulkQueueTab />}
      </div>
    </div>
  );
}

// ─── Tab 1: Photo Browser ─────────────────────────────────────────────────────

function PhotoBrowserTab() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null);

  const presetsQuery = trpc.podDesignStudio.getPresets.useQuery();

  const searchQuery = trpc.podDesignStudio.searchUnsplash.useQuery(
    { query: activeQuery, page, perPage: 20 },
    { enabled: activeQuery.length > 0 }
  );

  const triggerDownload = trpc.podDesignStudio.triggerDownload.useMutation();

  const handleSearch = () => {
    if (!query.trim()) return;
    setActiveQuery(query.trim());
    setPage(1);
    setSelectedPhoto(null);
  };

  const handlePreset = (presetQuery: string) => {
    setQuery(presetQuery);
    setActiveQuery(presetQuery);
    setPage(1);
    setSelectedPhoto(null);
  };

  const handleSelectPhoto = async (photo: UnsplashPhoto) => {
    setSelectedPhoto(photo);
    // Trigger download event as required by Unsplash API guidelines
    await triggerDownload.mutateAsync({ downloadLocation: photo.downloadLocation });
  };

  const handleUsePhoto = (photo: UnsplashPhoto) => {
    toast.success(`Photo selected: ${photo.attribution}`, {
      description: "Copy the full-res URL below to use in your design tool.",
      duration: 5000,
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search aviation photos (e.g. F-15 fighter jet, afterburner, aircraft carrier)..."
            className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim()}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Search
        </button>
      </div>

      {/* Presets */}
      {presetsQuery.data && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {presetsQuery.data.presets.map((preset: { label: string; query: string }) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset.query)}
                className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-300 hover:border-indigo-500 hover:text-white transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Licence Notice */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-800/50 bg-blue-900/20 p-3 text-sm text-blue-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Unsplash free licence permits commercial POD use. Attribution required: <strong>"Photo by [name] on Unsplash"</strong>.
          Always trigger download before using a photo (handled automatically when you click a photo).
        </span>
      </div>

      {/* Results */}
      {searchQuery.isLoading && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mr-3" />
          Searching Unsplash...
        </div>
      )}

      {searchQuery.error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400 text-sm">
          {searchQuery.error.message}
        </div>
      )}

      {searchQuery.data && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {searchQuery.data.total.toLocaleString()} results for <strong className="text-white">"{activeQuery}"</strong>
            </p>
            <p className="text-xs text-gray-600">Page {page} of {searchQuery.data.totalPages}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {searchQuery.data.results.map((photo: UnsplashPhoto) => (
              <div
                key={photo.id}
                onClick={() => handleSelectPhoto(photo)}
                className={`group cursor-pointer overflow-hidden rounded-lg border transition-all ${
                  selectedPhoto?.id === photo.id
                    ? "border-indigo-500 ring-2 ring-indigo-500/50"
                    : "border-gray-700 hover:border-gray-500"
                }`}
              >
                <div className="relative aspect-square overflow-hidden bg-gray-800">
                  <img
                    src={photo.smallUrl}
                    alt={photo.description}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Spec badges */}
                  <div className="absolute bottom-1 left-1 flex gap-1">
                    {photo.meetsAmazonSpec && (
                      <span className="rounded bg-orange-600/90 px-1 py-0.5 text-[10px] font-bold text-white">AMZ</span>
                    )}
                    {photo.meetsRedbubbleSpec && (
                      <span className="rounded bg-red-600/90 px-1 py-0.5 text-[10px] font-bold text-white">RB</span>
                    )}
                  </div>
                  <div className="absolute top-1 right-1">
                    <span className="rounded bg-black/70 px-1 py-0.5 text-[10px] text-gray-300">{photo.megapixels}MP</span>
                  </div>
                </div>
                <div className="p-2">
                  <p className="truncate text-xs text-gray-400">{photo.photographerName}</p>
                  <p className="text-xs text-gray-600">{photo.width}×{photo.height}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= searchQuery.data.totalPages}
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Selected Photo Detail Panel */}
      {selectedPhoto && (
        <div className="rounded-xl border border-indigo-700/50 bg-gray-900 p-5">
          <div className="flex gap-5">
            <img
              src={selectedPhoto.regularUrl}
              alt={selectedPhoto.description}
              className="h-48 w-48 shrink-0 rounded-lg object-cover"
            />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-white">{selectedPhoto.description}</h3>
                <p className="text-sm text-gray-400">
                  {selectedPhoto.width}×{selectedPhoto.height}px · {selectedPhoto.megapixels}MP
                </p>
              </div>

              {/* Platform readiness */}
              <div className="flex flex-wrap gap-2">
                {(["amazon", "redbubble", "etsy", "spring", "spreadshirt"] as Platform[]).map(p => {
                  const ready = p === "amazon"
                    ? selectedPhoto.meetsAmazonSpec
                    : p === "redbubble"
                    ? selectedPhoto.meetsRedbubbleSpec
                    : selectedPhoto.width >= 2000;
                  return (
                    <span
                      key={p}
                      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                        ready ? "border-green-700 bg-green-900/30 text-green-400" : "border-yellow-700 bg-yellow-900/30 text-yellow-400"
                      }`}
                    >
                      {ready ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {p}
                    </span>
                  );
                })}
              </div>

              {/* Attribution */}
              <div className="rounded-lg bg-gray-800 px-3 py-2 text-xs text-gray-300">
                <strong>Required attribution:</strong> {selectedPhoto.attribution}
                <a
                  href={selectedPhoto.photographerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-indigo-400 hover:text-indigo-300"
                >
                  View profile ↗
                </a>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUsePhoto(selectedPhoto)}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Download className="h-4 w-4" />
                  Use This Photo
                </button>
                <a
                  href={selectedPhoto.fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Full Resolution
                </a>
                <a
                  href={selectedPhoto.unsplashUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  View on Unsplash
                </a>
              </div>

              {/* Full-res URL for copying */}
              <div>
                <p className="mb-1 text-xs text-gray-500">Full-res URL (copy into your design tool):</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={selectedPhoto.fullUrl}
                    className="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 font-mono"
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPhoto.fullUrl);
                      toast.success("URL copied to clipboard");
                    }}
                    className="rounded border border-gray-600 bg-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-600"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Artwork Intake ────────────────────────────────────────────────────

function ArtworkIntakeTab() {
  const [filename, setFilename] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [dpi, setDpi] = useState("");
  const [fileSizeMB, setFileSizeMB] = useState("");
  const [format, setFormat] = useState("PNG");
  const [hasTransparency, setHasTransparency] = useState<boolean | undefined>(undefined);
  const [colourMode, setColourMode] = useState("sRGB");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvasQuery = trpc.podDesignStudio.getCanvasSpecs.useQuery();
  const analyseArtwork = trpc.podDesignStudio.analyseArtwork.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    setFileSizeMB((file.size / 1024 / 1024).toFixed(2));

    const ext = file.name.split(".").pop()?.toUpperCase() || "PNG";
    setFormat(ext === "JPG" ? "JPG" : ext === "JPEG" ? "JPG" : ext);

    // Read image dimensions
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleAnalyse = async () => {
    if (!filename || !width || !height || !fileSizeMB) {
      toast.error("Please fill in all required fields or select a file");
      return;
    }

    try {
      await analyseArtwork.mutateAsync({
        filename,
        widthPx: parseInt(width),
        heightPx: parseInt(height),
        dpi: dpi ? parseInt(dpi) : undefined,
        fileSizeMB: parseFloat(fileSizeMB),
        format,
        hasTransparentBackground: hasTransparency,
        colourMode: colourMode || undefined,
      });
    } catch (err) {
      toast.error("Analysis failed");
    }
  };

  const result = analyseArtwork.data;

  const statusColor = result?.overallStatus === "READY"
    ? "border-green-700 bg-green-900/20"
    : result?.overallStatus === "NEEDS_CANVAS"
    ? "border-yellow-700 bg-yellow-900/20"
    : "border-red-700 bg-red-900/20";

  const statusIcon = result?.overallStatus === "READY"
    ? <CheckCircle className="h-5 w-5 text-green-400" />
    : result?.overallStatus === "NEEDS_CANVAS"
    ? <AlertTriangle className="h-5 w-5 text-yellow-400" />
    : <XCircle className="h-5 w-5 text-red-400" />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Input Panel */}
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Artwork Validator</h2>
          <p className="text-sm text-gray-400">Upload or enter your artwork details to check Amazon/POD readiness.</p>
        </div>

        {/* File Upload */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Upload Artwork (auto-reads dimensions)</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/50 p-6 text-center hover:border-gray-500 transition-colors"
          >
            <Image className="mb-2 h-8 w-8 text-gray-600" />
            <p className="text-sm text-gray-400">Click to select file or drag & drop</p>
            <p className="text-xs text-gray-600 mt-1">PNG, JPG, GIF, BMP, TIFF</p>
            {filename && <p className="mt-2 text-sm font-medium text-indigo-400">{filename}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Manual Input Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Width (px)</label>
            <input
              type="number"
              value={width}
              onChange={e => setWidth(e.target.value)}
              placeholder="e.g. 4500"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Height (px)</label>
            <input
              type="number"
              value={height}
              onChange={e => setHeight(e.target.value)}
              placeholder="e.g. 5400"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">DPI (optional)</label>
            <input
              type="number"
              value={dpi}
              onChange={e => setDpi(e.target.value)}
              placeholder="e.g. 300"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">File Size (MB)</label>
            <input
              type="number"
              step="0.1"
              value={fileSizeMB}
              onChange={e => setFileSizeMB(e.target.value)}
              placeholder="e.g. 12.5"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Format</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              {["PNG", "JPG", "GIF", "BMP", "TIFF", "PSD", "AI", "EPS"].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Colour Mode</label>
            <select
              value={colourMode}
              onChange={e => setColourMode(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="sRGB">sRGB</option>
              <option value="RGB">RGB</option>
              <option value="CMYK">CMYK</option>
            </select>
          </div>
        </div>

        {/* Transparency */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Background Transparency</label>
          <div className="flex gap-3">
            {[
              { value: true, label: "Transparent" },
              { value: false, label: "Solid/White" },
              { value: undefined, label: "Unknown" },
            ].map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => setHasTransparency(opt.value)}
                className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                  hasTransparency === opt.value
                    ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAnalyse}
          disabled={analyseArtwork.isPending || !filename}
          className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {analyseArtwork.isPending ? (
            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Analysing...</>
          ) : (
            <><Zap className="h-4 w-4" /> Analyse Artwork</>
          )}
        </button>

        {/* Canvas Specs Reference */}
        {canvasQuery.data && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Golden Standard</p>
            <p className="text-sm font-medium text-green-400">{canvasQuery.data.universalStandard.note}</p>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-400">
              <span>Size: {canvasQuery.data.universalStandard.width}×{canvasQuery.data.universalStandard.height}px</span>
              <span>DPI: {canvasQuery.data.universalStandard.dpi}</span>
              <span>Format: {canvasQuery.data.universalStandard.format}</span>
              <span>Background: {canvasQuery.data.universalStandard.background}</span>
            </div>
          </div>
        )}
      </div>

      {/* Results Panel */}
      <div className="space-y-4">
        {!result && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-700 bg-gray-800/30 py-16 text-center">
            <Upload className="mb-3 h-10 w-10 text-gray-600" />
            <p className="text-gray-500">Upload artwork or enter dimensions to see analysis</p>
          </div>
        )}

        {result && (
          <>
            {/* Overall Status */}
            <div className={`rounded-xl border p-4 ${statusColor}`}>
              <div className="flex items-center gap-3">
                {statusIcon}
                <div>
                  <p className="font-semibold text-white">{result.statusLabel}</p>
                  <p className="text-sm text-gray-400">{filename}</p>
                </div>
              </div>
            </div>

            {/* Platform Readiness */}
            <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-300">Platform Readiness</p>
              <div className="space-y-2">
                {Object.entries(result.platformReadiness).map(([platform, status]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${PLATFORM_COLORS[platform as Platform]}`}>
                      {platform}
                    </span>
                    <span className={`text-sm ${
                      String(status).includes("Ready") ? "text-green-400" : "text-yellow-400"
                    }`}>
                      {String(status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="rounded-xl border border-red-800/50 bg-red-900/10 p-4">
                <p className="mb-2 text-sm font-semibold text-red-400">Issues to Fix ({result.issues.length})</p>
                <ul className="space-y-1">
                  {result.issues.map((issue: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="rounded-xl border border-yellow-800/50 bg-yellow-900/10 p-4">
                <p className="mb-2 text-sm font-semibold text-yellow-400">Warnings ({result.warnings.length})</p>
                <ul className="space-y-1">
                  {result.warnings.map((w: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-yellow-300">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fix Steps */}
            {result.fixSteps.length > 0 && (
              <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-300">Fix Steps</p>
                <div className="space-y-3">
                  {result.fixSteps.map((step: { step: number; action: string; detail: string; tool: string }) => (
                    <div key={step.step} className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                        {step.step}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{step.action}</p>
                        <p className="text-xs text-gray-400">{step.detail}</p>
                        <p className="mt-0.5 text-xs text-indigo-400">Tool: {step.tool}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Placement Guide */}
            <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
              <p className="mb-2 text-sm font-semibold text-gray-300">Amazon Placement Guide</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <span>Canvas: {result.placementGuide.canvasSize}</span>
                <span>Your image: {result.placementGuide.yourImageSize}</span>
                <span>X offset: {result.placementGuide.recommendedPlacement.x}px</span>
                <span>Y offset: {result.placementGuide.recommendedPlacement.y}px</span>
                <span>Design width: {result.placementGuide.recommendedPlacement.width}px</span>
                <span>Scale: {result.placementGuide.recommendedPlacement.scaleFactor}</span>
              </div>
            </div>

            {/* Quick Win */}
            <div className="rounded-xl border border-green-800/50 bg-green-900/10 p-3 text-sm text-green-400">
              <strong>Quick Win:</strong> {result.quickWin}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tab 3: Bulk Queue ────────────────────────────────────────────────────────

function BulkQueueTab() {
  const [designs, setDesigns] = useState<BulkDesign[]>([
    { id: "1", name: "F-15 Eagle Afterburner", aircraft: "F-15 Strike Eagle", contentAngle: "veteran_gift", artworkReady: false },
  ]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["amazon", "redbubble", "etsy"]);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [expandedDesign, setExpandedDesign] = useState<string | null>(null);

  const processBulkQueue = trpc.podDesignStudio.processBulkQueue.useMutation({
    onSuccess: (data) => {
      setResults(data as Record<string, unknown>);
      toast.success(`Processed ${data.processed} designs — ${data.readyToUpload} ready to upload`);
    },
    onError: (err) => toast.error(err.message || "Processing failed"),
  });

  const addDesign = () => {
    setDesigns(prev => [
      ...prev,
      {
        id: String(Date.now()),
        name: "",
        aircraft: "F-15 Strike Eagle",
        contentAngle: "veteran_gift",
        artworkReady: false,
      },
    ]);
  };

  const removeDesign = (id: string) => {
    setDesigns(prev => prev.filter(d => d.id !== id));
  };

  const updateDesign = (id: string, field: keyof BulkDesign, value: unknown) => {
    setDesigns(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleProcess = () => {
    const valid = designs.filter(d => d.name.trim() && d.aircraft.trim());
    if (valid.length === 0) {
      toast.error("Add at least one design with a name and aircraft");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }
    processBulkQueue.mutate({ designs: valid, platforms: selectedPlatforms });
  };

  const typedResults = results as {
    processed: number;
    readyToUpload: number;
    awaitingArtwork: number;
    totalListingsGenerated: number;
    nextStep: string;
    results: Array<{
      id: string;
      name: string;
      aircraft: string;
      status: string;
      listings: Record<string, { title: string; description: string; tags: string[]; bullets: string[]; price: number }>;
    }>;
  } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Bulk Design Queue</h2>
          <p className="text-sm text-gray-400">Add multiple designs, select platforms, generate all listings at once.</p>
        </div>
        <button
          onClick={addDesign}
          className="flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          Add Design
        </button>
      </div>

      {/* Platform Selection */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-300">Target Platforms</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                selectedPlatforms.includes(p)
                  ? PLATFORM_COLORS[p] + " border-current"
                  : "border-gray-700 bg-gray-800 text-gray-500"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Design List */}
      <div className="space-y-3">
        {designs.map((design, idx) => (
          <div key={design.id} className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-gray-300">
                {idx + 1}
              </div>
              <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Design Name</label>
                  <input
                    type="text"
                    value={design.name}
                    onChange={e => updateDesign(design.id, "name", e.target.value)}
                    placeholder="e.g. F-15 Afterburner Sunset"
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Aircraft</label>
                  <select
                    value={design.aircraft}
                    onChange={e => updateDesign(design.id, "aircraft", e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {["F-15 Strike Eagle", "F-16 Fighting Falcon", "A-10 Warthog", "F-22 Raptor", "F-35 Lightning", "SR-71 Blackbird", "B-52 Stratofortress", "P-51 Mustang", "F/A-18 Hornet", "AH-64 Apache", "V-22 Osprey"].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Content Angle</label>
                  <select
                    value={design.contentAngle}
                    onChange={e => updateDesign(design.id, "contentAngle", e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {CONTENT_ANGLES.map(a => (
                      <option key={a.id} value={a.id}>{a.label} ({a.score})</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={design.artworkReady}
                      onChange={e => updateDesign(design.id, "artworkReady", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600"
                    />
                    <span className="text-sm text-gray-400">Artwork ready</span>
                  </label>
                  <button
                    onClick={() => removeDesign(design.id)}
                    className="ml-auto rounded-lg p-1.5 text-gray-600 hover:bg-gray-700 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Process Button */}
      <button
        onClick={handleProcess}
        disabled={processBulkQueue.isPending || designs.length === 0}
        className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {processBulkQueue.isPending ? (
          <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Generating listings...</>
        ) : (
          <><Zap className="h-4 w-4" /> Generate All Listings ({designs.length} designs × {selectedPlatforms.length} platforms)</>
        )}
      </button>

      {/* Results */}
      {typedResults && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Designs Processed", value: typedResults.processed, color: "text-white" },
              { label: "Ready to Upload", value: typedResults.readyToUpload, color: "text-green-400" },
              { label: "Awaiting Artwork", value: typedResults.awaitingArtwork, color: "text-yellow-400" },
              { label: "Listings Generated", value: typedResults.totalListingsGenerated, color: "text-indigo-400" },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-indigo-800/50 bg-indigo-900/20 p-3 text-sm text-indigo-300">
            <strong>Next step:</strong> {typedResults.nextStep}
          </div>

          {/* Per-Design Results */}
          {typedResults.results.map(r => (
            <div key={r.id} className="rounded-xl border border-gray-700 bg-gray-800/50">
              <button
                onClick={() => setExpandedDesign(expandedDesign === r.id ? null : r.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "READY_TO_UPLOAD"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-yellow-900/50 text-yellow-400"
                  }`}>
                    {r.status === "READY_TO_UPLOAD" ? "Ready" : "Awaiting Artwork"}
                  </span>
                  <span className="font-medium text-white">{r.name}</span>
                  <span className="text-sm text-gray-500">{r.aircraft}</span>
                </div>
                <span className="text-gray-500">{expandedDesign === r.id ? "▲" : "▼"}</span>
              </button>

              {expandedDesign === r.id && (
                <div className="border-t border-gray-700 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(r.listings).map(([platform, listing]) => (
                      <div key={platform} className="rounded-lg border border-gray-700 bg-gray-900 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${PLATFORM_COLORS[platform as Platform]}`}>
                            {platform}
                          </span>
                          <span className="text-sm font-semibold text-green-400">${listing.price}</span>
                        </div>
                        <p className="mb-1 text-sm font-medium text-white">{listing.title}</p>
                        <p className="mb-2 text-xs text-gray-400 line-clamp-2">{listing.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {listing.tags.slice(0, 5).map((tag, i) => (
                            <span key={i} className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">
                              {tag}
                            </span>
                          ))}
                          {listing.tags.length > 5 && (
                            <span className="text-[10px] text-gray-600">+{listing.tags.length - 5} more</span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const text = `TITLE: ${listing.title}\n\nDESCRIPTION: ${listing.description}\n\nTAGS: ${listing.tags.join(", ")}\n\nBULLETS:\n${listing.bullets?.join("\n") || ""}`;
                            navigator.clipboard.writeText(text);
                            toast.success(`${platform} listing copied`);
                          }}
                          className="mt-2 w-full rounded border border-gray-700 py-1 text-xs text-gray-400 hover:bg-gray-800"
                        >
                          Copy listing text
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
