#!/bin/sh
set -e
alembic upgrade head
if [ "${SEED_DEMO:-1}" = "1" ]; then
  PYTHONPATH=. python -m app.seed.run
fi
exec "$@"
