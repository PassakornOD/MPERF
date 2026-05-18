# MPERF - Project Instructions

## Project Overview
MPERF is a professional performance reporting application designed to visualize and export server utilization data. It is built using the **Next.js** framework and leverages **Puppeteer** for high-quality PDF report generation.

### Key Technologies
- **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide React (icons).
- **Data Visualization:** Highcharts for interactive dashboards.
- **PDF Generation:** Puppeteer (running in a Dockerized Linux environment with Chromium).
- **Backend/API:** Next.js API Routes, MySQL (`mysql2`).
- **State Management:** TanStack Query (React Query) for data fetching.
- **Containerization:** Docker & Docker Compose for orchestration.

### Architecture Highlights
- **PDF Export Engine:** Located in `src/app/api/export-pdf/route.ts`. It uses a **two-pass rendering strategy**:
    1. **Mock Pass:** Renders the HTML to calculate DOM-based page numbers for the Table of Contents.
    2. **Final Pass:** Re-renders the HTML with accurate page numbers and generates the final PDF buffer.
- **Database Connectivity:** Centralized in `src/lib/db.ts`. In Docker environments, it defaults to the `mperf-db` hostname.

---

## Building and Running

### Local Development
To run the project locally (ensure a MySQL instance is available):
```bash
cd MPERF
npm install
npm run dev
```

### Docker Deployment (Recommended)
The project is optimized for Docker. It includes a MySQL service that initializes with local `.sql` files found in the parent directory.
```bash
cd MPERF
docker-compose up -d --build
```
The application will be available at `http://localhost:3000`.

### Key Commands
- **Rebuild App:** `docker-compose up -d --build mperf-app`
- **View Logs:** `docker-compose logs -f mperf-app`
- **Linting:** `npm run lint`

---

## Development Conventions

### PDF Report Layout
- **Typography:**
    - Hostgroups in TOC: 16pt, Bold.
    - Hostnames in TOC: 14pt, Normal (Indented 40px).
    - Section Titles: 16pt Bold for Hostnames; 14pt for Chart Titles.
- **Components:**
    - **Cover Page:** Includes the MFEC logo (embedded as Base64 for Docker compatibility).
    - **Table of Contents:** English title "Table of Contents", clickable links to sections, dynamic dot leaders.
    - **Charts:** Grouped 2 per page, following the order selected in the UI.
- **Spacing:** Always maintain a one-line gap (spacer) between CPU and Memory utilization tables.

### File Structure
- `src/app/api/`: Backend logic and PDF generation.
- `src/app/report/`: Main report configuration and dashboard UI.
- `src/lib/`: Shared utilities (database, auth).
- `src/types/`: TypeScript definitions (ensure `ReportPayload` and `ChartData` remain synchronized).

### Style Guide
- Use Tailwind CSS for UI components.
- Adhere to the established typography for PDF reports to ensure branding consistency.
- Maintain Base64 image embedding for PDF generation to avoid path resolution issues in containerized environments.
