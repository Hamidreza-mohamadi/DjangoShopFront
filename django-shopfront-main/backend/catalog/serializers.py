from rest_framework import serializers

from .models import Category, Product, ProductComment


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "price",
            "compare_at_price",
            "stock",
            "sales_count",
            "views",
            "category",
            "image",
            "image_url",
            "created_at",
            "updated_at",
        ]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class ProductCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductComment
        fields = [
            "id",
            "product",
            "user_name",
            "rate",
            "body",
            "is_recommended",
            "created_at",
        ]
        read_only_fields = ["product", "user_name", "created_at"]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
