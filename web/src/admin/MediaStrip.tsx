import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Crosshair, Star, Trash2, Plus } from "lucide-react";
import type { MediaItem } from "../../../shared/events";
import { MediaThumbnail } from "../components/EventGallery";
interface Props {
  media: MediaItem[];
  coverId: string | null;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onChange: (media: MediaItem[], coverId: string | null) => void;
  onUpload: (files: File[]) => void;
  busy: boolean;
}
export function MediaStrip(props: Props) {
  const [active, setActive] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const dragged = props.media.find((m) => m.id === active);
  return (
    <div className="admin-media-area">
      <p className="media-help">
        Kapağı yıldızla seçin; taşımak için tutamacı sürükleyin veya boşluk ve
        ok tuşlarını kullanın.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActive(String(e.active.id))}
        onDragCancel={() => setActive(null)}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id)
            props.onChange(
              arrayMove(
                props.media,
                props.media.findIndex((m) => m.id === active.id),
                props.media.findIndex((m) => m.id === over.id),
              ),
              props.coverId,
            );
          setActive(null);
        }}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "Taşımak için boşluk tuşuna basın. Ok tuşlarıyla yer değiştirin. Bırakmak için boşluk, iptal etmek için Escape tuşuna basın.",
          },
        }}
      >
        <SortableContext
          items={props.media.map((m) => m.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="admin-media-strip" aria-label="Galeri sırası">
            {props.media.map((media) => (
              <SortableMedia key={media.id} {...props} item={media} />
            ))}
            <label className={`upload-tile ${props.busy ? "is-disabled" : ""}`}>
              <Plus size={25} />
              <span>{props.busy ? "Yükleniyor…" : "Görsel ekle"}</span>
              <input
                type="file"
                aria-label="Görsel ekle"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                multiple
                disabled={props.busy || props.media.length >= 50}
                onChange={(e) => {
                  props.onUpload(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </SortableContext>
        <DragOverlay>
          {dragged ? (
            <div className="drag-preview">
              <MediaThumbnail media={dragged} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
function SortableMedia(props: Props & { item: MediaItem }) {
  const { item } = props;
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: item.id, disabled: props.busy });
  const cover = props.coverId === item.id;
  return (
    <div
      ref={setNodeRef}
      className={`admin-media-item ${isDragging ? "is-dragging" : ""} ${isOver ? "is-over" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        className="media-select"
        type="button"
        aria-label={`${item.originalName} seç`}
        aria-pressed={props.selectedId === item.id}
        onClick={() => props.onSelect(item.id)}
      >
        <MediaThumbnail media={item} />
      </button>
      {cover && <span className="cover-label">Kapak</span>}
      <div className="media-actions">
        {item.kind === "image" && (
          <button
            type="button"
            aria-label={`${item.originalName} kapak`}
            disabled={cover || props.busy}
            title={cover ? undefined : "Tanıtım görseli olarak seç"}
            onClick={() => props.onChange(props.media, item.id)}
          >
            <Star size={15} fill={cover ? "currentColor" : "none"} />
          </button>
        )}
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="drag-handle"
          aria-label={`${item.originalName} sırala`}
          title="Sıralamak için sürükle"
          disabled={props.busy}
        >
          <Crosshair size={15} />
        </button>
        <button
          type="button"
          aria-label={`${item.originalName} galeriden kaldır`}
          title="Galeriden kaldır"
          disabled={props.busy}
          onClick={() => {
            const remaining = props.media.filter((m) => m.id !== item.id);
            props.onChange(
              remaining,
              cover
                ? (remaining.find((m) => m.kind === "image")?.id ?? null)
                : props.coverId,
            );
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
