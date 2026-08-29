from django.urls import path

from .views import (
    CategoryListView,
    ProductCommentListCreateView,
    ProductDetailView,
    ProductListView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
    path(
        "products/<slug:product_slug>/comments/",
        ProductCommentListCreateView.as_view(),
        name="product-comments",
    ),
]
