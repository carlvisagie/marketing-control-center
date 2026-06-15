/**
 * POD Compliance Engine Dashboard
 *
 * Validates listings against all 5 platform rules before upload.
 * Shows rulebook, term checker, and full compliance report.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Search,
  BookOpen,
  Zap,
  ImageIcon,
  Upload,
} from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  amazon_merch: "Amazon Merch",
  redbubble: "Redbubble",
  etsy: "Etsy",
  spring: "Spring",
  spreadshirt: "Spreadshirt",
};

export default function PODCompliance() {
  const [activeTab, setActiveTab] = useState("checker");
  const [termToCheck, setTermToCheck] = useState("");
  const [checkedTerm, setCheckedTerm] = useState<string | null>(null);

  // Listing form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bullets, setBullets] = useState("");
  const [tags, setTags] = useState("");
  const [brand, setBrand] = useState("");
  const [productionPartner, setProductionPartner] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["amazon_merch", "redbubble", "etsy", "spring", "spreadshirt"]);
  const [runCheck, setRunCheck] = useState(false);

  // Artwork validator state
  const [artworkFilename, setArtworkFilename] = useState("");
  const [artworkFormat, setArtworkFormat] = useState("PNG");
  const [artworkWidth, setArtworkWidth] = useState("");
  const [artworkHeight, setArtworkHeight] = useState("");
  const [artworkDpi, setArtworkDpi] = useState("");
  const [artworkSizeMB, setArtworkSizeMB] = useState("");
  const [artworkTransparent, setArtworkTransparent] = useState<boolean | undefined>(undefined);
  const [artworkColourMode, setArtworkColourMode] = useState("");
  const [artworkPlatforms, setArtworkPlatforms] = useState<("amazon" | "redbubble" | "etsy" | "spring" | "spreadshirt")[]>(["amazon", "redbubble", "etsy", "spring", "spreadshirt"]);
  const [artworkResult, setArtworkResult] = useState<any>(null);

  const validateArtwork = trpc.podCompliance.validateArtwork.useMutation({
    onSuccess: (data) => setArtworkResult(data),
  });

  const handleArtworkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArtworkFilename(file.name);
    const ext = file.name.split(".").pop()?.toUpperCase() ?? "PNG";
    setArtworkFormat(ext);
    setArtworkSizeMB((file.size / (1024 * 1024)).toFixed(2));
    // Read image dimensions
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setArtworkWidth(String(img.naturalWidth));
      setArtworkHeight(String(img.naturalHeight));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleArtworkValidate = () => {
    if (!artworkFilename || !artworkWidth || !artworkHeight || !artworkSizeMB) return;
    validateArtwork.mutate({
      filename: artworkFilename,
      format: artworkFormat,
      widthPx: parseInt(artworkWidth),
      heightPx: parseInt(artworkHeight),
      dpi: artworkDpi ? parseFloat(artworkDpi) : undefined,
      fileSizeMB: parseFloat(artworkSizeMB),
      hasTransparentBackground: artworkTransparent,
      colourMode: artworkColourMode || undefined,
      platforms: artworkPlatforms,
    });
  };

  const toggleArtworkPlatform = (p: "amazon" | "redbubble" | "etsy" | "spring" | "spreadshirt") => {
    setArtworkPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  // Rulebook
  const { data: rulebook } = trpc.podCompliance.getRulebook.useQuery();

  // Safe terms
  const { data: safeTerms } = trpc.podCompliance.getSafeAviationTerms.useQuery();

  // Term check
  const { data: termResult } = trpc.podCompliance.checkTerm.useQuery(
    { term: checkedTerm! },
    { enabled: !!checkedTerm }
  );

  // Listing compliance check
  const { data: complianceResult, isLoading: isChecking } = trpc.podCompliance.checkListing.useQuery(
    {
      title,
      description,
      bullets: bullets.split("\n").filter((b: string) => b.trim()),
      tags: tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      brand: brand || undefined,
      hasProductionPartnerDisclosed: productionPartner,
      platforms: selectedPlatforms as any[],
    },
    { enabled: runCheck && title.length > 0 }
  );

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-emerald-400" />
            Compliance Engine
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">ZERO VIOLATIONS</Badge>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Every listing validated against all 5 platform rules before upload. No rejections. No suspensions.
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <Card className="bg-gradient-to-r from-emerald-900/20 to-slate-900 border-emerald-500/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {["amazon_merch", "redbubble", "etsy", "spring", "spreadshirt"].map(p => (
              <div key={p} className="text-center">
                <ShieldCheck className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-white font-medium">{PLATFORM_LABELS[p]}</p>
                <p className="text-xs text-emerald-400">Rules Loaded</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="checker">Listing Validator</TabsTrigger>
          <TabsTrigger value="term">Term Checker</TabsTrigger>
          <TabsTrigger value="rulebook">Rulebook</TabsTrigger>
            <TabsTrigger value="safe-terms">Safe Aviation Terms</TabsTrigger>
          <TabsTrigger value="artwork">Artwork Validator</TabsTrigger>
        </TabsList>

        {/* Listing Validator */}
        <TabsContent value="checker" className="mt-4 space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                Validate Listing Before Upload
              </CardTitle>
              <p className="text-slate-400 text-xs">Paste your listing details. Engine checks against all platform rules instantly.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platform selector */}
              <div>
                <Label className="text-slate-300 text-sm mb-2 block">Platforms to Check</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => togglePlatform(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedPlatforms.includes(key)
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 text-sm">Title <span className="text-slate-500">(max 60 chars for Amazon)</span></Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="F-15 Strike Eagle Fighter Pilot Gift Military Aviation Shirt"
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                  <p className={`text-xs mt-1 ${title.length > 60 ? "text-red-400" : "text-slate-500"}`}>
                    {title.length}/60 chars
                  </p>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm">Brand <span className="text-slate-500">(Amazon only)</span></Label>
                  <Input
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder="Jetfighter1"
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300 text-sm">Bullet Points <span className="text-slate-500">(one per line, Amazon)</span></Label>
                <Textarea
                  value={bullets}
                  onChange={e => setBullets(e.target.value)}
                  placeholder={"Perfect gift for F-15 Strike Eagle fans and USAF veterans\nHigh quality print on premium cotton t-shirt\nAvailable in multiple sizes and colors"}
                  className="bg-slate-800 border-slate-700 text-white mt-1 h-24 text-sm"
                />
              </div>

              <div>
                <Label className="text-slate-300 text-sm">Tags <span className="text-slate-500">(comma separated, max 13 Etsy / 15 Redbubble)</span></Label>
                <Input
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="fighter pilot gift, f-15 shirt, military aviation, usaf veteran, aviation art"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {tags.split(",").filter(t => t.trim()).length} tags entered
                </p>
              </div>

              <div>
                <Label className="text-slate-300 text-sm">Description</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Show your love for military aviation with this F-15 Strike Eagle design..."
                  className="bg-slate-800 border-slate-700 text-white mt-1 h-20 text-sm"
                />
              </div>

              {/* Etsy production partner */}
              {selectedPlatforms.includes("etsy") && (
                <div className="flex items-center gap-3 p-3 bg-orange-900/20 rounded-lg border border-orange-500/30">
                  <input
                    type="checkbox"
                    id="prodPartner"
                    checked={productionPartner}
                    onChange={e => setProductionPartner(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="prodPartner" className="text-sm text-orange-300">
                    I have disclosed my POD provider as a production partner in Etsy Shop Settings
                    <span className="text-orange-400 font-bold"> (REQUIRED for Etsy)</span>
                  </label>
                </div>
              )}

              <Button
                onClick={() => setRunCheck(r => !r)}
                disabled={!title || isChecking}
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Run Compliance Check
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {complianceResult && (
            <div className="space-y-4">
              {/* Overall result */}
              <Card className={`border ${complianceResult.overallPassed ? "bg-emerald-900/20 border-emerald-500/30" : "bg-red-900/20 border-red-500/30"}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {complianceResult.overallPassed
                      ? <ShieldCheck className="h-6 w-6 text-emerald-400" />
                      : <ShieldX className="h-6 w-6 text-red-400" />
                    }
                    <div className="flex-1">
                      <p className={`font-semibold ${complianceResult.overallPassed ? "text-emerald-400" : "text-red-400"}`}>
                        {complianceResult.summary}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Overall compliance score: {complianceResult.overallScore}/100
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Approved</p>
                      <p className="text-lg font-bold text-emerald-400">{complianceResult.approvedPlatforms.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Blocked</p>
                      <p className="text-lg font-bold text-red-400">{complianceResult.blockedPlatforms.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Per-platform results */}
              {complianceResult.results.map((result: any) => (
                <Card key={result.platform} className={`bg-slate-900 border ${result.passed ? "border-emerald-500/20" : "border-red-500/30"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {result.passed
                          ? <CheckCircle className="h-4 w-4 text-emerald-400" />
                          : <XCircle className="h-4 w-4 text-red-400" />
                        }
                        <h3 className="font-semibold text-white text-sm">{PLATFORM_LABELS[result.platform]}</h3>
                      </div>
                      <Badge className={result.passed
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                      }>
                        {result.score}/100 — {result.passed ? "SAFE TO UPLOAD" : "FIX REQUIRED"}
                      </Badge>
                    </div>

                    {/* Violations */}
                    {result.violations.map((v: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-red-900/20 rounded border border-red-500/20 mb-2">
                        <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-red-400 font-medium">{v.rule}</p>
                          <p className="text-xs text-white mt-0.5">{v.detail}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Fix: {v.fix}</p>
                        </div>
                      </div>
                    ))}

                    {/* Warnings */}
                    {result.warnings.map((w: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-yellow-900/20 rounded border border-yellow-500/20 mb-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-yellow-400 font-medium">{w.rule}</p>
                          <p className="text-xs text-white mt-0.5">{w.detail}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Fix: {w.fix}</p>
                        </div>
                      </div>
                    ))}

                    {/* Suggestions */}
                    {result.suggestions.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-blue-900/20 rounded border border-blue-500/20 mb-2">
                        <Info className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-300">{s}</p>
                      </div>
                    ))}

                    {result.violations.length === 0 && result.warnings.length === 0 && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        No violations or warnings. Listing is clean.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Term Checker */}
        <TabsContent value="term" className="mt-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Search className="h-4 w-4 text-emerald-400" />
                Term Safety Checker
              </CardTitle>
              <p className="text-slate-400 text-xs">Check any word or phrase before using it in a listing.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={termToCheck}
                  onChange={e => setTermToCheck(e.target.value)}
                  placeholder="e.g. thunderbirds, premium, f-15 strike eagle"
                  className="bg-slate-800 border-slate-700 text-white"
                  onKeyDown={e => e.key === "Enter" && setCheckedTerm(termToCheck)}
                />
                <Button
                  onClick={() => setCheckedTerm(termToCheck)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Check
                </Button>
              </div>

              {termResult && (
                <div className={`p-4 rounded-lg border ${
                  termResult.status === "SAFE" ? "bg-emerald-900/20 border-emerald-500/30" :
                  termResult.status === "BLOCKED" ? "bg-red-900/20 border-red-500/30" :
                  termResult.status === "CAUTION" ? "bg-yellow-900/20 border-yellow-500/30" :
                  "bg-slate-800 border-slate-700"
                }`}>
                  <div className="flex items-center gap-3">
                    {termResult.status === "SAFE" && <ShieldCheck className="h-5 w-5 text-emerald-400" />}
                    {termResult.status === "BLOCKED" && <ShieldX className="h-5 w-5 text-red-400" />}
                    {termResult.status === "CAUTION" && <ShieldAlert className="h-5 w-5 text-yellow-400" />}
                    {termResult.status === "UNKNOWN" && <Info className="h-5 w-5 text-slate-400" />}
                    <div>
                      <p className="font-semibold text-white">"{termResult.term}"</p>
                      <Badge className={`text-xs mt-1 ${
                        termResult.status === "SAFE" ? "bg-emerald-500/20 text-emerald-400" :
                        termResult.status === "BLOCKED" ? "bg-red-500/20 text-red-400" :
                        termResult.status === "CAUTION" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-slate-700 text-slate-300"
                      }`}>
                        {termResult.status}
                      </Badge>
                      <p className="text-xs text-slate-300 mt-1">{termResult.reason}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rulebook */}
        <TabsContent value="rulebook" className="mt-4 space-y-4">
          {rulebook && Object.entries(rulebook).map(([key, rules]: [string, any]) => (
            <Card key={key} className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                  {rules.name}
                  {key === "amazon_merch" && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">HIGH RISK</Badge>
                  )}
                </CardTitle>
                {rules.criticalWarning && (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    {rules.criticalWarning}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {rules.titleMaxLength && (
                    <div className="p-2 bg-slate-800 rounded">
                      <p className="text-xs text-slate-400">Title Max</p>
                      <p className="text-sm font-bold text-white">{rules.titleMaxLength} chars</p>
                    </div>
                  )}
                  {rules.maxTags && (
                    <div className="p-2 bg-slate-800 rounded">
                      <p className="text-xs text-slate-400">Max Tags</p>
                      <p className="text-sm font-bold text-white">{rules.maxTags}</p>
                    </div>
                  )}
                  {rules.bulletMaxLength && (
                    <div className="p-2 bg-slate-800 rounded">
                      <p className="text-xs text-slate-400">Bullet Max</p>
                      <p className="text-sm font-bold text-white">{rules.bulletMaxLength} chars</p>
                    </div>
                  )}
                  {rules.triggerWordCount && (
                    <div className="p-2 bg-slate-800 rounded">
                      <p className="text-xs text-slate-400">Trigger Words</p>
                      <p className="text-sm font-bold text-red-400">{rules.triggerWordCount} blocked</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {rules.keyRules?.map((rule: string, i: number) => (
                    <p key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <CheckCircle className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                      {rule}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Safe Aviation Terms */}
        <TabsContent value="safe-terms" className="mt-4 space-y-4">
          {safeTerms && (
            <>
              <Card className="bg-slate-900 border-emerald-500/20">
                <CardHeader>
                  <CardTitle className="text-emerald-400 text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Safe Aviation Terms — Verified for All Platforms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {safeTerms.safeTerms.map((term: string) => (
                      <span key={term} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">
                        {term}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="text-yellow-400 text-sm flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Caution Terms — Use Descriptively Only, Never as Endorsement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {safeTerms.cautionTerms.map((term: string) => (
                      <span key={term} className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded">
                        {term}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-red-400 text-sm flex items-center gap-2">
                    <ShieldX className="h-4 w-4" />
                    Amazon Trigger Words — Never Use These Anywhere in Listings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {safeTerms.triggerWords.map((term: string) => (
                      <span key={term} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded">
                        {term}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        {/* Artwork Validator */}
        <TabsContent value="artwork" className="mt-4 space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-blue-400" />
                Artwork File Validator
              </CardTitle>
              <p className="text-slate-400 text-xs mt-1">
                Upload your design file or enter its specs manually. Engine checks dimensions, DPI, format, file size, and colour mode against all 5 platform requirements.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File upload shortcut */}
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Quick-fill from file (reads dimensions and size automatically)</Label>
                <input
                  type="file"
                  accept="image/*,.ai,.eps,.pdf"
                  onChange={handleArtworkFileChange}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer"
                />
              </div>

              {/* Manual spec entry */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-slate-300 text-xs">Filename</Label>
                  <Input value={artworkFilename} onChange={e => setArtworkFilename(e.target.value)}
                    placeholder="design.png" className="bg-slate-800 border-slate-700 text-white text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Format</Label>
                  <select value={artworkFormat} onChange={e => setArtworkFormat(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-2 mt-1">
                    {["PNG","JPG","JPEG","GIF","BMP","SVG","AI","EPS","PDF"].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Width (px)</Label>
                  <Input value={artworkWidth} onChange={e => setArtworkWidth(e.target.value)}
                    placeholder="4500" type="number" className="bg-slate-800 border-slate-700 text-white text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Height (px)</Label>
                  <Input value={artworkHeight} onChange={e => setArtworkHeight(e.target.value)}
                    placeholder="5400" type="number" className="bg-slate-800 border-slate-700 text-white text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">DPI (optional)</Label>
                  <Input value={artworkDpi} onChange={e => setArtworkDpi(e.target.value)}
                    placeholder="300" type="number" className="bg-slate-800 border-slate-700 text-white text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">File Size (MB)</Label>
                  <Input value={artworkSizeMB} onChange={e => setArtworkSizeMB(e.target.value)}
                    placeholder="8.5" type="number" step="0.01" className="bg-slate-800 border-slate-700 text-white text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Colour Mode</Label>
                  <select value={artworkColourMode} onChange={e => setArtworkColourMode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-2 mt-1">
                    <option value="">Unknown</option>
                    <option value="RGB">RGB / sRGB</option>
                    <option value="CMYK">CMYK</option>
                    <option value="Grayscale">Grayscale</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300 text-xs">Transparent Background</Label>
                  <select value={artworkTransparent === undefined ? "" : artworkTransparent ? "yes" : "no"}
                    onChange={e => setArtworkTransparent(e.target.value === "" ? undefined : e.target.value === "yes")}
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-2 mt-1">
                    <option value="">Unknown</option>
                    <option value="yes">Yes — transparent</option>
                    <option value="no">No — solid background</option>
                  </select>
                </div>
              </div>

              {/* Platform selection */}
              <div>
                <Label className="text-slate-300 text-xs mb-2 block">Check Against Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {(["amazon","redbubble","etsy","spring","spreadshirt"] as const).map(p => (
                    <button key={p} onClick={() => toggleArtworkPlatform(p)}
                      className={`text-xs px-3 py-1 rounded border transition-colors ${
                        artworkPlatforms.includes(p)
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                          : "bg-slate-800 text-slate-500 border-slate-700"
                      }`}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleArtworkValidate} disabled={validateArtwork.isPending || !artworkFilename}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Upload className="h-4 w-4" />
                {validateArtwork.isPending ? "Checking..." : "Validate Artwork"}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {artworkResult && (
            <div className="space-y-3">
              {/* Overall status */}
              <Card className={`border ${
                artworkResult.overallStatus === "PASS" ? "bg-emerald-900/20 border-emerald-500/30" :
                artworkResult.overallStatus === "WARNING" ? "bg-yellow-900/20 border-yellow-500/30" :
                "bg-red-900/20 border-red-500/30"
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {artworkResult.overallStatus === "PASS" ? (
                      <CheckCircle className="h-6 w-6 text-emerald-400" />
                    ) : artworkResult.overallStatus === "WARNING" ? (
                      <AlertTriangle className="h-6 w-6 text-yellow-400" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-400" />
                    )}
                    <div>
                      <p className={`font-bold text-sm ${
                        artworkResult.overallStatus === "PASS" ? "text-emerald-400" :
                        artworkResult.overallStatus === "WARNING" ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {artworkResult.overallStatus === "PASS" ? "ARTWORK READY TO UPLOAD" :
                         artworkResult.overallStatus === "WARNING" ? "ARTWORK HAS WARNINGS — REVIEW BEFORE UPLOADING" :
                         "ARTWORK WILL BE REJECTED — FIX ISSUES FIRST"}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {artworkResult.summary.failedPlatforms.length > 0 &&
                          `Fails on: ${artworkResult.summary.failedPlatforms.join(", ")} · `}
                        {artworkResult.summary.passingPlatforms.length > 0 &&
                          `Passes on: ${artworkResult.summary.passingPlatforms.join(", ")}`}
                      </p>
                    </div>
                  </div>
                  {/* Specs summary */}
                  <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-2">
                    {Object.entries(artworkResult.artworkSpecs).filter(([k]) => k !== "filename").map(([k, v]) => (
                      <div key={k} className="text-center">
                        <p className="text-xs text-slate-500 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                        <p className="text-xs text-white font-medium">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Per-platform results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {artworkResult.platformResults.map((r: any) => (
                  <Card key={r.platform} className={`border ${
                    r.status === "PASS" ? "bg-slate-900 border-emerald-500/20" :
                    r.status === "WARNING" ? "bg-slate-900 border-yellow-500/20" :
                    "bg-slate-900 border-red-500/20"
                  }`}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {r.status === "PASS" ? <CheckCircle className="h-4 w-4 text-emerald-400" /> :
                         r.status === "WARNING" ? <AlertTriangle className="h-4 w-4 text-yellow-400" /> :
                         <XCircle className="h-4 w-4 text-red-400" />}
                        <span className="text-white text-sm font-medium">{r.platform}</span>
                        <Badge className={`text-xs ml-auto ${
                          r.status === "PASS" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                          r.status === "WARNING" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                          "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}>{r.status}</Badge>
                      </div>
                      {r.issues.map((issue: string, i: number) => (
                        <div key={i} className="flex gap-2 text-xs text-red-300 mb-1">
                          <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{issue}</span>
                        </div>
                      ))}
                      {r.warnings.map((warn: string, i: number) => (
                        <div key={i} className="flex gap-2 text-xs text-yellow-300 mb-1">
                          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{warn}</span>
                        </div>
                      ))}
                      {r.recommendations.map((rec: string, i: number) => (
                        <div key={i} className="flex gap-2 text-xs text-slate-400 mb-1">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Universal recommendations */}
              {artworkResult.universalRecommendations.length > 0 && (
                <Card className="bg-blue-900/10 border-blue-500/20">
                  <CardContent className="p-3">
                    <p className="text-blue-400 text-xs font-medium mb-2 flex items-center gap-1">
                      <Info className="h-3 w-3" /> Universal Recommendations
                    </p>
                    {artworkResult.universalRecommendations.map((rec: string, i: number) => (
                      <p key={i} className="text-xs text-slate-300 mb-1">• {rec}</p>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Spec reference card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" />
                Platform Artwork Specifications — Quick Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 pr-4 text-slate-400">Platform</th>
                      <th className="text-left py-2 pr-4 text-slate-400">Min Dimensions</th>
                      <th className="text-left py-2 pr-4 text-slate-400">Recommended</th>
                      <th className="text-left py-2 pr-4 text-slate-400">Min DPI</th>
                      <th className="text-left py-2 pr-4 text-slate-400">Formats</th>
                      <th className="text-left py-2 pr-4 text-slate-400">Max Size</th>
                      <th className="text-left py-2 text-slate-400">Colour Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { platform: "Amazon Merch", min: "4500×5400px", rec: "4500×5400px", dpi: "300", formats: "PNG only", size: "25 MB", colour: "sRGB (RGB 8-bit)", critical: true },
                      { platform: "Redbubble", min: "2400×3200px", rec: "4500×5400px", dpi: "150", formats: "PNG, JPG, GIF", size: "300 MB", colour: "RGB", critical: false },
                      { platform: "Etsy", min: "2000px short side", rec: "4500×5400px", dpi: "72", formats: "PNG, JPG", size: "20 MB", colour: "RGB", critical: false },
                      { platform: "Spring", min: "3720×4950px", rec: "3720×4950px", dpi: "150", formats: "PNG, JPG, AI, EPS, PDF", size: "50 MB", colour: "RGB", critical: false },
                      { platform: "Spreadshirt", min: "4000px long side", rec: "4500×5400px", dpi: "200", formats: "PNG, JPG, BMP, GIF", size: "10 MB", colour: "RGB", critical: false },
                    ].map(row => (
                      <tr key={row.platform} className={`border-b border-slate-800 ${
                        row.critical ? "bg-amber-900/10" : ""
                      }`}>
                        <td className="py-2 pr-4 font-medium text-white">
                          {row.platform}
                          {row.critical && <span className="ml-1 text-amber-400 text-xs">(strictest)</span>}
                        </td>
                        <td className="py-2 pr-4">{row.min}</td>
                        <td className="py-2 pr-4 text-emerald-400">{row.rec}</td>
                        <td className="py-2 pr-4">{row.dpi}</td>
                        <td className="py-2 pr-4">{row.formats}</td>
                        <td className="py-2 pr-4">{row.size}</td>
                        <td className="py-2">{row.colour}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-slate-500 text-xs mt-3">
                <strong className="text-amber-400">Universal standard:</strong> Design at 4500×5400px, 300 DPI, PNG, transparent background, sRGB colour mode — and your artwork passes all 5 platforms without re-exporting.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
