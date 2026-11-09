.PHONY: lab up down demo test
lab: ; docker compose -f lab/docker-compose.lab.yml up -d --build
up: ; docker compose up -d --build
down: ; docker compose down && docker compose -f lab/docker-compose.lab.yml down -v
demo: lab up ; @echo "Open http://localhost:5173 and click 'Load demo scenario'"
test: ; pytest backend/tests -q
