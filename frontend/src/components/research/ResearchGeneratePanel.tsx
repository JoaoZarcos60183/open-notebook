"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Sparkles } from "lucide-react";
import {
  useReportTypes,
  useResearchTones,
  useGenerateResearch,
} from "@/lib/hooks/use-research";
import { useTranslation } from "@/lib/hooks/use-translation";

interface ResearchGeneratePanelProps {
  onJobStarted?: () => void;
}

export function ResearchGeneratePanel({ onJobStarted }: ResearchGeneratePanelProps) {
  const { t } = useTranslation();
  const { data: reportTypes, isLoading: typesLoading } = useReportTypes();
  const { data: tones, isLoading: tonesLoading } = useResearchTones();
  const generateMutation = useGenerateResearch();

  const [query, setQuery] = useState("");
  const [reportType, setReportType] = useState("research_report");
  const [tone, setTone] = useState("Objective");
  const [useAmalia, setUseAmalia] = useState(true);
  const [sourceUrls, setSourceUrls] = useState("");

  const isLoading = typesLoading || tonesLoading;
  const isSubmitting = generateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const urls = sourceUrls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    await generateMutation.mutateAsync({
      query: query.trim(),
      report_type: reportType,
      report_source: "local",
      tone,
      source_urls: urls,
      use_amalia: useAmalia,
      run_in_background: true,
    });

    onJobStarted?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Research Query */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t.research?.queryTitle ?? "Research Query"}
          </CardTitle>
          <CardDescription>
            {t.research?.queryDescription ??
              "Enter your research question or topic. Be specific for better results."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              t.research?.queryPlaceholder ??
              "e.g., What are the latest developments in maritime autonomous systems?"
            }
            className="min-h-[100px] text-base"
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Report Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.research?.reportType ?? "Report Type"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={reportType} onValueChange={setReportType} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes?.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    <div className="flex flex-col">
                      <span>{rt.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reportTypes && (
              <p className="text-xs text-muted-foreground">
                {reportTypes.find((rt) => rt.value === reportType)?.description}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.research?.toneLabel ?? "Writing Tone"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={tone} onValueChange={setTone} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tones?.map((tn) => (
                  <SelectItem key={tn.value} value={tn.value}>
                    {tn.label} — {tn.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t.research?.modelLabel ?? "AI Model"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="use-amalia"
                checked={useAmalia}
                onCheckedChange={(checked) => setUseAmalia(!!checked)}
                disabled={isSubmitting}
              />
              <div className="space-y-1">
                <Label htmlFor="use-amalia" className="text-sm font-medium cursor-pointer">
                  {t.research?.useAmalia ?? "Use Amália"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t.research?.amaliaDescription ??
                    "AMALIA-9B — Portuguese-optimized model by NOVASearch"}
                </p>
              </div>
            </div>
            {useAmalia && (
              <Badge variant="secondary" className="text-xs">
                carminho/AMALIA-9B-50-DPO
              </Badge>
            )}
            {!useAmalia && (
              <p className="text-xs text-muted-foreground">
                {t.research?.defaultModelNote ??
                  "Will use the default GPTResearcher model (GPT-4o-mini)"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Optional Source URLs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t.research?.sourceUrls ?? "Source URLs (Optional)"}
          </CardTitle>
          <CardDescription>
            {t.research?.sourceUrlsDescription ??
              "Add specific URLs to include in the research. One URL per line."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={sourceUrls}
            onChange={(e) => setSourceUrls(e.target.value)}
            placeholder="https://example.com/article-1&#10;https://example.com/article-2"
            className="min-h-[80px] font-mono text-sm"
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={!query.trim() || isSubmitting || isLoading}
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.research?.generating ?? "Generating..."}
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              {t.research?.generate ?? "Generate Research"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
