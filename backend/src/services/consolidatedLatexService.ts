import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';

const DEPARTMENT_CODE_MAP: Record<string, string> = {
  'Civil Engineering': 'CIVIL',
  'Computer Science & Engineering': 'CSE',
  'Electronics & Communication Engineering': 'ECE',
  'Electrical & Electronics Engineering': 'EEE',
  'Mechanical Engineering': 'MECH',
  'Humanities & Sciences': 'H&S',
  'Innovation & Entrepreneurship': 'IIC/EDC',
  'Student Engagement & Clubs': 'CLUBS',
  'NSS & Community Engagement': 'NSS',
  'Minutes of the Meeting': 'MOM',
  'Training & Placement Cell': 'T&P',
  'Research & Development (R&D)': 'R&D',
  'Disciplinary Committee': 'DISCIP'
};

export const getDeptCode = (deptName?: string): string => {
  if (!deptName) return 'DEPT';
  return DEPARTMENT_CODE_MAP[deptName] || (deptName.length >= 6 ? deptName.substring(0, 6).toUpperCase() : deptName.toUpperCase());
};

export const escapeLatex = (text?: any): string => {
  if (text === null || text === undefined) return '';
  let str = String(text);
  if (!str.trim()) return '';

  str = str.replace(/\\/g, '\\textbackslash{}');
  const replacements: Array<[string, string]> = [
    ['&', '\\&'],
    ['%', '\\%'],
    ['$', '\\$'],
    ['#', '\\#'],
    ['_', '\\_'],
    ['{', '\\{'],
    ['}', '\\}'],
    ['~', '\\textasciitilde{}'],
    ['^', '\\textasciicircum{}'],
    ['<', '\\textless{}'],
    ['>', '\\textgreater{}'],
    ['"', "''"]
  ];
  for (const [char, rep] of replacements) {
    str = str.split(char).join(rep);
  }
  return str.replace(/[\r\n]+/g, ' \\newline ');
};

export const formatLatexLink = (url?: string, label = '[View Link]'): string => {
  if (!url || !String(url).trim()) return '';
  let urlStr = String(url).trim();
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    urlStr = 'https://' + urlStr;
  }
  const cleanLabel = escapeLatex(label);
  const escapedUrl = urlStr.replace(/%/g, '\\%').replace(/#/g, '\\#');
  return `{\\fontsize{6.5}{8}\\selectfont\\href{${escapedUrl}}{\\textcolor{linkblue}{\\underline{\\textbf{${cleanLabel}}}}}}`;
};

export const isMeaningfulItem = (item: any): boolean => {
  if (!item || typeof item !== 'object') return false;
  const primaryKeys = ['title', 'event', 'subject', 'initiative', 'name', 'nameRoll', 'decisions', 'award', 'platform', 'purpose', 'activity'];
  for (const k of primaryKeys) {
    const val = String(item[k] || '').trim();
    if (val.length >= 2) return true;
  }
  return Object.entries(item).some(([k, v]) => {
    if (['status', 'mode', 'deptCode', 'noOfDays', 'link'].includes(k)) return false;
    return String(v || '').trim().length >= 2;
  });
};

export const normalizeSyllabusYearSem = (raw?: string): string => {
  if (!raw) return '--';
  const clean = String(raw).toUpperCase().trim();
  if (clean.includes('4-1') || clean.includes('IV/I') || clean.includes('IV-I') || clean.includes('IV EEE') || clean.includes('IV/1') || clean.includes('4/1')) return 'IV / I';
  if (clean.includes('3-1') || clean.includes('III/I') || clean.includes('III-I') || clean.includes('III EEE') || clean.includes('III/1') || clean.includes('3/1')) return 'III / I';
  if (clean.includes('2-1') || clean.includes('II/I') || clean.includes('II-I') || clean.includes('II EEE') || clean.includes('II/1') || clean.includes('2/1')) return 'II / I';
  if (clean.includes('1-1') || clean.includes('I/I') || clean.includes('I-I') || clean.includes('I/1') || clean.includes('1/1')) return 'I / I';
  return String(raw).trim();
};

export const normalizeSyllabusCompleted = (completed?: string): string => {
  if (!completed) return '--';
  const c = String(completed).trim();
  const cUpper = c.toUpperCase();
  if (c.includes('100%')) return '5 Units (100%)';
  if (c.includes('95%') || c.includes('98%')) return '4.8 Units (95%)';
  if (c.includes('90%')) return '4.5 Units (90%)';
  if (c.includes('84%')) return '4.2 Units (84%)';
  if (c.includes('80%')) return '4 Units (80%)';
  if (c.includes('75%')) return '3.8 Units (75%)';
  if (c.includes('70%')) return '3.5 Units (70%)';
  if (c.includes('60%')) return '3 Units (60%)';
  if (c.includes('50%')) return '2.5 Units (50%)';
  if (cUpper.includes('1,2,3,4-50%') || cUpper.includes('4-50%')) return '3.5 Units';
  if (cUpper.includes('1,2,3,4') || cUpper.includes('I,II,III,IV')) return '4 Units';
  if (cUpper.includes('4 UNIT') || c === '4' || cUpper.includes('4 UNITS')) return '4 Units';
  if (cUpper.includes('3.5') || cUpper.includes('3.5 UNITS')) return '3.5 Units';
  if (cUpper.includes('1,2,3') || cUpper.includes('I,II,III') || c === '3' || cUpper.includes('3 UNITS') || cUpper.includes('3 UNIT')) return '3 Units';
  if (cUpper.includes('I,II') || cUpper.includes('1,2') || c === '2' || cUpper.includes('2 UNITS') || cUpper.includes('2 UNIT')) return '2 Units';
  if (cUpper.includes('1 UNIT') || c === '1') return '1 Unit';
  if (cUpper.includes('EXPERIMENT')) return c;
  if (cUpper.includes('GENERAL TOPICS')) return '100% Completed';
  return c;
};

