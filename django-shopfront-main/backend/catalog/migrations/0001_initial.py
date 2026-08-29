import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Category",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=120)),
                ("slug", models.SlugField(max_length=140, unique=True)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"ordering": ["name"], "verbose_name_plural": "Categories"},
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=240)),
                ("slug", models.SlugField(max_length=260, unique=True)),
                ("description", models.TextField(blank=True)),
                ("price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("compare_at_price", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("stock", models.PositiveIntegerField(default=0)),
                ("sales_count", models.PositiveIntegerField(default=0)),
                ("views", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("image", models.ImageField(blank=True, null=True, upload_to="products/")),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="products", to="catalog.category")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="ProductComment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("rate", models.PositiveSmallIntegerField()),
                ("body", models.TextField()),
                ("is_approved", models.BooleanField(default=True)),
                ("is_recommended", models.BooleanField(default=False)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comments", to="catalog.product")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="product_comments", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="productcomment",
            constraint=models.CheckConstraint(condition=models.Q(("rate__gte", 1), ("rate__lte", 5)), name="comment_rate_1_to_5"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["category", "is_active"], name="catalog_pro_categor_8b6fcb_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["price"], name="catalog_pro_price_6e5a8d_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["-created_at"], name="catalog_pro_created_1d9c90_idx"),
        ),
    ]
