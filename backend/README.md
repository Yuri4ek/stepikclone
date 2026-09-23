# StepikClone backend (FastAPI)

## Запуск

```bash
# 1. Postgres
cd postgres && docker compose up -d && cd ..

# 2. Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

alembic upgrade head
PYTHONPATH=. python -m app.seed.run

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Postgres в Docker слушает **5433** (чтобы не конфликтовать с локальным 5432).

- API: http://localhost:8000  
- Swagger: http://localhost:8000/docs  
- Health: http://localhost:8000/health  

## Демо-логины

| email | password | role |
|-------|----------|------|
| admin@example.com | demo1234 | admin |
| curator@example.com | demo1234 | curator |
| student@example.com | demo1234 | student |

## Срезы

`auth` · `course_builder` · `catalog` · `learning` · `reviews` · `progress` · `lag`
