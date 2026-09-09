import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export function generateExperienceLetter(outputPaths: string[]) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 72, // Standard 1-inch margins matching official certificate format
    bufferPages: true,
    info: {
      Title: 'Certificate of Experience - Mr. Nookala Manikanta (23KF1A0591)',
      Author: 'Sanskrithi School of Engineering',
      Subject: 'Certificate of Experience - Backend Developer',
      Keywords: 'Certificate of Experience, Manikanta, 23KF1A0591, Backend Developer',
    }
  });

  // Pipe to output streams
  const streams = outputPaths.map(p => fs.createWriteStream(p));
  streams.forEach(stream => doc.pipe(stream));

  // --- TOP RIGHT DATE ---
  doc.y = 72;
  doc.font('Times-Bold')
     .fontSize(12)
     .fillColor('#000000')
     .text('Date: 04-09-2026', 72, 72, { align: 'right', width: 451 });

  // --- CENTERED TITLE (BOLD & UNDERLINED) ---
  doc.y = 130;
  doc.font('Times-Bold')
     .fontSize(16)
     .fillColor('#000000')
     .text('Certificate of Experience', 72, doc.y, { align: 'center', width: 451, underline: true });

  // --- BRIEF BACKEND DEVELOPER BODY WITH PROJECT DETAILS (TIMES-ROMAN, JUSTIFIED) ---
  doc.y = 185;
  doc.font('Times-Roman')
     .fontSize(11.5)
     .fillColor('#000000')
     .lineGap(7);

  const paragraph1 = `This is to certify that Mr. Nookala Manikanta, bearing Roll Number: 23KF1A0591, is a full-time student of Sanskrithi School of Engineering, currently pursuing Bachelor of Technology (B.Tech) in Computer Science and Engineering. He enrolled in 2023 and is expected to complete all degree requirements by April 2027.`;

  doc.text(paragraph1, 72, doc.y, { align: 'justify', width: 451 });

  doc.y = doc.y + 14;

  const paragraph2 = `During his academic tenure, Mr. Manikanta served as a Backend Developer for the Sanskrithi Buddy Platform. He engineered secure RESTful APIs, PostgreSQL database architecture, Google Authenticator 2FA security, anti-cheating proctoring services, and performance analytics logic using Node.js, Express, and TypeScript.`;

  doc.text(paragraph2, 72, doc.y, { align: 'justify', width: 451 });

  doc.y = doc.y + 14;

  const paragraph3 = `His technical skills, problem-solving abilities, and dedication to backend software engineering are exceptional.`;

  doc.text(paragraph3, 72, doc.y, { align: 'justify', width: 451 });

  // --- BOTTOM RIGHT PRINCIPAL SIGN-OFF ---
  const signY = Math.max(doc.y + 70, 680);
  doc.font('Times-Bold')
     .fontSize(12)
     .fillColor('#000000')
     .text('Principal', 72, signY, { align: 'right', width: 451 });

  doc.end();
}

// Direct Execution
if (require.main === module) {
  const pathsToSave = [
    path.join('c:', 'Users', 'nmani', 'Desktop', 'Sanskrithi_Buddy_Developer_Experience_Letter.pdf'),
    path.join('c:', 'Users', 'nmani', 'OneDrive', 'Desktop', 'Sanskrithi_Buddy_Developer_Experience_Letter.pdf'),
    path.join('c:', 'Users', 'nmani', 'OneDrive', 'Desktop', 'Certificate_of_Experience.pdf'),
    path.join('c:', 'Users', 'nmani', 'OneDrive', 'Desktop', 'Certificate_of_Enrollment.pdf'),
    path.join('c:', 'Users', 'nmani', 'OneDrive', 'Desktop', 'Buddy', 'Sanskrithi_Buddy_Developer_Experience_Letter.pdf'),
    path.join('C:', 'Users', 'nmani', '.gemini', 'antigravity-ide', 'brain', '070fef1c-3b7d-489a-8faa-24d9bfa977a2', 'Sanskrithi_Buddy_Developer_Experience_Letter.pdf')
  ].filter(p => {
    try {
      const dir = path.mentorName(p);
      return fs.existsSync(dir);
    } catch (e) {
      return false;
    }
  });

  generateExperienceLetter(pathsToSave);
  console.log('✅ Updated Experience Letter PDF with minor project details generated successfully at:');
  pathsToSave.forEach((p, i) => console.log(` ${i + 1}. ${p}`));
}
