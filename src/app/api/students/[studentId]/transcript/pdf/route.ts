import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

function gradeToPoint(grade: string): number {
	const g = (grade || '').toUpperCase();
	// Granular mapping per student-facing rules
	if (g === 'A1' || g.startsWith('A')) return 5.0;
	if (g === 'B2') return 4.5;
	if (g === 'B3') return 4.0;
	if (g === 'C4') return 3.5;
	if (g === 'C5') return 3.0;
	if (g === 'C6') return 2.5;
	if (g === 'D7') return 2.0;
	if (g === 'E8') return 1.0;
	return 0.0;
}

export async function GET(request: Request, context: { params: Promise<{ studentId: string }> }) {
	try {
		const { studentId } = await context.params;
		if (!studentId) return NextResponse.json({ error: 'studentId is required' }, { status: 400 });

		// Fetch student info
		const { data: student, error: sErr } = await supabase
			.from('school_students')
			.select('student_id, full_name, class_level, stream')
			.eq('student_id', studentId)
			.maybeSingle();
		if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
		if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

		// Fetch all results with names
		const { data: results, error: rErr } = await supabase
			.from('student_results')
			.select(`
				course_id, total_score, grade,
				courses:course_id (name),
				academic_sessions:session_id (name),
				academic_terms:term_id (name)
			`)
			.eq('student_id', studentId)
			.order('created_at', { ascending: true });
		if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

		// Group results by session
		const groups = new Map<string, any[]>();
		for (const rAny of results || []) {
			const r = rAny as any;
			const sess = (r.academic_sessions && r.academic_sessions.name) ? String(r.academic_sessions.name) : 'Unknown Session';
			if (!groups.has(sess)) groups.set(sess, []);
			groups.get(sess)!.push(r);
		}
		const sessions = Array.from(groups.keys());
		const graduationSession = sessions[sessions.length - 1] || '';

		// Compute overall GPA
		const allGrades = (results || []).map((r: any) => gradeToPoint(r.grade));
		const overallGpa = allGrades.length ? (allGrades.reduce((a: number, b: number) => a + b, 0) / allGrades.length) : 0;

		const pdfDoc = await PDFDocument.create();
		let page = pdfDoc.addPage([595.28, 841.89]); // A4
		const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
		const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

		// Preload logo once (prefer footer logo, fallback to standard logo)
		let logoImg: any = null;
		let logoDims: { width: number; height: number } | null = null;
		try {
			const footerLogoPath = path.join(process.cwd(), 'public', 'yano-footer-logo.png');
			const footerLogoBytes = await fs.readFile(footerLogoPath);
			const embedded = await pdfDoc.embedPng(footerLogoBytes);
			logoImg = embedded;
			const dims = embedded.scale(0.18);
			logoDims = { width: dims.width, height: dims.height };
		} catch {
			try {
				const logoPath = path.join(process.cwd(), 'public', 'yano-logo.png');
				const logoBytes = await fs.readFile(logoPath);
				const embedded2 = await pdfDoc.embedPng(logoBytes);
				logoImg = embedded2;
				const dims2 = embedded2.scale(0.2);
				logoDims = { width: dims2.width, height: dims2.height };
			} catch {
				logoImg = null;
				logoDims = null;
			}
		}

		const drawText = (text: string, x: number, y: number, size = 10, bold = false) => {
			page.drawText(text, { x, y, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) });
		};

		const drawLine = (x1: number, y1: number, x2: number, y2: number, thickness = 1) => {
			page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: rgb(0, 0, 0) });
		};

		let repeatNextTableHeader = false;

		const addNewPageIfNeeded = (needed: number, yRef: { y: number }) => {
			if (yRef.y - needed < 80) {
				page = pdfDoc.addPage([595.28, 841.89]);
				// Draw header on new page
				drawHeader(page);
				yRef.y = 760;
				// Repeat table header if we're in the middle of a section
				if (repeatNextTableHeader) {
					drawResultsTableHeader(yRef.y, yRef);
				}
			}
		};

		// Header
		const drawHeader = (p: typeof page) => {
			const titleY = 800;
			let localY = titleY;
			if (logoImg && logoDims) {
				p.drawImage(logoImg, { x: 60, y: localY - logoDims.height + 6, width: logoDims.width, height: logoDims.height });
			}
			// Title block
			p.drawText('YANO SCHOOL', { x: 220, y: localY + 6, size: 18, font: fontBold, color: rgb(0, 0, 0) });
			p.drawText('Official Academic Transcript', { x: 220, y: localY - 12, size: 12, font: font, color: rgb(0, 0, 0) });
			// Decorative line
			p.drawLine({ start: { x: 60, y: localY - 28 }, end: { x: 535, y: localY - 28 }, thickness: 1, color: rgb(0, 0, 0) });
		};

		// Results table header
		const drawResultsTableHeader = (startY: number, yRef: { y: number }) => {
			const headerY = startY - 10;
			drawText('Term', 60, headerY, 11, true);
			drawText('Course', 160, headerY, 11, true);
			drawText('Total', 420, headerY, 11, true);
			drawText('Grade', 480, headerY, 11, true);
			drawLine(60, headerY - 4, 535, headerY - 4, 1);
			yRef.y = headerY - 12;
		};

		// repeatNextTableHeader declared above

		// Header with logo and title
		drawHeader(page);
		let y = 760;

		// Student info
		drawText('Student Information', 60, y, 12, true); y -= 14;
		drawLine(60, y, 200, y, 0.5); y -= 8;
		drawText(`Name: ${student.full_name}`, 60, y); y -= 12;
		drawText(`Student ID: ${student.student_id}`, 60, y); y -= 12;
		drawText(`Class: ${student.class_level} ${student.stream || ''}`.trim(), 60, y); y -= 12;
		drawText(`Graduation Session: ${graduationSession}`, 60, y); y -= 20;

		drawLine(60, y, 535, y, 1); y -= 6;

		// Iterate sessions
		for (const sess of sessions) {
			const rows = groups.get(sess) || [];
			// Compute session GPA
			const sessGrades = rows.map((r: any) => gradeToPoint(r.grade));
			const sessGpa = sessGrades.length ? (sessGrades.reduce((a: number, b: number) => a + b, 0) / sessGrades.length) : 0;

			addNewPageIfNeeded(80, { y });
			drawText(`${sess}`, 60, y, 12, true); y -= 6;
			drawResultsTableHeader(y, { y });
			repeatNextTableHeader = true;

			for (const rAny of rows) {
				const r = rAny as any;
				addNewPageIfNeeded(18, { y });
				drawText((r.academic_terms && r.academic_terms.name) ? String(r.academic_terms.name) : '', 60, y);
				drawText(String((r.courses && r.courses.name ? r.courses.name : r.course_id) || '').slice(0, 64), 160, y);
				drawText(String(r.total_score ?? ''), 420, y);
				drawText(String(r.grade || ''), 480, y);
				y -= 14;
			}

			// Session summary line
			addNewPageIfNeeded(22, { y });
			drawLine(60, y, 535, y, 0.5); y -= 10;
			drawText(`Session GPA: ${sessGpa.toFixed(2)}`, 60, y, 11, true); y -= 14;
		}

		// Academic summary card
		addNewPageIfNeeded(140, { y });
		drawLine(60, y, 535, y, 1); y -= 8;
		drawText('Academic Summary', 60, y, 12, true); y -= 12;
		const totalCourses = (results || []).length;
		const sessionsCount = sessions.length;
		const bestSessionGpa = sessions.reduce((best, s) => {
			const rows = groups.get(s) || [];
			const pts = rows.map((r: any) => gradeToPoint(r.grade));
			const g = pts.length ? pts.reduce((a: number, b: number) => a + b, 0) / pts.length : 0;
			return Math.max(best, g);
		}, 0);
		drawText(`Overall CGPA: ${overallGpa.toFixed(2)}`, 60, y); y -= 12;
		drawText(`Total Courses: ${totalCourses}`, 60, y); y -= 12;
		drawText(`Sessions Attended: ${sessionsCount}`, 60, y); y -= 12;
		drawText(`Best Session GPA: ${bestSessionGpa.toFixed(2)}`, 60, y); y -= 18;

		// Signatures
		addNewPageIfNeeded(80, { y });
		drawText('Signatures', 60, y, 12, true); y -= 12;
		drawLine(60, y, 535, y, 0.5); y -= 18;
		drawLine(60, y, 240, y, 0.5); drawText('Registrar', 60, y - 12, 10); 
		drawLine(300, y, 535, y, 0.5); drawText('Principal / Head Teacher', 300, y - 12, 10);
		y -= 34;
		drawText('This document is official only when printed on authorized letterhead or accompanied by a school seal.', 60, y, 9);
		y -= 14;

		// Footer: page numbers and timestamp on every page
		const pages = pdfDoc.getPages();
		const total = pages.length;
		const generatedAt = new Date().toLocaleString();
		pages.forEach((pg, idx) => {
			const footerY = 40;
			pg.drawLine({ start: { x: 60, y: footerY + 16 }, end: { x: 535, y: footerY + 16 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });
			pg.drawText(`Yano School • ${generatedAt}`, { x: 60, y: footerY, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
			pg.drawText(`Page ${idx + 1} of ${total}`, { x: 480, y: footerY, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
		});

		const pdfBytes = await pdfDoc.save();
		return new NextResponse(Buffer.from(pdfBytes), {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `inline; filename="${studentId}-transcript.pdf"`
			}
		});
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 });
	}
} 