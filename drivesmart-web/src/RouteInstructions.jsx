// src/RouteInstructions.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge"; // if you didn't add badge via shadcn, replace with a <span>
import { CornerDownRight } from "lucide-react";

/**
 * Renders turn-by-turn route instructions if present.
 * It supports multiple possible shapes from the backend:
 * - route.instructions: [{ text, distance_meters, duration_seconds }]
 * - route.steps:        [{ instruction, distance, duration }]
 * - route.segments[0].steps (ORS raw): [{ instruction, distance, duration }]
 *
 * Pass the whole `route` object you already send to the frontend.
 */
export default function RouteInstructions({ route }) {
  const steps = normalizeSteps(route);
  const summary = route?.summary;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Turn-by-turn</CardTitle>
        {summary && (
          <div className="text-xs text-muted-foreground mt-1">
            {Math.round((summary.distance_miles ?? metersToMiles(summary.distance_meters)))} mi ·{" "}
            {Math.round((summary.duration_seconds ?? 0) / 60)} min
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!steps?.length ? (
          <div className="text-sm text-muted-foreground">
            No step-by-step instructions available. Plan a trip or enable instructions in the backend.
          </div>
        ) : (
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <CornerDownRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm leading-snug">{s.text}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{fmtMiles(s.distance_meters)} mi</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>{fmtMinutes(s.duration_seconds)} min</span>
                    {s.name && (
                      <>
                        <Separator orientation="vertical" className="h-3" />
                        <span title="Road">{s.name}</span>
                      </>
                    )}
                    {s.type && (
                      <>
                        <Separator orientation="vertical" className="h-3" />
                        <Badge variant="outline">{s.type}</Badge>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function normalizeSteps(route) {
  if (!route) return [];
  // Preferred: explicit route.instructions
  if (Array.isArray(route.instructions) && route.instructions.length) {
    return route.instructions.map(toStepShape);
  }
  // Alternate: route.steps (generic)
  if (Array.isArray(route.steps) && route.steps.length) {
    return route.steps.map(toStepShape);
  }
  // ORS: route.segments[0].steps
  if (Array.isArray(route.segments) && route.segments[0]?.steps?.length) {
    return route.segments[0].steps.map((s) =>
      toStepShape({
        text: s.instruction,
        distance_meters: s.distance,
        duration_seconds: s.duration,
        name: s.name,
        type: s.type,
      })
    );
  }
  return [];
}

function toStepShape(s) {
  // supports either {text, distance_meters, duration_seconds} or {instruction, distance, duration}
  const text = s.text || s.instruction || "";
  const distance_meters = s.distance_meters ?? s.distance ?? 0;
  const duration_seconds = s.duration_seconds ?? s.duration ?? 0;
  const name = s.name;
  const type = s.type;
  return { text, distance_meters, duration_seconds, name, type };
}

function metersToMiles(m) {
  return (Number(m || 0) / 1609.344) || 0;
}
function fmtMiles(meters) {
  const mi = metersToMiles(meters);
  return (Math.round(mi * 10) / 10).toFixed(1);
}
function fmtMinutes(seconds) {
  return Math.round(Number(seconds || 0) / 60);
}
