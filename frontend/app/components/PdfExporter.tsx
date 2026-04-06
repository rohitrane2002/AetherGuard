"use client";

import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Export any element as a PDF with enterprise-grade reliability.
 */
export async function exportPdf(elementId: string) {
  console.log("[PdfExporter] Triggered for ID:", elementId);
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error("[PdfExporter] Element not found:", elementId);
    toast.error("Dashboard context not detected. Run a security scan first.");
    return;
  }

  // Check if it has content (to avoid hanging on empty divs)
  if (!element.textContent?.trim() && element.children.length === 0) {
     toast.error("Report intelligence is still being synthesized. Wait a moment.");
     return;
  }

  const tid = toast.loading("Synthesizing AetherGuard Security Certificate...");

  try {
    // Ensure the element is visible for capture
    const originalStyle = element.style.cssText;
    
    const canvas = await html2canvas(element, {
      backgroundColor: "#020617",
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: false, // Prevents tainted canvas errors from external assets
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          clonedElement.style.opacity = "1";
          clonedElement.style.visibility = "visible";
          clonedElement.style.position = "static";
          clonedElement.style.display = "block";
        }
      }
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate how many pages we need
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    // Add subsequent pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }
    
    pdf.save(`AETHER_AUDIT_${new Date().getTime()}.pdf`);

    toast.success("Enterprise security certificate generated.", { id: tid });

  } catch (err) {
    console.error("[PdfExporter] Critical failure:", err);
    toast.error("Audit synthesis failed. Use the 'Copy Fix' instead for now.", { id: tid });
  }
}