import { Pencil } from "lucide-react";
import { categories, type EventCategory } from "../../../shared/events";
export interface EventFieldsValue {
  category: EventCategory | "";
  date: string;
  title: string;
  description: string;
  location: string;
}
export function EventFields({
  value,
  onChange,
  inline = false,
  disabled = false,
}: {
  value: EventFieldsValue;
  onChange: (value: EventFieldsValue) => void;
  inline?: boolean;
  disabled?: boolean;
}) {
  const field = (
    key: "title" | "description" | "location",
    label: string,
    max: number,
  ) => (
    <label className={`editor-field field-${key}`}>
      <span className="field-label">
        {label}
        {inline && <Pencil size={13} />}
      </span>
      {key === "description" ? (
        <textarea
          required
          maxLength={max}
          rows={3}
          aria-label={label}
          disabled={disabled}
          value={value[key]}
          onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        />
      ) : (
        <input
          required
          maxLength={max}
          aria-label={label}
          disabled={disabled}
          value={value[key]}
          onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        />
      )}
    </label>
  );
  return (
    <div className={`event-fields ${inline ? "inline-fields" : ""}`}>
      <div className="fields-pair">
        <label className="editor-field">
          <span className="field-label">
            Tür{inline && <Pencil size={13} />}
          </span>
          <select
            aria-label="Tür"
            disabled={disabled}
            value={value.category}
            onChange={(e) =>
              onChange({ ...value, category: e.target.value as EventCategory })
            }
          >
            <option value="">Belirtilmemiş</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="editor-field">
          <span className="field-label">
            Tarih{inline && <Pencil size={13} />}
          </span>
          <input
            type="date"
            aria-label="Tarih"
            disabled={disabled}
            required
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
          />
        </label>
      </div>
      {field("title", "Başlık", 160)}
      {field("description", "Açıklama", 5000)}
      {field("location", "Konum", 250)}
    </div>
  );
}
