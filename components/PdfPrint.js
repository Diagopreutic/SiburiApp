// lib/pdf.js
let html2pdfPromise = null;

export const getHtml2Pdf = () => {
  if (typeof window === 'undefined') return null;

  if (!html2pdfPromise) {
    html2pdfPromise = import('html2pdf.js');
  }
  return html2pdfPromise;
};