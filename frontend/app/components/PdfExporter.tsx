"use client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Export any element as a PDF.
 * Handles Tailwind gradient colours by sanitising them for html2canvas.
 */
export async function exportPdf(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const sanitized = element.cloneNode(true) as HTMLElement;
  sanitized.querySelectorAll("*").forEach((el: any) => {
    // html2canvas can't do modern color() or oklab();
    const style = window.getComputedStyle(el);
    const bg = style.backgroundImage || "";
    if (bg.includes("oklab") || bg.includes("color(")) {
      (el.style as any).backgroundImage = "none";
    }
    if (style.backgroundColor.includes("oklab")) {
      (el.style as any).backgroundColor = "#111827";
    }
  });

  const canvas = await html2canvas(sanitized, {
    backgroundColor: "#0d1117",
    scale: 2,
    useCORS: true,
    allowTaint: true,
    onclone: (doc) => {
      // Hide neon background before screenshot so it's dark but not noisy
      const bg = doc.querySelector(".absolute.inset-0");
      if (bg) (bg as HTMLElement).style.display = "none";
    },
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight, undefined, "FAST");
  pdf.save("aetherguard_report.pdf");
}