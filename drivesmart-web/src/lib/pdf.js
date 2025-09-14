// src/lib/pdf.js
// Helper to export a DOM node (our SVG log sheet) to a single-page PDF.

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Export a given HTMLElement (e.g., a wrapper around <LogSheet/>) to PDF.
 * Renders the node to a high-DPI canvas via html2canvas, then inserts it into a landscape A4 PDF.
 *
 * @param {HTMLElement} element - The DOM node to render (e.g., a <div> that contains the SVG).
 * @param {Object} options
 * @param {string} [options.filename="ELD-Log.pdf"] - Output filename.
 * @param {number} [options.margin=24] - Margin in PDF points (1pt = 1/72 inch).
 * @param {"a4"|"letter"} [options.format="a4"] - PDF page format.
 * @returns {Promise<void>}
 */
export async function exportElementToPDF(element, {
  filename = "ELD-Log.pdf",
  margin = 24,
  format = "a4",
} = {}) {
  if (!element) throw new Error("exportElementToPDF: element is required");

  // Render DOM → Canvas (transparent bg to respect your theme)
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,             // higher scale for sharper output
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format,               // 'a4' or 'letter'
    compress: true,
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Fit image within page with margins, preserving aspect ratio
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const imgW = canvas.width;
  const imgH = canvas.height;
  const imgRatio = imgW / imgH;

  let renderW = maxW;
  let renderH = renderW / imgRatio;
  if (renderH > maxH) {
    renderH = maxH;
    renderW = renderH * imgRatio;
  }

  const x = (pageW - renderW) / 2;
  const y = (pageH - renderH) / 2;

  pdf.addImage(imgData, "PNG", x, y, renderW, renderH, undefined, "FAST");
  pdf.save(filename);
}

/**
 * Convenience: find the element by id and export.
 * You’ll set the id on your LogSheet wrapper, e.g. id={`logsheet-day-${day.day}`}
 */
export async function exportByIdToPDF(id, {
  filename = "ELD-Log.pdf",
  margin = 24,
  format = "a4",
} = {}) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`exportByIdToPDF: element #${id} not found`);
  await exportElementToPDF(el, { filename, margin, format });
}
