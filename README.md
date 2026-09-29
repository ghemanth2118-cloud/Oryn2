# ORYN — Autonomous AI Incident Response & Organizational Memory Platform

> **"AI Incident Response That Learns From Every Outage"**  
> ORYN is an enterprise-grade Site Reliability Engineering (SRE) platform that autonomously analyzes production failures, recalls organizational knowledge, generates recovery runbooks, and retains incident memory to prevent repeat outages.

Built using the exact **Stitch UI** design reference (`Project ID: 7145372843435062551`).

---

## ⚡ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS (Custom Stitch Design System Tokens)
- **State & Routing**: React Router DOM v6, React Query
- **Cloud & Database**: Firebase Authentication, Cloud Firestore, Firebase Storage, Firebase Hosting
- **AI Engine**: Google Gemini 2.5 Flash / Flash Latest with structured JSON output & resilience fallbacks
- **Animations**: GSAP (Hero entrance & mesh gradients), Framer Motion (page transitions & modals)
- **Visualization**: Recharts (Outage trends, MTTR trajectory, Subsystem failure distribution)
- **Document & PDF Export**: jsPDF + jspdf-autotable (audit-ready SRE runbook generation)
- **UI Notifications**: Sonner, Lucide Icons, Canvas Confetti

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
The `.env` and `.env.local` files are already pre-configured with project credentials:
```env
VITE_FIREBASE_API_KEY=AIzaSyBF4qUk8p71-bcQZDCTk9EUuC3MeFLgQjw
VITE_FIREBASE_AUTH_DOMAIN=team-99962.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=team-99962
VITE_FIREBASE_STORAGE_BUCKET=team-99962.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=32938382356
VITE_FIREBASE_APP_ID=1:32938382356:web:ecd064be7e7d28b0bfc301
VITE_FIREBASE_MEASUREMENT_ID=G-47Z0MH5DDQ
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛡️ Role-Based Access Control (RBAC)

ORYN provides built-in role switching for instant evaluation:
- **Admin (`admin`)**: Full read/write and delete authority across all collections.
- **Engineer (`engineer`)**: Incident triage, playbook execution, and postmortem authoring.

Toggle roles anytime via the **Role Switcher** in the sidebar or Settings page.

---

## 🗄️ Firestore Collections & Schema

1. `users`: User profiles with role clearance (`admin` / `engineer`).
2. `incidents`: 25 realistic production outages across **Payment API, Redis, PostgreSQL, Gateway, Kafka, and Authentication**.
3. `memories`: Organizational memory vectors with error signatures and verified success rates.
4. `runbooks`: Recovery playbooks with executable CLI commands and validation checklists.
5. `postmortems`: Collaborative blameless postmortems with 5-whys root causes and timelines.
6. `deployments`: Correlated deployment release logs.
7. `serviceHealth`: Real-time latency, error rates, and cluster health metrics.

---

## 🔒 Firebase Security & Deployment

- **Firestore Rules**: [`firestore.rules`](file:///c:/Users/ghema/OneDrive/Desktop/oryn/firestore.rules)
- **Storage Rules**: [`storage.rules`](file:///c:/Users/ghema/OneDrive/Desktop/oryn/storage.rules)
- **Hosting Config**: [`firebase.json`](file:///c:/Users/ghema/OneDrive/Desktop/oryn/firebase.json)

### Deploy to Firebase
```bash
npm run build
firebase deploy
```
