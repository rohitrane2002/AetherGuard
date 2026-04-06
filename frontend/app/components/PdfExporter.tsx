import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


/**
 * Export any element as a PDF.
 * Handles Tailwind gradient colours by sanitising them for html2canvas.
 */
export async function exportPdf(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error("Telemetry context missing for report generation. Run a scan first.");
    return;
  }

  const tid = toast.loading("Synthesizing AetherGuard Security Certificate...");

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#0d1117",
      scale: 1.5, // Slightly lower scale for faster processing but still sharp
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: 1024,
      onclone: (doc) => {
        const report = doc.getElementById(elementId);
        if (report) {
          // Temporarily fix any positioning that would hide it from canvas
          report.style.position = "static";
          report.style.opacity = "1";
          report.style.left = "0";
          report.style.display = "block";
        }
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add multiple pages if height is too much
    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight, undefined, "FAST");
    pdf.save("aetherguard_audit_report.pdf");
    toast.success("Audit report ready.", { id: tid });
  } catch (err) {
    console.error("PDF Export failed:", err);
    toast.error("Report synthesis failed. Your workspace context might be too large.", { id: tid });
  }
}