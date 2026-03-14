import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface PdfSection {
  id: string;
  label: string;
}

export interface PdfExportOptions {
  filename: string;
  title: string;
  subtitle: string;
  sections: PdfSection[];
  onProgress?: (label: string) => void;
}

const PAGE_W  = 210;
const PAGE_H  = 297;
const MARGIN  = 14;
const CONTENT = PAGE_W - MARGIN * 2;

/* ─────────────────────────────────────────────────────────────
   oklch → rgb polyfill for html2canvas
   html2canvas v1 cannot parse oklch() colors (Tailwind v4 default).
   We fix this by walking every element in the original subtree,
   reading browser-resolved computed styles (already RGB), and
   stamping them as inline styles on the cloned counterparts
   before html2canvas parses any CSS.
───────────────────────────────────────────────────────────── */

// Properties that may contain oklch values in Tailwind v4
const COLOR_PROPS_HTML = [
  "color",
  "background-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "caret-color",
  "column-rule-color",
  "accent-color",
  "fill",
  "stroke",
  "stop-color",
] as const;

/**
 * Recursively walk orig ↔ clone trees and copy browser-resolved
 * color values as inline styles, eliminating raw oklch references.
 */
function patchOklch(orig: Element, clone: Element): void {
  if (orig instanceof HTMLElement && clone instanceof HTMLElement) {
    const cs = window.getComputedStyle(orig);
    for (const prop of COLOR_PROPS_HTML) {
      const val = cs.getPropertyValue(prop);
      // Skip transparent / empty / already-rgb is fine too
      if (val && val.trim() !== "") {
        clone.style.setProperty(prop, val, "important");
      }
    }
    // Also clear box-shadow (often uses oklch vars)
    clone.style.setProperty("box-shadow", "none", "important");
  }

  // Recurse into children
  const origChildren  = Array.from(orig.children);
  const cloneChildren = Array.from(clone.children);
  const len = Math.min(origChildren.length, cloneChildren.length);
  for (let i = 0; i < len; i++) {
    patchOklch(origChildren[i], cloneChildren[i]);
  }
}

/* ─────────────────────────────────────────────────────────────
   PDF helpers
───────────────────────────────────────────────────────────── */

function drawHeader(
  pdf: jsPDF,
  title: string,
  subtitle: string,
  dateStr: string,
): number {
  pdf.setFillColor(17, 24, 39);
  pdf.rect(MARGIN, 10, CONTENT, 18, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("NEXA", MARGIN + 5, 21.5);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(title, MARGIN + 22, 21.5);

  const dw = pdf.getTextWidth(dateStr);
  pdf.text(dateStr, PAGE_W - MARGIN - 5 - dw, 21.5);

  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(7.5);
  pdf.text(subtitle, MARGIN, 36);

  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, 39, PAGE_W - MARGIN, 39);

  return 45;
}

function drawSectionLabel(pdf: jsPDF, label: string, cursorY: number): number {
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.text(label.toUpperCase(), MARGIN, cursorY);

  pdf.setDrawColor(243, 244, 246);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN, cursorY + 2, PAGE_W - MARGIN, cursorY + 2);

  return cursorY + 7;
}

function drawFooters(pdf: jsPDF, dateStr: string): void {
  const total = pdf.getNumberOfPages();
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setTextColor(156, 163, 175);
    pdf.text(`NEXA Admin · Generado el ${dateStr}`, MARGIN, PAGE_H - 7);
    const pn = `Pág. ${i} / ${total}`;
    pdf.text(pn, PAGE_W - MARGIN - pdf.getTextWidth(pn), PAGE_H - 7);
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10);
  }
}

/* ─────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────── */
export async function exportToPdf(opts: PdfExportOptions): Promise<void> {
  const { filename, title, subtitle, sections, onProgress } = opts;

  const dateStr = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let cursorY = drawHeader(pdf, title, subtitle, dateStr);

  for (const section of sections) {
    const origEl = document.getElementById(section.id);
    if (!origEl) continue;

    onProgress?.(section.label);

    if (cursorY > PAGE_H - 50) {
      pdf.addPage();
      cursorY = 20;
    }
    cursorY = drawSectionLabel(pdf, section.label, cursorY);

    const canvas = await html2canvas(origEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (_clonedDoc, clonedEl) => {
        // Patch every element: replace oklch vars with resolved RGB values
        patchOklch(origEl, clonedEl);
      },
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    const imgH    = (canvas.height / canvas.width) * CONTENT;

    if (cursorY + imgH > PAGE_H - 15) {
      pdf.addPage();
      cursorY = 20;
    }

    pdf.addImage(imgData, "PNG", MARGIN, cursorY, CONTENT, imgH);
    cursorY += imgH + 10;
  }

  drawFooters(pdf, dateStr);
  pdf.save(filename);
}
