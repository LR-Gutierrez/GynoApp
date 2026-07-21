import { Injectable, inject } from '@angular/core';
import { Consultation } from 'src/app/shared/models/patient.model';
import { DigitalSignatureService } from './digital-signature.service';

const SIG_BEGIN = '%%GYNOAPP_SIG_START';
const SIG_END = '%%GYNOAPP_SIG_END';

@Injectable({ providedIn: 'root' })
export class RecetaPdfService {

  private sig = inject(DigitalSignatureService);

  async generate(consultation: Consultation, patientName: string): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    doc.setProperties({ title: `Receta - ${patientName} - ${consultation.date}` });

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentW = pageW - margin * 2;

    // Header
    doc.setFillColor(15, 82, 186);
    doc.rect(0, 0, pageW, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RECETA MÉDICA', pageW / 2, 16, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('GynoApp', pageW / 2, 24, { align: 'center' });

    // Info section
    let y = 42;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Paciente:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(patientName, margin + 28, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', margin + 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(consultation.date, margin + 130, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Motivo:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(consultation.motivo, margin + 28, y);

    // Divider
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);

    // Receta content
    y += 12;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Indicaciones:', margin, y);

    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const text = consultation.receta || '';
    const lines = doc.splitTextToSize(text, contentW);
    doc.text(lines, margin, y);

    y += lines.length * 5 + 20;

    // Watermark — diagonal "GynoApp" across the page
    doc.saveGraphicsState();
    doc.setGState(doc.GState({ opacity: 0.08 }));
    doc.setFontSize(48);
    doc.setTextColor(15, 82, 186);
    doc.setFont('helvetica', 'bold');
    for (let x = -pageW; x < pageW * 2; x += 120) {
      for (let yy = -50; yy < 350; yy += 100) {
        doc.text('GynoApp', x, yy, { angle: 45 });
      }
    }
    doc.restoreGraphicsState();

    // Signature area
    if (y > 250) y = 250;
    doc.line(margin, y, margin + 60, y);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Firma del médico', margin, y + 5);

    // Verification ID
    const verifyId = `GYNC-${consultation.date.replace(/-/g, '')}-${consultation.id.slice(0, 8).toUpperCase()}`;
    doc.setFontSize(6);
    doc.setTextColor(180, 180, 180);
    doc.text(`ID: ${verifyId}`, pageW / 2, 260, { align: 'center' });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(
      'Documento generado por GynoApp — Los datos clínicos son responsabilidad del profesional.',
      pageW / 2,
      272,
      { align: 'center' }
    );

    // ── Firma digital ──────────────────────────────────────────────────────
    const fp = await this.sig.getFingerprint();
    const pubKeyB64 = await this.sig.getPublicKeyB64();
    const rawBytes = doc.output('arraybuffer');
    const contentHash = await crypto.subtle.digest('SHA-256', rawBytes);
    const contentHashB64 = btoa(String.fromCharCode(...new Uint8Array(contentHash)));
    const sigB64 = await this.sig.sign(new Uint8Array(rawBytes));

    const sigBlock = [
      SIG_BEGIN,
      JSON.stringify({
        fingerprint: fp,
        publicKey: pubKeyB64,
        contentHash: contentHashB64,
        signature: sigB64,
        timestamp: new Date().toISOString(),
        docId: verifyId,
        version: 1,
      }),
      SIG_END,
    ].join('\n');

    const pdfBytes = new Uint8Array(rawBytes.byteLength + sigBlock.length + 1);
    pdfBytes.set(new Uint8Array(rawBytes), 0);
    pdfBytes.set(new TextEncoder().encode('\n' + sigBlock), rawBytes.byteLength);

    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  async verifyPdf(pdfBytes: Uint8Array): Promise<{
    valid: boolean;
    error?: string;
    data?: Record<string, unknown>;
  }> {
    const text = new TextDecoder().decode(pdfBytes);
    const startIdx = text.lastIndexOf(SIG_BEGIN);
    const endIdx = text.lastIndexOf(SIG_END);
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      return { valid: false, error: 'No se encontró bloque de firma digital' };
    }

    try {
      const contentBytes = new TextEncoder().encode(text.slice(0, startIdx));
      const jsonStr = text.slice(startIdx + SIG_BEGIN.length, endIdx);
      const data = JSON.parse(jsonStr) as Record<string, unknown>;

      const pubKeyB64 = data['publicKey'] as string;
      const signature = data['signature'] as string;
      if (!pubKeyB64 || !signature) {
        return { valid: false, error: 'Bloque de firma incompleto', data };
      }

      const valid = await this.sig.verify(contentBytes, signature, pubKeyB64);
      return { valid, data };
    } catch {
      return { valid: false, error: 'Error al verificar la firma digital' };
    }
  }
}
