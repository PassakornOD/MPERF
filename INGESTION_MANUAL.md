# User Manual: Data Ingestion System

## 1. System Overview
The Ingestion System is designed to automate the extraction and processing of SAR (System Activity Report) logs from remote servers into a centralized MySQL database.

### 1.1 Core Workflow
1.  **Scanning:** The system recursively scans source directories (`data_RedHat` or `data_Solaris`) based on the provided **Hostgroup** and **Hostname**.
2.  **Filtering:** Identifies files using specialized Regex patterns that match the target date and data category (**CPU** or **Memory**).
3.  **Processing:** Extracts raw content, standardizes timestamps into the `YYYY-MM-DD HH:mm:ss` format, and performs strict deduplication to prevent redundant records.
4.  **Persistence:** Records are written to the database using `INSERT IGNORE` into tables named as `[Hostgroup]:u` (CPU) or `[Hostgroup]:r` (Memory).
5.  **Audit Logging:** Every operation is logged in the `insertion_logs` table (Success/Error/Skip). Logs older than **90 days** are automatically purged.

---

## 2. Operation Modes
The system supports three flexible modes to cater to different data requirements:
-   **Yesterday:** Automatically targets all SAR files generated during the previous day.
-   **Specific Date:** Allows manual ingestion for a particular historical date.
-   **Full Month:** Performs a bulk scan and ingestion for every day within a specified month.

---

## 3. Usage Interfaces

### 3.1 Web User Interface (Admin Dashboard)
Recommended for manual tasks and real-time monitoring.

**Steps:**
1.  **Navigate:** Go to **User Profile > SAR Management Dashboard > Ingestion**.
2.  **Configuration:**
    *   Select the **Ingestion Mode** (Yesterday, Specific, or Month).
    *   Apply target filters: **Hostgroup**, **Hostname**, and **OS Type**. (Leave fields blank to select **"All"**).
    *   Provide the required date or month details in the **Date Configuration** panel.
3.  **Execute:** Click **"Start Ingestion"**.
4.  **Monitor:** View live progress and individual file results in the **Process Log** terminal at the bottom of the page.

### 3.2 Command Line Interface (CLI)
Optimized for developers and server-side automation.

**Command Format:**
```bash
# General Syntax
npx ts-node MPERF/scripts/ingest_sar.ts [options]

# Example: Specific date for a specific Hostgroup
npx ts-node MPERF/scripts/ingest_sar.ts --hostgroup Datawarehouse --dataType cpu --day "2026-05-19"

# Example: Full Month for all systems
npx ts-node MPERF/scripts/ingest_sar.ts --dataType mem --month May --year 2026
```

### 3.3 API Integration (HTTP Requests)
Connect the ingestion pipeline to external applications or automation scripts.

**Endpoint Details:**
-   **URL:** `https://localhost/api/admin/ingest`
-   **Method:** `POST`
-   **Headers:** `Content-Type: application/json`

**Example (cURL):**
```bash
curl -X POST https://localhost/api/admin/ingest \
     -H "Content-Type: application/json" \
     -d '{"mode": "yesterday", "dataType": "All"}'
```

---

## 4. Parameter Reference

| Parameter | Format | Description |
| :--- | :--- | :--- |
| `mode` | `yesterday`, `specific`, `month` | Sets the ingestion logic. |
| `date` | `YYYY-MM-DD` | Target date (required for `specific` mode). |
| `month` | `Jan - Dec` | Target month (required for `month` mode). |
| `year` | `YYYY` | Target year. Defaults to current year if omitted. |
| `hostgroup` | `String` | Filters by server group. Omit for **All Groups**. |
| `hostname` | `String` | Filters by server name. Omit for **All Hosts**. |
| `dataType` | `cpu`, `mem`, `All` | Category of SAR data to process. |
| `os` | `RedHat`, `Solaris`, `All` | Filters by source operating system. |

---

## 5. Critical Guidelines

### 5.1 Resource Usage Warning
All operation modes support the **"All"** scope by omitting the `hostgroup` and `hostname` parameters. 
> [!WARNING]
> Running a global scan is **resource-intensive** and may impact system performance. It is highly recommended to perform "All" operations via the **CLI** or **Cron Job** during off-peak hours.

### 5.2 Log Retention
The system maintains an automated cleanup policy. Logs in the `insertion_logs` table are kept for a maximum of **90 days**. Ensure critical reports are exported before this window expires.
