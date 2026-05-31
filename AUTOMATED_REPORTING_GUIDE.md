# User Manual: Automated Performance Reporting

## 1. System Overview
The Automated Performance Reporting system (Batch Report) is designed to handle high-volume PDF generation for multiple servers simultaneously. It uses a **Two-Pass Rendering Engine** and a **Background Job Queue** to ensure system stability while generating large, multi-page reports.

### 1.1 Core Components
- **Template Engine:** Allows users to save configurations (Hosts, Charts, Layouts) for recurring use.
- **Automation Service:** Orchestrates the multi-stage generation process (Mock Pass -> Metrics Resolution -> Rendering -> Merging).
- **Background Worker:** Processes reports asynchronously to prevent web browser timeouts.

---

## 2. Template Management
Templates are the foundation of automated reporting. They store the "Who" and "What" of your reports.

### 2.1 Creating a New Template
1.  **Navigate:** Go to **Reports > Batch Report**.
2.  **Action:** Click **"Create New Template"**.
3.  **Configuration Steps:**
    *   **Step 1 (Template Info):** Provide an internal name and the official heading for the PDF report.
    *   **Step 2 (Select Hosts):** Choose target servers from the hostgroup tree.
    *   **Step 3 (Chart Order):** Select the metrics you want to include (e.g., CPU Daily, Memory Monthly) and drag them into the desired display order.
4.  **Save:** The template will appear in your Batch Report dashboard.

---

## 3. Executing Batch Reports
Once a template is ready, you can trigger a "Batch Run" for any historical month.

### 3.1 Web Interface Trigger
1.  **Select Template:** Locate your template in the list and click **"Start Batch"** (Zap icon).
2.  **Configuration:** 
    *   Select the **Target Month** and **Target Year**.
3.  **Execution:** Click **"Start Batch"** again. The system will create a background job.

### 3.2 Monitoring Progress
*   Track live progress in the **"Batch Job Status"** section at the bottom of the page.
*   **Statuses:**
    *   `Pending`: Waiting for resources.
    *   `Processing`: Resolving metrics and rendering pages (Progress bar shown).
    *   `Completed`: PDF is ready for download.
    *   `Failed`: An error occurred (view the message for details).

---

## 4. CLI Operations (For Developers)
For large-scale automation or bulk historical generation, use the Command Line Interface within the application container.

**Command Format:**
```bash
# General Syntax
npm run generate-monthly-report -- --month=[MM] --year=[YYYY] --templateId=[ID]

# Example: Generate May 2026 report using Template #5
npm run generate-monthly-report -- --month=5 --year=2026 --templateId=5
```

---

## 5. Automation Scheduling (Cron)
To automate reports on the 1st of every month at 2:00 AM, add a Cron job on the host machine:

```bash
0 2 1 * * docker exec mperf-app npm run generate-monthly-report
```
*Note: This command defaults to the previous month if `--month` is not specified.*

---

## 6. Storage & Maintenance
- **Output Directory:** Reports are stored in `public/reports/monthly/[Year]_[Month]/`.
- **Cleanup:** Administrators should periodically monitor the `reports/jobs` folder for old status files.
- **File Management:** Use the **"Delete"** button in the Job Status table to remove generated PDFs from the server storage.
