import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(_: Request, { params }: { params: Promise<{ receiptNo: string }> }) {
  try {
    const { receiptNo } = await params;
    const { data, error } = await supabase
      .from('receipts')
      .select('receipt_no, student_id, amount, method, issued_at')
      .eq('receipt_no', receiptNo)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const drawText = (text: string, x: number, y: number, size = 12, bold = false) => {
      page.drawText(text, { x, y, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) });
    };

    let y = 800;
    drawText('Payment Receipt', 220, y, 18, true); y -= 30;
    drawText(`Receipt No: ${data.receipt_no}`, 60, y, 12, true); y -= 20;
    drawText(`Student ID: ${data.student_id}`, 60, y); y -= 20;
    drawText(`Amount: ₦${Number(data.amount).toLocaleString()}`, 60, y); y -= 20;
    drawText(`Method: ${data.method}`, 60, y); y -= 20;
    drawText(`Issued: ${new Date(data.issued_at).toLocaleString()}`, 60, y);

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${receiptNo}.pdf"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}








