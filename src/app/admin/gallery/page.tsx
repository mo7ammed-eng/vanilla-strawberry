"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton } from "@/components/ui/spinner";
import { useToast } from "@/providers/toast-provider";
import { ApiError, api, errorMessage } from "@/lib/api";
import type { GalleryItem } from "@/lib/types";

interface GalleryDraft {
  title: string;
  caption: string;
  image_url: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const emptyDraft: GalleryDraft = {
  title: "",
  caption: "",
  image_url: "/images/",
  category: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminGalleryPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [draft, setDraft] = useState<GalleryDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<GalleryItem[]>("/admin/gallery");
      setItems(response.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const payload = {
        ...draft,
        title: draft.title.trim(),
        caption: draft.caption.trim() || null,
        image_url: draft.image_url.trim(),
        category: draft.category.trim() || null,
      };
      if (editing) {
        await api.patch<GalleryItem>(`/admin/gallery/${editing.id}`, payload);
        toast("Gallery image updated.", "success");
      } else {
        await api.post<GalleryItem>("/admin/gallery", payload);
        toast("Gallery image added.", "success");
      }
      setDraft(null);
      setEditing(null);
      void load();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors);
        setFormError(Object.values(err.errors)[0]?.[0] ?? err.message);
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/gallery/${deleteTarget.id}`);
      toast("Gallery image deleted.", "success");
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  const categories = Array.from(new Set(items.map((item) => item.category).filter((category): category is string => Boolean(category))));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Marketing"
        title="Gallery"
        description="Photography for the website gallery. Keep captions short and images consistent in tone."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDraft({ ...emptyDraft, sort_order: items.length });
              setFormError(null);
              setFieldErrors({});
            }}
          >
            <Plus className="h-4 w-4" /> Add image
          </Button>
        }
      />

      {error ? <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <CardSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border-warm bg-vanilla-0 px-5 py-12 text-center">
          <p className="font-medium">The gallery is empty.</p>
          <p className="mt-1 text-sm text-ink-600">Add an image to start building the wall.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-border-warm bg-vanilla-0">
              <div
                role="img"
                aria-label={item.title}
                className="h-44 w-full bg-vanilla-100 bg-cover bg-center"
                style={{ backgroundImage: `url("${item.image_url.replace(/"/g, "%22")}")` }}
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{item.title}</h2>
                    <p className="text-[11px] text-ink-600">
                      {item.category ?? "Uncategorised"} · sort {item.sort_order}
                    </p>
                  </div>
                  <Badge tone={item.is_active ? "success" : "neutral"}>{item.is_active ? "Live" : "Hidden"}</Badge>
                </div>
                {item.caption ? <p className="mt-2 line-clamp-2 text-sm text-ink-600">{item.caption}</p> : null}
                <div className="mt-3 flex justify-end gap-1.5 border-t border-border-warm pt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(item)}
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditing(item);
                      setDraft({
                        title: item.title,
                        caption: item.caption ?? "",
                        image_url: item.image_url,
                        category: item.category ?? "",
                        sort_order: item.sort_order,
                        is_active: item.is_active,
                      });
                      setFormError(null);
                      setFieldErrors({});
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => { setDraft(null); setEditing(null); }}
        title={editing ? `Edit ${editing.title}` : "Add gallery image"}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setDraft(null); setEditing(null); }}>Cancel</Button>
            <Button type="submit" form="gallery-form" loading={saving}>{editing ? "Save changes" : "Add image"}</Button>
          </>
        }
      >
        {draft ? (
          <form
            id="gallery-form"
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div className="sm:col-span-2"><FormError message={formError} /></div>
            <Field label="Title" htmlFor="gallery-title" required error={fieldErrors.title?.[0]}>
              <Input id="gallery-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
            </Field>
            <Field label="Category" htmlFor="gallery-category" error={fieldErrors.category?.[0]}>
              <Input
                id="gallery-category"
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                list="gallery-categories"
              />
              <datalist id="gallery-categories">
                {categories.map((category) => <option key={category} value={category} />)}
              </datalist>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Image URL" htmlFor="gallery-image" required error={fieldErrors.image_url?.[0]}>
                <Input id="gallery-image" value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} required />
              </Field>
              <div
                role="img"
                aria-label="Gallery image preview"
                className="mt-2 h-36 w-full rounded-xl border border-border-warm bg-vanilla-100 bg-cover bg-center"
                style={draft.image_url ? { backgroundImage: `url("${draft.image_url.replace(/"/g, "%22")}")` } : undefined}
              />
            </div>
            <Field label="Caption" htmlFor="gallery-caption" className="sm:col-span-2">
              <Textarea
                id="gallery-caption"
                value={draft.caption}
                onChange={(event) => setDraft({ ...draft, caption: event.target.value })}
                className="min-h-16"
              />
            </Field>
            <Field label="Sort order" htmlFor="gallery-sort">
              <Input
                id="gallery-sort"
                type="number"
                min={0}
                value={draft.sort_order}
                onChange={(event) => setDraft({ ...draft, sort_order: Number(event.target.value) })}
              />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })}
                className="h-4 w-4 accent-strawberry-500"
              />
              Visible in the gallery
            </label>
          </form>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? `Delete ${deleteTarget.title}?` : "Delete gallery image"}
        description="The image is removed from the website gallery."
        confirmLabel="Delete image"
        dangerous
        busy={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