export const normalizeSyllabusPending = (completed?: string, pending?: string): string => {
  const p = String(pending || '').trim();
  const pUpper = p.toUpperCase();
  const cUpper = String(completed || '').toUpperCase().trim();
  if (pUpper.includes('5-80%') || pUpper.includes('5-60%') || pUpper.includes('5-50%') || pUpper.includes('5 STARTED')) return 'Unit 5 (In Progress)';
  if (pUpper.includes('5 UNIT') || p === '5' || pUpper.includes('V UNIT') || pUpper.includes('5TH UNIT') || pUpper.includes('5 UNIT RUNNING')) return 'Unit 5';
  if (pUpper.includes('4,5') || pUpper.includes('4, 5') || pUpper.includes('IV,V') || pUpper.includes('4 UNIT AND 5') || pUpper.includes('4 UNIT RUNNING') || pUpper.includes('4 RUNNING') || pUpper.includes('IV RUNNING') || pUpper.includes('IV STARTED')) return 'Units 4 & 5';
  if (pUpper.includes('3 UNIT RUNNING') || pUpper.includes('3 RUNNING') || pUpper.includes('III RUNNING') || pUpper.includes('III STARTED') || pUpper.includes('III UNIT 30%')) return 'Units 3, 4 & 5';
  if (!p || p === '-' || p === 'NIL') {
    if (cUpper === '4' || cUpper.includes('4 UNITS') || cUpper.includes('1,2,3,4') || cUpper.includes('80%')) return 'Unit 5';
    if (cUpper === '3.5' || cUpper.includes('3.5 UNITS') || cUpper.includes('70%')) return 'Unit 4 (50%) & Unit 5';
    if (cUpper === '3' || cUpper.includes('3 UNITS') || cUpper.includes('1,2,3') || cUpper.includes('60%')) return 'Units 4 & 5';
    if (cUpper === '2' || cUpper.includes('2 UNITS') || cUpper.includes('1,2') || cUpper.includes('50%')) return 'Units 3, 4 & 5';
    if (cUpper.includes('100%') || cUpper === '5' || cUpper.includes('GENERAL TOPICS')) return 'Nil (Complete)';
    return '--';
  }
  return p;
};

export const normalizeSyllabusRemarks = (remarks?: string): string => {
  const r = String(remarks || '').trim();
  if (!r || r === '-' || r === 'NIL' || r === '--') return 'On Schedule as per Lesson Plan';
  return r;
};

export const getTectonicExecutable = (projectRoot: string): string => {
  const isWin = process.platform === 'win32';
  const binName = isWin ? 'tectonic.exe' : 'tectonic';

  const candidates = [
    path.join(process.cwd(), 'bin', binName),
    path.join(projectRoot, 'bin', binName),
    path.join(__dirname, '../../bin', binName),
    path.join(__dirname, '../bin', binName),
    binName
  ];

  for (const c of candidates) {
    if (path.isAbsolute(c) && fs.existsSync(c)) {
      return c;
    }
  }

  return binName;
};

