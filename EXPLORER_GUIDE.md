# User Manual: Data Explorer & Maintenance

## 1. System Overview
The Data Explorer is an interactive analytics engine designed for visualizing and managing historical system performance metrics. It provides a robust interface for querying CPU and Memory utilization data stored in the database.

## 2. Core Workflow
1.  **Querying:** Users define the analysis scope using filters such as **Time Range** (Year/Month/Day/All), **Hostgroup**, and **Hostname**.
2.  **Retrieval:** The system fetches performance data from the database based on the selected criteria.
3.  **Visualization:** Data is rendered into interactive charts (Highcharts) and provides detailed metrics view in a tabular format.
4.  **Maintenance:** Provides administrative tools for purging specific records or performing bulk data cleanup to maintain database health.

---

## 3. Usage Guide

### 3.1 Data Querying (Web UI)
1.  **Navigate:** Go to **User Profile > SAR Management Dashboard > Explorer**.
2.  **Filter:** Select the **Metric Type** (CPU/Memory).
3.  **Specify Scope:** Choose the **Hostgroup** and **Hostname**, then set the **Filter Level** (Year, Month, Day, or All).
4.  **Execute:** Click **"Query"** to retrieve and visualize the data.

### 3.2 Data Deletion & Maintenance
The system supports both automated and manual cleanup processes.

#### A. Automated Maintenance
- **Ingestion Logs:** Logs in the `insertion_logs` table are automatically purged after **90 days**. No manual intervention is required.

#### B. Manual Record Deletion
1.  **Navigate:** Use the Explorer dashboard to query the desired data range.
2.  **Action:** Locate the specific entry in the data table and click the **"Delete"** action.
3.  **Confirmation:** Confirm the action in the prompt.

#### C. Bulk Cleanup
1.  **Navigate:** Use the main control panel in the Explorer dashboard.
2.  **Select Scope:** Apply filters (e.g., Year, Month, Hostgroup) to define the deletion target.
3.  **Execute:** Click the **"Delete"** button. This will purge all records matching the current filter criteria.
> **CAUTION:** All deletion operations are permanent and irreversible.

---

## 4. API Integration
External applications can programmatically query and manage data.

### Querying Data
- **Endpoint:** `GET /api/admin/sar-data`
- **Example:**
```bash
curl -X GET "https://localhost/api/admin/sar-data?hostgroup=Datawarehouse&type=cpu&level=year&year=2026"
```

### Deleting Data
- **Endpoint:** `POST /api/admin/sar-data/delete`
- **Example:**
```bash
curl -X POST https://localhost/api/admin/sar-data/delete \
     -H "Content-Type: application/json" \
     -d '{"hostgroup": "Datawarehouse", "type": "cpu", "level": "year", "year": "2026"}'
```

---

## 5. Parameter Reference

| Parameter | Format | Description |
| :--- | :--- | :--- |
| `type` | `cpu`, `mem` | Specifies the metric category. |
| `level` | `all`, `year`, `month`, `day` | The scope of the query or maintenance action. |
| `hostgroup` | `String` | Target server group. |
| `hostname_id` | `Integer` | Target server ID (Optional for "All Hosts"). |
| `year` | `YYYY` | Required if level is not `all`. |
| `month` | `01 - 12` | Required if level is `month` or `day`. |
| `day` | `01 - 31` | Required if level is `day`. |
