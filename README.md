🚚 DriveSmart — Route & ELD Log Planner

DriveSmart is a full-stack web app that plans a long-haul trip for a U.S. property-carrying CMV driver, produces a legal-style ELD daily log (RODS grid), and renders the map route, waypoints, fuel stops, and turn-by-turn instructions. It implements the core FMCSA Hours-of-Service (HOS) rules for planning (11/14-hour clocks, 30-minute break, 70-hours/8-days, 10-hour off-duty resets, 34-hour restart) and assumes:

🛻 Property-carrying driver

⏱️ 70 hrs / 8-day cycle

🌤️ No adverse driving conditions extension

📦 1 hr on-duty at pickup and drop-off

⛽ Fuel at least once every 1,000 miles

🧭 Table of contents

🔗 Live links & demo

🖼️ Screenshots

✨ Key features

🏗️ Architecture

🗂️ Directory layout

⚡ Quick start (local)

🔐 Environment variables

🔌 API

⏳ HOS planner (how it works)

🎨 UI/UX

🚀 Deployment

🧪 Troubleshooting

🗺️ Roadmap

🙏 Acknowledgements

📄 License


🔗 Live links & demo

Frontend (Vercel): https://drive-smart-web-bay.vercel.app/

Backend (Render): https://drivesmart-backend-krng.onrender.com


✨ Key features

🗺️ Real routing & map: OpenRouteService (geocode + routing) with Leaflet + OSM tiles.

⏳ HOS-aware plan: inserts pickup/drop-off on-duty, mandatory breaks, off-duty resets, and fuel stops every ~1,000 mi.

📊 ELD-style daily log: SVG grid with OFF/SB/DR/ON rows, 12-hour Mid/Noon labels, and a Total Hours gutter (HH:MM + decimals).

📜 Instructions tab: normalised step list (manoeuvres, distances).

🎨 Polished UI: Tailwind CSS, shadcn/ui, theme toggle (light/dark), skeleton loaders, sticky summary chips.

🧾 Export: one-click PDF of the daily log.

👩‍💻 DX: clean API, tiny HTTP helper, simple .env config.


🏗️ Architecture

Frontend: React (Vite) + Tailwind + shadcn/ui + react-leaflet
Backend: Django + Django REST Framework
Hosting: Vercel (frontend), Render (backend)
Data sources: OpenRouteService (routing & geocode), OpenStreetMap tiles

React (form) ──▶ POST /api/trips/ ──▶ Django
                       │
                       ├─ geocode: current/pickup/dropoff (ORS)
                       ├─ route: current → pickup → dropoff (ORS)
                       ├─ fuel stops every ~1000 mi
                       └─ HOS planner → per-day segments (OFF/SB/DR/ON)

◀─ JSON: route LineString + summary + waypoints + stops + daily logs


⚡ Quick start (local)
🐍 Backend
# 1) Create & activate venv (Windows PowerShell)
python -m venv .venv
. .venv/Scripts/Activate.ps1

# 2) Install deps
pip install -r requirements.txt

# 3) Set env
copy .env.example .env
# put ORS_API_KEY=... and a dev DJANGO_SECRET_KEY into .env

# 4) Migrate & run
python manage.py migrate
python manage.py runserver 127.0.0.1:8000


Test: http://127.0.0.1:8000/api/ping/
 → { "status": "ok" }

⚛️ Frontend
cd drivesmart-web
npm ci            # or: npm install
npm run dev       # http://localhost:5173


If your backend isn’t 127.0.0.1:8000, set:

# drivesmart-web/.env
VITE_API_BASE=https://<your-backend>.onrender.com


🔐 Environment variables
Backend (.env)
# Required
ORS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
DJANGO_SECRET_KEY=<random-string>

# Optional (recommended for prod)
DEBUG=False
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,<your-backend>.onrender.com
FRONTEND_ORIGIN=https://<your-frontend>.vercel.app
SECURE_SSL_REDIRECT=True

Frontend (drivesmart-web/.env)
VITE_API_BASE=https://<your-backend>.onrender.com


🔌 API
Health
GET /api/ping/
→ { "status": "ok" }

Trip planning
POST /api/trips/
Content-Type: application/json

{
  "current_location": "Kansas City, MO",
  "pickup_location": "Chicago, IL",
  "dropoff_location": "Dallas, TX",
  "current_cycle_used": 20
}


Response (shape):

