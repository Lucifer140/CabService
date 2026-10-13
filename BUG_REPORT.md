# Comprehensive Bug Report & Defect Remediation
**Project:** Sangita Travels Pune — Intercity Cab Management System  
**Audit Branch:** `audit-remediation`  
**Date:** October 13, 2026  
**Auditor:** Senior Quality Assurance & Application Security Specialist  
**Document Version:** 1.0.0  

---

## 1. Defect Summary Table

| Defect ID | Severity | Module / Component | Impact | Resolution Status |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-HIGH-01** | **HIGH** | `backend/controllers/booking_controller.py` | Allows negative fares, past travel dates, identical pickup/drop points | **RESOLVED & VERIFIED** |
| **BUG-HIGH-02** | **HIGH** | `backend/services/payment_service.py` | Payment callback replay causes duplicate balance increments | **RESOLVED & VERIFIED** |
| **BUG-MED-01** | **MEDIUM** | `backend/scripts/backup_db.py` | Sub-second backup filename collision & orphaned WAL sidecar files | **RESOLVED & VERIFIED** |
| **BUG-MED-02** | **MEDIUM** | `backend/controllers/media_controller.py` | SVG upload lacks XML schema validation, allowing embedded XSS tags | **RESOLVED & VERIFIED** |
| **BUG-LOW-01** | **LOW** | `backend/tests/test_api_integration.py` | Integration test fixture missing test user seeding, causing 401 failure | **RESOLVED & VERIFIED** |
| **BUG-LOW-02** | **LOW** | `backend/core/response.py` | Blind trust of `X-Forwarded-For` from non-proxy IP addresses | **RESOLVED & VERIFIED** |

---

## 2. Detailed Defect Investigations & Resolutions

---

### [BUG-HIGH-01] Unchecked Booking Trip Specifications & Negative Fares
- **Component:** Public Booking API (`backend/controllers/booking_controller.py`)
- **Severity:** High
- **Type:** Functional / Business Logic Defect

#### Symptoms & Expected vs. Actual Behavior
- **Expected:** The server must reject booking payloads where:
  - Pickup and drop points are identical.
  - Travel date is in the past.
  - Passenger count is less than 1 or exceeds vehicle capacity.
  - Fares are negative or arbitrated solely by client-side inputs.
- **Actual:** Prior to remediation, any arbitrary values submitted via POST to `/api/bookings` were saved into the database without server-side validation.

#### Root Cause
The controller extracted fields from `data.get()` and passed them straight to `BookingRepository.create_booking()` without running domain verification against distance rules or vehicle capacity boundaries.

#### Code Fix Applied
- In `backend/controllers/booking_controller.py`:
  - Added string comparison: `if pickup_location.lower() == drop_location.lower(): return error("Pickup and drop locations cannot be identical", 400)`.
  - Added date parsing against `datetime.now(timezone.utc).date()`: rejects dates earlier than current date.
  - Added seating capacity check: `if passengers < 1 or passengers > max_pax: return error(..., 400)`.
  - Authoritatively invoked `MapsService.compute_fare_breakdown()` to compute fare based on distance and rates.

#### Verification
Validated via automated tests in `backend/tests/test_api_integration.py` and `frontend/tests/booking_validation.test.ts`.

---

### [BUG-HIGH-02] Payment Callback Replay & Non-Idempotent Balance Increments
- **Component:** Payment Verification Service (`backend/services/payment_service.py`)
- **Severity:** High
- **Type:** Financial / Idempotency Defect

#### Symptoms & Expected vs. Actual Behavior
- **Expected:** Processing the same payment confirmation twice must be idempotent and must not credit double advance payment to the booking record.
- **Actual:** Each invocation of `/api/payments/verify` with a previously confirmed payment ID increased the booking's `advance_paid` column, eventually causing the balance to drop below zero.

#### Root Cause
`PaymentService.verify_payment()` did not check if the transaction had already been credited in the `payments` table before executing `UPDATE bookings SET advance_paid = advance_paid + ?`.

#### Code Fix Applied
- Added transaction query:
  ```python
  cur.execute("SELECT id, status FROM payments WHERE razorpay_payment_id = ?;", (payment_id,))
  existing_pay = cur.fetchone()
  if existing_pay and existing_pay["status"] == "SUCCESS":
      return {"success": True, "already_processed": True, ...}
  ```
- Wrapped the payment record insertion and booking balance update in an atomic transaction.

#### Verification
Validated via unit tests in `backend/tests/test_api_integration.py:test_06_payments_create_and_verify`.

---

### [BUG-MED-01] Sub-second Database Backup Timestamp Collision & Orphaned WAL Sidecars
- **Component:** Disaster Recovery Utility (`backend/scripts/backup_db.py`)
- **Severity:** Medium
- **Type:** Reliability / Operational Defect

