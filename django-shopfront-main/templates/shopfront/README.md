# Django template conversion

این پوشه نسخه Django Template از shell اصلی فرانت است. ساختار بر پایه inheritance است:

- `base.html` — layout اصلی؛ Header + `<main>` + Footer + assetها
- `partials/header.html` — هدر، جستجو، سبد، علاقه‌مندی، منوی موبایل و مخفی‌شدن ردیف ناوبری هنگام اسکرول
- `partials/footer.html` — فوتر
- `partials/product_row.html` — ردیف قابل استفاده مجدد محصولات
- `home.html` — صفحه خانه با Hero چهار اسلاید، دسته‌بندی‌ها، محصولات و بخش مزایا
- `products.html` — لیست محصولات و فیلترهای پایه
- `product_detail.html` — جزئیات محصول
- `articles.html` و `article_detail.html` — صفحات مقاله
- `about.html` و `contact.html` — درباره ما و ارتباط با ما
- `auth.html` — template مشترک برای ورود/ثبت‌نام
- `profile.html`, `favorites.html`, `cart.html`, `orders.html`, `checkout.html`

## Context پیشنهادی

`home.html`: `categories`, `featured_products`, `best_sellers`, `discounted_products`, `latest_articles`

`products.html`: `products`, `categories`, `active_category`, `brands`, `colors`

`product_detail.html`: `product`

`articles.html`: `articles`

`article_detail.html`: `article`

`about.html` / `contact.html`: `site_setting`

## URL names

Templateها از نام‌های استاندارد زیر استفاده می‌کنند: `home`, `products`, `product_detail`, `articles`, `article_detail`, `about`, `contact`, `login`, `register`, `logout`, `profile`, `favorites`, `cart`, `cart_add`, `checkout`, `orders`.

اگر نام URLهای پروژه Django شما متفاوت است، فقط `{% url %}`ها را در partialها و صفحات اصلاح کنید؛ inheritance دست‌نخورده می‌ماند.

## Static

CSS و JS در `static/shopfront/css/theme.css` و `static/shopfront/js/theme.js` قرار گرفته‌اند. برای حفظ لوگوی اصلی، header فعلاً همان asset تصویری موجود در frontend را از GitHub می‌خواند؛ در استقرار واقعی بهتر است `site-logo-wide.png` و `site-logo.png` را به static پروژه Django منتقل کنید.

این تبدیل عمداً SPA/router را حذف کرده است: navigation با URLهای عادی Django انجام می‌شود و refresh صفحه مشکلی ندارد. رفتارهای UI که برای ظاهر مهم‌اند (slider، منوی موبایل، account popover و collapse نوار دوم هنگام scroll) در `theme.js` باقی مانده‌اند.
