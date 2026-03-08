"use client";

/**
 * Polygon draw-to-search tool using terra-draw with MapLibre adapter.
 * Allows users to draw a custom area on the map to search within.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { Button } from "@/components/ui/button";
import { PenTool, Trash2 } from "lucide-react";
import type { MapRef } from "@vis.gl/react-maplibre";

type MapDrawToolProps = Readonly<{
  mapRef: MapRef | null;
  onPolygonComplete?: (coordinates: number[][]) => void;
  onPolygonClear?: () => void;
  active?: boolean;
}>;

export function MapDrawTool({
  mapRef,
  onPolygonComplete,
  onPolygonClear,
  active = false,
}: MapDrawToolProps) {
  const drawRef = useRef<TerraDraw | null>(null);
  const [isDrawing, setIsDrawing] = useState(active);
  const [hasPolygon, setHasPolygon] = useState(false);

  // Initialize TerraDraw when map is available
  useEffect(() => {
    if (!mapRef) return;

    const map = mapRef.getMap ? mapRef.getMap() : mapRef;

    const draw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: [
        new TerraDrawPolygonMode({
          styles: {
            fillColor: "#1B4D3E",
            fillOpacity: 0.2,
            outlineColor: "#1B4D3E",
            outlineWidth: 2,
          },
        }),
        new TerraDrawSelectMode({
          flags: {
            polygon: {
              feature: {
                draggable: true,
                coordinates: {
                  midpoints: true,
                  draggable: true,
                  deletable: true,
                },
              },
            },
          },
        }),
      ],
    });

    draw.start();
    drawRef.current = draw;

    // Listen for polygon completion
    draw.on("finish", (id: string | number, _context: unknown) => {
      const snapshot = draw.getSnapshot();
      const feature = snapshot.find((f) => f.id === id);
      if (feature && feature.geometry.type === "Polygon") {
        const coords = feature.geometry.coordinates[0] as number[][];
        setHasPolygon(true);
        onPolygonComplete?.(coords);
      }
    });

    return () => {
      draw.stop();
      drawRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef]);

  // Sync drawing mode with state
  useEffect(() => {
    const draw = drawRef.current;
    if (!draw) return;

    if (isDrawing) {
      draw.setMode("polygon");
    } else if (hasPolygon) {
      draw.setMode("select");
    }
  }, [isDrawing, hasPolygon]);

  const handleToggleDraw = useCallback(() => {
    setIsDrawing((prev) => !prev);
  }, []);

  const handleClear = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) return;

    draw.clear();
    setHasPolygon(false);
    setIsDrawing(false);
    onPolygonClear?.();
  }, [onPolygonClear]);

  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
      <Button
        variant={isDrawing ? "default" : "outline"}
        size="sm"
        onClick={handleToggleDraw}
        className="bg-white text-foreground shadow-md hover:bg-muted"
        aria-label={isDrawing ? "Cancel drawing" : "Draw search area"}
      >
        <PenTool className="size-3.5" data-icon="inline-start" />
        {isDrawing ? "Cancel" : "Draw Area"}
      </Button>
      {hasPolygon && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="bg-white text-foreground shadow-md hover:bg-muted"
          aria-label="Clear drawn area"
        >
          <Trash2 className="size-3.5" data-icon="inline-start" />
          Clear
        </Button>
      )}
    </div>
  );
}
