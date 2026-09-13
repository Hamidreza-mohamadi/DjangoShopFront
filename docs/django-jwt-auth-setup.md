# Django JWT authentication setup

This frontend expects a Django REST API using SimpleJWT.

## 1. Install packages

```bash
pip install djangorestframework djangorestframework-simplejwt django-cors-headers
```

## 2. Configure `settings.py`

```python
from datetime import timedelta

INSTALLED_APPS = [
    # ...
    "rest_framework",
    "corsheaders",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
```

If refresh-token blacklisting is enabled, add
`rest_framework_simplejwt.token_blacklist` to `INSTALLED_APPS` and run migrations.

## 3. Add token endpoints in `urls.py`

```python
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # ...
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
```

The login response is:

```json
{
  "refresh": "...",
  "access": "..."
}
```

## 4. Add the current-user endpoint

```python
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserSerializer

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
```

Register it at `/api/v1/auth/me/`.

## 5. Connect the frontend

Create a frontend environment file with the explicit backend URL:

```env
DJANGO_API_BASE_URL=http://localhost:8000/api/v1
```

The frontend's TanStack Start server functions keep the token in an HttpOnly cookie and send it to Django as a Bearer token. Do not put the JWT in localStorage.

## Important

The frontend currently uses a mock mode when `DJANGO_API_BASE_URL` is missing. Set this variable explicitly before testing real Django authentication.