export const buildConsolidatedLatexCode = (departmentsData: Record<string, any>, period: string): string => {
  const escapedPeriod = escapeLatex(period);
  const gatherItems = (secKey: string, altKey?: string): any[] => {
    const res: any[] = [];
    for (const [dName, secData] of Object.entries(departmentsData || {})) {
      if (!secData || typeof secData !== 'object') continue;
      let items = (secData as any)[secKey];
      if ((!items || !items.length) && altKey) {
        items = (secData as any)[altKey];
      }
      if (Array.isArray(items)) {
        for (const it of items) {
          if (isMeaningfulItem(it)) {
            res.push({
              ...it,
              department: dName,
              deptCode: getDeptCode(dName)
            });
          }
        }
      }
    }
    return res;
  };

  const renderSection = (
    titleText: string,
    colWidths: string[],
    headers: string[],
    rowsGen: (it: any, idx: number) => string[] | string[][],
    items: any[]
  ): string => {
    if (!items || items.length === 0) return '';
    const out: string[] = [];
    out.push(`\\needspace{2.8cm}\n`);
    out.push(`\\rendersectionheader{${escapeLatex(titleText)}}\n`);
    const specs = colWidths.map((w, i) => (i < 2 ? `>{\\centering\\arraybackslash}p{${w}}` : `>{\\raggedright\\arraybackslash}p{${w}}`));
    const colSpec = `|${specs.join('|')}|`;
    out.push(`\\noindent\\begin{longtable}{${colSpec}}\n\\hline\n\\rowcolor{brandnavy}\n`);
    const headerCells = headers.map(h => `\\textbf{\\textcolor{white}{\\fontsize{7}{8.5}\\selectfont ${escapeLatex(h)}}}`);
    out.push(`${headerCells.join(' & ')} \\\\ \\hline\n\\endfirsthead\n\\hline\n\\rowcolor{brandnavy}\n`);
    out.push(`${headerCells.join(' & ')} \\\\ \\hline\n\\endhead\n\\endfoot\n\\endlastfoot\n`);

    items.forEach((it, idx) => {
      const bg = idx % 2 === 1 ? '\\rowcolor{rowalt} ' : '';
      const rowRes = rowsGen(it, idx);
      if (Array.isArray(rowRes[0])) {
        (rowRes as string[][]).forEach((subRow, subIdx) => {
          const subBg = subIdx === 0 ? bg : '';
          subRow[0] = `${subBg}${subRow[0]}`;
          out.push(`${subRow.join(' & ')} \\\\ \\hline\n`);
        });
      } else {
        const singleRow = rowRes as string[];
        singleRow[0] = `${bg}${singleRow[0]}`;
        out.push(`${singleRow.join(' & ')} \\\\ \\hline\n`);
      }
    });

    out.push(`\\end{longtable}\n\n`);
    return out.join('');
  };

  const tex: string[] = [];

  tex.push(`\\documentclass[a4paper,8pt]{article}
\\usepackage[margin=10mm,top=8mm,bottom=10mm,headheight=18pt,headsep=6pt,includehead,includefoot]{geometry}
\\usepackage[scaled=0.92]{helvet}
\\renewcommand{\\familydefault}{\\sfdefault}
\\usepackage[table]{xcolor}
\\usepackage{colortbl}
\\usepackage{longtable}
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{fancyhdr}
\\usepackage{lastpage}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{needspace}
\\usepackage{titlesec}
\\usepackage{graphicx}

\\definecolor{brandnavy}{HTML}{1E3A8A}
\\definecolor{branddark}{HTML}{0F172A}
\\definecolor{headerdark}{HTML}{1F2937}
\\definecolor{brandamber}{HTML}{C2410C}
\\definecolor{brandgreen}{HTML}{15803D}
\\definecolor{brandborder}{HTML}{E2E8F0}
\\definecolor{rowalt}{HTML}{F8FAFC}
\\definecolor{slatedark}{HTML}{1E293B}
\\definecolor{slatemed}{HTML}{334155}
\\definecolor{slatelight}{HTML}{475569}
\\definecolor{linkblue}{HTML}{1D4ED8}

\\hypersetup{
    colorlinks=true,
    linkcolor=brandnavy,
    filecolor=brandnavy,
    urlcolor=linkblue,
    pdftitle={Institutional HOD Progress Report - ${escapedPeriod}},
    pdfauthor={Sanskrithi School of Engineering}
}

\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{1.5pt}
\\arrayrulecolor{brandborder}
\\setlength{\\arrayrulewidth}{0.65pt}
\\setlength{\\tabcolsep}{3pt}
\\setlength{\\LTleft}{0pt}
\\setlength{\\LTright}{\\fill}
\\renewcommand{\\arraystretch}{1.22}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\fontsize{6.5}{8}\\selectfont\\textbf{\\textcolor{slatemed}{SANSKRITHI SCHOOL OF ENGINEERING (AUTONOMOUS)}}}
\\fancyhead[R]{\\fontsize{6.5}{8}\\selectfont\\textbf{\\textcolor{slatemed}{INSTITUTIONAL HOD PROGRESS REPORT \\textbullet\\ ${escapedPeriod.toUpperCase()}}}}
\\fancyfoot[R]{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatemed}{Page \\thepage\\ of \\pageref{LastPage}}}}
\\renewcommand{\\headrulewidth}{0.6pt}
\\renewcommand{\\footrulewidth}{0pt}
\\renewcommand{\\headrule}{\\hbox to\\headwidth{\\color{brandborder}\\leaders\\hrule height \\headrulewidth\\hfill}}

\\newcommand{\\rendersectionheader}[1]{%
  \\vspace{7pt}%
  \\noindent%
  {\\textbf{\\fontsize{8.5}{10.5}\\selectfont \\textcolor{brandnavy}{#1}}}\\par\\nopagebreak[4]\\vspace{2pt}%
  {\\color{brandnavy}\\rule{\\textwidth}{1.3pt}}\\par\\nopagebreak[4]\\vspace{3pt}\\nopagebreak[4]%
}

\\begin{document}
\\thispagestyle{empty}
\\vspace*{-20pt}
\\noindent
\\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
  \\parbox{8cm}{
    {\\Large\\textbf{\\textcolor{brandnavy}{SSE}}}
  } &
  \\parbox{9cm}{\\raggedleft
    {\\fontsize{9}{11}\\selectfont \\textbf{\\textcolor{headerdark}{SANSKRITHI SCHOOL OF ENGINEERING}}}\\\\[2pt]
    {\\fontsize{7}{9}\\selectfont \\textbf{\\textcolor{brandamber}{AUTONOMOUS}}}
  }
\\end{tabular*}
\\vspace{2pt}
\\noindent{\\color{brandnavy}\\rule{\\textwidth}{1.2pt}}
\\vspace{6pt}

{\\centering
  {\\fontsize{14}{16}\\selectfont \\textbf{\\textcolor{brandnavy}{INSTITUTIONAL HOD PROGRESS REPORT}}}\\\\[3pt]
  {\\fontsize{9}{11}\\selectfont \\textbf{\\textcolor{slatemed}{Comprehensive Performance Dossier \\& Departmental Analytics}}}\\\\[2pt]
  {\\fontsize{8}{10}\\selectfont \\textcolor{slatelight}{Reporting Period: \\textbf{\\textcolor{branddark}{${escapedPeriod}}}}}\\\\par
}
\\vspace{4pt}
`);

  // 1A. Journals
  tex.push(renderSection(
    '1. RESEARCH — a) JOURNAL PUBLICATIONS',
    ['0.80cm', '1.20cm', '6.70cm', '5.30cm', '3.70cm'],
    ['#', 'Branch', 'Paper Title', 'Authors & Publication Details', 'Indexing & Verification'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.title || 'Untitled')}}}}`;
      const details: string[] = [];
      if (it.authors) details.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatemed}{Authors:}} \\textcolor{slatelight}{${escapeLatex(it.authors)}}}`);
      if (it.journalName) details.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatemed}{Journal:}} \\textcolor{slatelight}{${escapeLatex(it.journalName)}} (${escapeLatex(it.volIssueYear || '')})}`);
      if (it.pageNos) details.push(`{\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{Pages: ${escapeLatex(it.pageNos)}}}`);
      const pubDetails = details.length ? details.join(' \\newline ') : '\\textcolor{slatelight}{--}';

      const verif: string[] = [];
      if (it.issnIsbn) verif.push(`{\\fontsize{7}{8.5}\\selectfont ISSN: \\textbf{\\textcolor{slatedark}{${escapeLatex(it.issnIsbn)}}}}`);
      if (it.indexedIn) verif.push(`{\\fontsize{7}{8.5}\\selectfont Indexed: \\textbf{\\textcolor{slatedark}{${escapeLatex(it.indexedIn)}}}}`);
      if (it.link) verif.push(formatLatexLink(it.link, '[Paper Link]'));
      const verifDetails = verif.length ? verif.join(' \\newline ') : '\\textcolor{slatelight}{--}';
      return [sno, branch, title, pubDetails, verifDetails];
    },
    gatherItems('journals')
  ));

  // 1B. Conferences
  tex.push(renderSection(
    '1. RESEARCH — b) CONFERENCE PRESENTATIONS',
    ['0.80cm', '1.20cm', '6.00cm', '5.60cm', '4.10cm'],
    ['#', 'Branch', 'Presentation Title', 'Authors & Conference Details', 'Date, Venue & Indexing'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.title || 'Untitled Presentation')}}}}`;
      const details: string[] = [];
      if (it.authors) details.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatemed}{Authors:}} \\textcolor{slatelight}{${escapeLatex(it.authors)}}}`);
      if (it.conferenceName) details.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatemed}{Conference:}} \\textcolor{slatelight}{${escapeLatex(it.conferenceName)}}}`);
      const confDetails = details.length ? details.join(' \\newline ') : '\\textcolor{slatelight}{--}';

      const verif: string[] = [];
      if (it.date) verif.push(`{\\fontsize{7}{8.5}\\selectfont Date: \\textbf{\\textcolor{slatedark}{${escapeLatex(it.date)}}}}`);
      const locVal = it.location || it.locationMode || '';
      const modeVal = it.mode || '';
      const venueDisplay = locVal && modeVal && !locVal.includes(modeVal) ? `${locVal} (${modeVal})` : (locVal || modeVal || '-');
      if (venueDisplay && venueDisplay !== '-') verif.push(`{\\fontsize{7}{8.5}\\selectfont Venue: \\textcolor{slatelight}{${escapeLatex(venueDisplay)}}}`);
      if (it.indexedIn) verif.push(`{\\fontsize{7}{8.5}\\selectfont Indexed: \\textbf{\\textcolor{slatedark}{${escapeLatex(it.indexedIn)}}}}`);
      if (it.link) verif.push(formatLatexLink(it.link, '[Proceedings]'));
      const verifDetails = verif.length ? verif.join(' \\newline ') : '\\textcolor{slatelight}{--}';
      return [sno, branch, title, confDetails, verifDetails];
    },
    gatherItems('conferences')
  ));

  // 2A. Patents
  tex.push(renderSection(
    '2. INNOVATION & ENTREPRENEURSHIP — a) PATENTS',
    ['0.80cm', '1.20cm', '7.50cm', '5.00cm', '3.20cm'],
    ['#', 'Branch', 'Patent / Innovation Title', 'Inventor/s, Applicant/s & Registration', 'Status & Date'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.title || 'Untitled Patent')}}}}`;
      const invLines: string[] = [];
      if (it.inventors) invLines.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatemed}{Inventor/s:}} \\textcolor{slatelight}{${escapeLatex(it.inventors)}}}`);
      if (it.applicants) invLines.push(`{\\fontsize{6.5}{8}\\selectfont\\textbf{\\textcolor{slatemed}{Applicant/s:}} \\textcolor{slatelight}{${escapeLatex(it.applicants)}}}`);
      if (it.patentNumber) invLines.push(`{\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{Pat: ${escapeLatex(it.patentNumber)}}}`);
      const inv = invLines.length ? invLines.join(' \\newline ') : '\\textcolor{slatelight}{--}';
      const status = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{brandgreen}{${escapeLatex(it.status || 'Published')}}}}` +
        (it.awardedDate ? ` \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.awardedDate)}}}` : '');
      return [sno, branch, title, inv, status];
    },
    gatherItems('patents')
  ));

  // 2B. Entrepreneurship Activities
  tex.push(renderSection(
    '2. INNOVATION & ENTREPRENEURSHIP — b) ACTIVITIES AND INITIATIVES',
    ['0.80cm', '1.20cm', '5.20cm', '3.40cm', '2.85cm', '4.00cm'],
    ['#', 'Branch', 'Program / Activity Title', 'Date & Organizer', 'Participants', 'Coordinator, Status & Proof'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.title || 'Untitled Activity')}}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{Type: ${escapeLatex(it.type || '-')} \\textbullet\\ ${escapeLatex(it.mode || 'Offline')}}}`;
      const meta = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.date || '-')}}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatemed}{By: ${escapeLatex(it.organizedBy || '-')}}}`;
      const tgt = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.participantsCount || '-')} parts}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.participants || '-')}}}`;
      const outc = `{\\fontsize{6.5}{8}\\selectfont\\textcolor{slatemed}{Coord: ${escapeLatex(it.mentorCoordinator || '-')}}} \\newline {\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{brandgreen}{Status: ${escapeLatex(it.status || 'Completed')}}}}` +
        (it.link ? ` \\newline ${formatLatexLink(it.link, '[Report Link]')}` : '');
      return [sno, branch, title, meta, tgt, outc];
    },
    gatherItems('entrepreneurship')
  ));

  // 3A. FDPs Attended
  tex.push(renderSection(
    '3. FACULTY DEVELOPMENT PROGRAMS (FDPs) — a) ATTENDED',
    ['0.80cm', '1.20cm', '6.20cm', '4.70cm', '4.80cm'],
    ['#', 'Branch', 'Program Title & Type', 'Organizing Body & Dates', 'Faculty Attended & Proof'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.title || 'Untitled FDP')}}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{Type: ${escapeLatex(it.type || 'FDP')}}}`;
      const org = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.organizingBody || '-')}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatemed}{Dates: ${escapeLatex(it.dates || '-')} (${escapeLatex(it.mode || 'Offline')})}}`;
      const fac = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.facultyAttended || it.role || '-')}}}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[Certificate]')}` : '');
      return [sno, branch, title, org, fac];
    },
    gatherItems('fdpAttended', 'fdp')
  ));

  // 3B. FDPs Organized
  tex.push(renderSection(
    '3. FACULTY DEVELOPMENT PROGRAMS (FDPs) — b) ORGANIZED',
    ['0.80cm', '1.20cm', '5.60cm', '5.40cm', '4.70cm'],
    ['#', 'Branch', 'Program Title & Type', 'Resource Person Details', 'Coordinators & Proof'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.title || 'Untitled FDP Organized')}}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{Type: ${escapeLatex(it.type || 'FDP')} \\textbullet\\ ${escapeLatex(it.dates || '-')} (${escapeLatex(it.mode || 'Offline')})}}`;
      const rp = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.resourcePersonDetails || '-')}}}`;
      const coords = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.facultyCoordinators || '-')}}}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[Proof Link]')}` : '');
      return [sno, branch, title, rp, coords];
    },
    gatherItems('fdpOrganized')
  ));

  // 4. SDP
  tex.push(renderSection(
    '4. STUDENT DEVELOPMENT PROGRAMS (SDPs)',
    ['0.80cm', '1.20cm', '8.00cm', '4.50cm', '3.00cm'],
    ['#', 'Branch', 'Event Title & Type', 'Date & Resource Person', 'Participants'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.title || 'Untitled SDP')}}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{Type: ${escapeLatex(it.type || 'Workshop')}}}`;
      const dtRp = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.date || '-')}}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatemed}{${escapeLatex(it.resourcePerson || '-')}}}`;
      const modeStr = it.mode ? ` (${escapeLatex(it.mode)})` : '';
      const parts = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.participantsCount || '-')} participants${modeStr}}}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[Report Link]')}` : '');
      return [sno, branch, title, dtRp, parts];
    },
    gatherItems('sdp')
  ));

  // 5A. Faculty Achievements
  tex.push(renderSection(
    '5. ACHIEVEMENTS & RECOGNITIONS — a) FACULTY ACHIEVEMENTS',
    ['0.80cm', '1.20cm', '3.50cm', '4.50cm', '3.70cm', '4.00cm'],
    ['#', 'Branch', 'Faculty Member', 'Award / Recognition', 'Event / Competition', 'Conferring Body & Date'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const fac = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.name || '-')}}}}`;
      const awd = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.award || '-')}}}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[Proof Link]')}` : '');
      const ev = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatedark}{${escapeLatex(it.event || '-')}}}`;
      const orgDt = it.date ? ` (${escapeLatex(it.date)})` : '';
      const org = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.organization || '-')}${orgDt}}}`;
      return [sno, branch, fac, awd, ev, org];
    },
    gatherItems('facultyAchievements')
  ));

  // 5B. Student Achievements
  tex.push(renderSection(
    '5. ACHIEVEMENTS & RECOGNITIONS — b) STUDENT ACHIEVEMENTS',
    ['0.80cm', '1.20cm', '5.20cm', '5.50cm', '5.00cm'],
    ['#', 'Branch', 'Student Name & ID', 'Prize / Accomplishment', 'Event & Host Institution'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const st = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.nameRoll || '-')}}}}`;
      const awd = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.award || '-')}}}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[Proof Link]')}` : '');
      const evOrg = it.organization ? ` (${escapeLatex(it.organization)})` : '';
      const ev = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.event || '-')}${evOrg}}}`;
      return [sno, branch, st, awd, ev];
    },
    gatherItems('studentAchievements')
  ));

  // 5C. Certifications
  tex.push(renderSection(
    '5. ACHIEVEMENTS & RECOGNITIONS — c) CERTIFICATIONS',
    ['0.80cm', '1.20cm', '5.80cm', '3.50cm', '2.65cm', '3.50cm'],
    ['#', 'Branch', 'Course / Certification Title', 'Platform & Type', 'Duration & Enrolled', 'Certified & Status'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.title || 'Untitled Certification')}}}}`;
      const plt = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.platform || '-')}}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{Type: ${escapeLatex(it.type || '-')}}}`;
      const enr = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.duration || '-')}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{Enrolled: ${escapeLatex(it.enrolled || '-')}}}`;
      const outc = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{brandgreen}{${escapeLatex(it.certified || '-')} Certified}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.keyOutcomes || '')}}}` +
        (it.link ? ` \\newline ${formatLatexLink(it.link, '[Certificate]')}` : '');
      return [sno, branch, title, plt, enr, outc];
    },
    gatherItems('certifications')
  ));

  // 6. MoUs
  tex.push(renderSection(
    '6. COLLABORATIONS & MOUS',
    ['0.80cm', '1.20cm', '5.40cm', '2.80cm', '2.80cm', '4.45cm'],
    ['#', 'Branch', 'Partner Entity / Industry', 'Date of Signing', 'Faculty SPOC', 'Scope & Focus Area'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const ptn = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.name || '-')}}}}`;
      const dt = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatedark}{${escapeLatex(it.datePeriod || '-')}}}`;
      const spoc = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.facultySpoc || '-')}}}}`;
      const purp = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.purpose || '-')}}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[MoU Copy]')}` : '');
      return [sno, branch, ptn, dt, spoc, purp];
    },
    gatherItems('mous')
  ));

  // 7. Tech Association
  tex.push(renderSection(
    '7. TECHNICAL ASSOCIATION ACTIVITIES',
    ['0.80cm', '1.20cm', '5.70cm', '3.50cm', '6.50cm'],
    ['#', 'Branch', 'Association Event & Type', 'Date & Coordinator', 'Participants & Outcomes'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const ev = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.event || '-')}}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{Type: ${escapeLatex(it.type || '-')}}}`;
      const dt = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.date || '-')}}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatemed}{${escapeLatex(it.resourcePersonCoordinator || '-')}}}`;
      const outc = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.participants || '-')}}} \\textcolor{slatelight}{participants}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.outcomes || '-')}}}` +
        (it.link ? ` \\newline ${formatLatexLink(it.link, '[Event Report]')}` : '');
      return [sno, branch, ev, dt, outc];
    },
    gatherItems('techAssociation')
  ));

  // 8. Syllabus
  tex.push(renderSection(
    '8. SYLLABUS COVERAGE REPORT',
    ['0.70cm', '1.05cm', '4.40cm', '1.15cm', '2.60cm', '2.15cm', '2.15cm', '2.30cm'],
    ['#', 'Branch', 'Course / Subject Title', 'Year / Sem', 'Faculty In-Charge', 'Done (5 Units)', 'Pending / Ongoing', 'Remarks / Status'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const sub = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.subject || 'Untitled Course')}}}}`;
      const yr = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(normalizeSyllabusYearSem(it.yearSem))}}}}`;
      const fac = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.faculty || '-')}}}`;
      const comp = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{brandgreen}{${escapeLatex(normalizeSyllabusCompleted(it.completed))}}}}`;
      const pend = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{brandamber}{${escapeLatex(normalizeSyllabusPending(it.completed, it.pending))}}}}`;
      const rem = `{\\fontsize{7}{8.5}\\selectfont\\textit{\\textcolor{slatelight}{${escapeLatex(normalizeSyllabusRemarks(it.remarks))}}}}`;
      return [sno, branch, sub, yr, fac, comp, pend, rem];
    },
    gatherItems('syllabus')
  ));

  // 9. Clubs
  tex.push(renderSection(
    '9. STUDENT ENGAGEMENT & CLUBS',
    ['0.75cm', '1.15cm', '4.50cm', '3.20cm', '1.80cm', '2.60cm', '3.20cm'],
    ['#', 'Branch', 'Activity / Event Title', 'Type & Duration', 'Participants', 'Coordinator', 'Remarks / Outcomes'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.title || 'Untitled Activity')}}}}`;
      const tSpan = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.type || 'Workshop')}}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.dates || it.noOfDays || '1 day')}}}`;
      const pts = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{brandgreen}{${escapeLatex(it.participantsCount || '-')}}}}`;
      const coord = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.coordinator || '-')}}}}`;
      const rem = `{\\fontsize{6.5}{8}\\selectfont\\textit{\\textcolor{slatelight}{${escapeLatex(it.remarks || '-')}}}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[Club Report]')}` : '');
      return [sno, branch, title, tSpan, pts, coord, rem];
    },
    gatherItems('studentEngagement')
  ));

  // 10. NSS
  tex.push(renderSection(
    '10. NSS & COMMUNITY ENGAGEMENT',
    ['0.80cm', '1.20cm', '4.40cm', '3.10cm', '3.00cm', '4.95cm'],
    ['#', 'Branch', 'Event / Activity Name', 'Date & Venue', 'Participants & Target', 'Outcomes & Coord.'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const ev = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.event || '-')}}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{Type: ${escapeLatex(it.type || '-')}}}`;
      const vn = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.date || '-')}}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatemed}{Venue: ${escapeLatex(it.venue || '-')}}}`;
      const ben = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.participantsCount || '-')} participants}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.typeOfParticipants || '-')}}}`;
      const outc = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.outcomes || '-')}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{\\textcolor{slatemed}{Coord: ${escapeLatex(it.coordinator || '-')}}}}` +
        (it.link ? ` \\newline ${formatLatexLink(it.link, '[NSS Report]')}` : '');
      return [sno, branch, ev, vn, ben, outc];
    },
    gatherItems('nss')
  ));

  // 11. Additional Initiatives
  tex.push(renderSection(
    '11. ADDITIONAL/OTHER RELEVANT INITIATIVES',
    ['0.80cm', '1.20cm', '5.50cm', '3.20cm', '7.00cm'],
    ['#', 'Branch', 'Initiative / Activity', 'Date & Coordinator', 'Description & Key Outcomes'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode)}}}}`;
      const init = `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${escapeLatex(it.initiative || '-')}}}}`;
      const dt = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatedark}{${escapeLatex(it.date || '-')}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textcolor{slatemed}{Coord: ${escapeLatex(it.coordinator || '-')}}}`;
      const desc = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.description || '-')}}}` +
        (it.outcomes ? ` \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{\\textcolor{brandgreen}{Outcome: ${escapeLatex(it.outcomes)}}}}` : '') +
        (it.link ? ` \\newline ${formatLatexLink(it.link, '[Proof Link]')}` : '');
      return [sno, branch, init, dt, desc];
    },
    gatherItems('additionalInitiatives')
  ));

  // 12. Minutes of the Meeting
  const rawMom = gatherItems('deptMeetings');
  const seenMoms = new Set<string>();
  const momItems: any[] = [];
  for (const m of rawMom) {
    const mTitle = String(m.title || "HoD's Meeting").trim();
    const mDate = String(m.date || '-').trim();
    const key = `${mTitle}__${mDate}`;
    if (!seenMoms.has(key) && isMeaningfulItem(m)) {
      seenMoms.add(key);
      momItems.push(m);
    }
  }

  if (momItems.length > 0) {
    tex.push(renderSection(
      '12. MINUTES OF THE MEETING (MOM)',
      ['0.80cm', '1.20cm', '3.60cm', '8.00cm', '4.10cm'],
      ['#', 'Branch', 'Meeting & Venue', 'Key Decisions & Topics Discussed', 'Policy Directives & Action Plan'],
      (it, idx) => {
        const sno = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${idx + 1}}}`;
        const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${escapeLatex(it.deptCode || 'MOM')}}}}`;
        const mTitle = escapeLatex(it.title || "HoD's Meeting");
        const mDate = escapeLatex(it.date || '-');
        const mtgLines = [
          `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{brandnavy}{${mTitle}}}}`,
          `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{slatedark}{${mDate}}}}`
        ];
        if (it.time) mtgLines.push(`{\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.time)}}}`);
        if (it.venue) mtgLines.push(`{\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{Venue: ${escapeLatex(it.venue)}}}`);
        const mtgFirst = mtgLines.join(' \\newline ');
        const pol = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.policyChanges || 'Standard operations and administrative resolutions confirmed.')}}}` +
          (it.link ? ` \\newline ${formatLatexLink(it.link, '[Proof Link]')}` : '');

        const discussions = it.discussions;
        if (Array.isArray(discussions) && discussions.length > 0) {
          let attPrefix = '';
          if (Array.isArray(it.attendees) && it.attendees.length > 0) {
            const attNames = it.attendees.map((a: any) => escapeLatex(a.name || '')).filter(Boolean).join(', ');
            if (attNames) {
              attPrefix = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Attendees (${it.attendees.length}):} \\textcolor{slatelight}{${attNames}}} \\newline\\vspace{2pt} `;
            }
          }

          const rows: string[][] = [];
          discussions.forEach((d: any, dIdx: number) => {
            const dHead = escapeLatex(d.heading || `Topic ${dIdx + 1}`);
            const rawDet = String(d.details || 'Discussed & recorded.').trim();
            const dDetLines = rawDet.split('\n').map(l => l.replace(/^[•*\-0-9.)\s]+/, '').trim()).filter(Boolean);
            let detFormatted = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(rawDet)}}}`;
            if (dDetLines.length > 1) {
              detFormatted = dDetLines.map(l => `\\textcolor{brandnavy}{\\textbf{\\textbullet}} {\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(l)}}}`).join(' \\newline ');
            }
            const discCell = (dIdx === 0 ? attPrefix : '') + `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{branddark}{${dHead}}}}: \\newline ${detFormatted}`;
            if (dIdx === 0) {
              rows.push([sno, branch, mtgFirst, discCell, pol]);
            } else {
              rows.push(['', '', '{\\fontsize{6.5}{8}\\selectfont\\textcolor{slatelight}{(Cont.)}}', discCell, '']);
            }
          });
          return rows;
        } else {
          const discStr = `{\\fontsize{7}{8.5}\\selectfont\\textcolor{slatelight}{${escapeLatex(it.decisions || '-')}}}`;
          return [[sno, branch, mtgFirst, discStr, pol]];
        }
      },
      momItems
    ));
  }

  // Final Signatures
  tex.push(`\\needspace{4.5cm}
\\vspace{24pt}
\\noindent{\\color{brandborder}\\rule{\\textwidth}{1.0pt}}\\vspace{18pt}

\\noindent
\\begin{tabular*}{\\textwidth}{@{\\extracolsep{\\fill}}ccc@{}}
  \\parbox{5.2cm}{\\centering
    \\rule{4.0cm}{1.0pt}\\\\[3pt]
    \\textbf{\\fontsize{9}{11}\\selectfont \\textcolor{branddark}{Dr. Sreenivas Prasad}}\\\\[1pt]
    {\\fontsize{7.5}{9.5}\\selectfont \\textbf{\\textcolor{slatemed}{IQAC Coordinator}}}\\\\[1pt]
    {\\fontsize{6.5}{8}\\selectfont \\textcolor{slatelight}{Sanskrithi School of Engineering}}
  } &
  \\parbox{5.2cm}{\\centering
    \\rule{4.0cm}{1.0pt}\\\\[3pt]
    \\textbf{\\fontsize{9}{11}\\selectfont \\textcolor{branddark}{Dean of Academics}}\\\\[1pt]
    {\\fontsize{7.5}{9.5}\\selectfont \\textbf{\\textcolor{slatemed}{Academic Governance}}}\\\\[1pt]
    {\\fontsize{6.5}{8}\\selectfont \\textcolor{slatelight}{Sanskrithi School of Engineering}}
  } &
  \\parbox{5.2cm}{\\centering
    \\rule{4.0cm}{1.0pt}\\\\[3pt]
    \\textbf{\\fontsize{9}{11}\\selectfont \\textcolor{branddark}{Principal}}\\\\[1pt]
    {\\fontsize{7.5}{9.5}\\selectfont \\textbf{\\textcolor{slatemed}{Institutional Endorsement}}}\\\\[1pt]
    {\\fontsize{6.5}{8}\\selectfont \\textcolor{slatelight}{Sanskrithi School of Engineering}}
  }
\\end{tabular*}

\\end{document}
`);

  return tex.join('');
};

export const compileMasterLatexDocument = async (
  projectRoot: string,
  departmentsData: Record<string, any>,
  period: string,
  outputPdfPath: string
): Promise<Buffer> => {
  const latexCode = buildConsolidatedLatexCode(departmentsData, period);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master_latex_'));
  const texFile = path.join(tempDir, 'report.tex');
  fs.writeFileSync(texFile, latexCode, 'utf-8');

  const tectonicBin = getTectonicExecutable(projectRoot);

  return new Promise<Buffer>((resolve, reject) => {
    execFile(tectonicBin, ['--outdir', tempDir, texFile], (err, _stdout, stderr) => {
      const compiledPdf = path.join(tempDir, 'report.pdf');
      if (err || !fs.existsSync(compiledPdf)) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
        return reject(new Error(`Tectonic compilation failed: ${stderr || err?.message || 'Unknown error'}`));
      }

      try {
        const buffer = fs.readFileSync(compiledPdf);
        fs.mkdirSync(path.dirname(outputPdfPath), { recursive: true });
        fs.writeFileSync(outputPdfPath, buffer);
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
        resolve(buffer);
      } catch (readErr: any) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
        reject(readErr);
      }
    });
  });
};
