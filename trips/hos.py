# trips/hos.py
"""
HOS planner for property-carrying drivers (70/8 cycle, no adverse conditions).
Rules implemented:
- 70 hours in 8 days (cycle). If exceeded, insert a 34h reset (24h off + next day continues;
  total off-duty across the reset boundary is >=34h).
- Max 11h DRIVING per day.
- Max 14h ON-DUTY window per day (driving + on-duty-not-driving).
- 30 min break required after 8h of DRIVING (fueling can satisfy it as on-duty-not-driving).
- +1h on-duty for pickup (day 1) and +1h for dropoff (final day).
- Fueling every 1,000 miles, modeled as 0.5h on-duty-not-driving each.

Outputs:
logs: [
  {
    "day": 1,
    "segments": [
      {"status": "on_duty_not_driving", "hours": 1.0, "note": "Pickup"},
      {"status": "driving", "hours": 4.0},
      {"status": "on_duty_not_driving", "hours": 0.5, "note": "Fuel"},
      ...
      {"status": "off_duty", "hours": 10.0, "note": "Rest"}
    ]
  },
  ...
]
"""

from __future__ import annotations
from typing import List, Dict

DAILY_DRIVE_MAX = 11.0
DAILY_DUTY_MAX = 14.0
BREAK_AFTER_DRIVING = 8.0
BREAK_DURATION = 0.5  # 30 minutes
OFF_DUTY_MIN = 10.0   # overnight
CYCLE_MAX = 70.0

PICKUP_HOURS = 1.0
DROPOFF_HOURS = 1.0
FUEL_EVERY_MILES = 1000.0
FUEL_DURATION = 0.5   # 30 minutes on-duty (counts toward duty + cycle)


def _add(seglist: List[Dict], status: str, hours: float, note: str | None = None):
    if hours <= 0:
        return
    item = {"status": status, "hours": round(hours, 2)}
    if note:
        item["note"] = note
    seglist.append(item)


def build_daily_logs(
    distance_miles: float,
    route_drive_seconds: float,
    current_cycle_used_hours: float,
) -> List[Dict]:
    drive_hours_total = max(route_drive_seconds / 3600.0, 0.0)
    fuel_stops = int(distance_miles // FUEL_EVERY_MILES)
    fuel_interval_hours = (drive_hours_total / (fuel_stops + 1)) if fuel_stops >= 0 else 9999.0

    remaining_drive = drive_hours_total
    remaining_fuels = fuel_stops
    cycle_used = float(current_cycle_used_hours or 0.0)

    logs: List[Dict] = []
    day = 1
    dropoff_pending = True  # we'll add on final day

    # helper counters for even fuel distribution
    hours_since_last_fuel = 0.0

    while remaining_drive > 0.0 or dropoff_pending:
        segments: List[Dict] = []
        duty_left = DAILY_DUTY_MAX
        driving_today = 0.0
        break_done = False

        # PICKUP on Day 1
        if day == 1:
            need = min(PICKUP_HOURS, duty_left)
            _add(segments, "on_duty_not_driving", need, "Pickup")
            cycle_used += need
            duty_left -= need

        # driving loop for the day
        while duty_left > 0 and remaining_drive > 0:
            # Insert 30-min break after 8h DRIVING if not satisfied yet.
            if (driving_today >= BREAK_AFTER_DRIVING) and not break_done:
                # Prefer using fueling (counts as break)
                if remaining_fuels > 0 and duty_left >= FUEL_DURATION:
                    _add(segments, "on_duty_not_driving", FUEL_DURATION, "Fuel (break)")
                    cycle_used += FUEL_DURATION
                    duty_left -= FUEL_DURATION
                    remaining_fuels -= 1
                    break_done = True
                    hours_since_last_fuel = 0.0
                    continue
                # Otherwise off-duty 30min
                if duty_left >= BREAK_DURATION:
                    _add(segments, "off_duty", BREAK_DURATION, "30-min break")
                    duty_left -= BREAK_DURATION
                    break_done = True
                    continue
                break  # no more duty time to place break

            # Determine how much we can drive next
            drive_cap_by_rule = DAILY_DRIVE_MAX - driving_today
            drive_cap_by_window = duty_left
            drive_cap_by_remaining = remaining_drive
            # Keep fuels even: drive until the next fuel interval if any left
            to_next_fuel = fuel_interval_hours - hours_since_last_fuel if remaining_fuels > 0 else drive_cap_by_remaining
            drive_chunk = max(
                0.0,
                min(drive_cap_by_rule, drive_cap_by_window, drive_cap_by_remaining, to_next_fuel),
            )
            if drive_chunk <= 0.0:
                break

            _add(segments, "driving", drive_chunk)
            remaining_drive -= drive_chunk
            driving_today += drive_chunk
            duty_left -= drive_chunk
            cycle_used += drive_chunk
            hours_since_last_fuel += drive_chunk

            # If we reached the fuel interval and still have fuels, insert one
            if remaining_fuels > 0 and hours_since_last_fuel >= fuel_interval_hours and duty_left >= FUEL_DURATION:
                _add(segments, "on_duty_not_driving", FUEL_DURATION, "Fuel")
                cycle_used += FUEL_DURATION
                duty_left -= FUEL_DURATION
                remaining_fuels -= 1
                hours_since_last_fuel = 0.0
                if not break_done and driving_today >= BREAK_AFTER_DRIVING and FUEL_DURATION >= BREAK_DURATION:
                    break_done = True

            # If we maxed daily driving, stop for the day
            if driving_today >= DAILY_DRIVE_MAX:
                break

        # DROPOFF on final day (when no driving left)
        if remaining_drive <= 0.0 and dropoff_pending and duty_left > 0.0:
            need = min(DROPOFF_HOURS, duty_left)
            _add(segments, "on_duty_not_driving", need, "Drop-off")
            cycle_used += need
            duty_left -= need
            dropoff_pending = False

        # Overnight rest to complete the 24h period (ensure >=10h)
        # Compute how many hours used so far today
        used_today = sum(s["hours"] for s in segments)
        off_needed = max(OFF_DUTY_MIN, 24.0 - used_today)
        _add(segments, "off_duty", off_needed, "Rest")

        logs.append({"day": day, "segments": segments})
        day += 1

        # 70/8 cycle check — if we need more driving but have no cycle hours left, insert a 34h reset
        if remaining_drive > 0.0:
            if cycle_used >= CYCLE_MAX - 1e-9:
                # Reset Day: full 24h off-duty
                logs.append({"day": day, "segments": [{"status": "off_duty", "hours": 24.0, "note": "34h reset (part 1/2)"}]})
                day += 1
                # Next day will still begin with at least 10h off-duty (part 2/2) before any duty.
                logs.append({"day": day, "segments": [{"status": "off_duty", "hours": 10.0, "note": "34h reset (part 2/2)"}]})
                day += 1
                cycle_used = 0.0  # reset cycle
                # After this, the loop will create the next working day normally.

    # Round every hours field to 2 decimals (already rounded), and coalesce tiny floats
    for d in logs:
        for s in d["segments"]:
            if abs(s["hours"]) < 1e-6:
                s["hours"] = 0.0

    return logs
