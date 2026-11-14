"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminThumb } from "@/components/admin/admin-thumb";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton } from "@/components/ui/spinner";
import { useToast } from "@/providers/toast-provider";
import { ApiError, api, errorMessage } from "@/lib/api";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/types";

interface CategoryDraft {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

const emptyDraft: CategoryDraft = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  is_active: true,
  sort_order: 0,
};

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Category[]>("/admin/categories");
      setCategories(response.data);
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
        name: draft.name.trim(),
        slug: draft.slug.trim(),
        description: draft.description.trim() || null,
        image_url: draft.image_url.trim() || null,
      };
      if (editing) {
        await api.patch<Category>(`/admin/categories/${editing.id}`, payload);
        toast("Category updated.", "success");
      } else {
        await api.post<Category>("/admin/categories", payload);
        toast("Category created.", "success");
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
      await api.delete(`/admin/categories/${deleteTarget.id}`);
      toast("Category deleted.", "success");
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Menu"
        title="Categories"
        description="The sections guests browse on the menu. Categories with products cannot be deleted."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDraft({ ...emptyDraft });
              setFormError(null);
              setFieldErrors({});
            }}
          >
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />

      {error ? <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <CardSkeleton />
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-border-warm bg-vanilla-0 px-5 py-12 text-center">
          <p className="font-medium">No categories yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="flex flex-col rounded-2xl border border-border-warm bg-vanilla-0 p-4">
              <div className="flex items-start gap-3">
                <AdminThumb src={category.image_url} alt={category.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="truncate font-semibold">{category.name}</h2>
                    <Badge tone={category.is_active ? "success" : "neutral"}>{category.is_active ? "Active" : "Hidden"}</Badge>
                  </div>
                  <p className="text-[11px] text-ink-600">/{category.slug} · sort {category.sort_order}</p>
                  <p className="mt-1 text-xs text-ink-600">{category.products_count ?? 0} product{category.products_count === 1 ? "" : "s"}</p>
                </div>
              </div>
              {category.description ? <p className="mt-3 line-clamp-2 text-sm text-ink-600">{category.description}</p> : null}
              <div className="mt-4 flex justify-end gap-2 border-t border-border-warm pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(category)}
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(category);
                    setDraft({
                      name: category.name,
                      slug: category.slug,
                      description: category.description ?? "",
                      image_url: category.image_url ?? "",
                      is_active: category.is_active,
                      sort_order: category.sort_order,
                    });
                    setFormError(null);
                    setFieldErrors({});
                  }}
                >
                  Edit
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => { setDraft(null); setEditing(null); }}
        title={editing ? `Edit ${editing.name}` : "New category"}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setDraft(null); setEditing(null); }}>Cancel</Button>
            <Button type="submit" form="category-form" loading={saving}>{editing ? "Save changes" : "Create category"}</Button>
          </>
        }
      >
        {draft ? (
          <form
            id="category-form"
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <FormError message={formError} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="category-name" required error={fieldErrors.name?.[0]}>
                <Input
                  id="category-name"
                  value={draft.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setDraft({
                      ...draft,
                      name,
                      ...(editing || draft.slug === slugify(draft.name) ? { slug: slugify(name) } : {}),
                    });
                  }}
                  required
                />
              </Field>
              <Field label="Slug" htmlFor="category-slug" required error={fieldErrors.slug?.[0]}>
                <Input id="category-slug" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} required />
              </Field>
            </div>
            <Field label="Description" htmlFor="category-description">
              <Textarea
                id="category-description"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                className="min-h-20"
              />
            </Field>
            <Field label="Image URL" htmlFor="category-image">
              <Input id="category-image" value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sort order" htmlFor="category-sort">
                <Input
                  id="category-sort"
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
                Visible on the menu
              </label>
            </div>
          </form>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? `Delete ${deleteTarget.name}?` : "Delete category"}
        description="Categories can only be deleted when no products belong to them."
        confirmLabel="Delete category"
        dangerous
        busy={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
