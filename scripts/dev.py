#!/usr/bin/env python3
"""
SANGITA TRAVELS PUNE — Unified Development Runner
Launches both Backend (Python HTTP Server) and Frontend (Vite Dev Server)
concurrently with prefixed log streams and graceful shutdown handling.
"""

import os
import sys
import signal
import subprocess
import threading

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# ANSI Color Codes
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

processes = []

def stream_output(pipe, prefix, color):
    """Stream stdout/stderr from a child process with colorized prefix."""
    try:
        for line in iter(pipe.readline, ""):
            if not line:
                break
            sys.stdout.write(f"{color}{BOLD}[{prefix}]{RESET} {line}")
            sys.stdout.flush()
    except Exception:
        pass
    finally:
        pipe.close()

def ensure_prerequisites():
    """Ensure environment files and initial database migration exist."""
    backend_env = os.path.join(BACKEND_DIR, ".env")
    backend_example = os.path.join(BACKEND_DIR, ".env.example")
    if not os.path.exists(backend_env) and os.path.exists(backend_example):
        print(f"{YELLOW}[DEV]{RESET} Creating backend/.env from .env.example...")
        with open(backend_example, "r") as src, open(backend_env, "w") as dst:
            dst.write(src.read())

    frontend_env = os.path.join(FRONTEND_DIR, ".env")
    frontend_example = os.path.join(FRONTEND_DIR, ".env.example")
    if not os.path.exists(frontend_env) and os.path.exists(frontend_example):
        print(f"{YELLOW}[DEV]{RESET} Creating frontend/.env from .env.example...")
        with open(frontend_example, "r") as src, open(frontend_env, "w") as dst:
            dst.write(src.read())

    # Check database initialization
    db_file = os.path.join(BACKEND_DIR, "data", "bookings.db")
    if not os.path.exists(db_file):
        print(f"{YELLOW}[DEV]{RESET} Initializing SQLite database schema...")
        subprocess.run([sys.executable, "migrate.py"], cwd=BACKEND_DIR, check=False)

def stop_all(signum=None, frame=None):
    """Gracefully stop all running development subprocesses."""
    print(f"\n{YELLOW}[DEV] Stopping all development servers...{RESET}")
    for p in processes:
        if p.poll() is None:
            try:
                p.terminate()
                p.wait(timeout=2)
            except Exception:
                try:
                    p.kill()
                except Exception:
                    pass
    print(f"{GREEN}[DEV] All development servers stopped.{RESET}")
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, stop_all)
    signal.signal(signal.SIGTERM, stop_all)

    print("=" * 65)
    print(f"{BOLD}🚀 SANGITA TRAVELS PUNE — UNIFIED DEV ENVIRONMENT{RESET}")
    print(f"  Backend:  {CYAN}http://localhost:8080{RESET}")
    print(f"  Frontend: {GREEN}http://localhost:5173{RESET}")
    print(f"  Admin:    {CYAN}http://localhost:8080/admin{RESET}")
    print(f"  Press {BOLD}Ctrl+C{RESET} to stop all services")
    print("=" * 65)

    ensure_prerequisites()

    # Determine backend python binary (prefer .venv if exists)
    venv_python = os.path.join(BACKEND_DIR, ".venv", "bin", "python3")
    py_bin = venv_python if os.path.exists(venv_python) else sys.executable

    # Launch Backend
    backend_proc = subprocess.Popen(
        [py_bin, "server.py"],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(backend_proc)

    # Launch Frontend
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(frontend_proc)

    # Start output streaming threads
    t_back = threading.Thread(target=stream_output, args=(backend_proc.stdout, "BACKEND", CYAN), daemon=True)
    t_front = threading.Thread(target=stream_output, args=(frontend_proc.stdout, "FRONTEND", GREEN), daemon=True)

    t_back.start()
    t_front.start()

    # Monitor processes
    while True:
        for p in processes:
            if p.poll() is not None:
                stop_all()
        try:
            signal.pause()
        except (AttributeError, KeyboardInterrupt):
            import time
            time.sleep(1)

if __name__ == "__main__":
    main()
