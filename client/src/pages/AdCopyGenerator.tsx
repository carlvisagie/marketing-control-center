/**
 * Ad Copy Generator
 * 
 * Generate Meta-safe ad copy using templates from Sintra strategy.
 * Avoids policy-violating language while maintaining emotional impact.
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  PenTool,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Send,
  Smartphone,
  Facebook,
  Instagram,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface AdTemplate {
  id: string;
  name: string;
  angle: string;
  headline: string;
  body: string;
  cta: string;
  platform: "meta" | "tiktok" | "all";
  complianceNotes: string[];
}

const AD_TEMPLATES: AdTemplate[] = [
  {
    id: "3am-problem",
    name: "The 3 AM Problem",
    angle: "Late-night availability",
    headline: "It's 3 AM. Who can you call?",
    body: "When everyone's asleep and you just need someone to talk to, we're here. Real conversations with real people, anytime you need them. No judgment. No waiting. Just support.",
    cta: "Start Talking Now",
    platform: "meta",
    complianceNotes: [
      "✓ Focuses on availability, not mental health claims",
      "✓ No targeting of vulnerable populations",
      "✓ General audience appeal",
    ],
  },
  {
    id: "no-schedule",
    name: "No Schedule Needed",
    angle: "Convenience",
    headline: "No appointments. No waiting rooms.",
    body: "Life doesn't wait for office hours. Get supportive conversations whenever you need them—morning, noon, or 3 AM. Connect with someone who listens, on your schedule.",
    cta: "Talk Now",
    platform: "meta",
    complianceNotes: [
      "✓ Emphasizes convenience over treatment",
      "✓ No medical claims",
      "✓ Positions as lifestyle service",
    ],
  },
  {
    id: "private-space",
    name: "Your Private Space",
    angle: "Privacy",
    headline: "A private space to talk things through",
    body: "Sometimes you just need to think out loud. Our coaches provide a confidential space where you can process your thoughts, explore your feelings, and find clarity—without anyone else knowing.",
    cta: "Find Your Space",
    platform: "meta",
    complianceNotes: [
      "✓ Privacy-focused messaging",
      "✓ No diagnosis or treatment language",
      "✓ Emphasizes self-reflection",
    ],
  },
  {
    id: "cheaper-therapy",
    name: "Affordable Support",
    angle: "Value",
    headline: "Real support. Real affordable.",
    body: "Quality conversations shouldn't cost a fortune. For less than a coffee a day, get unlimited access to supportive coaching whenever you need it. No insurance needed.",
    cta: "See Pricing",
    platform: "meta",
    complianceNotes: [
      "✓ Value proposition without therapy comparison",
      "✓ No medical billing claims",
      "✓ Clear pricing transparency",
    ],
  },
  {
    id: "trial-offer",
    name: "7-Day Trial",
    angle: "Low-risk trial",
    headline: "Try it for 7 days. Just $7.",
    body: "Not sure if it's right for you? Try Just Talk for a full week for only $7. No commitment. Cancel anytime. See why thousands choose us for their daily support.",
    cta: "Start Your Trial",
    platform: "meta",
    complianceNotes: [
      "✓ Clear trial terms",
      "✓ No pressure tactics",
      "✓ Easy cancellation messaging",
    ],
  },
];

export default function AdCopyGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<AdTemplate | null>(null);
  const [generatedCopy, setGeneratedCopy] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  // Generate AI variations
  const generateMutation = trpc.tiktok.generateContent.useMutation({
    onSuccess: (data) => {
      if (data.content) {
        const content = data.content;
        const fullCopy = `${content.hook}\n\n${content.script}\n\n${content.caption}`;
        setGeneratedCopy(fullCopy);
        toast.success("Ad copy generated!");
      }
    },
    onError: (error) => {
      toast.error(`Generation failed: ${error.message}`);
    },
  });

  // Send to phone
  const sendToPhoneMutation = trpc.tiktok.sendToPhone.useMutation({
    onSuccess: () => {
      toast.success("Ad copy sent to your phone!");
    },
    onError: (error) => {
      toast.error(`Failed to send: ${error.message}`);
    },
  });

  const handleSelectTemplate = (template: AdTemplate) => {
    setSelectedTemplate(template);
    setGeneratedCopy(`${template.headline}\n\n${template.body}\n\n${template.cta}`);
  };

  const handleGenerateVariation = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first");
      return;
    }

    setIsGenerating(true);
    
    const prompt = customPrompt || `Create a variation of this ad copy for Just Talk coaching service. 
Keep the same angle (${selectedTemplate.angle}) but use different words.
Must be Meta-compliant - no mental health claims, no targeting vulnerable populations.

Original:
${selectedTemplate.headline}
${selectedTemplate.body}
${selectedTemplate.cta}

Create a fresh variation with the same emotional impact.`;

    generateMutation.mutate({
      topic: prompt,
    });
    
    setIsGenerating(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleSendToPhone = () => {
    if (!generatedCopy) {
      toast.error("No copy to send");
      return;
    }
    // Parse the generated copy into structured format for sendToPhone
    const lines = generatedCopy.split('\n\n');
    sendToPhoneMutation.mutate({
      content: {
        hook: lines[0] || generatedCopy,
        script: lines[1] || '',
        caption: lines[2] || generatedCopy,
        hashtags: ['JustTalk', 'MentalHealth', 'Support'],
        postingTip: 'Best times to post: 7-9am, 12-2pm, 7-9pm',
      },
      method: "sms",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <PenTool className="w-6 h-6 text-primary" />
            Ad Copy Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate Meta-safe ad copy using proven templates
          </p>
        </div>
      </div>

      {/* Compliance Warning */}
      <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-400">Meta Advertising Compliance</h3>
            <p className="text-sm text-yellow-400/80 mt-1">
              All templates are designed to be Meta-compliant. Avoid language that:
            </p>
            <ul className="text-sm text-yellow-400/80 mt-2 space-y-1">
              <li>• Targets users based on mental health conditions</li>
              <li>• Makes medical or therapeutic claims</li>
              <li>• Uses "you are lonely/depressed" language</li>
              <li>• Promises specific outcomes or cures</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Template Selection */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Select Template</h2>
          
          <div className="space-y-3">
            {AD_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-foreground">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.angle}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {template.platform === "meta" ? (
                      <><Facebook className="w-3 h-3 mr-1" /> Meta</>
                    ) : template.platform === "tiktok" ? (
                      "TikTok"
                    ) : (
                      "All Platforms"
                    )}
                  </Badge>
                </div>
                
                <div className="text-sm text-foreground/80 mb-2">
                  <strong>"{template.headline}"</strong>
                </div>
                
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {template.body}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Generated Copy */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Generated Copy</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateVariation}
                disabled={!selectedTemplate || isGenerating || generateMutation.isPending}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                {isGenerating || generateMutation.isPending ? "Generating..." : "AI Variation"}
              </Button>
            </div>
          </div>

          {selectedTemplate ? (
            <Card className="p-4 bg-card border-border">
              {/* Compliance Notes */}
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <h4 className="text-sm font-medium text-green-400 mb-2">Compliance Check</h4>
                <ul className="space-y-1">
                  {selectedTemplate.complianceNotes.map((note, i) => (
                    <li key={i} className="text-xs text-green-400/80 flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Copy Preview */}
              <Textarea
                value={generatedCopy}
                onChange={(e) => setGeneratedCopy(e.target.value)}
                className="min-h-[200px] bg-background"
                placeholder="Select a template to see the copy..."
              />

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleCopy(generatedCopy)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleSendToPhone}
                  disabled={sendToPhoneMutation.isPending}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  {sendToPhoneMutation.isPending ? "Sending..." : "Send to Phone"}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-8 bg-card border-border text-center">
              <PenTool className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Select a Template</h3>
              <p className="text-muted-foreground">
                Choose a template from the left to generate ad copy
              </p>
            </Card>
          )}

          {/* Custom Prompt */}
          <Card className="p-4 bg-card border-border">
            <h3 className="font-medium text-foreground mb-2">Custom Variation Prompt</h3>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Optional: Add specific instructions for AI variations (e.g., 'Make it more casual' or 'Focus on the trial offer')"
              className="min-h-[80px] bg-background"
            />
          </Card>
        </div>
      </div>

      {/* Quick Copy Snippets */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Copy Snippets</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "CTA - Start Now", text: "Start Talking Now →" },
            { label: "CTA - Try Free", text: "Try 7 Days for $7 →" },
            { label: "CTA - Learn More", text: "See How It Works →" },
            { label: "Disclaimer", text: "Just Talk is not a substitute for professional mental health care. If you're in crisis, please contact emergency services." },
            { label: "Social Proof", text: "Join thousands who've found their voice with Just Talk" },
            { label: "Value Prop", text: "Real conversations. Real support. Real affordable." },
          ].map((snippet) => (
            <div
              key={snippet.label}
              className="p-3 rounded-lg bg-background border border-border hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => handleCopy(snippet.text)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{snippet.label}</span>
                <Copy className="w-3 h-3 text-muted-foreground" />
              </div>
              <p className="text-sm text-foreground">{snippet.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
