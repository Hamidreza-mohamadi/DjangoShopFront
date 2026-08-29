from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly

from .models import Category, Product, ProductComment
from .serializers import CategorySerializer, ProductCommentSerializer, ProductSerializer


class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["slug"]


class ProductListView(generics.ListCreateAPIView):
    queryset = Product.objects.filter(is_active=True).select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category", "category__slug"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "sales_count", "views", "price"]
    ordering = ["-created_at"]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.filter(is_active=True).select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"


class ProductCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductCommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return ProductComment.objects.filter(
            product__slug=self.kwargs["product_slug"],
            is_approved=True,
        ).select_related("user", "product")

    def perform_create(self, serializer):
        product = Product.objects.get(slug=self.kwargs["product_slug"], is_active=True)
        serializer.save(user=self.request.user, product=product)
