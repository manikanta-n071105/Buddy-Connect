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

  // Clean errant patterns in source data
  str = str
    .replace(/\u2014/g, '---') // em dash
    .replace(/\u2013/g, '--')  // en dash
    .replace(/\u2212/g, '-')   // minus
    .replace(/[\u2018\u2019]/g, "'") // single curly quotes
    .replace(/[\u201C\u201D]/g, '"') // double curly quotes
    .replace(/\u00A0/g, ' ')   // non-breaking space
    .replace(/\u200B/g, '')    // zero-width space
    .replace(/\/{2,}/g, '/ ')  // replace double slash // with /
    .replace(/\s+\.\s*([A-Za-z])/g, ' $1') // fix " .Vinitha" -> " Vinitha"
    .replace(/\)(\d+\.)/g, ') $1'); // fix ")6." -> ") 6." in student achievements

  const tokens: Record<string, string> = {};
  let tokenIdx = 0;

  const addToken = (latexStr: string): string => {
    const key = `ZZZLATEXTOKEN${tokenIdx}ZZZ`;
    tokenIdx++;
    tokens[key] = latexStr;
    return key;
  };

  // 1. User LaTeX math superscript attempts: $^{...}$, $^{-}$, $^{5}$, $ ^{-} $, $ {-}$, $ - $, $ + $
  str = str.replace(/\$\s*\^\s*\{([^}]+)\}\s*\$/g, (_, val) => addToken(`\\textsuperscript{${val.trim()}}`));
  str = str.replace(/\$\s*\^\s*([^\s\$]+)\s*\$/g, (_, val) => addToken(`\\textsuperscript{${val.trim()}}`));
  str = str.replace(/\$\s*\{([-+0-9a-zA-Z]+)\}\s*\$/g, (_, val) => addToken(`\\textsuperscript{${val.trim()}}`));
  str = str.replace(/\$\s*([-+])\s*\$/g, (_, val) => addToken(`\\textsuperscript{${val.trim()}}`));

  // 2. User LaTeX math subscript attempts: $_{...}$, $_2$, $ _2 $
  str = str.replace(/\$\s*_\s*\{([^}]+)\}\s*\$/g, (_, val) => addToken(`\\textsubscript{${val.trim()}}`));
  str = str.replace(/\$\s*_\s*([^\s\$]+)\s*\$/g, (_, val) => addToken(`\\textsubscript{${val.trim()}}`));

  // 3. General inline math: $10^{-5}$, $10^5$, $CO^{-}$, $CO_2$, etc.
  str = str.replace(/\$([^\$]+)\$/g, (_, content) => {
    const trimmed = content.trim();
    const mPow = trimmed.match(/^([A-Za-z0-9]+)\s*\^\s*\{?([^}]+)\}?$/);
    if (mPow) {
      return mPow[1] + addToken(`\\textsuperscript{${mPow[2]}}`);
    }
    const mSub = trimmed.match(/^([A-Za-z0-9]+)\s*_\s*\{?([^}]+)\}?$/);
    if (mSub) {
      return mSub[1] + addToken(`\\textsubscript{${mSub[2]}}`);
    }
    return addToken(`\\ensuremath{${trimmed}}`);
  });

  // 4. HTML tags <sup> and <sub>
  str = str.replace(/<sup>(.*?)<\/sup>/gi, (_, val) => addToken(`\\textsuperscript{${val.trim()}}`));
  str = str.replace(/<sub>(.*?)<\/sub>/gi, (_, val) => addToken(`\\textsubscript{${val.trim()}}`));

  // 5. Unicode superscripts: ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ
  const supMap: Record<string, string> = {
    '\u2070': '0', '\u00B9': '1', '\u00B2': '2', '\u00B3': '3', '\u2074': '4',
    '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9',
    '\u207A': '+', '\u207B': '-', '\u207C': '=', '\u207D': '(', '\u207E': ')',
    '\u207F': 'n', '\u2071': 'i'
  };
  str = str.replace(/[\u2070\u00B9\u00B2\u00B3\u2074-\u2079\u207A-\u207E\u207F\u2071]+/g, (match) => {
    const converted = Array.from(match).map(c => supMap[c] || c).join('');
    return addToken(`\\textsuperscript{${converted}}`);
  });

  // 6. Unicode subscripts: ₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓᵤ
  const subMap: Record<string, string> = {
    '\u2080': '0', '\u2081': '1', '\u2082': '2', '\u2083': '3', '\u2084': '4',
    '\u2085': '5', '\u2086': '6', '\u2087': '7', '\u2088': '8', '\u2089': '9',
    '\u208A': '+', '\u208B': '-', '\u208C': '=', '\u208D': '(', '\u208E': ')',
    '\u2090': 'a', '\u2091': 'e', '\u2092': 'o', '\u2093': 'x', '\u2095': 'h',
    '\u2096': 'k', '\u2097': 'l', '\u2098': 'm', '\u2099': 'n', '\u209A': 'p',
    '\u209B': 's', '\u209C': 't'
  };
  str = str.replace(/[\u2080-\u208E\u2090-\u2093\u2095-\u209C]+/g, (match) => {
    const converted = Array.from(match).map(c => subMap[c] || c).join('');
    return addToken(`\\textsubscript{${converted}}`);
  });

  // 7. Shorthand "10 power 5" or "10 power -5"
  str = str.replace(/\b(\d+)\s+power\s+([-+]?\d+)\b/gi, (_, base, pow) => {
    return base + addToken(`\\textsuperscript{${pow}}`);
  });

  // 8. Caret power notation: e.g. 10^5, 10^-5, 10^{-5}, CO^-, CO^+, CO^{2+}, x^2, m^3, km^2
  str = str.replace(/([A-Za-z0-9]+)\s*\^\s*(\{([^}]+)\}|[-+]?[0-9a-zA-Z]+|[-+])/g, (_, base, _all, braced) => {
    const val = braced !== undefined ? braced : _all;
    return base + addToken(`\\textsuperscript{${val.trim()}}`);
  });

  // 9. Subscript notation: CO_{2}, N_2, H_2O, etc.
  str = str.replace(/([A-Za-z0-9]+)\s*_\s*\{([^}]+)\}/g, (_, base, val) => {
    return base + addToken(`\\textsubscript{${val.trim()}}`);
  });
  str = str.replace(/([A-Z][a-z]?)\s*_\s*([0-9]+)/g, (_, base, val) => {
    return base + addToken(`\\textsubscript{${val.trim()}}`);
  });
  // Chemical molecule names with explicit suffix e.g. N2 Molecule, O2 Gas
  str = str.replace(/\b([A-Z][a-z]?)([0-9]+)\s+(Molecule|Gas|Ion|Atom)\b/gi, (_, base, num, suf) => {
    return base + addToken(`\\textsubscript{${num.trim()}}`) + ` ${suf}`;
  });

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

  // Restore protected tokens
  for (const [k, v] of Object.entries(tokens)) {
    str = str.split(k).join(v);
  }

  // Convert bullet characters to LaTeX \textbullet AFTER backslash/brace escaping
  str = str.replace(/[\u2022\uF0B7\uF000-\uF0FF]/g, '\\textbullet\\ ');
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
  if (cUpper.includes('EXPERIMENT')) return c;
  if (cUpper.includes('GENERAL TOPICS')) return '100% Completed';

  const unitMatch = c.match(/(\d+(?:\.\d+)?)\s*Unit/i);
  const pctMatch = c.match(/(\d+)%/);
  if (unitMatch) {
    const u = parseFloat(unitMatch[1]);
    const pct = Math.round((u / 5.0) * 100);
    return `${u} ${u === 1 ? 'Unit' : 'Units'} (${pct}%)`;
  } else if (pctMatch) {
    const pct = parseInt(pctMatch[1], 10);
    const u = Math.round((pct / 20.0) * 10) / 10;
    return `${u} ${u === 1 ? 'Unit' : 'Units'} (${pct}%)`;
  } else if (/^\d+(?:\.\d+)?$/.test(c)) {
    const u = parseFloat(c);
    const pct = Math.round((u / 5.0) * 100);
    return `${u} ${u === 1 ? 'Unit' : 'Units'} (${pct}%)`;
  } else if (cUpper.includes('1,2,3,4') || cUpper.includes('I,II,III,IV')) {
    return '4 Units (80%)';
  } else if (cUpper.includes('1,2,3') || cUpper.includes('I,II,III')) {
    return '3 Units (60%)';
  } else if (cUpper.includes('1,2') || cUpper.includes('I,II')) {
    return '2 Units (40%)';
  }
  return c;
};

