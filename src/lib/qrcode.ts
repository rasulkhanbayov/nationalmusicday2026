import QRCode from "qrcode";

/**
 * Generates a QR code as a PNG data URL encoding the given text (the ticket id).
 * Used for both the email/HTML and the PDF ticket.
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: {
      dark: "#0a1733", // navy
      light: "#ffffff",
    },
  });
}

/** Generates a QR code as a raw PNG Buffer (useful for email inline attachments). */
export async function generateQrBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#0a1733", light: "#ffffff" },
  });
}
