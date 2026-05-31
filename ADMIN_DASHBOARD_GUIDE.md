# User Manual: Admin Dashboard

## 1. Overview
The Admin Dashboard provides centralized control for system access, user roles, and security policies. It is designed for administrators to manage the MPERF environment securely and efficiently.

## 2. Module Navigation
Navigate to **Admin Dashboard** (or via the top navbar if logged in as admin) to access the following modules:

### 2.1 User Management
Allows administrators to create, modify, and delete system users.
- **Workflow:** 
    1. Click the **'+' (Plus)** icon to add a new user.
    2. Fill in the username, password, and assign a role (e.g., admin, sysadmin, operation).
    3. Use the **Edit** (pencil icon) to modify user roles or group memberships.
- **Security:** Self-deletion and renaming protected accounts (`sysreport`, `mfadmin`) are restricted.

### 2.2 User Group Management
Manages logical groupings of users for easier permission assignment.
- **Workflow:**
    1. Create a group via the **'+'** icon.
    2. Edit a group to add/remove members (Users) and associate Permission Groups.
    3. Note: The system automatically adds the creator to the group.
- **Note:** System groups like `admin`, `sysadmin`, and `operation` are protected.

### 2.3 Permission Group Management
Maps security permissions to specific Hostgroups.
- **Workflow:**
    1. Define a new Permission Group (e.g., "Datawarehouse Access").
    2. Edit the group to associate specific **Hostgroups**.
    3. Link this Permission Group to a **User Group** in the "Associated" tab.
- **Security:** Sysadmins can only manage groups they created or have access to.

---

## 3. Administrative Workflows

### Mapping Access (The Chain of Command)
To grant a user access to a specific server:
1.  **Assign Hostgroups to Permission Group:** (Permission Group Management).
2.  **Assign Permission Group to User Group:** (Permission Group Management > Associated tab).
3.  **Assign User to User Group:** (User Group Management > Members tab).

---

## 4. Operational Best Practices
- **Principle of Least Privilege:** Assign only the necessary roles (Operation vs. Sysadmin) to users.
- **Auditing:** All major administrative actions (Creating/Updating/Deleting users or roles) are logged automatically to `security.log` for audit purposes.
- **Naming Conflicts:** The system prevents group names that conflict with existing usernames.
- **Irreversibility:** Be extremely cautious when deleting users or groups, as this removes associated access permissions globally.

---

## 5. Security & Protection
- **Protected Accounts:** `sysreport` and `mfadmin` are locked from deletion to maintain system integrity.
- **Role Isolation:** Non-admin roles (e.g., sysadmin) are limited in their ability to escalate privileges or manage protected administrative entities.
