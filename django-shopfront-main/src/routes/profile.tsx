import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Package, Settings, User, CreditCard } from "lucide-react";

const items = [
  { title: "سفارش‌های من", desc: "مشاهده و پیگیری سفارش‌ها", icon: Package },
  { title: "آدرس‌ها", desc: "مدیریت آدرس‌های ارسال", icon: MapPin },
  { title: "علاقه‌مندی‌ها", desc: "محصولات ذخیره شده", icon: Heart },
  { title: "پرداخت‌ها", desc: "تاریخچه پرداخت‌ها", icon: CreditCard },
  { title: "تنظیمات حساب", desc: "ویرایش اطلاعات شخصی", icon: Settings },
];

export default function ProfilePage() {
  return (
    <main className="container mx-auto px-4 py-10" dir="rtl">
      <div className="mb-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">پروفایل کاربری</h1>
            <p className="mt-1 text-sm text-muted-foreground">مدیریت حساب، سفارش‌ها و اطلاعات شخصی</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              to="/profile"
              className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-primary/5"
            >
              <Icon className="mb-4 h-6 w-6 text-primary transition group-hover:scale-110" />
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </Link>
          );
        })}
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-bold">اطلاعات کاربر</h2>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <p>نام: کاربر نمونه</p>
          <p>ایمیل: user@example.com</p>
          <p>شماره تماس: ۰۹۱۲۱۲۳۴۵۶۷</p>
          <p>عضویت: امروز</p>
        </div>
      </section>
    </main>
  );
}
