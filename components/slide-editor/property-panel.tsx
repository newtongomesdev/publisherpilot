"use client";

import { useSlideEditorStore } from "@/lib/slide-editor/store";
import { useState } from "react";

const FONT_CATEGORIES = {
  "Sans Serif": ["Inter", "Roboto", "Open Sans", "Montserrat", "Poppins", "Raleway", "Lato", "Nunito", "Work Sans", "DM Sans", "Outfit", "Manrope", "Space Grotesk", "Albert Sans", "Plus Jakarta Sans", "Urbanist"],
  "Serif": ["Playfair Display", "Merriweather", "Lora", "PT Serif", "EB Garamond", "Libre Baskerville", "Cormorant Garamond", "Bitter", "Crimson Text", "DM Serif Display", "Fraunces", "Newsreader"],
  "Display": ["Anton", "Bebas Neue", "Oswald", "Righteous", "Permanent Marker", "Lilita One", "Passion One", "Ultra", "Abril Fatface", "Fredoka One", "Pacifico", "Lobster"],
  "Monospace": ["JetBrains Mono", "Fira Code", "Source Code Pro", "IBM Plex Mono", "Space Mono", "Roboto Mono", "PT Mono"],
  "Handwriting": ["Caveat", "Dancing Script", "Satisfy", "Great Vibes", "Sacramento", "Kalam", "Architects Daughter"],
};

const loadedFonts = new Set<string>();

