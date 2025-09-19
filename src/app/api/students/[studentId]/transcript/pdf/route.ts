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
			.select('student_id, full_name, class_level, stream, profile_image_url')
			.eq('student_id', studentId)
			.maybeSingle();
		if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
		if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

		// Fetch all results with names (no credits weighting needed)
		let results: any[] | null = null;
		{
			const { data, error } = await supabase
				.from('student_results')
				.select(`
					course_id, total_score, grade,
					courses:course_id (name, code),
					academic_sessions:session_id (name),
					academic_terms:term_id (name)
				`)
				.eq('student_id', studentId)
				.order('created_at', { ascending: true });
			if (error) {
				return NextResponse.json({ error: error.message }, { status: 500 });
			} else {
				results = data as any[];
			}
		}

		// Group results by session and term
		const groups = new Map<string, any[]>();
		for (const rAny of results || []) {
			const r = rAny as any;
			const sess = (r.academic_sessions && r.academic_sessions.name) ? String(r.academic_sessions.name) : 'Unknown Session';
			const term = (r.academic_terms && r.academic_terms.name) ? String(r.academic_terms.name) : 'Unknown Term';
			const key = `${sess} – ${term}`; // en dash for nicer typography
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key)!.push(r);
		}
		const sessionTermKeys = Array.from(groups.keys());
		const lastKey = sessionTermKeys[sessionTermKeys.length - 1] || '';
		const graduationSession = lastKey.split(' – ')[0] || '';

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
			const footerLogoPath = path.join(process.cwd(), 'public', 'images', 'yano-logo.png');
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

		// Preload student photo if available
		let studentPhotoImg: any = null;
		try {
			const url = (student as any)?.profile_image_url as string | undefined;
			if (url) {
				const resp = await fetch(url);
				const bytes = new Uint8Array(await resp.arrayBuffer());
				// Try JPG then PNG
				try {
					studentPhotoImg = await pdfDoc.embedJpg(bytes);
				} catch {
					try {
						studentPhotoImg = await pdfDoc.embedPng(bytes);
					} catch {}
				}
			}
		} catch {}

		const drawText = (text: string, x: number, y: number, size = 10, bold = false) => {
			page.drawText(text, { x, y, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) });
		};

		const drawLine = (x1: number, y1: number, x2: number, y2: number, thickness = 1) => {
			page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: rgb(0, 0, 0) });
		};

		let repeatNextTableHeader = false;

		const addNewPageIfNeeded = (needed: number, currentY: number): number => {
			if (currentY - needed < 100) {
				page = pdfDoc.addPage([595.28, 841.89]);
				// Do NOT draw the full header on subsequent pages; continue content
				let newY = 770; // top margin for content on new pages
				if (repeatNextTableHeader) {
					newY = drawResultsTableHeader(newY);
				}
				return newY;
			}
			return currentY;
		};

		// Header
		const drawHeader = (p: typeof page) => {
			const titleY = 800;
			let localY = titleY;
			
			// School address - TOP LEFT (updated)
			p.drawText('YANO SCHOOL', { x: 60, y: localY + 20, size: 10, font: fontBold, color: rgb(0, 0, 0) });
			p.drawText('peace estate Igbo Olomu Rd Ikorodu', { x: 60, y: localY + 6, size: 9, font: font, color: rgb(0, 0, 0) });
			
			// Logo - MIDDLE TOP (centered, smaller)
			if (logoImg) {
				const displayW = 60;
				const displayH = 60;
				p.drawImage(logoImg, { x: (595.28 - displayW) / 2, y: localY - 10, width: displayW, height: displayH });
			}
			
			// From the office of the principal + contact info - TOP RIGHT (pushed right)
			p.drawText('From the Office of the Principal', { x: 410, y: localY + 20, size: 10, font: fontBold, color: rgb(0, 0, 0) });
			p.drawText('Phone: +23480 333 90 882', { x: 410, y: localY + 8, size: 9, font: font, color: rgb(0, 0, 0) });
			p.drawText('Email: yanocon@yahoo.com', { x: 410, y: localY - 4, size: 9, font: font, color: rgb(0, 0, 0) });
			
			// School name - BELOW LOGO (centered)
			p.drawText('YANO SCHOOL', { x: 220, y: localY - 45, size: 18, font: fontBold, color: rgb(0, 0, 0) });
			// Motto centered under title (smaller)
			p.drawText('Knowledge is Power', { x: 242, y: localY - 60, size: 10, font: font, color: rgb(0, 0, 0) });
			
			// Decorative line
			p.drawLine({ start: { x: 60, y: localY - 75 }, end: { x: 535, y: localY - 75 }, thickness: 1, color: rgb(0, 0, 0) });
		};

		// Results table header (Code, Title, Mark, Letter / Grade, GP)
		const drawResultsTableHeader = (startY: number): number => {
			// Position header close to provided Y, then create ample space below for rows
			const headerY = startY;
			drawText('S/No', 60, headerY, 11, true);
			drawText('Course Code', 90, headerY, 11, true);
			drawText('Course Title', 170, headerY, 11, true);
			drawText('Mark', 400, headerY, 11, true);
			// Split to two lines to avoid any overlap with GP
			drawText('Letter', 450, headerY, 11, true);
			drawText('Grade', 450, headerY - 12, 10, true);
			drawText('GP', 520, headerY, 11, true);
			// Removed underline below table header per request
			// Small gap before rows
			return headerY - 30;
		};

		// repeatNextTableHeader declared above

		// Header with logo and title
		drawHeader(page);
		let y = 660; // slightly higher start to reduce gap after motto

		// Student academic record title (reduced gap under motto)
		drawText('STUDENT ACADEMIC RECORD', 200, y + 28, 14, true);
		
		// Student info on the LEFT side
		drawText(`STUDENT NAME: ${student.full_name}`, 60, y); y -= 15;
		drawText(`MATRIC NUMBER: ${student.student_id}`, 60, y); y -= 15;
		drawText(`CLASS: ${student.class_level}${student.stream ? ' • ' + student.stream : ''}`, 60, y); y -= 15;
		drawText(`GRADUATION SESSION: ${graduationSession}`, 60, y); y -= 15;
		drawText(`DATE ISSUED: ${new Date().toLocaleDateString()}`, 60, y); y -= 15;
		
		// Student image on the RIGHT side (reduced size, aligned with lowered content start)
		if (studentPhotoImg) {
			const size = 90;
			const rightX = 595.28 - 80 - size; // Right aligned with margin
			const topY = 640 + 25; // Aligned with student info section
			page.drawImage(studentPhotoImg, { x: rightX, y: topY - size, width: size, height: size });
			// Add border around photo
			page.drawRectangle({ x: rightX - 2, y: topY - size - 2, width: size + 4, height: size + 4, borderColor: rgb(0, 0, 0), borderWidth: 1 });
		}

		// Removed horizontal rule before session/year and table
		y -= 20; // Reduced gap so title sits closer to content

		// Iterate sessions
		for (const key of sessionTermKeys) {
			const rows = groups.get(key) || [];
			// Compute session GPA
			const sessGrades = rows.map((r: any) => gradeToPoint(r.grade));
			const sessGpa = sessGrades.length ? (sessGrades.reduce((a: number, b: number) => a + b, 0) / sessGrades.length) : 0;

			y = addNewPageIfNeeded(90, y);
			drawText(`${key}`, 60, y, 12, true); y -= 12; // add clearer gap below year/session-term text
		y = drawResultsTableHeader(y);
			repeatNextTableHeader = true;

			let idx = 1;
			for (const rAny of rows) {
				const r = rAny as any;
				y = addNewPageIfNeeded(25, y);
				drawText(String(idx), 60, y);
				drawText(String(r.courses?.code || ''), 90, y);
				drawText(String((r.courses?.name || r.course_id) || '').slice(0, 36), 170, y);
				const mark = Number(r.total_score ?? 0);
				drawText(String(mark), 400, y);
				const letter = String(r.grade || '');
				// Draw letter and move grade below for clarity
				drawText(letter.replace(/\s+/g, '').replace('Grade',''), 450, y);
				const gp = gradeToPoint(letter);
				drawText(gp.toFixed(2), 520, y);
				// Add extra row height since header is two lines
				y -= 26; idx += 1; // Increased spacing between rows
			}

			// Term summary
			y = addNewPageIfNeeded(60, y);
			drawText('Term Summary:', 60, y, 11, true); y -= 14;
			drawText(`GPA: ${sessGpa.toFixed(2)}`, 80, y); y -= 12;
			drawText(`Courses Taken: ${rows.length}`, 80, y); y -= 20;
			// Removed separator line between terms
			y = addNewPageIfNeeded(20, y); y -= 20; // spacing after term
		}

		// Academic summary card
		y = addNewPageIfNeeded(120, y);
		// Removed horizontal rule before summary; keep spacing
		y -= 24; // generous space after table before summary
		drawText('Academic Summary', 60, y, 12, true); y -= 12;
		const totalCourses = (results || []).length;
		drawText(`Overall CGPA: ${overallGpa.toFixed(2)}`, 60, y); y -= 12;
		drawText(`Total Courses: ${totalCourses}`, 60, y); y -= 12;
		// Degree classification based on overall CGPA
		const classify = (cgpa: number): string => {
			if (cgpa >= 4.5) return 'First Class';
			if (cgpa >= 3.5) return 'Second Class Upper';
			if (cgpa >= 2.4) return 'Second Class Lower';
			if (cgpa >= 1.5) return 'Third Class';
			if (cgpa >= 1.0) return 'Pass';
			return 'Fail';
		};
		drawText(`Classification: ${classify(overallGpa)}`, 60, y); y -= 30; // more space before signatures

		// Signatures (cleaner layout)
		y = addNewPageIfNeeded(100, y);
		drawLine(80, y, 250, y, 1);
		drawText('Registrar', 120, y - 12, 10);
		drawLine(340, y, 520, y, 1);
		drawText('Principal / Head Teacher', 370, y - 12, 10);
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