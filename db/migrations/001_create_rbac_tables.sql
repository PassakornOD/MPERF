-- 1. สร้างตาราง Roles
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- 2. สร้างตารางเชื่อมโยง Role กับ Hostgroup
CREATE TABLE IF NOT EXISTS role_hostgroups (
    role_id INT NOT NULL,
    hostgroup_id INT NOT NULL,
    PRIMARY KEY (role_id, hostgroup_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- 3. แทรกข้อมูลตัวอย่าง (Roles)
INSERT IGNORE INTO roles (role_name) VALUES ('admin'), ('sta1'), ('sta2'), ('vas');
