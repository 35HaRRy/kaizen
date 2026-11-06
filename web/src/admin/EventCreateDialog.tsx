import { useEffect, useState } from "react";
import { Plus, ImagePlus } from "lucide-react";
import type { EventItem, MediaItem } from "../../../shared/events";
import { Modal } from "../components/Modal";
import { apiRequest, errorMessage, uploadMedia } from "../api";
import { EventFields, type EventFieldsValue } from "./EventFields";
export function EventCreateDialog({
  onCreated,
  onClose,
  onDirtyChange,
}: {
  onCreated: (event: EventItem) => void;
  onClose: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [initial] = useState<EventFieldsValue>({
    category: "Seminerler",
    date: new Date().toISOString().slice(0, 10),
    title: "",
    description: "",
    location: "",
  });
  const [fields, setFields] = useState<EventFieldsValue>(initial),
    [file, setFile] = useState<File>(),
    [uploaded, setUploaded] = useState<MediaItem>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [committed, setCommitted] = useState<EventItem>();
  const dirty =
    !committed &&
    (JSON.stringify(fields) !== JSON.stringify(initial) || !!file || busy);
  useEffect(() => {
    onDirtyChange?.(dirty);
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => {
      window.removeEventListener("beforeunload", guard);
      onDirtyChange?.(false);
    };
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (committed) onCreated(committed);
  }, [committed, onCreated]);
  const close = () => {
    if (
      !busy &&
      (!dirty ||
        window.confirm(
          "Kaydedilmemiş etkinlik bilgileri silinecek. Kapatılsın mı?",
        ))
    )
      onClose();
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!file && !uploaded) {
      setError("Bir tanıtım görseli seçin.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const media = uploaded ?? (await uploadMedia(file!));
      setUploaded(media);
      const event = await apiRequest<EventItem>("/admin/events", {
        method: "POST",
        body: JSON.stringify({
          ...fields,
          mediaIds: [media.id],
          coverMediaId: media.id,
        }),
      });
      setCommitted(event);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Yeni Etkinlik Ekle" onClose={close}>
      <form className="admin-create" onSubmit={submit} aria-busy={busy}>
        <p className="create-intro">
          Dojo'dan yeni bir hikâye. Önce bilgileri ve kapağı ekleyin; galeriyi
          bir sonraki adımda genişletin.
        </p>
        <EventFields value={fields} disabled={busy} onChange={setFields} />
        <label className="cover-upload">
          <ImagePlus size={24} />
          <span>Tanıtım görseli</span>
          <small>{file?.name ?? "JPEG, PNG veya WebP · En fazla 10 MB"}</small>
          <input
            aria-label="Tanıtım görseli"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => {
              setFile(e.target.files?.[0]);
              setUploaded(undefined);
            }}
          />
        </label>
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        <button type="submit" className="admin-button" disabled={busy}>
          <Plus size={17} />
          {busy ? "Kaydediliyor…" : "Kaydet ve galeriyi düzenle"}
        </button>
      </form>
    </Modal>
  );
}
