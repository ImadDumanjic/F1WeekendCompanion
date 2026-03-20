# F1 Weekend Companion

F1 Weekend Companion je Formula 1 second-screen aplikacija fokusirana na race weekend iskustvo, predikcije, live context i social competition.

## Overview

Projekt je zamišljen kao companion app za F1 fanove koji žele više od samog gledanja utrke:

- live informacije o vikendu i narednoj sesiji
- predikcije za podium, fastest lap i race events
- leaderboard i takmičenje s prijateljima
- schedule i weather pregled na jednom mjestu
- post-race summaries i ključni highlights

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, shadcn/ui
- Backend: Node.js, Express

## Project Structure

```text
F1WeekendCompanion/
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
├── backend/
│   ├── src/
│   └── package.json
└── package.json
```

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Start the frontend

```bash
npm run dev --workspace frontend
```

3. Start the backend

```bash
npm run dev --workspace backend
```

## Planned Features

- **Race Dashboard**: Countdown do naredne sesije, race info i venue detalji.
- **Predictions**: Predikcije za podium, fastest lap i safety car scenarije.
- **Leaderboard**: Rang lista i poređenje rezultata s prijateljima.
- **Live Race View**: Praćenje dešavanja tokom utrke u realnom vremenu.
- **Schedule & Weather**: Pregled kompletnog race weekend rasporeda uz vremensku prognozu.
- **AI Summary**: Kratki post-race recap sa highlightovima i ključnim pomacima.

## Notes

- Frontend koristi Vite, React i Tailwind CSS.
- Backend je postavljen kao minimalni Express API.
- `shadcn/ui` setup je pripremljen tako da se komponente mogu dodavati bez dodatnog ručnog podešavanja.
