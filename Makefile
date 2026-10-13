# ==============================================================================
# SANGITA TRAVELS PUNE (PUNE TAXI CAB) — ROOT MAKEFILE
# ==============================================================================

.DEFAULT_GOAL := help
.PHONY: help setup install dev dev-backend dev-frontend build migrate seed lint format test clean

# Colors for terminal output
CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RESET  := \033[0m
BOLD   := \033[1m

## Display available targets and descriptions
help:
	@echo "$(BOLD)Sangita Travels Pune — Common Management Commands$(RESET)"
	@echo ""
	@echo "$(CYAN)Development & Execution:$(RESET)"
	@echo "  $(GREEN)make dev$(RESET)           Start both backend and frontend dev servers concurrently"
	@echo "  $(GREEN)make dev-backend$(RESET)   Start backend HTTP server standalone (Port 8080)"
	@echo "  $(GREEN)make dev-frontend$(RESET)  Start frontend Vite HMR server standalone (Port 5173)"
	@echo ""
	@echo "$(CYAN)Build & Production:$(RESET)"
	@echo "  $(GREEN)make build$(RESET)         Compile frontend production bundle and validate backend"
	@echo "  $(GREEN)make prod-serve$(RESET)    Serve unified production application from backend server"
	@echo ""
	@echo "$(CYAN)Database & Migrations:$(RESET)"
	@echo "  $(GREEN)make migrate$(RESET)       Apply relational SQLite schema upgrades (WAL mode)"
	@echo "  $(GREEN)make seed$(RESET)          Seed initial default users, vehicles, tours & settings"
	@echo ""
	@echo "$(CYAN)Setup & Code Quality:$(RESET)"
	@echo "  $(GREEN)make setup$(RESET)         One-command full-stack project bootstrap"
	@echo "  $(GREEN)make lint$(RESET)          Run Prettier, Oxlint, ESLint and backend checks"
	@echo "  $(GREEN)make format$(RESET)        Auto-format frontend and backend source code"
	@echo "  $(GREEN)make clean$(RESET)         Remove build artifacts, caches, and temporary files"
	@echo ""

## Bootstrap full-stack development environment
setup: install
install:
	@./scripts/setup.sh

## Start unified dev environment (both servers concurrently)
dev:
	@./scripts/dev.sh

## Run standalone backend development server
dev-backend:
	@cd backend && python3 server.py

## Run standalone frontend development server
dev-frontend:
	@cd frontend && npm run dev

## Compile frontend production build and validate backend
build:
	@./scripts/build.sh

## Run unified production server locally
prod-serve: build
	@cd backend && python3 server.py

## Run database schema migrations
migrate:
	@./scripts/migrate.sh

## Seed default data
seed:
	@./scripts/seed.sh

## Run linters and quality checks
lint:
	@./scripts/lint.sh

## Auto-format codebase
format:
	@echo "Formatting frontend..."
	@cd frontend && npm run format
	@if [ -x backend/.venv/bin/ruff ]; then backend/.venv/bin/ruff format backend/; fi

## Clean build outputs, caches and logs
clean:
	@echo "Cleaning up generated build artifacts and caches..."
	@rm -rf frontend/dist
	@rm -rf backend/data/*.db-wal backend/data/*.db-shm
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo "Clean completed."
