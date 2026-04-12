"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Video, Upload, Loader2, X, Download } from "lucide-react";

export default function VideoTrackingPage() {
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleVideoSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }
    setVideo(file);
    setError(null);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleVideoSelect(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video || !target.trim()) {
      setError("Please provide both a video and a target element to track.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultVideo(null);

    try {
      // TODO: Replace with actual API call
      const formData = new FormData();
      formData.append("video", video);
      formData.append("target", target);

      // const response = await fetch("/api/vision/video-tracking", {
      //   method: "POST",
      //   body: formData,
      // });
      // const blob = await response.blob();
      // const url = URL.createObjectURL(blob);
      // setResultVideo(url);

      // Simulated response for frontend demo
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setResultVideo(videoPreview);
    } catch {
      setError("Failed to process video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    if (resultVideo && resultVideo !== videoPreview)
      URL.revokeObjectURL(resultVideo);
    setVideo(null);
    setVideoPreview(null);
    setTarget("");
    setResultVideo(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 md:px-6 py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Video Tracking</h1>
        <p className="text-muted-foreground">
          Upload a video and specify which element to track. The model will
          process the video and return it with the tracked element highlighted.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Video Upload */}
        <div className="space-y-2">
          <Label>Upload Video</Label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : videoPreview
                  ? "border-border bg-muted/50"
                  : "border-border hover:border-primary hover:bg-muted/50"
            }`}
          >
            {videoPreview ? (
              <div className="relative">
                <video
                  src={videoPreview}
                  className="max-h-64 mx-auto rounded-lg"
                  muted
                  playsInline
                  onMouseEnter={(e) =>
                    (e.target as HTMLVideoElement).play().catch(() => {})
                  }
                  onMouseLeave={(e) => {
                    const v = e.target as HTMLVideoElement;
                    v.pause();
                    v.currentTime = 0;
                  }}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Hover to preview &middot; Click or drag to replace
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-foreground font-medium">
                  Drop a video here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  MP4, WEBM, MOV, AVI
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleVideoSelect(file);
              }}
              className="hidden"
            />
          </div>
        </div>

        {/* Target Input */}
        <div className="space-y-2">
          <Label htmlFor="target">Element to Track</Label>
          <Input
            id="target"
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g. red car, person in blue shirt, tennis ball..."
          />
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading || !video || !target.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                Track Element
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={clearAll}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </form>

      {/* Progress indicator */}
      {isLoading && (
        <Card className="max-w-4xl">
          <CardContent className="flex items-center gap-4 py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <p className="font-medium">Processing video...</p>
              <p className="text-sm text-muted-foreground">
                Tracking &quot;{target}&quot; &mdash; this may take a moment
                depending on video length.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {resultVideo && !isLoading && (
        <div className="space-y-4 max-w-4xl">
          <h2 className="text-xl font-semibold tracking-tight">Result</h2>
          <Card>
            <CardContent className="pt-6">
              <video
                src={resultVideo}
                controls
                className="w-full rounded-lg"
                autoPlay
                muted
              />
            </CardContent>
          </Card>
          <Button variant="outline" asChild>
            <a href={resultVideo} download="tracked_video.mp4">
              <Download className="h-4 w-4 mr-2" />
              Download Video
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
