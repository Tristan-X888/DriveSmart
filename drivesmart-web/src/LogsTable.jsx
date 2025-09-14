// src/LogsTable.jsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LogSheet from "./LogSheet";
import { exportByIdToPDF } from "@/lib/pdf";
import { Download } from "lucide-react";

export default function LogsTable({ logs }) {
  if (!logs || logs.length === 0) {
    return <div className="text-sm text-muted-foreground">No logs yet. Plan a trip to see daily logs.</div>;
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead>Driving</TableHead>
            <TableHead>On Duty (not driving)</TableHead>
            <TableHead>Off Duty</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((d) => {
            const driving = sumHours(d.segments, "driving");
            const onduty = sumHours(d.segments, "on_duty_not_driving");
            const off = sumHours(d.segments, "off_duty");
            return (
              <TableRow key={d.day}>
                <TableCell className="font-medium">Day {d.day}</TableCell>
                <TableCell>{driving} h</TableCell>
                <TableCell>{onduty} h</TableCell>
                <TableCell>{off} h</TableCell>
                <TableCell className="text-right">
                  <LogDialog day={d} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <p className="text-xs text-muted-foreground">
        Logs follow assumptions: 70hrs/8days cycle, fueling every 1,000 miles (0.5h), and +1h at pickup &amp; drop-off.
      </p>
    </div>
  );
}

function sumHours(segments, status) {
  if (!segments) return 0;
  const v = segments.filter(s => s.status === status).reduce((a, s) => a + Number(s.hours || 0), 0);
  return Math.round(v * 100) / 100;
}

function LogDialog({ day }) {
  const id = `logsheet-day-${day.day}`;

  const handleExport = async () => {
    try {
      await exportByIdToPDF(id, { filename: `ELD-Day-${day.day}.pdf`, format: "a4", margin: 24 });
    } catch (e) {
      // Optional: you could toast an error here
      console.error(e);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="transition active:scale-[.98]">View</Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>Day {day.day} — ELD Log</DialogTitle>
            <Button onClick={handleExport} size="sm" variant="secondary" className="transition active:scale-[.98]">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Wrap the sheet with an id for PDF export */}
        <div id={id} className="bg-background rounded-md">
          <LogSheet day={day} />
        </div>

        <div className="rounded-md border p-3 text-xs text-muted-foreground">
          {day.segments?.map((s, i) => (
            <span key={i} className="mr-3">
              <span className="font-medium">{label(s.status)}</span>: {s.hours}h{ s.note ? ` (${s.note})` : "" }
            </span>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function label(s) {
  if (s === "on_duty_not_driving") return "On duty";
  if (s === "off_duty") return "Off duty";
  if (s === "driving") return "Driving";
  if (s === "sleeper_berth") return "Sleeper berth";
  return s;
}