function loadGoogleFont(fontFamily: string) {
  if (loadedFonts.has(fontFamily) || typeof document === "undefined") return;
  loadedFonts.add(fontFamily);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

const ALL_FONTS = Object.values(FONT_CATEGORIES).flat();

export function PropertyPanel() {
  const { slides, activeSlideIndex, activeElementId, updateElement, removeElement } =
    useSlideEditorStore();
  const slide = slides[activeSlideIndex];
  const element = slide?.elements.find((el) => el.id === activeElementId);

  if (!element) {
    return (
      <div className="w-56 bg-zinc-900 border-l border-zinc-800 p-3 overflow-y-auto shrink-0">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
          Propriedades
        </h3>
        <p className="text-xs text-zinc-600">Selecione um elemento para editar</p>
      </div>
    );
  }

  const update = (key: string, value: unknown) => {
    if (activeElementId) {
      updateElement(activeSlideIndex, activeElementId, { [key]: value });
    }
  };

  return (
    <div className="w-56 bg-zinc-900 border-l border-zinc-800 p-3 overflow-y-auto shrink-0">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
        Propriedades
      </h3>
      <div className="mb-3">
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 rounded">
          {element.type}
        </span>
      </div>

      {"text" in element.props && (
        <Field label="Texto">
          <textarea
            value={element.props.text}
            onChange={(e) => update("text", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100 resize-y min-h-[60px]"
          />
        </Field>
      )}

      {"value" in element.props && element.type === "stat" && (
        <Field label="Valor">
          <input
            type="text"
            value={element.props.value}
            onChange={(e) => update("value", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100"
          />
        </Field>
      )}

      {"fontSize" in element.props && (
        <Field label={`Tamanho: ${element.props.fontSize}px`}>
          <input
            type="range"
            min={12}
            max={400}
            value={element.props.fontSize}
            onChange={(e) => update("fontSize", Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </Field>
      )}

      {"color" in element.props && (
        <Field label="Cor">
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={element.props.color}
              onChange={(e) => update("color", e.target.value)}
              className="w-8 h-8 rounded border border-zinc-700 cursor-pointer"
            />
            <input
              type="text"
              value={element.props.color}
              onChange={(e) => update("color", e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100 font-mono"
            />
          </div>
        </Field>
      )}

      {"fontFamily" in element.props && (
        <Field label="Fonte">
          <select
            value={element.props.fontFamily}
            onChange={(e) => {
              update("fontFamily", e.target.value);
              loadGoogleFont(e.target.value);
            }}
            onFocus={() => {
              // Preload all fonts on focus for faster preview
              ALL_FONTS.forEach(loadGoogleFont);
            }}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100 max-h-40 overflow-y-auto"
          >
            {Object.entries(FONT_CATEGORIES).map(([category, fonts]) => (
              <optgroup key={category} label={category}>
                {fonts.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </optgroup>
            ))}
            <optgroup label="Sistema">
              <option value="system-ui">System UI</option>
              <option value="Georgia">Georgia</option>
              <option value="monospace">Monospace</option>
            </optgroup>
          </select>
        </Field>
      )}

      {"fontWeight" in element.props && (
        <Field label={`Peso: ${element.props.fontWeight}`}>
          <input
            type="range"
            min={100}
            max={900}
            step={100}
            value={element.props.fontWeight}
            onChange={(e) => update("fontWeight", Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </Field>
      )}

      {"lineHeight" in element.props && (
        <Field label={`Altura da linha: ${element.props.lineHeight}`}>
          <input
            type="range"
            min={0.8}
            max={2}
            step={0.05}
            value={element.props.lineHeight}
            onChange={(e) => update("lineHeight", Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </Field>
      )}

      {"letterSpacing" in element.props && (
        <Field label={`Espaçamento: ${element.props.letterSpacing}px`}>
          <input
            type="range"
            min={-5}
            max={20}
            step={0.5}
            value={element.props.letterSpacing}
            onChange={(e) => update("letterSpacing", Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </Field>
      )}

      {"textTransform" in element.props && (
        <Field label="Transformação">
          <select
            value={element.props.textTransform}
            onChange={(e) => update("textTransform", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100"
          >
            <option value="none">Normal</option>
            <option value="uppercase">MAIÚSCULO</option>
            <option value="lowercase">minúsculo</option>
          </select>
        </Field>
      )}

      {"objectFit" in element.props && (
        <Field label="Ajuste da imagem">
          <select
            value={element.props.objectFit}
            onChange={(e) => update("objectFit", e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100"
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </select>
        </Field>
      )}

      {"opacity" in element.props && (
        <Field label={`Opacidade: ${Math.round(element.props.opacity * 100)}%`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={element.props.opacity}
            onChange={(e) => update("opacity", Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </Field>
      )}

      {/* Text Shadow Controls */}
      {"fontFamily" in element.props && (
        <ShadowControl element={element} update={update} />
      )}

      <div className="mt-4 pt-4 border-t border-zinc-800">
        <button
          onClick={() => activeElementId && removeElement(activeSlideIndex, activeElementId)}
          className="w-full px-3 py-2 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
        >
          Remover Elemento
        </button>
      </div>
    </div>
  );
}

const SHADOW_PRESETS = [
  { label: "Nenhuma", value: "" },
  { label: "Leve", value: "0 2px 8px rgba(0,0,0,0.3)" },
  { label: "Média", value: "0 4px 16px rgba(0,0,0,0.5)" },
  { label: "Forte", value: "0 6px 24px rgba(0,0,0,0.7)" },
  { label: "Neon", value: "0 0 20px currentColor, 0 0 40px currentColor" },
  { label: "Brilho", value: "0 0 10px rgba(255,255,255,0.8)" },
  { label: "Dupla", value: "0 2px 0 #000, 0 4px 16px rgba(0,0,0,0.5)" },
  { label: "Outline", value: "0 0 0 3px rgba(0,0,0,0.8)" },
];

function parseShadow(value: string | undefined) {
  if (!value) return { enabled: false, preset: "", x: 0, y: 4, blur: 16, color: "#000000", opacity: 0.5 };
  // Check presets
  const presetMatch = SHADOW_PRESETS.find((p) => p.value === value);
  if (presetMatch) return { enabled: true, preset: value, x: 0, y: 4, blur: 16, color: "#000000", opacity: 0.5 };
  // Parse custom: "Xpx Ypx Bpx rgba(R,G,B,A)"
  const m = value.match(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*(rgba?\(.+?\))?/);
  if (m) {
    const r = parseInt(m[4]?.match(/\d+/g)?.[0] || "0");
    const g = parseInt(m[4]?.match(/\d+/g)?.[1] || "0");
    const b = parseInt(m[4]?.match(/\d+/g)?.[2] || "0");
    const a = parseFloat(m[4]?.match(/[\d.]+(?=\))/)?.[0] || "1");
    return { enabled: true, preset: "custom", x: parseFloat(m[1]), y: parseFloat(m[2]), blur: parseFloat(m[3]), color: `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`, opacity: a };
  }
  return { enabled: true, preset: "custom", x: 0, y: 4, blur: 16, color: "#000000", opacity: 0.5 };
}

function buildShadow(enabled: boolean, preset: string, x: number, y: number, blur: number, color: string, opacity: number): string {
  if (!enabled || preset === "") return "";
  if (preset !== "custom" && SHADOW_PRESETS.find((p) => p.value === preset)) {
    return preset;
  }
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `${x}px ${y}px ${blur}px rgba(${r},${g},${b},${opacity})`;
}

function ShadowControl({ element, update }: { element: any; update: (k: string, v: unknown) => void }) {
  const shadow = parseShadow(element.props.textShadow);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] text-zinc-400 font-semibold">Sombra</label>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {expanded ? "▲ menos" : "▼ mais"}
        </button>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={shadow.enabled}
            onChange={(e) => {
              if (e.target.checked) {
                update("textShadow", buildShadow(true, "0 4px 16px rgba(0,0,0,0.5)", 0, 4, 16, "#000000", 0.5));
              } else {
                update("textShadow", "");
              }
            }}
            className="sr-only peer"
          />
          <div className="w-7 h-3.5 bg-zinc-700 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-emerald-600" />
        </label>
        <span className="text-[10px] text-zinc-500">
          {shadow.enabled ? "Ativada" : "Desativada"}
        </span>
      </div>
      {expanded && shadow.enabled && (
        <>
          <Field label="Predefinição">
            <select
              value={shadow.preset}
              onChange={(e) => {
                const val = e.target.value;
                update("textShadow", buildShadow(true, val, shadow.x, shadow.y, shadow.blur, shadow.color, shadow.opacity));
              }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100"
            >
              <option value="custom">Personalizado</option>
              {SHADOW_PRESETS.filter((p) => p.value !== "").map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Field>
          <Field label={`X: ${shadow.x}px`}>
            <input
              type="range" min={-20} max={20} step={1} value={shadow.x}
              onChange={(e) => update("textShadow", buildShadow(true, "custom", Number(e.target.value), shadow.y, shadow.blur, shadow.color, shadow.opacity))}
              className="w-full accent-emerald-500"
            />
          </Field>
          <Field label={`Y: ${shadow.y}px`}>
            <input
              type="range" min={-20} max={20} step={1} value={shadow.y}
              onChange={(e) => update("textShadow", buildShadow(true, "custom", shadow.x, Number(e.target.value), shadow.blur, shadow.color, shadow.opacity))}
              className="w-full accent-emerald-500"
            />
          </Field>
          <Field label={`Blur: ${shadow.blur}px`}>
            <input
              type="range" min={0} max={50} step={1} value={shadow.blur}
              onChange={(e) => update("textShadow", buildShadow(true, "custom", shadow.x, shadow.y, Number(e.target.value), shadow.color, shadow.opacity))}
              className="w-full accent-emerald-500"
            />
          </Field>
          <Field label={`Opacidade: ${Math.round(shadow.opacity * 100)}%`}>
            <input
              type="range" min={0} max={1} step={0.05} value={shadow.opacity}
              onChange={(e) => update("textShadow", buildShadow(true, "custom", shadow.x, shadow.y, shadow.blur, shadow.color, Number(e.target.value)))}
              className="w-full accent-emerald-500"
            />
          </Field>
          <Field label="Cor da Sombra">
            <div className="flex gap-2 items-center">
              <input
                type="color" value={shadow.color}
                onChange={(e) => update("textShadow", buildShadow(true, "custom", shadow.x, shadow.y, shadow.blur, e.target.value, shadow.opacity))}
                className="w-8 h-8 rounded border border-zinc-700 cursor-pointer"
              />
              <input
                type="text" value={shadow.color}
                onChange={(e) => update("textShadow", buildShadow(true, "custom", shadow.x, shadow.y, shadow.blur, e.target.value, shadow.opacity))}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100 font-mono"
              />
            </div>
          </Field>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] text-zinc-400 mb-1 font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}
