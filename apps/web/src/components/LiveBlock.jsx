import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, LoaderCircle, MonitorSmartphone, Puzzle } from "lucide-react";

import { hasDemoSource } from "../demo-registry.js";
import { Badge } from "./ui/badge.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";

function createDemoFrameSrc({ buildId, colorMode, demoStyle, frameId, source }) {
  const payload = encodeURIComponent(JSON.stringify({
    source,
    colorMode,
    demoStyle,
    frameId,
  }).replace(/</g, "\\u003c"));

  return `/demo-frame.html?payload=${payload}&v=${encodeURIComponent(buildId)}`;
}

export function LiveBlock({ block, copy, demoStyle }) {
  const demoExists = hasDemoSource(block.source);
  const isPage = block.type === "live-page";
  const [frameStatus, setFrameStatus] = useState(demoExists ? "loading" : "missing");
  const [frameMessage, setFrameMessage] = useState("");
  const [frameHeight, setFrameHeight] = useState(block.height);
  const frameId = useMemo(
    () => `${block.id || block.source}-${Math.random().toString(36).slice(2, 10)}`,
    [block.id, block.source],
  );
  const frameSrc = useMemo(
    () =>
      createDemoFrameSrc({
        buildId: __LIVE_PRD_BUILD_ID__,
        colorMode: document.documentElement.classList.contains("dark") ? "dark" : "light",
        demoStyle,
        frameId,
        source: block.source,
      }),
    [block.source, demoStyle, frameId],
  );

  useEffect(() => {
    setFrameHeight(block.height);
    setFrameStatus(demoExists ? "loading" : "missing");
    setFrameMessage("");
  }, [block.height, block.source, copy, demoExists, frameSrc]);

  useEffect(() => {
    if (!demoExists) {
      return undefined;
    }

    const handleMessage = (event) => {
      const data = event.data;
      if (!data || data.frameId !== frameId) {
        return;
      }

      if (data.type === "live-prd-demo-ready") {
        setFrameStatus("ready");
        setFrameMessage("");
        if (typeof data.height === "number" && Number.isFinite(data.height)) {
          setFrameHeight(Math.max(block.height, Math.ceil(data.height)));
        }
      }

      if (data.type === "live-prd-demo-resize" && typeof data.height === "number" && Number.isFinite(data.height)) {
        setFrameHeight(Math.max(block.height, Math.ceil(data.height)));
      }

      if (data.type === "live-prd-demo-error") {
        setFrameStatus("error");
        setFrameMessage(data.message || copy.demoLoadFailed);
      }
    };

    const timeoutId = window.setTimeout(() => {
      setFrameStatus((current) => {
        if (current === "loading") {
          setFrameMessage(copy.demoTimedOut);
          return "error";
        }

        return current;
      });
    }, 6000);

    window.addEventListener("message", handleMessage);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", handleMessage);
    };
  }, [block.height, copy, demoExists, frameId]);

  return (
    <Card className="overflow-hidden border-border/80 bg-card/90 shadow-[0_1px_2px_rgba(0,0,0,0.025)]">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-3 py-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-secondary text-secondary-foreground">
              {isPage ? copy.livePage : copy.liveDemo}
            </Badge>
            <span className="text-xs text-muted-foreground">{block.id}</span>
          </div>
          {block.caption ? (
            <p className="text-xs leading-5 text-muted-foreground">{block.caption}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isPage ? <MonitorSmartphone className="h-4 w-4" /> : <Puzzle className="h-4 w-4" />}
          <span>{block.source}</span>
        </div>
      </CardHeader>

      <CardContent
        className={`bg-muted/10 p-0 ${isPage ? "" : "p-3"}`}
        style={{ minHeight: `${block.height}px` }}
      >
        {demoExists ? (
          <div className="relative" style={{ height: `${frameHeight}px`, minHeight: `${block.height}px` }}>
            <iframe
              className={
                isPage
                  ? "h-full w-full overflow-hidden rounded-none border-0 bg-background"
                  : "h-full w-full overflow-hidden rounded-xl border border-border bg-background"
              }
              sandbox="allow-scripts allow-same-origin"
              src={frameSrc}
              title={block.id || block.source}
            />

            {frameStatus === "loading" ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit] bg-background/72 backdrop-blur-[1px]">
                <div className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground shadow-sm">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  {copy.loadingDemo}
                </div>
              </div>
            ) : null}

            {frameStatus === "error" ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-background/88 p-4 backdrop-blur-[2px]">
                <div className="max-w-sm rounded-md border bg-card px-4 py-3 text-left shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    {copy.demoLoadFailed}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {frameMessage || copy.demoFailedDefault}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {block.source}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-[240px] items-center gap-3 rounded-xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-foreground" />
            {copy.demoMissing(block.source)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
