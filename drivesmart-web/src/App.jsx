// src/App.jsx
import { useState } from "react";
import { planTrip } from "./api";
import MapView from "./MapView";
import RouteInstructions from "./RouteInstructions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import LogsTable from "./LogsTable";
import ThemeToggle from "@/components/ThemeToggle";

import { MapPin, Package, Flag, Timer } from "lucide-react";

// ⬇️ NEW: header logo
import logoUrl from "./assets/drivesmart-logo.svg";

// Sticky summary chips under header
function StickySummary({ summary, fuelCount }) {
  if (!summary) return null;
  return (
    <div className="sticky top-12 z-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mt-3 grid grid-cols-3 gap-3 rounded-xl border bg-card/70 backdrop-blur p-3 shadow-sm">
          <div className="rounded-lg border p-3 bg-card/50">
            <div className="text-xs text-muted-foreground">Distance</div>
            <div className="font-semibold">{summary.distance_miles} mi</div>
          </div>
          <div className="rounded-lg border p-3 bg-card/50">
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="font-semibold">
              {Math.round(summary.duration_seconds / 3600)} h
            </div>
          </div>
          <div className="rounded-lg border p-3 bg-card/50">
            <div className="text-xs text-muted-foreground">Fuel stops</div>
            <div className="font-semibold">{fuelCount ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState({
    current_location: "Kansas City, MO",
    pickup_location: "Chicago, IL",
    dropoff_location: "Dallas, TX",
    current_cycle_used: 20,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "current_cycle_used" ? Number(value) : value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await planTrip(form);
      setData(res);
      toast.success("Trip planned!");
    } catch (err) {
      toast.error(err?.message || "Failed to plan trip");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.route?.summary;

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_80%_-100px,rgba(124,58,237,.15),transparent)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={logoUrl}
              alt="DriveSmart logo"
              className="h-6 w-6 select-none transition-transform duration-150 will-change-transform hover:scale-105"
              draggable="false"
            />
            <div className="font-semibold text-lg leading-none">DriveSmart</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-sm text-muted-foreground mr-1">
              Route &amp; ELD Log Planner
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Sticky summary bar (only when data exists) */}
      {summary && (
        <StickySummary
          summary={summary}
          fuelCount={data?.stops?.fueling?.length}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 grid gap-6 md:grid-cols-[380px_1fr]">
        {/* Left: Form */}
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Trip Inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4" aria-busy={loading}>
              {/* Current location */}
              <div className="grid gap-2">
                <Label htmlFor="current_location">Current location</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current_location"
                    name="current_location"
                    className="pl-9"
                    value={form.current_location}
                    onChange={onChange}
                    placeholder="City, State"
                  />
                </div>
              </div>

              {/* Pickup */}
              <div className="grid gap-2">
                <Label htmlFor="pickup_location">Pickup location</Label>
                <div className="relative">
                  <Package className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pickup_location"
                    name="pickup_location"
                    className="pl-9"
                    value={form.pickup_location}
                    onChange={onChange}
                    placeholder="City, State"
                  />
                </div>
              </div>

              {/* Dropoff */}
              <div className="grid gap-2">
                <Label htmlFor="dropoff_location">Dropoff location</Label>
                <div className="relative">
                  <Flag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dropoff_location"
                    name="dropoff_location"
                    className="pl-9"
                    value={form.dropoff_location}
                    onChange={onChange}
                    placeholder="City, State"
                  />
                </div>
              </div>

              {/* Current cycle used */}
              <div className="grid gap-2">
                <Label htmlFor="current_cycle_used">
                  Current cycle used (hrs)
                </Label>
                <div className="relative">
                  <Timer className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current_cycle_used"
                    name="current_cycle_used"
                    type="number"
                    min="0"
                    max="70"
                    className="pl-9"
                    value={form.current_cycle_used}
                    onChange={onChange}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full transition active:scale-[.98]"
                disabled={loading}
              >
                {loading ? "Planning..." : "Plan Trip"}
              </Button>
            </form>

            {/* Summary: skeleton while loading, chips when we have data */}
            {loading ? (
              <div className="grid grid-cols-3 gap-3 text-sm mt-4">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ) : summary ? (
              <>
                <Separator className="my-4" />
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border p-3 bg-card/50 shadow-sm">
                    <div className="text-muted-foreground">Distance</div>
                    <div className="font-semibold">
                      {summary.distance_miles} mi
                    </div>
                  </div>
                  <div className="rounded-xl border p-3 bg-card/50 shadow-sm">
                    <div className="text-muted-foreground">Duration</div>
                    <div className="font-semibold">
                      {Math.round(summary.duration_seconds / 3600)} h
                    </div>
                  </div>
                  <div className="rounded-xl border p-3 bg-card/50 shadow-sm">
                    <div className="text-muted-foreground">Fuel stops</div>
                    <div className="font-semibold">
                      {data?.stops?.fueling?.length ?? 0}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Right: Results */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="map" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map">Map</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
              </TabsList>

              {/* MAP TAB */}
              <TabsContent value="map" className="mt-4">
                {loading ? (
                  <Skeleton className="h-[60vh] w-full rounded-xl" />
                ) : data?.route ? (
                  <div className="h-[60vh] w-full overflow-hidden rounded-xl border">
                    <MapView
                      route={data?.route}
                      waypoints={data?.waypoints}
                      stops={data?.stops}
                    />
                  </div>
                ) : (
                  <div className="h-[60vh] w-full rounded-xl border grid place-items-center">
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        Enter locations to plan a route.
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        We’ll draw your route and show fuel stops automatically.
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* LOGS TAB */}
              <TabsContent value="logs" className="mt-4">
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-28" />
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ) : (
                  <LogsTable logs={data?.logs} />
                )}
              </TabsContent>

              {/* INSTRUCTIONS TAB */}
              <TabsContent value="instructions" className="mt-4">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <RouteInstructions route={data?.route} />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
