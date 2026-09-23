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
PYTHONPATH=. python -m app.seed.run --force

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Postgres в Docker: порт **5433**.

- API: http://localhost:8000  
- Swagger: http://localhost:8000/docs  
- Uploads: http://localhost:8000/uploads/...  

Локальная шпаргалка по данным БД (в gitignore): `backend/DATA.md`.

## Демо-логины (password `demo1234`)

| email | role |
|-------|------|
| admin@example.com | admin |
| curator@example.com | curator |
| student@example.com | student |
| ivan@example.com | student |

## Курсы в seed

`python-setup` · `python-first-steps` · `codeolymp-start` · `algo-intro`  
У курсов есть `cover_url`; админ может загрузить обложку: `POST /api/v1/admin/courses/{id}/cover`.

## Срезы

`auth` · `course_builder` · `catalog` · `learning` · `reviews` · `progress` · `lag`
