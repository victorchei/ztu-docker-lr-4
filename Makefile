# Simple Makefile to run stacks
.PHONY: prod dev both down down-dev logs-dev logs-prod logs-nginx logs-nginx-dev reload-nginx reload-nginx-dev

prod:
	docker compose up --build -d

dev:
	docker compose -f docker-compose.dev.yml up --build -d

both:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

down:
	docker compose down

down-dev:
	docker compose -f docker-compose.dev.yml down

logs-dev:
	docker compose -f docker-compose.dev.yml logs -f api_dev

logs-prod:
	docker compose logs -f api_prod

logs-nginx:
	docker compose logs -f nginx_prod

logs-nginx-dev:
	docker compose -f docker-compose.dev.yml logs -f nginx_dev

reload-nginx:
	docker compose exec nginx_prod nginx -s reload

reload-nginx-dev:
	docker compose -f docker-compose.dev.yml exec nginx_dev nginx -s reload
