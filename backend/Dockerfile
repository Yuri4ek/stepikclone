FROM python:3.12-slim

WORKDIR /backend

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x docker-entrypoint.sh \
    # Решения учеников выполняются от judge (app/steps/judge.py): код и настройки бэкенда ему недоступны
    && useradd --system --no-create-home --shell /usr/sbin/nologin judge \
    && chmod -R o-rwx /backend

EXPOSE 8000

# Миграции и демо-данные (seed идемпотентен: без --force существующие данные не трогает)
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
