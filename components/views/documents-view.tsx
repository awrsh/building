"use client";

import { useEffect, useMemo, useState } from "react";
import { SitePhoto } from "@/components/site-photo";
import { Button, Empty, Field, Modal, PageHeader, Panel, controlClass } from "@/components/ui";
import { faDate, faNum, todayIso, uid } from "@/lib/format";
import { DOC_CATEGORIES, DOC_LABEL } from "@/lib/labels";
import { useProject } from "@/lib/store";
import type { DocCategory, DocItem, GalleryItem } from "@/lib/types";

const PHASE_LABEL = {
  before: "قبل",
  after: "بعد",
  progress: "کارگاه",
} as const;

function fileSize(bytes: number) {
  if (bytes < 1024) return `${faNum(bytes)} بایت`;
  if (bytes < 1_048_576) return `${faNum(bytes / 1024, 0)} کیلوبایت`;
  return `${faNum(bytes / 1_048_576, 1)} مگابایت`;
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function DocumentsView({ embedded = false }: { embedded?: boolean }) {
  const { state, addDocument, deleteDocument, addGallery, deleteGallery } = useProject();
  const [docCat, setDocCat] = useState<DocCategory | "all">("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [docOpen, setDocOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(
    state.gallery.find((item) => item.pairId)?.pairId ?? null,
  );

  const docs = state.documents.filter((item) => (docCat === "all" ? true : item.category === docCat));
  const photos = state.gallery.filter((item) => {
    if (floorFilter !== "all" && item.floorId !== floorFilter) return false;
    if (stageFilter !== "all" && item.stageId !== stageFilter) return false;
    return true;
  });
  const pairs = useMemo(() => {
    const map = new Map<string, GalleryItem[]>();
    for (const item of state.gallery) {
      if (!item.pairId) continue;
      const list = map.get(item.pairId) ?? [];
      list.push(item);
      map.set(item.pairId, list);
    }
    return [...map.entries()].map(([id, items]) => ({
      id,
      before: items.find((item) => item.phase === "before"),
      after: items.find((item) => item.phase === "after"),
    }));
  }, [state.gallery]);
  const compare = pairs.find((item) => item.id === compareId) ?? pairs[0];
  const activePhoto = photos.find((item) => item.id === lightbox) ?? null;
  const photoIndex = photos.findIndex((item) => item.id === lightbox);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowLeft" && photoIndex < photos.length - 1) setLightbox(photos[photoIndex + 1].id);
      if (event.key === "ArrowRight" && photoIndex > 0) setLightbox(photos[photoIndex - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photoIndex, photos]);

  return (
    <div className={embedded ? "space-y-5" : "h-full overflow-auto p-4 lg:p-6"}>
      <PageHeader
        title="اسناد و تصاویر"
        description="نقشه‌ها، قراردادها و گالری کارگاه با نمایش تمام‌صفحه و مقایسه قبل و بعد."
        actions={
          <>
            <Button tone="ghost" onClick={() => setDocOpen(true)}>ثبت سند</Button>
            <Button onClick={() => setPhotoOpen(true)}>بارگذاری تصویر</Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDocCat("all")}
          className={`h-9 border px-3 text-sm ${docCat === "all" ? "border-ink bg-ink text-white" : "border-line bg-surface"}`}
        >
          همه اسناد
        </button>
        {DOC_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setDocCat(category)}
            className={`h-9 border px-3 text-sm ${docCat === category ? "border-ink bg-ink text-white" : "border-line bg-surface"}`}
          >
            {DOC_LABEL[category]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {docs.map((doc) => (
          <Panel key={doc.id} className="flex flex-col p-4">
            <div className="text-[11px] text-accent">{DOC_LABEL[doc.category]}</div>
            <h2 className="mt-1 text-sm font-semibold">{doc.title}</h2>
            <p className="mt-2 flex-1 text-[12px] leading-5 text-muted">{doc.summary}</p>
            <div className="mt-3 text-[12px] text-muted">
              ویرایش {doc.revision} · {faDate(doc.date)} · {doc.size} · {doc.author}
            </div>
            <div className="mt-3 flex gap-2">
              {doc.dataUrl ? (
                <a href={doc.dataUrl} download={doc.fileName ?? `${doc.title}.pdf`} className="text-[12px] underline">
                  دانلود
                </a>
              ) : (
                <span className="text-[12px] text-muted">نسخه نمایشی بدون فایل</span>
              )}
              <button type="button" className="mr-auto text-[12px] text-danger underline" onClick={() => deleteDocument(doc.id)}>
                حذف
              </button>
            </div>
          </Panel>
        ))}
      </div>
      {docs.length === 0 ? <Empty>سندی در این دسته نیست.</Empty> : null}

      <div className="mt-8 mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold">گالری کارگاه</h2>
        <div className="flex gap-2">
          <select className={controlClass} value={floorFilter} onChange={(event) => setFloorFilter(event.target.value)}>
            <option value="all">همه طبقات</option>
            {state.floors.map((floor) => (
              <option key={floor.id} value={floor.id}>{floor.name}</option>
            ))}
          </select>
          <select className={controlClass} value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
            <option value="all">همه مراحل</option>
            {state.stages.map((stage) => (
              <option key={stage.id} value={stage.id}>{stage.name}</option>
            ))}
          </select>
        </div>
      </div>

      {photos.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {photos.map((item) => (
            <button key={item.id} type="button" onClick={() => setLightbox(item.id)} className="overflow-hidden border border-line bg-surface text-right">
              <div className="aspect-[4/3]">
                <SitePhoto item={item} />
              </div>
              <div className="p-3">
                <div className="text-sm font-medium">{item.title}</div>
                <div className="mt-1 text-[11px] text-muted">
                  {PHASE_LABEL[item.phase]} · {faDate(item.date)}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Empty>تصویری با این فیلتر نیست.</Empty>
      )}

      {compare?.before && compare.after ? (
        <Panel className="mt-6 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">مقایسه قبل و بعد</h2>
            <select className={`${controlClass} max-w-xs`} value={compare.id} onChange={(event) => setCompareId(event.target.value)}>
              {pairs.map((pair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.before?.title ?? pair.after?.title}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="overflow-hidden border border-line">
              <div className="aspect-[16/10]"><SitePhoto item={compare.before} /></div>
              <div className="p-3 text-sm">{compare.before.title}</div>
            </div>
            <div className="overflow-hidden border border-line">
              <div className="aspect-[16/10]"><SitePhoto item={compare.after} /></div>
              <div className="p-3 text-sm">{compare.after.title}</div>
            </div>
          </div>
        </Panel>
      ) : null}

      <DocModal
        open={docOpen}
        onClose={() => setDocOpen(false)}
        onSave={async (item) => {
          addDocument(item);
          setDocOpen(false);
        }}
      />
      <PhotoModal
        open={photoOpen}
        floors={state.floors}
        stages={state.stages}
        onClose={() => setPhotoOpen(false)}
        onSave={(item) => {
          addGallery(item);
          setPhotoOpen(false);
        }}
      />

      {activePhoto ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink/80 p-4" onClick={() => setLightbox(null)}>
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between text-white">
              <div>
                <div className="text-sm font-medium">{activePhoto.title}</div>
                <div className="text-[12px] text-white/70">{activePhoto.caption} · {faDate(activePhoto.date)}</div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="border border-white/30 px-3 py-1 text-sm" onClick={() => photoIndex > 0 && setLightbox(photos[photoIndex - 1].id)}>قبلی</button>
                <button type="button" className="border border-white/30 px-3 py-1 text-sm" onClick={() => photoIndex < photos.length - 1 && setLightbox(photos[photoIndex + 1].id)}>بعدی</button>
                <button type="button" className="border border-white/30 px-3 py-1 text-sm" onClick={() => setLightbox(null)}>بستن</button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden bg-black">
              <SitePhoto item={activePhoto} />
            </div>
            <button type="button" className="mt-3 self-start text-[12px] text-white/70 underline" onClick={() => deleteGallery(activePhoto.id)}>
              حذف تصویر
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DocModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: DocItem) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocCategory>("architecture");
  const [revision, setRevision] = useState("A");
  const [author, setAuthor] = useState("");
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setCategory("architecture");
    setRevision("A");
    setAuthor("");
    setSummary("");
    setFile(null);
  }, [open]);

  return (
    <Modal open={open} title="سند جدید" onClose={onClose}>
      <div className="space-y-3">
        <Field label="عنوان">
          <input className={controlClass} value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="دسته">
          <select className={controlClass} value={category} onChange={(event) => setCategory(event.target.value as DocCategory)}>
            {DOC_CATEGORIES.map((item) => (
              <option key={item} value={item}>{DOC_LABEL[item]}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ویرایش">
            <input className={controlClass} value={revision} onChange={(event) => setRevision(event.target.value)} />
          </Field>
          <Field label="نویسنده">
            <input className={controlClass} value={author} onChange={(event) => setAuthor(event.target.value)} />
          </Field>
        </div>
        <Field label="خلاصه">
          <textarea className={`${controlClass} h-20 py-2`} value={summary} onChange={(event) => setSummary(event.target.value)} />
        </Field>
        <Field label="فایل">
          <input className="text-sm" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </Field>
        <Button
          disabled={!title.trim()}
          onClick={async () => {
            const dataUrl = file ? await readFile(file) : undefined;
            onSave({
              id: uid("doc"),
              title: title.trim(),
              category,
              revision: revision.trim() || "A",
              date: todayIso(),
              size: file ? fileSize(file.size) : "—",
              author: author.trim() || "کارگاه",
              summary: summary.trim(),
              fileName: file?.name,
              dataUrl,
            });
          }}
        >
          ذخیره
        </Button>
      </div>
    </Modal>
  );
}

function PhotoModal({
  open,
  floors,
  stages,
  onClose,
  onSave,
}: {
  open: boolean;
  floors: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  onClose: () => void;
  onSave: (item: GalleryItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [floorId, setFloorId] = useState("");
  const [stageId, setStageId] = useState("");
  const [phase, setPhase] = useState<GalleryItem["phase"]>("progress");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setCaption("");
    setFloorId("");
    setStageId("");
    setPhase("progress");
    setFile(null);
  }, [open]);

  return (
    <Modal open={open} title="تصویر کارگاه" onClose={onClose}>
      <div className="space-y-3">
        <Field label="عنوان">
          <input className={controlClass} value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="توضیح">
          <textarea className={`${controlClass} h-20 py-2`} value={caption} onChange={(event) => setCaption(event.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="طبقه">
            <select className={controlClass} value={floorId} onChange={(event) => setFloorId(event.target.value)}>
              <option value="">بدون طبقه</option>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>{floor.name}</option>
              ))}
            </select>
          </Field>
          <Field label="مرحله">
            <select className={controlClass} value={stageId} onChange={(event) => setStageId(event.target.value)}>
              <option value="">بدون مرحله</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="نوع">
          <select className={controlClass} value={phase} onChange={(event) => setPhase(event.target.value as GalleryItem["phase"])}>
            <option value="progress">کارگاه</option>
            <option value="before">قبل</option>
            <option value="after">بعد</option>
          </select>
        </Field>
        <Field label="فایل تصویر">
          <input className="text-sm" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </Field>
        <Button
          disabled={!title.trim()}
          onClick={async () => {
            const src = file ? await readFile(file) : undefined;
            onSave({
              id: uid("gal"),
              title: title.trim(),
              floorId: floorId || null,
              stageId: stageId || null,
              date: todayIso(),
              caption: caption.trim(),
              seed: Math.floor(Math.random() * 40) + 1,
              pairId: null,
              phase,
              src,
            });
          }}
        >
          ذخیره
        </Button>
      </div>
    </Modal>
  );
}
