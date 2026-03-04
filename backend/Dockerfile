FROM python:3.13-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
  libpq-dev \
  gcc \
  curl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
ENV UV_SYSTEM_PYTHON=1
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-cache
COPY backend/ .
EXPOSE 8000
CMD [ \
    "uv", "run", "uvicorn", "core.asgi:application", \
    "--host", "0.0.0.0", \
    "--port", "8000", \
    "--proxy-headers", \
    "--forwarded-allow-ips=*", \
    "--log-level", "warning" \
]