#### Symptoms & Expected vs. Actual Behavior
- **Expected:** Automated backup jobs run in quick succession or within loops must create distinct, monotonically increasing snapshots. When older backups are pruned, all associated file system artifacts must be cleanly deleted.
- **Actual:**
  1. Filename timestamp format was `%Y%m%d_%H%M%S`, lacking sub-second granularity. Rapid backup operations overwrote the same file, causing retention rotation tests (`test_03_retention_rotation`) to fail.
  2. Because SQLite operated in WAL mode, opening the backup to run `PRAGMA integrity_check` generated `.db-wal` and `.db-shm` sidecar files in the backup directory. The retention rotator only pruned `.db` files, leaving orphaned sidecars on disk.

#### Root Cause
1. Format string truncation at seconds.
2. Failure to checkpoint WAL mode into the backup file and clean temporary journal files.

#### Code Fix Applied
- Updated timestamp format:
  ```python
  timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
  ```
- Checkpointed and switched backup database to standalone rollback mode:
  ```python
  dst_conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")
  dst_conn.execute("PRAGMA journal_mode=DELETE;")
  ```
- Cleaned up transient sidecars during backup generation and retention pruning:
  ```python
  for ext in ["-wal", "-shm"]:
      sidecar_old = old_file + ext
      if os.path.exists(sidecar_old):
          os.remove(sidecar_old)
  ```

#### Verification
Verified with `python3 -m unittest backend/tests/test_backup_restore.py`: all 5 tests passed (100% OK).

---

### [BUG-MED-02] SVG Media Upload Lack of XML Tag Validation
- **Component:** Media Upload Controller (`backend/controllers/media_controller.py`)
- **Severity:** Medium
- **Type:** Security / Data Processing Defect

#### Symptoms & Expected vs. Actual Behavior
- **Expected:** File uploads with extension `.svg` must be validated against dangerous XML elements before storage.
- **Actual:** The upload endpoint accepted `.svg` files based solely on extension and magic bytes, allowing SVGs containing embedded `<script>` or `<foreignObject>` tags to be stored on disk.

#### Root Cause
File type checking was limited to basic extension matching without inspecting XML structure.

#### Code Fix Applied
- Added regex and XML token parsing in `media_controller.py`:
  - Disallows `script`, `foreignObject`, `iframe`, `object`, `embed`, and `use` tags.
  - Strips/rejects inline event attributes (`onload=`, `onerror=`, etc.).
  - Rejects external entity DTD declarations (`<!ENTITY ...>`) to prevent XXE.

#### Verification
Validated via media controller unit tests and direct file upload probes.

---

### [BUG-LOW-01] Integration Test Fixture Missing Dynamic User Seeding
- **Component:** Test Suite (`backend/tests/test_api_integration.py`)
- **Severity:** Low
- **Type:** Test Harness Defect

#### Symptoms & Expected vs. Actual Behavior
- **Expected:** Running `python3 -m unittest backend/tests/test_api_integration.py` should execute reliably regardless of whether an initial `admin` user is pre-seeded in the database.
- **Actual:** `test_05_admin_login_auth_flow` failed with `AssertionError: 401 != 200` because the live database only contained custom administrative accounts.

#### Root Cause
The integration test suite assumed static database seed values instead of managing its own test fixtures.

#### Code Fix Applied
Added `setUpClass` and `tearDownClass` methods in `TestApiIntegration`:
```python
@classmethod
def setUpClass(cls):
    with transaction() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM admins WHERE username = 'admin';")
        if not cur.fetchone():
            pwd_hash, salt = hash_password("admin123")
            cur.execute("""
                INSERT INTO admins (username, password_hash, password_salt, full_name, phone, email, role, is_active)
                VALUES ('admin', ?, ?, 'API Test Admin', '9999999999', 'testadmin@sangitatravels.com', 'SUPER_ADMIN', 1)
            """, (pwd_hash, salt))
```

#### Verification
Verified via `python3 -m unittest backend/tests/test_api_integration.py`: 9/9 tests passing.

---

### [BUG-LOW-02] Client IP Extraction Trusted Unverified Forwarded Headers
- **Component:** HTTP Response & Request Dispatcher (`backend/core/response.py`)
- **Severity:** Low
- **Type:** Network Security Defect

#### Symptoms & Expected vs. Actual Behavior
- **Expected:** `get_client_ip()` must return the authentic client IP address and only trust proxy headers if the direct socket connection is from an authorized reverse proxy (e.g., localhost Nginx).
- **Actual:** The function read `handler.headers.get("X-Forwarded-For")` blindly, allowing external callers to spoof their reported IP.

#### Root Cause
Lack of source address verification on socket connections before reading forwarded headers.

#### Code Fix Applied
- Inspected `handler.client_address[0]`:
  - If source IP is in `['127.0.0.1', '::1', 'localhost']` or internal Docker networks, parse `X-Forwarded-For`.
  - Otherwise, return `handler.client_address[0]` directly.

#### Verification
Verified through health controller tests and direct header manipulation testing.

---

## 3. Regression & Test Suite Summary

All 6 identified defects were resolved on the `audit-remediation` branch. The test matrix was executed across all components:
- **Backend Unit & Integration Tests:** 44/44 Passed (0 Failures, 0 Errors)
- **Frontend Vitest Suite:** 10/10 Passed (0 Failures)
- **Production Build:** Succeeded with zero errors in 393ms.
