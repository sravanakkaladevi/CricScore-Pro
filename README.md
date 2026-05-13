# 🏏 CricScore Pro

> **Professional Live Cricket Scorer** — IPL-style broadcast scoring web app built with HTML5, Tailwind CSS & Vanilla JavaScript.

🔴 **[▶ Live Demo → sravanakkaladevi.github.io/CricScore-Pro](https://sravanakkaladevi.github.io/CricScore-Pro/)**
&nbsp;&nbsp;|&nbsp;&nbsp;
📁 **[Source Code → github.com/sravanakkaladevi/CricScore-Pro](https://github.com/sravanakkaladevi/CricScore-Pro)**

---

## 📸 Preview

| Setup Screen | Live Scoring |
|---|---|
| Dark glassmorphism team setup with player count selector | Ball-by-ball scoring with IPL broadcast overlay |

---

## ✨ Features

### ⚙️ Match Setup
- Team A & Team B names with optional logo upload
- **Variable player count** — choose 7, 8, 9, 10, or 11 players per team
- Player name inputs auto-generated based on count
- **Impact Player toggle** (Yes / No)
  - `Yes` → enter impact player name
  - `No` → field hidden, no impact player used
- Venue & umpire names
- Overs format: T2 / T5 / T10 / T20 / ODI (50)
- Toss winner, elected decision, batting-first selection

### 🏏 Live Scoring
| Button | Action |
|---|---|
| 0, 1, 2, 3, 4, 6 | Run scoring |
| Wide | Extra (no ball count) |
| No Ball | Extra (no ball count) |
| Bye / Leg Bye | Extra (legal ball) |
| 🔴 Wicket | Opens dismissal modal |
| 🏃 Run Out | Opens run-out modal |
| ↩ Undo | Restores previous ball state |

### 🔴 Wicket Modal
- Select type: **Bowled / Caught / LBW / Stumped / Hit Wicket**
- Select dismissed batsman
- Select fielder (for Caught/Stumped)
- Runs scored on that ball
- Select next incoming batsman from remaining squad

### 🏃 Run Out Modal
- Select which batsman got run out
- Enter completed runs before dismissal
- Select next batsman

### 📊 Scoreboard Display
- Live **Score / Wickets / Overs** in sticky top bar
- **CRR** (Current Run Rate) & **RRR** (Required Run Rate)
- Batsmen table: Runs · Balls · 4s · 6s · Strike Rate · ★ strike indicator
- Bowler stats: Overs · Runs · Wickets
- **Ball-by-ball colored circles** this over:
  - ` · ` grey = Dot
  - White = 1–3 runs
  - 🔵 Blue = Four
  - 🟣 Purple = Six (glowing)
  - 🔴 Red = Wicket
  - Yellow = Wide / No Ball / Bye
- **Over-by-over history** panel
- **Live commentary** feed (auto-generated, color-coded)
- Partnership tracker, Dot%, Boundary count, Extras total

### 🔄 Match Flow
- Innings break popup with summary & target
- 2nd innings with run-chase RRR
- Match result popup with winner & stats
- Exit confirmation with full reset

---

## 💾 Data Persistence
- `localStorage` saves match state after **every ball**
- Browser **refresh-safe** — restores in-progress match automatically
- Full reset clears localStorage and returns to setup

---

## 🚀 Tech Stack

| Technology | Usage |
|---|---|
| **HTML5** | Structure & semantic markup |
| **Tailwind CSS** (CDN) | Utility-first styling |
| **Vanilla JavaScript** | Scoring engine, state, rendering |
| **localStorage** | Client-side match persistence |

---

## 📁 Project Structure

```
CricScore-Pro/
├── index.html        ← Setup screen + Scoring screen + All modals
├── styles.css        ← IPL glassmorphism broadcast theme + animations
├── app.js            ← Full scoring engine (state, events, render)
└── README.md
```

---

## 🎨 UI Design System

- **Dark stadium background** — deep #06100a with neon green radial glow
- **Glassmorphism panels** — `backdrop-filter: blur(20px)` frosted glass cards
- **Neon green** `#39ff8f` primary accent (scores, live indicator, CRR)
- **Barlow Condensed** font for score display (TV-scoreboard feel)
- **Inter** for all body/form text
- Color-coded ball circles — Blue 4s · Purple 6s · Red wickets
- Smooth CSS animations — ball pop, score flash, commentary slide-in
- Fully **responsive** — Desktop · Tablet · Mobile

---

## 🏃 Run Locally

No build step — just open `index.html`:

```bash
git clone https://github.com/sravanakkaladevi/CricScore-Pro.git
cd CricScore-Pro

# Option 1: Open directly
start index.html

# Option 2: Local server
python -m http.server 8080
# Visit http://localhost:8080
```

---

## 📋 Changelog

| Version | Changes |
|---|---|
| v1.2 | Variable player count (7–11) + Impact Player Yes/No toggle |
| v1.1 | Professional README + GitHub Pages deployment |
| v1.0 | Full cricket scoring app — setup, live scoring, wickets, undo, innings, localStorage |

---

## 👩‍💻 Author

**Sravana Kkaladevi**  
🔗 GitHub: [@sravanakkaladevi](https://github.com/sravanakkaladevi)

---

*Built with ❤️ for cricket fans · Inspired by IPL & Cricbuzz broadcast graphics*
