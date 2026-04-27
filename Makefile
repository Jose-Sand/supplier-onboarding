# Makefile — supplier-onboarding monorepo
# Requiere GNU Make. En Windows: instalar via `choco install make` o usar WSL.

.PHONY: up down logs ps build \
        migrate-checklist migrate-supplier \
        test-checklist test-supplier test \
        lint-checklist lint-supplier lint \
        shell-checklist shell-supplier \
        prisma-generate-checklist prisma-generate-supplier \
        prisma-studio-checklist prisma-studio-supplier \
        redis-cli rabbit-ui

# ── Docker Compose ────────────────────────────────────────────────

## Levanta todos los servicios en background
up:
	docker compose up -d

## Detiene y elimina los contenedores (preserva los volúmenes)
down:
	docker compose down

## Sigue los logs de todos los servicios en tiempo real
logs:
	docker compose logs -f

## Muestra el estado de los contenedores
ps:
	docker compose ps

## Reconstruye y reinicia ambos servicios
build:
	docker compose build checklist-service supplier-service
	docker compose up -d checklist-service supplier-service

## Reconstruye solo checklist-service
build-checklist:
	docker compose build checklist-service
	docker compose up -d checklist-service

## Reconstruye solo supplier-service
build-supplier:
	docker compose build supplier-service
	docker compose up -d supplier-service

# ── Base de datos ─────────────────────────────────────────────────

## Ejecuta las migraciones de Prisma — checklist-service
migrate-checklist:
	docker compose exec checklist-service npx prisma migrate dev

## Ejecuta las migraciones de Prisma — supplier-service
migrate-supplier:
	docker compose exec supplier-service npx prisma migrate dev

## Abre Prisma Studio para checklist-service en localhost:5555
prisma-studio-checklist:
	docker compose exec checklist-service npx prisma studio

## Abre Prisma Studio para supplier-service en localhost:5556
prisma-studio-supplier:
	docker compose exec supplier-service npx prisma studio --port 5556

## Regenera el cliente Prisma — checklist-service
prisma-generate-checklist:
	docker compose exec checklist-service npx prisma generate

## Regenera el cliente Prisma — supplier-service
prisma-generate-supplier:
	docker compose exec supplier-service npx prisma generate

# ── Tests ─────────────────────────────────────────────────────────

## Corre los tests de checklist-service
test-checklist:
	cd checklist-service && npm test

## Corre los tests de supplier-service
test-supplier:
	cd supplier-service && npm test

## Corre los tests de ambos servicios
test: test-checklist test-supplier

## Tests con cobertura — checklist-service
test-coverage-checklist:
	cd checklist-service && npm run test:coverage

## Tests con cobertura — supplier-service
test-coverage-supplier:
	cd supplier-service && npm run test:coverage

# ── Desarrollo ────────────────────────────────────────────────────

## Chequeo de tipos TypeScript — checklist-service
lint-checklist:
	cd checklist-service && npx tsc --noEmit

## Chequeo de tipos TypeScript — supplier-service
lint-supplier:
	cd supplier-service && npx tsc --noEmit

## Chequeo de tipos en ambos servicios
lint: lint-checklist lint-supplier

## Abre una shell dentro del contenedor de checklist-service
shell-checklist:
	docker compose exec checklist-service sh

## Abre una shell dentro del contenedor de supplier-service
shell-supplier:
	docker compose exec supplier-service sh

## Abre redis-cli dentro del contenedor de Redis
redis-cli:
	docker compose exec redis redis-cli

## Abre la URL de la management UI de RabbitMQ en el navegador
rabbit-ui:
	@echo "RabbitMQ Management UI → http://localhost:15672 (guest/guest)"