{
  "inputs": { "...": "..." },
  "route": {
    "geometry": { "type": "LineString", "coordinates": [[-94.58,39.10], ...] },
    "summary": { "distance_miles": 1491.2, "duration_seconds": 123456 },
    "instructions": [
      { "text": "Head south on I-35", "distance_mi": 12.3, "duration_s": 840 }
    ]
  },
  "waypoints": { "current": [-94.58,39.10], "pickup": [...], "dropoff": [...] },
  "stops": { "fueling": [ { "coord": [...], "mile": 995.4 } ] },
  "logs": [
    {
      "day": 1,
      "segments": [
        { "status": "on_duty_not_driving", "hours": 1.0, "note": "Pickup" },
        { "status": "driving", "hours": 5.5 },
        { "status": "off_duty", "hours": 0.5, "note": "Break" },
        { "status": "driving", "hours": 5.5 },
        { "status": "off_duty", "hours": 12.0, "note": "Rest" }
      ]
    }
  ]
}


🧭 The frontend draws the polyline, markers, and a RODS-style SVG grid per day; the Instructions tab lists the manoeuvres.



⏳ HOS planner (how it works)

📦 1 hr pickup (ON) at the start of the pickup day; 1 hr drop-off (ON) at the end.

🛣️ Driving segments are sliced to obey:

11 hr max driving per shift

14 hr shift window from first on-duty

30 min break after 8 hr cumulative driving

😴 Off-duty ≥ 10 hr blocks split days and reset shift clocks.

🔁 70 hr / 8 days rolling total; 34-hr restart when required.

⛽ Fuel stops ~ every 1,000 mi (waypoints + map markers).


Output → LogSheet.jsx

🕛 12-hour labels (Mid, 1..11, Noon, 1..11, Mid) on top/bottom.

📈 OFF/SB/DR/ON rows with vertical connectors between duty changes.

➕ Right gutter shows Total Hours (HH:MM and decimal) per row and an overall 24:00 checksum.

🧾 PDF export per day.



⚠️ DriveSmart is a planner (not a certified ELD). It mirrors the RODS grid and core rules for planning accuracy.

🎨 UI/UX

🧩 Tailwind + shadcn/ui for consistent, accessible components.

🌗 Theme toggle (light/dark) with no flash (pre-init script in index.html).

🦴 Loading skeletons for map/logs.

📌 Sticky summary chips (distance, duration, fuel) under the header.

🧠 Input icons and micro-interactions (active:scale-[.98]).

🔢 Validation: “Current cycle used (hrs)” is two digits only (0–70).



🚀 Deployment
🐍 Backend (Render)

Build Command: pip install -r requirements.txt

Start Command: gunicorn server.wsgi:application --bind 0.0.0.0:$PORT

Env: PYTHON_VERSION (e.g., 3.12+), ORS_API_KEY, DJANGO_SECRET_KEY, DJANGO_ALLOWED_HOSTS, DEBUG=False, etc.

settings.py includes WhiteNoise (static), CORS, and proxy SSL header.

⚛️ Frontend (Vercel)

Framework preset: Vite

Root directory: drivesmart-web

Build command: npm run build

Output dir: dist

Env: VITE_API_BASE=https://<your-backend>.onrender.com

🧯 Rollup native binary issue on Vercel? We set
ROLLUP_DISABLE_NATIVE=1 in the build script to use the JS fallback.



🧪 Troubleshooting

🚫 DisallowedHost on Render: ensure DJANGO_ALLOWED_HOSTS includes your Render hostname.

🔒 CORS blocked: set FRONTEND_ORIGIN=https://<your-frontend>.vercel.app and redeploy.

🛰️ /api/ping works, /api/trips fails: confirm ORS_API_KEY; check logs for ORS rate limiting.

🧱 Vercel build fails on Rollup: keep ROLLUP_DISABLE_NATIVE=1 in the frontend build script.

🌗 Theme flash: the pre-init theme script must remain in index.html <head>.

🗺️ Roadmap

🧮 Waypoint optimisation for multi-stop loads

🚦 Live traffic ETAs & weather layers

💾 Save/load plans & shareable links

🛌 Advanced sleeper-berth pairings/exceptions

🏢 Carrier profiles & custom policies



🙏 Acknowledgements

OpenRouteService (routing/geocoding)

OpenStreetMap (map tiles & data)

Leaflet / react-leaflet (map rendering)

shadcn/ui, Tailwind CSS (UI)


📄 License

MIT © Shane Viyazhi.
This project is a planner for educational and operational planning use only; it is not a certified ELD and does not replace legal compliance tools or official logs.


