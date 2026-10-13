# 👑 Sangita Travels Pune — Admin Setup & Bootstrap Guide

This document outlines the operational procedures for provisioning, configuring, and bootstrapping the **Secure Super Admin & Admin Dashboard** in the Sangita Travels Pune Cab Management System.

---

## 1. System Overview & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | Hash-based client routing (`#/admin/login`, `#/admin/dashboard`, `#/admin/users`), glassmorphic design system. |
| **Backend** | Python 3 (Standard Library) | `http.server`, custom REST dispatcher (`backend/router.py`), zero external third-party web framework dependencies. |
| **Database** | SQLite3 in WAL Mode | Located at `backend/data/bookings.db`. Features foreign key constraints and transactional schema migrations. |
| **Auth Engine** | PBKDF2-HMAC-SHA256 | 100,000 hashing rounds, 16-byte cryptographically secure random salt, 64-character bearer tokens in DB sessions. |
| **Audit Log** | SQLite `audit_logs` | Tamper-evident logging of authentication events, user mutations, and privilege assignments. |

---

## 2. Environment Variables Specification

The system uses environment variables for secure credential configuration. **Never commit actual values or secrets to source control.**

Create a `.env` file in the project root based on `.env.example`:

| Variable Name | Required | Default / Format | Description |
|---|---|---|---|
| `SUPER_ADMIN_PASSWORD` | **Yes** (during setup) | String (min 8 chars, 1 letter, 1 number) | Password used strictly during initial Super Admin bootstrap or password rotation CLI runs. |
| `ADMIN_SECRET_KEY` | Optional | 64-character hex | Master application secret. If omitted, auto-generated and safely persisted in `backend/data/.secret_key`. |
| `DATABASE_PATH` | Optional | `data/bookings.db` | Relative or absolute path to the SQLite database file. |
| `PORT` | Optional | `8080` | Port for the backend HTTP server. |
| `ENVIRONMENT` | Optional | `development` / `production` | When set to `production`, cookies enforce the `; Secure` attribute. |
| `SESSION_EXPIRY_DAYS` | Optional | `30` | Duration (in days) before admin sessions expire. |
| `SMTP_ENABLED` | Optional | `false` | Enables email notifications and password recovery dispatch. |
| `SMTP_HOST` | Optional | `smtp.gmail.com` | Mail transfer agent hostname. |
| `SMTP_PORT` | Optional | `587` | Port for TLS email dispatch. |
| `SMTP_USER` | Optional | Email string | SMTP authentication username. |
| `SMTP_PASSWORD` | Optional | App-specific password | SMTP authentication password. |

---

## 3. Database Migration Execution

All migrations are version-controlled and reversible. To initialize or update your database schema to the latest version:

```bash
# Run all pending migrations
python3 backend/migrate.py

# Check current migration status
python3 backend/migrate.py status

# Create a timestamped WAL-safe database backup
python3 backend/migrate.py backup
```

### Applied Security Migrations
- `20261012_001_core_schema`: Initial relational schema (14 tables including `admins` and `sessions`).
- `20261012_002_wal_and_indexes`: Enabled WAL journaling and lookup indexes.
- `20261012_003_seed_data`: Seeded operational fleet, tours, and services.
- `20261013_009_admins_security_hardening`: Added `idx_admins_email_unique` unique constraint, role indexes, and account status indexing.

---

## 4. Super Admin Bootstrap Process

The initial Super Admin is bootstrapped using a dedicated, idempotent CLI utility:

```bash
backend/scripts/bootstrap_super_admin.py
```

### Initial Account Target
- **Email:** `shitalupadhye2001@gmail.com`
- **Role:** `SUPER_ADMIN`
- **Initial Status:** `Active`

### Step 4.1: Check If Super Admin Exists
```bash
python3 backend/scripts/bootstrap_super_admin.py --check
```

### Step 4.2: Bootstrap Super Admin (Interactive Prompt)
Run the bootstrap command. If `SUPER_ADMIN_PASSWORD` is not set in your environment, the script will securely prompt for the password without echoing characters:

```bash
python3 backend/scripts/bootstrap_super_admin.py --email shitalupadhye2001@gmail.com
```

### Step 4.3: Bootstrap Super Admin (Environment Variable)
For automated infrastructure setup:

```bash
SUPER_ADMIN_PASSWORD="<YourSecurePasswordHere>" python3 backend/scripts/bootstrap_super_admin.py --email shitalupadhye2001@gmail.com
```

### Idempotence Guarantee
Running the bootstrap command when the account already exists is safe: it will verify the account exists without altering credentials or database state.

---

## 5. Super Admin Password Rotation Procedure

To rotate the password of an authorized Super Admin account:

```bash
python3 backend/scripts/bootstrap_super_admin.py --email shitalupadhye2001@gmail.com --rotate-password
```

This procedure:
1. Prompts for and verifies a new strong password.
2. Generates a fresh PBKDF2 hash with a new 16-byte random salt.
3. Immediately revokes all active session tokens across all devices.
4. Resets failed login attempts and unlocks the account if previously locked.
5. Appends a tamper-evident audit record to `audit_logs`.

---

## 6. Starting the Application

### Development Server:
```bash
# Terminal 1: Backend API Server
python3 backend/server.py

# Terminal 2: Frontend Vite Development Server
cd frontend
npm run dev
```

### Production Execution:
```bash
# Build frontend production bundle
cd frontend
npm run build

# Start backend (serves static frontend files and API routes)
cd ..
python3 backend/server.py
```

Access the administration portal at:
```
http://localhost:8080/#/admin/login
```

---

## 7. Rollback & Disaster Recovery Instructions

If a rollback of the latest migration is ever required:

```bash
python3 backend/migrate.py rollback
```

To restore from a backup:
```bash
python3 backend/scripts/restore_db.py --file backend/data/backups/<backup_filename>.db
```
The restore script takes an automatic safety snapshot of the active database before replacing files.