export const normalizeSyllabusPending = (completed?: string, pending?: string): string => {
  const p = String(pending || '').trim();
  const c = String(completed || '').trim();
  const pUpper = p.toUpperCase();

  // Determine done units
  let doneUnits: number | null = null;
  const unitMatch = c.match(/(\d+(?:\.\d+)?)\s*Unit/i);
  const pctMatch = c.match(/(\d+)%/);
  if (unitMatch) {
    doneUnits = parseFloat(unitMatch[1]);
  } else if (pctMatch) {
    doneUnits = Math.round((parseFloat(pctMatch[1]) / 20.0) * 10) / 10;
  } else if (/^\d+(?:\.\d+)?$/.test(c)) {
    doneUnits = parseFloat(c);
  }

  // 1. If pending is already a formatted string like '3.5 Units (70%)' or '5 Exp Pending (50%)', keep it!
  if (p && !['-', '--', 'NIL'].includes(p.toUpperCase())) {
    if (/^\d+(?:\.\d+)?\s*(?:Units?|Exp\s*Pending|\s*Exp(?:eriments?)?)(?:\s*\(\d+%\))?$/i.test(p)) {
      return p;
    }
    if (pUpper.includes('5-80%') || pUpper.includes('5-60%') || pUpper.includes('5-50%') || pUpper.includes('5 STARTED')) {
      return 'Unit 5 (In Progress)';
    }
    if (doneUnits !== null && doneUnits >= 3.8 && /\b(?:5\s*UNIT|V\s*UNIT|5TH\s*UNIT|UNIT\s*5)\b/i.test(pUpper)) {
      return 'Unit 5';
    }
    if (doneUnits !== null && doneUnits >= 2.5 && doneUnits <= 3.5 && (pUpper.includes('4,5') || pUpper.includes('4, 5') || pUpper.includes('IV,V') || pUpper.includes('4 UNIT AND 5'))) {
      return 'Units 4 & 5';
    }
  }

  // 2. Auto-calculate from doneUnits if known
  if (doneUnits !== null) {
    const remUnits = Math.round((5.0 - doneUnits) * 10) / 10;
    if (remUnits <= 0) {
      return 'Nil (Complete)';
    }
    const remPct = Math.round((remUnits / 5.0) * 100);
    const unitStr = remUnits === 1.0 ? 'Unit' : 'Units';
    return `${remUnits} ${unitStr} (${remPct}%)`;
  }

  // 3. Fallbacks
  if (/\b(?:5\s*UNIT|V\s*UNIT|5TH\s*UNIT|UNIT\s*5)\b/i.test(pUpper) || p === '5') {
    return 'Unit 5';
  }
  if (pUpper.includes('4,5') || pUpper.includes('4, 5') || pUpper.includes('IV,V')) {
    return 'Units 4 & 5';
  }
  if (pUpper.includes('3 UNIT RUNNING') || pUpper.includes('3 RUNNING') || pUpper.includes('III RUNNING')) {
    return 'Units 3, 4 & 5';
  }

  return (!p || ['-', 'NIL', '--'].includes(p.toUpperCase())) ? 'On Schedule' : p;
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

export const buildConsolidatedLatexCode = (departmentsData: Record<string, any>, period: string, hasLogo = false): string => {
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
    out.push(`\\Needspace*{6.5cm}\n`);
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
\\usepackage{libertinus}
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
\\definecolor{branddark}{HTML}{000000}
\\definecolor{headerdark}{HTML}{000000}
\\definecolor{brandamber}{HTML}{C2410C}
\\definecolor{brandgreen}{HTML}{15803D}
\\definecolor{brandborder}{HTML}{E2E8F0}
\\definecolor{rowalt}{HTML}{F8FAFC}
\\definecolor{slatedark}{HTML}{000000}
\\definecolor{slatemed}{HTML}{000000}
\\definecolor{slatelight}{HTML}{000000}
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
  \\parbox{8.5cm}{
    ${hasLogo ? '\\includegraphics[height=1.2cm]{sse-header-logo.png}' : '{\\Large\\textbf{\\textcolor{brandnavy}{SSE}}}'}
  } &
  \\parbox{8.5cm}{\\raggedleft
    {\\fontsize{9.5}{11.5}\\selectfont \\textbf{\\textcolor{headerdark}{SANSKRITHI SCHOOL OF ENGINEERING}}}\\\\[2pt]
    {\\fontsize{7.5}{9.5}\\selectfont \\textbf{\\textcolor{brandamber}{AUTONOMOUS}}}
  }
\\end{tabular*}
\\vspace{2pt}
\\noindent{\\color{brandnavy}\\rule{\\textwidth}{1.2pt}}
\\vspace{6pt}

{\\centering
  {\\fontsize{14}{16}\\selectfont \\textbf{\\textcolor{brandnavy}{INSTITUTIONAL HOD PROGRESS REPORT}}}\\\\[3pt]
  {\\fontsize{9}{11}\\selectfont \\textbf{\\textcolor{slatemed}{Comprehensive Performance Dossier \\& Departmental Analytics}}}\\\\[2pt]
  {\\fontsize{8}{10}\\selectfont \\textcolor{slatelight}{Reporting Period: \\textbf{\\textcolor{branddark}{${escapedPeriod}}}}}\\\\[6pt]
\\par}
\\vspace{4pt}
`);

  // 1A. Journals
  tex.push(renderSection(
    '1. RESEARCH — a) JOURNAL PUBLICATIONS',
    ['0.80cm', '1.20cm', '6.70cm', '5.30cm', '3.70cm'],
    ['#', 'Branch', 'Paper Title', 'Authors & Publication Details', 'Indexing & Verification'],
    (it, idx) => {
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.title || 'Untitled')}}}`;
      const details: string[] = [];
      if (it.authors) details.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{Authors:} ${escapeLatex(it.authors)}}`);
      if (it.journalName) details.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{Journal:} ${escapeLatex(it.journalName)} (${escapeLatex(it.volIssueYear || '')})}`);
      if (it.pageNos) details.push(`{\\fontsize{6.5}{8}\\selectfont\\textbf{Pages:} ${escapeLatex(it.pageNos)}}`);
      const pubDetails = details.length ? details.join(' \\newline ') : '--';

      const verif: string[] = [];
      if (it.issnIsbn) verif.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{ISSN:} ${escapeLatex(it.issnIsbn)}}`);
      if (it.indexedIn) {
        const idxIn = escapeLatex(it.indexedIn);
        if (idxIn.toLowerCase().includes('proof')) {
          verif.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{Indexed:} \\textcolor{linkblue}{${idxIn}}}`);
        } else {
          verif.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{Indexed:} ${idxIn}}`);
        }
      }
      if (it.link) verif.push(formatLatexLink(it.link, '[Paper Link]'));
      const verifDetails = verif.length ? verif.join(' \\newline ') : '--';
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.title || 'Untitled Presentation')}}}`;
      const details: string[] = [];
      if (it.authors) details.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{Authors:} ${escapeLatex(it.authors)}}`);
      if (it.conferenceName) details.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{Conference:} ${escapeLatex(it.conferenceName)}}`);
      const sub: string[] = [];
      if (it.volIssueYear) sub.push(`\\textbf{Issue:} ${escapeLatex(it.volIssueYear)}`);
      if (it.pageNos) sub.push(`\\textbf{Pages:} ${escapeLatex(it.pageNos)}`);
      if (it.issnIsbn) sub.push(`\\textbf{ISBN:} ${escapeLatex(it.issnIsbn)}`);
      if (sub.length) details.push(`{\\fontsize{6.5}{8}\\selectfont ${sub.join(' ')}}`);
      const confDetails = details.length ? details.join(' \\newline ') : '--';

      const verif: string[] = [];
      if (it.date) verif.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{Date:} ${escapeLatex(it.date)}}`);
      const locVal = it.location || it.locationMode || '';
      const modeVal = it.mode || '';
      const venueDisplay = locVal && modeVal && !locVal.includes(modeVal) ? `${locVal} (${modeVal})` : (locVal || modeVal || '-');
      if (venueDisplay && venueDisplay !== '-') verif.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{Venue:} ${escapeLatex(venueDisplay)}}`);
      if (it.indexedIn) verif.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{Indexed:} ${escapeLatex(it.indexedIn)}}`);
      if (it.link) verif.push(formatLatexLink(it.link, '[Proceedings]'));
      const verifDetails = verif.length ? verif.join(' \\newline ') : '--';
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.title || 'Untitled Patent')}}}`;
      const invLines: string[] = [];
      if (it.inventors) invLines.push(`{\\fontsize{7}{8.5}\\selectfont\\textbf{Inventor/s:} ${escapeLatex(it.inventors)}}`);
      if (it.applicants) invLines.push(`{\\fontsize{6.5}{8}\\selectfont\\textbf{Applicant/s:} ${escapeLatex(it.applicants)}}`);
      if (it.patentNumber) invLines.push(`{\\fontsize{6.5}{8}\\selectfont\\textbf{Pat No:} ${escapeLatex(it.patentNumber)}}`);
      const inv = invLines.length ? invLines.join(' \\newline ') : '--';
      const status = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{brandgreen}{${escapeLatex(it.status || 'Published')}}}}` +
        (it.awardedDate ? ` \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Date:} ${escapeLatex(it.awardedDate)}}` : '');
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.title || 'Untitled Activity')}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Type:} ${escapeLatex(it.type || '-')} \\textbullet\\ \\textbf{Mode:} ${escapeLatex(it.mode || 'Offline')}}`;
      const meta = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Date:} ${escapeLatex(it.date || '-')}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{By:} ${escapeLatex(it.organizedBy || '-')}}`;
      const tgt = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Participants:} ${escapeLatex(it.participantsCount || '-')} parts} \\newline {\\fontsize{6.5}{8}\\selectfont ${escapeLatex(it.participants || '-')}}`;
      const outc = `{\\fontsize{6.5}{8}\\selectfont\\textbf{Coord:} ${escapeLatex(it.mentorCoordinator || '-')}} \\newline {\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{brandgreen}{Status: ${escapeLatex(it.status || 'Completed')}}}}` +
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.title || 'Untitled FDP')}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Type:} ${escapeLatex(it.type || 'FDP')}}`;
      const org = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Org:} ${escapeLatex(it.organizingBody || '-')}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Dates:} ${escapeLatex(it.dates || '-')} (${escapeLatex(it.mode || 'Offline')})}`;
      const fac = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.facultyAttended || it.role || '-')}}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[Certificate]')}` : '');
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.title || 'Untitled FDP Organized')}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Type:} ${escapeLatex(it.type || 'FDP')} \\textbullet\\ \\textbf{Dates:} ${escapeLatex(it.dates || '-')} (${escapeLatex(it.mode || 'Offline')})}`;
      const rp = `{\\fontsize{7}{8.5}\\selectfont\\textbf{RP:} ${escapeLatex(it.resourcePersonDetails || '-')}}`;
      const coords = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Coord:} ${escapeLatex(it.facultyCoordinators || '-')}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[Proof Link]')}` : '');
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.title || 'Untitled SDP')}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Type:} ${escapeLatex(it.type || 'Workshop')}}`;
      const dtRp = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Date:} ${escapeLatex(it.date || '-')}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{RP:} ${escapeLatex(it.resourcePerson || '-')}}`;
      const modeStr = it.mode ? ` (${escapeLatex(it.mode)})` : '';
      const parts = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Participants:} ${escapeLatex(it.participantsCount || '-')} participants${modeStr}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[Report Link]')}` : '');
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const fac = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.name || '-')}}}`;
      const awd = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.award || '-')}}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[Proof Link]')}` : '');
      const ev = `{\\fontsize{7}{8.5}\\selectfont ${escapeLatex(it.event || '-')}}`;
      const orgDt = it.date ? ` (${escapeLatex(it.date)})` : '';
      const org = `{\\fontsize{7}{8.5}\\selectfont ${escapeLatex(it.organization || '-')}${orgDt}}`;
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const st = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.nameRoll || '-')}}}`;
      const awd = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.award || '-')}}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[Proof Link]')}` : '');
      const evOrg = it.organization ? ` (${escapeLatex(it.organization)})` : '';
      const ev = `{\\fontsize{7}{8.5}\\selectfont ${escapeLatex(it.event || '-')}${evOrg}}`;
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.title || 'Untitled Certification')}}}`;
      const plt = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Platform:} ${escapeLatex(it.platform || '-')}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Type:} ${escapeLatex(it.type || '-')}}`;
      const enr = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Duration:} ${escapeLatex(it.duration || '-')}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Enrolled:} ${escapeLatex(it.enrolled || '-')}}`;
      const outc = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{brandgreen}{${escapeLatex(it.certified || '-')} Certified}}} \\newline {\\fontsize{6.5}{8}\\selectfont ${escapeLatex(it.keyOutcomes || '')}}` +
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const ptn = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.name || '-')}}}`;
      const dt = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Date:} ${escapeLatex(it.datePeriod || '-')}}`;
      const spoc = `{\\fontsize{7}{8.5}\\selectfont\\textbf{SPOC:} ${escapeLatex(it.facultySpoc || '-')}}`;
      const purp = `{\\fontsize{7}{8.5}\\selectfont ${escapeLatex(it.purpose || '-')}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[MoU Copy]')}` : '');
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const ev = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.event || '-')}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Type:} ${escapeLatex(it.type || '-')}}`;
      const dt = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Date:} ${escapeLatex(it.date || '-')}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Coord:} ${escapeLatex(it.resourcePersonCoordinator || '-')}}`;
      const outc = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Participants:} ${escapeLatex(it.participants || '-')}} \\newline {\\fontsize{6.5}{8}\\selectfont ${escapeLatex(it.outcomes || '-')}}` +
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const sub = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.subject || 'Untitled Course')}}}`;
      const yr = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(normalizeSyllabusYearSem(it.yearSem))}}}`;
      const fac = `{\\fontsize{7}{8.5}\\selectfont ${escapeLatex(it.faculty || '-')}}`;
      const comp = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{brandgreen}{${escapeLatex(normalizeSyllabusCompleted(it.completed))}}}}`;
      const pend = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{brandamber}{${escapeLatex(normalizeSyllabusPending(it.completed, it.pending))}}}}`;
      const rem = `{\\fontsize{7}{8.5}\\selectfont\\textit{${escapeLatex(normalizeSyllabusRemarks(it.remarks))}}}`;
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const title = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.title || 'Untitled Activity')}}}`;
      const tSpan = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Type:} ${escapeLatex(it.type || 'Workshop')}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Dates:} ${escapeLatex(it.dates || it.noOfDays || '1 day')}}`;
      const pts = `{\\fontsize{7}{8.5}\\selectfont\\textbf{\\textcolor{brandgreen}{${escapeLatex(it.participantsCount || '-')}}}}`;
      const coord = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Coord:} ${escapeLatex(it.coordinator || '-')}}`;
      const rem = `{\\fontsize{6.5}{8}\\selectfont\\textit{${escapeLatex(it.remarks || '-')}}}` + (it.link ? ` \\newline ${formatLatexLink(it.link, '[Club Report]')}` : '');
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const ev = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.event || '-')}}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Type:} ${escapeLatex(it.type || '-')}}`;
      const vn = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Date:} ${escapeLatex(it.date || '-')}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Venue:} ${escapeLatex(it.venue || '-')}}`;
      const ben = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Participants:} ${escapeLatex(it.participantsCount || '-')} participants} \\newline {\\fontsize{6.5}{8}\\selectfont ${escapeLatex(it.typeOfParticipants || '-')}}`;
      const outc = `{\\fontsize{7}{8.5}\\selectfont ${escapeLatex(it.outcomes || '-')}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Coord:} ${escapeLatex(it.coordinator || '-')}}` +
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
      const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
      const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode)}}}`;
      const init = `{\\fontsize{7.5}{9}\\selectfont\\textbf{${escapeLatex(it.initiative || '-')}}}`;
      const dt = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Date:} ${escapeLatex(it.date || '-')}} \\newline {\\fontsize{6.5}{8}\\selectfont\\textbf{Coord:} ${escapeLatex(it.coordinator || '-')}}`;
      const desc = `{\\fontsize{7}{8.5}\\selectfont ${escapeLatex(it.description || '-')}}` +
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
        const sno = `{\\fontsize{7}{8.5}\\selectfont ${idx + 1}}`;
        const branch = `{\\fontsize{7}{8.5}\\selectfont\\textbf{${escapeLatex(it.deptCode || 'MOM')}}}`;
        const mTitle = escapeLatex(it.title || "HoD's Meeting");
        const mDate = escapeLatex(it.date || '-');
        const mtgLines = [
          `{\\fontsize{7.5}{9}\\selectfont\\textbf{\\textcolor{brandnavy}{${mTitle}}}}`,
          `{\\fontsize{7}{8.5}\\selectfont\\textbf{Date:} ${mDate}}`
        ];
        if (it.time) mtgLines.push(`{\\fontsize{6.5}{8}\\selectfont\\textbf{Time:} ${escapeLatex(it.time)}}`);
        if (it.venue) mtgLines.push(`{\\fontsize{6.5}{8}\\selectfont\\textbf{Venue:} ${escapeLatex(it.venue)}}`);
        const mtgFirst = mtgLines.join(' \\newline ');
        const pol = `{\\fontsize{7}{8.5}\\selectfont ${escapeLatex(it.policyChanges || 'Standard operations and administrative resolutions confirmed.')}}` +
          (it.link ? ` \\newline ${formatLatexLink(it.link, '[Proof Link]')}` : '');

        const discussions = it.discussions;
        if (Array.isArray(discussions) && discussions.length > 0) {
          let attPrefix = '';
          if (Array.isArray(it.attendees) && it.attendees.length > 0) {
            const attNames = it.attendees.map((a: any) => escapeLatex(a.name || '')).filter(Boolean).join(', ');
            if (attNames) {
              attPrefix = `{\\fontsize{7}{8.5}\\selectfont\\textbf{Attendees (${it.attendees.length}):} ${attNames}} \\newline\\vspace{2pt} `;
            }
          }

          const rows: string[][] = [];
          discussions.forEach((d: any, dIdx: number) => {
            const rawHead = String(d.heading || `Topic ${dIdx + 1}`).trim();
            const cleanHead = rawHead.replace(/^[•*\-\uF000-\uF0FF\s]+/, '').trim();
            const dHead = escapeLatex(cleanHead || `Topic ${dIdx + 1}`);

            const rawDet = String(d.details || 'Discussed & recorded.').trim();
            const normHead = rawHead.replace(/^[•*\-0-9.)\s\uF000-\uF0FF]+/, '').trim().toLowerCase();
            const dDetLines = rawDet
              .split('\n')
              .map(l => l.replace(/^[•*\-0-9.)\s\uF000-\uF0FF]+/, '').trim())
              .filter(l => {
                const normL = l.toLowerCase();
                return normL.length > 0 && normL !== normHead;
              });
            let detFormatted = `{\\fontsize{7}{8.5}\\selectfont ${escapeLatex(rawDet)}}`;
            if (dDetLines.length > 0) {
              detFormatted = dDetLines.map(l => `\\textcolor{brandnavy}{\\textbf{\\textbullet}} {\\fontsize{7}{8.5}\\selectfont ${escapeLatex(l)}}`).join(' \\newline ');
            }
            const discCell = (dIdx === 0 ? attPrefix : '') + `{\\fontsize{7.5}{9}\\selectfont\\textbf{${dHead}}}: \\newline ${detFormatted}`;
            if (dIdx === 0) {
              rows.push([sno, branch, mtgFirst, discCell, pol]);
            } else {
              rows.push(['', '', '{\\fontsize{6.5}{8}\\selectfont (Cont.)}', discCell, '']);
            }
          });
          return rows;
        } else {
          const discStr = `{\\fontsize{7}{8.5}\\selectfont ${escapeLatex(it.decisions || '-')}}`;
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
\\begin{tabular*}{\\textwidth}{@{\\extracolsep{\\fill}}lr@{}}
  \\parbox{6.5cm}{\\centering
    \\rule{5.0cm}{1.0pt}\\\\[4pt]
    \\textbf{\\fontsize{9.5}{11.5}\\selectfont \\textcolor{branddark}{IQAC Coordinator}}\\\\[2pt]
    {\\fontsize{7}{8.5}\\selectfont \\textcolor{slatelight}{Sanskrithi School of Engineering}}
  } &
  \\parbox{6.5cm}{\\centering
    \\rule{5.0cm}{1.0pt}\\\\[4pt]
    \\textbf{\\fontsize{9.5}{11.5}\\selectfont \\textcolor{branddark}{Principal}}\\\\[2pt]
    {\\fontsize{7}{8.5}\\selectfont \\textcolor{slatelight}{Sanskrithi School of Engineering}}
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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master_latex_'));

  const logoCandidates = [
    path.join(projectRoot, 'backend', 'assets', 'sse-header-logo.png'),
    path.join(projectRoot, 'assets', 'sse-header-logo.png'),
    path.join(__dirname, '../../assets/sse-header-logo.png'),
    path.join(__dirname, '../assets/sse-header-logo.png'),
    path.join(process.cwd(), 'assets', 'sse-header-logo.png'),
    path.join(projectRoot, 'frontend', 'public', 'assets', 'sse-header-logo.png'),
    path.join(projectRoot, 'public', 'assets', 'sse-header-logo.png')
  ];

  let hasLogo = false;
  for (const c of logoCandidates) {
    if (fs.existsSync(c)) {
      try {
        fs.copyFileSync(c, path.join(tempDir, 'sse-header-logo.png'));
        hasLogo = true;
        break;
      } catch (_) { }
    }
  }

  const latexCode = buildConsolidatedLatexCode(departmentsData, period, hasLogo);
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
