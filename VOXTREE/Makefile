# VOXTREE Project Management System - Makefile

.PHONY: help build up down restart logs clean dev test lint format

# Default target
help: ## Show this help message
	@echo "VOXTREE Project Management System"
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	@echo "Starting development environment..."
	cd infra && docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

build: ## Build all Docker images
	@echo "Building Docker images..."
	cd infra && docker-compose build

up: ## Start production environment
	@echo "Starting production environment..."
	cd infra && docker-compose up -d

down: ## Stop all services
	@echo "Stopping all services..."
	cd infra && docker-compose down

restart: ## Restart all services
	@echo "Restarting all services..."
	cd infra && docker-compose restart

logs: ## Show logs for all services
	@echo "Showing logs for all services..."
	cd infra && docker-compose logs -f

logs-backend: ## Show backend logs
	@echo "Showing backend logs..."
	cd infra && docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	@echo "Showing frontend logs..."
	cd infra && docker-compose logs -f frontend

logs-db: ## Show database logs
	@echo "Showing database logs..."
	cd infra && docker-compose logs -f mysql

# Database commands
db-migrate: ## Run database migrations
	@echo "Running database migrations..."
	cd infra && docker-compose exec backend npx prisma migrate deploy

db-seed: ## Seed the database
	@echo "Seeding the database..."
	cd infra && docker-compose exec backend npm run prisma:seed

db-reset: ## Reset the database (WARNING: This will delete all data)
	@echo "Resetting the database..."
	cd infra && docker-compose exec backend npx prisma migrate reset --force

db-backup: ## Backup the database
	@echo "Creating database backup..."
	cd infra && docker-compose exec mysql mysqldump -u root -p voxtree > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Testing commands
test: ## Run all tests
	@echo "Running backend tests..."
	cd backend && npm test
	@echo "Running frontend tests..."
	cd frontend && npm test

test-backend: ## Run backend tests
	@echo "Running backend tests..."
	cd backend && npm test

test-frontend: ## Run frontend tests
	@echo "Running frontend tests..."
	cd frontend && npm test

test-integration: ## Run integration tests
	@echo "Running integration tests..."
	cd backend && npm run test:integration

# Code quality commands
lint: ## Run linting for all projects
	@echo "Running backend linting..."
	cd backend && npm run lint
	@echo "Running frontend linting..."
	cd frontend && npm run lint

lint-fix: ## Fix linting issues
	@echo "Fixing backend linting issues..."
	cd backend && npm run lint:fix
	@echo "Fixing frontend linting issues..."
	cd frontend && npm run lint

format: ## Format code
	@echo "Formatting backend code..."
	cd backend && npm run format

# Health check commands
health: ## Check health of all services
	@echo "Checking backend health..."
	@curl -s http://localhost:3001/health | jq . || echo "Backend not responding"
	@echo "Checking frontend health..."
	@curl -s http://localhost:3000/health || echo "Frontend not responding"
	@echo "Checking database health..."
	@cd infra && docker-compose exec mysql mysqladmin ping -h localhost || echo "Database not responding"

# Cleanup commands
clean: ## Clean up Docker resources
	@echo "Cleaning up Docker resources..."
	docker system prune -f
	docker volume prune -f

clean-all: ## Clean up all Docker resources (WARNING: This will remove all unused containers, networks, images)
	@echo "Cleaning up all Docker resources..."
	docker system prune -a -f
	docker volume prune -f

# Production deployment commands
deploy: ## Deploy to production
	@echo "Deploying to production..."
	cd infra && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

deploy-build: ## Build and deploy to production
	@echo "Building and deploying to production..."
	cd infra && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Monitoring commands
stats: ## Show container statistics
	@echo "Showing container statistics..."
	docker stats

ps: ## Show running containers
	@echo "Showing running containers..."
	cd infra && docker-compose ps

# Security commands
security-audit: ## Run security audit
	@echo "Running backend security audit..."
	cd backend && npm audit
	@echo "Running frontend security audit..."
	cd frontend && npm audit

# Documentation commands
docs: ## Generate API documentation
	@echo "API documentation available at: http://localhost:3001/docs"

# Environment setup
setup: ## Initial setup for development
	@echo "Setting up development environment..."
	@if [ ! -f infra/.env ]; then \
		cp infra/env.example infra/.env; \
		echo "Created .env file from template. Please edit it with your configuration."; \
	fi
	@echo "Installing dependencies..."
	cd backend && npm install
	cd frontend && npm install
	@echo "Setup complete! Run 'make dev' to start the development environment."

# Quick start for new developers
quickstart: setup up db-migrate db-seed ## Quick start for new developers
	@echo "Quick start complete!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:3001"
	@echo "API Docs: http://localhost:3001/docs"
	@echo "Database Admin: http://localhost:8080"
	@echo "Default admin: admin@example.com / Admin@123"