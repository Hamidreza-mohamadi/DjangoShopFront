import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { MessageCircle, Star, CornerDownLeft } from "lucide-react";
import { useState } from "react";
import { getProductComments, createProductComment } from "@/lib/shop/api";
import { Button } from "@/components/ui/button";
import type { ProductComment } from "@/lib/shop/types";

const commentsQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["products", "comments", id],
    queryFn: () => getProductComments({ data: { productId: id } }),
  });

export function ProductComments({ productId }: { productId: number }) {
  const qc = useQueryClient();
  const { data: comments } = useSuspenseQuery(commentsQueryOptions(productId));
  const [text, setText] = useState("");
  const [rate, setRate] = useState(5);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const topLevel = comments.filter((c) => !c.parent);
  const repliesOf = (id: number) => comments.filter((c) => c.parent === id);
  const avgRate =
    topLevel.length > 0 ? topLevel.reduce((s, c) => s + c.rate, 0) / topLevel.length : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await createProductComment({
        data: { product: productId, text: text.trim(), rate, parent: replyTo },
      });
      setText("");
      setRate(5);
      setReplyTo(null);
      await qc.invalidateQueries({ queryKey: ["products", "comments", productId] });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(d));

  return (
    <section className="mt-16 border-t border-border pt-12" dir="rtl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <MessageCircle className="h-5 w-5" />
          نظرات و امتیازها ({comments.length})
        </h2>
        {avgRate > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
            <Stars value={Math.round(avgRate)} />
            <span className="text-sm font-medium">{avgRate.toFixed(1)} از ۵</span>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-6">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-xs">
            <span>در حال پاسخ به نظر #{replyTo}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-primary hover:underline">
              انصراف
            </button>
          </div>
        )}
        {!replyTo && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">امتیاز شما:</span>
            <div className="flex flex-row-reverse">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRate(n)}
                  aria-label={`${n} ستاره`}
                  className="p-1"
                >
                  <Star
                    className={`h-5 w-5 transition ${
                      n <= rate ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="نظرتان را درباره این محصول بنویسید..."
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-background p-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <div className="mt-3 flex justify-end">
          <Button type="submit" size="sm" disabled={submitting || !text.trim()}>
            {submitting ? "در حال ارسال..." : "ثبت نظر"}
          </Button>
        </div>
      </form>

      <div className="mt-8 space-y-6">
        {topLevel.length === 0 ? (
          <p className="text-sm text-muted-foreground">هنوز نظری ثبت نشده.</p>
        ) : (
          topLevel.map((c) => (
            <div key={c.id} className="space-y-3">
              <CommentItem c={c} onReply={() => setReplyTo(c.id)} formatDate={formatDate} />
              {repliesOf(c.id).length > 0 && (
                <div className="mr-8 space-y-3 border-r-2 border-border pr-4">
                  {repliesOf(c.id).map((r) => (
                    <CommentItem key={r.id} c={r} onReply={() => setReplyTo(c.id)} formatDate={formatDate} isReply />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex flex-row-reverse">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );
}

function CommentItem({
  c,
  onReply,
  formatDate,
  isReply,
}: {
  c: ProductComment;
  onReply: () => void;
  formatDate: (d: string) => string;
  isReply?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {c.user.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{c.user}</p>
            <p className="text-xs text-muted-foreground">{formatDate(c.create_date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isReply && <Stars value={c.rate} />}
          <button
            type="button"
            onClick={onReply}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <CornerDownLeft className="h-3 w-3" />
            پاسخ
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{c.text}</p>
    </div>
  );
}
