# Django backend

This directory contains the Django + Django REST Framework backend for ShopFront.

## Structure

- `config/` — project configuration, URLs and WSGI/ASGI entrypoints.
- `catalog/` — categories, products and product comments.
- `manage.py` — Django management commands.

## Run locally

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API is available under `http://localhost:8000/api/v1/` and Django Admin under `http://localhost:8000/admin/`.

## API endpoints

- `GET /api/v1/categories/`
- `GET /api/v1/products/`
- `GET /api/v1/products/<slug>/`
- `GET /api/v1/products/<slug>/comments/`
- `POST /api/v1/products/<slug>/comments/` (authenticated)
- `POST /api/v1/auth/token/`
- `POST /api/v1/auth/token/refresh/`

Product listing supports Django Filter, search and ordering. The ordering fields intentionally match the frontend contract: `created_at`, `sales_count`, `views`, and `price`.
