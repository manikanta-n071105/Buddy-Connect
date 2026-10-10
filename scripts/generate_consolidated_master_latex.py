import os
import sys
import json
import re
import subprocess
import shutil
import tempfile

DEPARTMENT_CODE_MAP = {
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
}

def get_dept_code(dept_name):
    return DEPARTMENT_CODE_MAP.get(dept_name, (dept_name[:6].upper() if dept_name else 'DEPT'))

def escape_latex(text):
    """Escapes special LaTeX characters in strings."""
    if text is None:
        return ""
    text = str(text)
    if not text.strip():
        return ""
    
    text = text.replace('\\', r'\textbackslash{}')
    replacements = [
        ('&', r'\&'),
        ('%', r'\%'),
        ('$', r'\$'),
        ('#', r'\#'),
        ('_', r'\_'),
        ('{', r'\{'),
        ('}', r'\}'),
        ('~', r'\textasciitilde{}'),
        ('^', r'\textasciicircum{}'),
        ('<', r'\textless{}'),
        ('>', r'\textgreater{}'),
        ('"', r"''"),
    ]
    for char, rep in replacements:
        text = text.replace(char, rep)
    
    text = re.sub(r'[\r\n]+', r' \\newline ', text)
    return text

def format_latex_link(url, label="[View Link]"):
    if not url or not str(url).strip():
        return ""
    url_str = str(url).strip()
    if not (url_str.startswith('http://') or url_str.startswith('https://')):
        url_str = 'https://' + url_str
    clean_label = escape_latex(label if label else "[View Link]")
    escaped_url = url_str.replace('%', r'\%').replace('#', r'\#')
    return r'{\fontsize{6.5}{8}\selectfont\href{' + escaped_url + r'}{\textcolor{linkblue}{\underline{\textbf{' + clean_label + r'}}}}}'

def format_bullet_points_latex(text):
    if not text or not str(text).strip():
        return r"\textcolor{slatelight}{--}"
    raw = str(text).strip()
    
    lines = []
    if '\n' in raw:
        lines = [l.strip().lstrip('•*-0123456789.) ') for l in raw.split('\n') if l.strip()]
    elif '•' in raw or '▪' in raw or '–' in raw:
        lines = [l.strip() for l in re.split(r'[•▪–]', raw) if l.strip()]
    elif re.search(r'(?:^|\s)(?:PO\d+:|CO\d+:|Outcome\s*\d+:|Objective\s*\d+:)', raw, re.I):
        lines = [l.strip() for l in re.split(r'(?=(?:PO\d+:|CO\d+:|Outcome\s*\d+:|Objective\s*\d+:))', raw, flags=re.I) if l.strip()]
    elif ';' in raw and len([s for s in raw.split(';') if len(s.strip()) > 5]) > 1:
        lines = [s.strip() for s in raw.split(';') if s.strip()]
    else:
        lines = [raw]
        
    if len(lines) <= 1:
        return escape_latex(raw)
        
    res = []
    for l in lines:
        if l:
            res.append(r'\textcolor{brandnavy}{\textbf{\textbullet}} ' + escape_latex(l))
    return r' \newline '.join(res)

def is_meaningful_item(item):
    if not item or not isinstance(item, dict):
        return False
    primary_keys = ['title', 'event', 'subject', 'initiative', 'name', 'nameRoll', 'decisions', 'award', 'platform', 'purpose', 'activity']
    for k in primary_keys:
        val = str(item.get(k, '') or '').strip()
        if len(val) >= 2:
            return True
    return any(len(str(v).strip()) >= 2 for k, v in item.items() if k not in ['status', 'mode', 'deptCode', 'noOfDays', 'link'])

def normalize_syllabus_year_sem(raw):
    if not raw: return '--'
    clean = str(raw).upper().strip()
    if '4-1' in clean or 'IV/I' in clean or 'IV-I' in clean or 'IV EEE' in clean or 'IV/1' in clean or '4/1' in clean:
        return 'IV / I'
    if '3-1' in clean or 'III/I' in clean or 'III-I' in clean or 'III EEE' in clean or 'III/1' in clean or '3/1' in clean:
        return 'III / I'
    if '2-1' in clean or 'II/I' in clean or 'II-I' in clean or 'II EEE' in clean or 'II/1' in clean or '2/1' in clean:
        return 'II / I'
    if '1-1' in clean or 'I/I' in clean or 'I-I' in clean or 'I/1' in clean or '1/1' in clean:
        return 'I / I'
    return str(raw).strip()

def normalize_syllabus_completed(completed, pending=None):
    if not completed: return '--'
    c = str(completed).strip()
    cUpper = c.upper()
    if '100%' in c: return '5 Units (100%)'
    if '95%' in c or '98%' in c: return '4.8 Units (95%)'
    if '90%' in c: return '4.5 Units (90%)'
    if '84%' in c: return '4.2 Units (84%)'
    if '80%' in c: return '4 Units (80%)'
    if '75%' in c: return '3.8 Units (75%)'
    if '70%' in c: return '3.5 Units (70%)'
    if '60%' in c: return '3 Units (60%)'
    if '50%' in c: return '2.5 Units (50%)'
    if '1,2,3,4-50%' in cUpper or '4-50%' in cUpper: return '3.5 Units'
    if '1,2,3,4' in cUpper or 'I,II,III,IV' in cUpper: return '4 Units'
    if '4 UNIT' in cUpper or c == '4' or '4 UNITS' in cUpper: return '4 Units'
    if '3.5' in cUpper or '3.5 UNITS' in cUpper: return '3.5 Units'
    if '1,2,3' in cUpper or 'I,II,III' in cUpper or c == '3' or '3 UNITS' in cUpper or '3 UNIT' in cUpper: return '3 Units'
    if 'I,II' in cUpper or '1,2' in cUpper or c == '2' or '2 UNITS' in cUpper or '2 UNIT' in cUpper: return '2 Units'
    if '1 UNIT' in cUpper or c == '1': return '1 Unit'
    if 'EXPERIMENT' in cUpper: return c
    if 'GENERAL TOPICS' in cUpper: return '100% Completed'
    return c

def normalize_syllabus_pending(completed, pending):
    p = str(pending or '').strip()
    pUpper = p.upper()
    cUpper = str(completed or '').upper().strip()
    if '5-80%' in pUpper or '5-60%' in pUpper or '5-50%' in pUpper or '5 STARTED' in pUpper:
        return 'Unit 5 (In Progress)'
    if '5 UNIT' in pUpper or p == '5' or 'V UNIT' in pUpper or '5TH UNIT' in pUpper or '5 UNIT RUNNING' in pUpper:
        return 'Unit 5'
    if '4,5' in pUpper or '4, 5' in pUpper or 'IV,V' in pUpper or '4 UNIT AND 5' in pUpper or '4 UNIT RUNNING' in pUpper or '4 RUNNING' in pUpper or 'IV RUNNING' in pUpper or 'IV STARTED' in pUpper:
        return 'Units 4 & 5'
    if '3 UNIT RUNNING' in pUpper or '3 RUNNING' in pUpper or 'III RUNNING' in pUpper or 'III STARTED' in pUpper or 'III UNIT 30%' in pUpper:
        return 'Units 3, 4 & 5'
    if 'IV UNIT' in pUpper or p == '4':
        return 'Units 4 & 5'
    if not p or p == '-' or p == 'NIL' or p == '--':
        if cUpper == '4' or '4 UNITS' in cUpper or '1,2,3,4' in cUpper or '80%' in cUpper:
            return 'Unit 5'
        if cUpper == '3.5' or '3.5 UNITS' in cUpper or '70%' in cUpper:
            return 'Unit 4 (50%) & Unit 5'
        if cUpper == '3' or '3 UNITS' in cUpper or '1,2,3' in cUpper or '60%' in cUpper:
            return 'Units 4 & 5'
        if cUpper == '2' or '2 UNITS' in cUpper or '1,2' in cUpper or '50%' in cUpper:
            return 'Units 3, 4 & 5'
        if '100%' in cUpper or cUpper == '5' or 'GENERAL TOPICS' in cUpper:
            return 'Nil (Complete)'
        return '--'
    return p

def normalize_syllabus_remarks(remarks, completed=None):
    r = str(remarks or '').strip()
    if not r or r == '-' or r == 'NIL' or r == '--':
        return 'On Schedule as per Lesson Plan'
    return r

def get_tectonic_bin():
    is_win = sys.platform.startswith('win')
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if is_win:
        candidates = [
            os.path.join(root_dir, 'bin', 'tectonic.exe'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bin', 'tectonic.exe'),
            'tectonic.exe',
            'tectonic'
        ]
    else:
        candidates = [
            os.path.join(root_dir, 'bin', 'tectonic'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bin', 'tectonic'),
            '/usr/local/bin/tectonic',
            '/usr/bin/tectonic',
            'tectonic'
        ]
        
    for p in candidates:
        if os.path.isabs(p) and os.path.exists(p):
            if not is_win:
                try:
                    os.chmod(p, 0o755)
                except Exception:
                    pass
            return p
        if shutil.which(p):
            return p

    # If on Linux / cloud container and tectonic is missing, download standalone static binary
    if not is_win:
        try:
            bin_dir = os.path.join(root_dir, 'bin')
            os.makedirs(bin_dir, exist_ok=True)
            target_bin = os.path.join(bin_dir, 'tectonic')
            if not os.path.exists(target_bin):
                import urllib.request
                import tarfile
                url = "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@0.15.0/tectonic-0.15.0-x86_64-unknown-linux-musl.tar.gz"
                print("Tectonic binary not found on Linux. Downloading standalone binary...", file=sys.stderr)
                tar_path = os.path.join(tempfile.gettempdir(), "tectonic_x86_64_linux.tar.gz")
                urllib.request.urlretrieve(url, tar_path)
                with tarfile.open(tar_path, "r:gz") as tar:
                    for member in tar.getmembers():
                        if member.name == 'tectonic' or member.name.endswith('/tectonic'):
                            member.name = 'tectonic'
                            tar.extract(member, bin_dir)
                            break
            if os.path.exists(target_bin):
                os.chmod(target_bin, 0o755)
                print("Tectonic binary downloaded and configured successfully.", file=sys.stderr)
                return target_bin
        except Exception as e:
            print(f"Notice: Auto-download of tectonic encountered: {e}", file=sys.stderr)

    return 'tectonic'

def get_logo_path():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    candidates = [
        os.path.join(root, 'frontend', 'public', 'assets', 'sse-header-logo.png'),
        os.path.join(root, 'public', 'assets', 'sse-header-logo.png'),
        os.path.join(root, 'assets', 'sse-header-logo.png'),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c.replace('\\', '/')
    return None

def build_latex_document(all_dept_data, period, college_name="SANSKRITHI SCHOOL OF ENGINEERING"):
    escaped_period = escape_latex(period)
    escaped_college = escape_latex(college_name)
    logo_path = get_logo_path()

    def gather_items(sec_key, alt_key=None):
        res = []
        for d_name, sec_data in all_dept_data.items():
            if not isinstance(sec_data, dict):
                continue
            items = sec_data.get(sec_key, [])
            if not items and alt_key:
                items = sec_data.get(alt_key, [])
            if isinstance(items, list):
                for it in items:
                    if is_meaningful_item(it):
                        it_copy = dict(it)
                        it_copy['department'] = d_name
                        it_copy['deptCode'] = get_dept_code(d_name)
                        res.append(it_copy)
        return res

    tex = []
    
    # Document Preamble using geometric sans-serif (Arial / Poppins fallback)
    tex.append(r'''\documentclass[a4paper,8pt]{article}
\usepackage[margin=10mm,top=8mm,bottom=10mm,headheight=18pt,headsep=6pt,includehead,includefoot]{geometry}
\usepackage[scaled=0.92]{helvet}
\renewcommand{\familydefault}{\sfdefault}
\usepackage[table]{xcolor}
\usepackage{colortbl}
\usepackage{longtable}
\usepackage{booktabs}
\usepackage{array}
\usepackage{fancyhdr}
\usepackage{lastpage}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{needspace}
\usepackage{titlesec}
\usepackage{graphicx}

% Color Definitions exactly as specified
\definecolor{brandnavy}{HTML}{1E3A8A}      % Solid navy #1E3A8A
\definecolor{branddark}{HTML}{0F172A}      % Near-black #0F172A
\definecolor{headerdark}{HTML}{1F2937}     % Dark slate #1F2937
\definecolor{brandamber}{HTML}{C2410C}     % Burnt orange #C2410C
\definecolor{brandgreen}{HTML}{15803D}     % Green #15803D
\definecolor{brandborder}{HTML}{E2E8F0}    % Thin light-grey #E2E8F0
\definecolor{rowalt}{HTML}{F8FAFC}         % Very light grey-blue #F8FAFC
\definecolor{slatedark}{HTML}{1E293B}      % Navy-slate #1E293B
\definecolor{slatemed}{HTML}{334155}       % Slate #334155
\definecolor{slatelight}{HTML}{475569}     % Grey #475569
\definecolor{linkblue}{HTML}{1D4ED8}       % Blue #1D4ED8
\definecolor{badgedone}{HTML}{ECFDF5}
\definecolor{colordone}{HTML}{15803D}
\definecolor{badgepending}{HTML}{FFFBEB}
\definecolor{colorpending}{HTML}{C2410C}

% Hyperlinks configuration
\hypersetup{
    colorlinks=true,
    linkcolor=brandnavy,
    filecolor=brandnavy,
    urlcolor=linkblue,
    pdftitle={Institutional HOD Progress Report - ''' + escaped_period + r'''},
    pdfauthor={Sanskrithi School of Engineering}
}

\setlength{\parindent}{0pt}
\setlength{\parskip}{1.5pt}

% Crisp table borders and layout tuning
\arrayrulecolor{brandborder}
\setlength{\arrayrulewidth}{0.65pt}
\setlength{\tabcolsep}{3pt}
\setlength{\LTleft}{0pt}
\setlength{\LTright}{\fill}
\renewcommand{\arraystretch}{1.22}

% Running Header / Footer configuration
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\fontsize{6.5}{8}\selectfont\textbf{\textcolor{slatemed}{SANSKRITHI SCHOOL OF ENGINEERING (AUTONOMOUS)}}}
\fancyhead[R]{\fontsize{6.5}{8}\selectfont\textbf{\textcolor{slatemed}{INSTITUTIONAL HOD PROGRESS REPORT \textbullet\ ''' + escaped_period.upper() + r'''}}}
\fancyfoot[L]{}
\fancyfoot[R]{\fontsize{7}{8.5}\selectfont\textbf{\textcolor{slatemed}{Page \thepage\ of \pageref{LastPage}}}}
\renewcommand{\headrulewidth}{0.6pt}
\renewcommand{\footrulewidth}{0pt}
\renewcommand{\headrule}{\hbox to\headwidth{\color{brandborder}\leaders\hrule height \headrulewidth\hfill}}

% Section title with navy underline
\newcommand{\rendersectionheader}[1]{%
  \vspace{7pt}%
  \noindent%
  {\textbf{\fontsize{8.5}{10.5}\selectfont \textcolor{brandnavy}{#1}}}\par\nopagebreak[4]\vspace{2pt}%
  {\color{brandnavy}\rule{\textwidth}{1.3pt}}\par\nopagebreak[4]\vspace{3pt}\nopagebreak[4]%
}

\begin{document}
''')

    # 1. Page Header (Top)
    logo_element = r'\includegraphics[height=1.05cm]{' + logo_path + r'}' if logo_path else r'{\Large\textbf{\textcolor{brandnavy}{SSE}}}'
    
    tex.append(r'''
\thispagestyle{empty}
\vspace*{-20pt}
\noindent
\begin{tabular*}{\textwidth}{@{}l@{\extracolsep{\fill}}r@{}}
  \parbox{8cm}{
    ''' + logo_element + r'''
  } &
  \parbox{9cm}{\raggedleft
    {\fontsize{9}{11}\selectfont \textbf{\textcolor{headerdark}{SANSKRITHI SCHOOL OF ENGINEERING}}}\\[2pt]
    {\fontsize{7}{9}\selectfont \textbf{\textcolor{brandamber}{AUTONOMOUS}}}
  }
\end{tabular*}
\vspace{2pt}
\noindent{\color{brandnavy}\rule{\textwidth}{1.2pt}}
\vspace{6pt}

{\centering
  {\fontsize{14}{16}\selectfont \textbf{\textcolor{brandnavy}{INSTITUTIONAL HOD PROGRESS REPORT}}}\\[3pt]
  {\fontsize{9}{11}\selectfont \textbf{\textcolor{slatemed}{Comprehensive Performance Dossier \& Departmental Analytics}}}\\[2pt]
  {\fontsize{8}{10}\selectfont \textcolor{slatelight}{Reporting Period: \textbf{\textcolor{branddark}{''' + escaped_period + r'''}}}}\par
}
\vspace{4pt}
''')

    # Helper function for empty rows
    def render_nil_row(col_count):
        return ""

    # Helper function for rendering section tables with full borders
    def render_section(title_text, col_widths, headers, rows_generator, items):
        if not items:
            return ""
        out = []
        out.append(f"\\needspace{{2.8cm}}\n")
        out.append(f"\\rendersectionheader{{{escape_latex(title_text)}}}\n")
        specs = []
        for i, w in enumerate(col_widths):
            if i in [0, 1]:
                specs.append(f">{{\\centering\\arraybackslash}}p{{{w}}}")
            else:
                specs.append(f">{{\\raggedright\\arraybackslash}}p{{{w}}}")
        col_spec = "|" + "|".join(specs) + "|"
        out.append(r"\noindent\begin{longtable}{" + col_spec + r"}" + "\n")
        out.append(r"\hline" + "\n")
        out.append(r"\rowcolor{brandnavy}" + "\n")
        header_cells = [f"\\textbf{{\\textcolor{{white}}{{\\fontsize{{7}}{{8.5}}\\selectfont {escape_latex(h)}}}}}" for h in headers]
        out.append(" & ".join(header_cells) + r" \\ \hline" + "\n")
        out.append(r"\endfirsthead" + "\n")
        out.append(r"\hline" + "\n")
        out.append(r"\rowcolor{brandnavy}" + "\n")
        header_cells_head = [f"\\textbf{{\\textcolor{{white}}{{\\fontsize{{7}}{{8.5}}\\selectfont {escape_latex(h)}}}}}" for h in headers]
        out.append(" & ".join(header_cells_head) + r" \\ \hline" + "\n")
        out.append(r"\endhead" + "\n")
        out.append(r"\endfoot" + "\n")
        out.append(r"\endlastfoot" + "\n")

        for idx, it in enumerate(items):
            bg = r'\rowcolor{rowalt} ' if idx % 2 == 1 else ''
            row_res = rows_generator(it, idx)
            if row_res and isinstance(row_res[0], list):
                for sub_idx, sub_row in enumerate(row_res):
                    sub_bg = bg if sub_idx == 0 else ''
                    sub_row[0] = f"{sub_bg}{sub_row[0]}"
                    out.append(" & ".join(sub_row) + r" \\ \hline" + "\n")
            else:
                row_res[0] = f"{bg}{row_res[0]}"
                out.append(" & ".join(row_res) + r" \\ \hline" + "\n")

        out.append(r"\end{longtable}" + "\n\n")
        return "".join(out)

    # -------------------------------------------------------------
    # 1. Research — a) Journal Publications
    # -------------------------------------------------------------
    j_items = gather_items('journals')
    def gen_j_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled'))}}}}}}}"
        
        details = []
        if it.get('authors'): details.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatemed}}{{Authors:}}}} \\textcolor{{slatelight}}{{{escape_latex(it['authors'])}}}}}")
        if it.get('journalName'): details.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatemed}}{{Journal:}}}} \\textcolor{{slatelight}}{{{escape_latex(it['journalName'])}}} ({escape_latex(it.get('volIssueYear', ''))})}}")
        if it.get('pageNos'): details.append(f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{Pages: {escape_latex(it['pageNos'])}}}}}")
        pub_details = r" \newline ".join(details) if details else r"\textcolor{slatelight}{--}"
        
        verif = []
        if it.get('issnIsbn'): verif.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont ISSN: \\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it['issnIsbn'])}}}}}}}")
        if it.get('indexedIn'):
            idx_in = escape_latex(it['indexedIn'])
            if 'proof' in idx_in.lower():
                verif.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont Indexed: \\textcolor{{linkblue}}{{{idx_in}}}}}")
            else:
                verif.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont Indexed: \\textbf{{\\textcolor{{slatedark}}{{{idx_in}}}}}}}")
        if it.get('link'): verif.append(format_latex_link(it['link'], '[Paper Link]'))
        verif_details = r" \newline ".join(verif) if verif else r"\textcolor{slatelight}{--}"
        return [sno, branch, title, pub_details, verif_details]

    tex.append(render_section(
        '1. RESEARCH — a) JOURNAL PUBLICATIONS',
        ['0.80cm', '1.20cm', '6.70cm', '5.30cm', '3.70cm'],
        ['#', 'Branch', 'Paper Title', 'Authors & Publication Details', 'Indexing & Verification'],
        gen_j_row,
        j_items
    ))

    # -------------------------------------------------------------
    # 1. Research — b) Conference Presentations
    # -------------------------------------------------------------
    c_items = gather_items('conferences')
    def gen_c_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled Presentation'))}}}}}}}"
        
        details = []
        if it.get('authors'): details.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatemed}}{{Authors:}}}} \\textcolor{{slatelight}}{{{escape_latex(it['authors'])}}}}}")
        if it.get('conferenceName'): details.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatemed}}{{Conference:}}}} \\textcolor{{slatelight}}{{{escape_latex(it['conferenceName'])}}}}}")
        sub = []
        if it.get('volIssueYear'): sub.append(f"Issue: {escape_latex(it['volIssueYear'])}")
        if it.get('pageNos'): sub.append(f"Pages: {escape_latex(it['pageNos'])}")
        if it.get('issnIsbn'): sub.append(f"ISBN: {escape_latex(it['issnIsbn'])}")
        if sub: details.append(r"{\fontsize{6.5}{8}\selectfont\textcolor{slatelight}{" + " ".join(sub) + "}}")
        conf_details = r" \newline ".join(details) if details else r"\textcolor{slatelight}{--}"
        
        verif = []
        if it.get('date'): verif.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont Date: \\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it['date'])}}}}}}}")
        loc_val = it.get('location') or it.get('locationMode', '')
        mode_val = it.get('mode', '')
        if loc_val and mode_val and mode_val not in loc_val:
            venue_display = f"{loc_val} ({mode_val})"
        else:
            venue_display = loc_val or mode_val or '-'
        if venue_display and venue_display != '-':
            verif.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont Venue: \\textcolor{{slatelight}}{{{escape_latex(venue_display)}}}}}")
        if it.get('indexedIn'): verif.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont Indexed: \\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it['indexedIn'])}}}}}}}")
        if it.get('link'): verif.append(format_latex_link(it['link'], '[Proceedings]'))
        verif_details = r" \newline ".join(verif) if verif else r"\textcolor{slatelight}{--}"
        return [sno, branch, title, conf_details, verif_details]

    tex.append(render_section(
        '1. RESEARCH — b) CONFERENCE PRESENTATIONS',
        ['0.80cm', '1.20cm', '6.00cm', '5.60cm', '4.10cm'],
        ['#', 'Branch', 'Presentation Title', 'Authors & Conference Details', 'Date, Venue & Indexing'],
        gen_c_row,
        c_items
    ))

    # -------------------------------------------------------------
    # 2. Innovation & Entrepreneurship — a) Patents
    # -------------------------------------------------------------
    pat_items = gather_items('patents')
    def gen_pat_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled Patent'))}}}}}}}"
        inv_lines = []
        if it.get('inventors'):
            inv_lines.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatemed}}{{Inventor/s:}}}} \\textcolor{{slatelight}}{{{escape_latex(it['inventors'])}}}}}")
        if it.get('applicants'):
            inv_lines.append(f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{\\textcolor{{slatemed}}{{Applicant/s:}}}} \\textcolor{{slatelight}}{{{escape_latex(it['applicants'])}}}}}")
        if it.get('patentNumber'):
            inv_lines.append(f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{Pat: {escape_latex(it['patentNumber'])}}}}}")
        inv = r" \newline ".join(inv_lines) if inv_lines else r"\textcolor{slatelight}{--}"
        status = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{brandgreen}}{{{escape_latex(it.get('status', 'Published'))}}}}}}}" + (f" \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('awardedDate', ''))}}}}}" if it.get('awardedDate') else "")
        return [sno, branch, title, inv, status]

    tex.append(render_section(
        '2. INNOVATION & ENTREPRENEURSHIP — a) PATENTS',
        ['0.80cm', '1.20cm', '7.50cm', '5.00cm', '3.20cm'],
        ['#', 'Branch', 'Patent / Innovation Title', 'Inventor/s, Applicant/s & Registration', 'Status & Date'],
        gen_pat_row,
        pat_items
    ))

    # -------------------------------------------------------------
    # 2. Innovation & Entrepreneurship — b) Activities and Initiatives
    # -------------------------------------------------------------
    act_items = gather_items('entrepreneurship')
    def gen_act_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled Activity'))}}}}}}}" + f" \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{Type: {escape_latex(it.get('type', '-'))} \\textbullet\\ {escape_latex(it.get('mode', 'Offline'))}}}}}"
        meta = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('date', '-'))}}}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatemed}}{{By: {escape_latex(it.get('organizedBy', '-'))}}}}}"
        tgt = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('participantsCount', '-'))} parts}}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('participants', '-'))}}}}}"
        outc = f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatemed}}{{Coord: {escape_latex(it.get('mentorCoordinator', '-'))}}}}} \\newline {{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{brandgreen}}{{Status: {escape_latex(it.get('status', 'Completed'))}}}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Report Link]')}" if it.get('link') else "")
        return [sno, branch, title, meta, tgt, outc]

    tex.append(render_section(
        '2. INNOVATION & ENTREPRENEURSHIP — b) ACTIVITIES AND INITIATIVES',
        ['0.80cm', '1.20cm', '5.20cm', '3.40cm', '2.85cm', '4.00cm'],
        ['#', 'Branch', 'Program / Activity Title', 'Date & Organizer', 'Participants', 'Coordinator, Status & Proof'],
        gen_act_row,
        act_items
    ))

    # -------------------------------------------------------------
    # 3. Faculty Development Programs (FDPs) — a) Attended
    # -------------------------------------------------------------
    fdpa_items = gather_items('fdpAttended', 'fdp')
    def gen_fdpa_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled FDP'))}}}}}}}" + f" \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{Type: {escape_latex(it.get('type', 'FDP'))}}}}}"
        org = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('organizingBody', '-'))}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatemed}}{{Dates: {escape_latex(it.get('dates', '-'))} ({escape_latex(it.get('mode', 'Offline'))})}}}}"
        fac = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('facultyAttended', it.get('role', '-')))}}}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Certificate]')}" if it.get('link') else "")
        return [sno, branch, title, org, fac]

    tex.append(render_section(
        '3. FACULTY DEVELOPMENT PROGRAMS (FDPs) — a) ATTENDED',
        ['0.80cm', '1.20cm', '6.20cm', '4.70cm', '4.80cm'],
        ['#', 'Branch', 'Program Title & Type', 'Organizing Body & Dates', 'Faculty Attended & Proof'],
        gen_fdpa_row,
        fdpa_items
    ))

    # -------------------------------------------------------------
    # 3. Faculty Development Programs (FDPs) — b) Organized
    # -------------------------------------------------------------
    fdpo_items = gather_items('fdpOrganized')
    def gen_fdpo_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled FDP Organized'))}}}}}}}" + f" \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{Type: {escape_latex(it.get('type', 'FDP'))} \\textbullet\\ {escape_latex(it.get('dates', '-'))} ({escape_latex(it.get('mode', 'Offline'))})}}}}"
        rp = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('resourcePersonDetails', '-'))}}}}}"
        coords = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('facultyCoordinators', '-'))}}}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Proof Link]')}" if it.get('link') else "")
        return [sno, branch, title, rp, coords]

    tex.append(render_section(
        '3. FACULTY DEVELOPMENT PROGRAMS (FDPs) — b) ORGANIZED',
        ['0.80cm', '1.20cm', '5.60cm', '5.40cm', '4.70cm'],
        ['#', 'Branch', 'Program Title & Type', 'Resource Person Details', 'Coordinators & Proof'],
        gen_fdpo_row,
        fdpo_items
    ))

    # -------------------------------------------------------------
    # 4. Student Development Programs (SDPs)
    # -------------------------------------------------------------
    sdp_items = gather_items('sdp')
    def gen_sdp_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled SDP'))}}}}}}}" + f" \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{Type: {escape_latex(it.get('type', 'Workshop'))}}}}}"
        dt_rp = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('date', '-'))}}}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatemed}}{{{escape_latex(it.get('resourcePerson', '-'))}}}}}"
        mode_str = f" ({escape_latex(it['mode'])})" if it.get('mode') else ""
        parts = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('participantsCount', '-'))} participants{mode_str}}}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Report Link]')}" if it.get('link') else "")
        return [sno, branch, title, dt_rp, parts]

    tex.append(render_section(
        '4. STUDENT DEVELOPMENT PROGRAMS (SDPs)',
        ['0.80cm', '1.20cm', '8.00cm', '4.50cm', '3.00cm'],
        ['#', 'Branch', 'Event Title & Type', 'Date & Resource Person', 'Participants'],
        gen_sdp_row,
        sdp_items
    ))

    # -------------------------------------------------------------
    # 5. Achievements & Recognitions — a) Faculty Achievements
    # -------------------------------------------------------------
    fa_items = gather_items('facultyAchievements')
    def gen_fa_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        fac = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('name', '-'))}}}}}}}"
        awd = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('award', '-'))}}}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Proof Link]')}" if it.get('link') else "")
        ev = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatedark}}{{{escape_latex(it.get('event', '-'))}}}}}"
        org_dt = f" ({escape_latex(it['date'])})" if it.get('date') else ""
        org = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('organization', '-'))}{org_dt}}}}}"
        return [sno, branch, fac, awd, ev, org]

    tex.append(render_section(
        '5. ACHIEVEMENTS & RECOGNITIONS — a) FACULTY ACHIEVEMENTS',
        ['0.80cm', '1.20cm', '3.50cm', '4.50cm', '3.70cm', '4.00cm'],
        ['#', 'Branch', 'Faculty Member', 'Award / Recognition', 'Event / Competition', 'Conferring Body & Date'],
        gen_fa_row,
        fa_items
    ))

    # -------------------------------------------------------------
    # 5. Achievements & Recognitions — b) Student Achievements
    # -------------------------------------------------------------
    sa_items = gather_items('studentAchievements')
    def gen_sa_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        st = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('nameRoll', '-'))}}}}}}}"
        awd = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('award', '-'))}}}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Proof Link]')}" if it.get('link') else "")
        ev_org = f" ({escape_latex(it['organization'])})" if it.get('organization') else ""
        ev = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('event', '-'))}{ev_org}}}}}"
        return [sno, branch, st, awd, ev]

    tex.append(render_section(
        '5. ACHIEVEMENTS & RECOGNITIONS — b) STUDENT ACHIEVEMENTS',
        ['0.80cm', '1.20cm', '5.20cm', '5.50cm', '5.00cm'],
        ['#', 'Branch', 'Student Name & ID', 'Prize / Accomplishment', 'Event & Host Institution'],
        gen_sa_row,
        sa_items
    ))

    # -------------------------------------------------------------
    # 5. Achievements & Recognitions — c) Certifications
    # -------------------------------------------------------------
    cert_items = gather_items('certifications')
    def gen_cert_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled Certification'))}}}}}}}"
        plt = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('platform', '-'))}}}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{Type: {escape_latex(it.get('type', '-'))}}}}}"
        enr = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('duration', '-'))}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{Enrolled: {escape_latex(it.get('enrolled', '-'))}}}}}"
        outc = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{brandgreen}}{{{escape_latex(it.get('certified', '-'))} Certified}}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('keyOutcomes', ''))}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Certificate]')}" if it.get('link') else "")
        return [sno, branch, title, plt, enr, outc]

    tex.append(render_section(
        '5. ACHIEVEMENTS & RECOGNITIONS — c) CERTIFICATIONS',
        ['0.80cm', '1.20cm', '5.80cm', '3.50cm', '2.65cm', '3.50cm'],
        ['#', 'Branch', 'Course / Certification Title', 'Platform & Type', 'Duration & Enrolled', 'Certified & Status'],
        gen_cert_row,
        cert_items
    ))

    # -------------------------------------------------------------
    # 6. Collaborations & MoUs
    # -------------------------------------------------------------
    mou_items = gather_items('mous')
    def gen_mou_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        ptn = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('name', '-'))}}}}}}}"
        dt = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatedark}}{{{escape_latex(it.get('datePeriod', '-'))}}}}}"
        spoc = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('facultySpoc', '-'))}}}}}}}"
        purp = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('purpose', '-'))}}}}}" + (f" \\newline {format_latex_link(it['link'], '[MoU Copy]')}" if it.get('link') else "")
        return [sno, branch, ptn, dt, spoc, purp]

    tex.append(render_section(
        '6. COLLABORATIONS & MOUS',
        ['0.80cm', '1.20cm', '5.40cm', '2.80cm', '2.80cm', '4.45cm'],
        ['#', 'Branch', 'Partner Entity / Industry', 'Date of Signing', 'Faculty SPOC', 'Scope & Focus Area'],
        gen_mou_row,
        mou_items
    ))

    # -------------------------------------------------------------
    # 7. Technical Association Activities
    # -------------------------------------------------------------
    ta_items = gather_items('techAssociation')
    def gen_ta_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        ev = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('event', '-'))}}}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{Type: {escape_latex(it.get('type', '-'))}}}}}"
        dt = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('date', '-'))}}}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatemed}}{{{escape_latex(it.get('resourcePersonCoordinator', '-'))}}}}}"
        outc = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('participants', '-'))}}}}} \\textcolor{{slatelight}}{{participants}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('outcomes', '-'))}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Event Report]')}" if it.get('link') else "")
        return [sno, branch, ev, dt, outc]

    tex.append(render_section(
        '7. TECHNICAL ASSOCIATION ACTIVITIES',
        ['0.80cm', '1.20cm', '5.70cm', '3.50cm', '6.50cm'],
        ['#', 'Branch', 'Association Event & Type', 'Date & Coordinator', 'Participants & Outcomes'],
        gen_ta_row,
        ta_items
    ))

    # -------------------------------------------------------------
    # 8. Syllabus Coverage Report
    # -------------------------------------------------------------
    syl_items = gather_items('syllabus')
    def gen_syl_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        sub = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('subject', 'Untitled Course'))}}}}}}}"
        yr_clean = escape_latex(normalize_syllabus_year_sem(it.get('yearSem', '-')))
        yr = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{yr_clean}}}}}}}"
        fac = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('faculty', '-'))}}}}}"
        
        comp_clean = escape_latex(normalize_syllabus_completed(it.get('completed', '')))
        comp = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{brandgreen}}{{{comp_clean}}}}}}}"
        
        pend_clean = escape_latex(normalize_syllabus_pending(it.get('completed', ''), it.get('pending', '')))
        pend = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{brandamber}}{{{pend_clean}}}}}}}"
        
        rem_clean = escape_latex(normalize_syllabus_remarks(it.get('remarks', '')))
        rem = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textit{{\\textcolor{{slatelight}}{{{rem_clean}}}}}}}"
        return [sno, branch, sub, yr, fac, comp, pend, rem]

    tex.append(render_section(
        '8. SYLLABUS COVERAGE REPORT',
        ['0.70cm', '1.05cm', '4.40cm', '1.15cm', '2.60cm', '2.15cm', '2.15cm', '2.30cm'],
        ['#', 'Branch', 'Course / Subject Title', 'Year / Sem', 'Faculty In-Charge', 'Done (5 Units)', 'Pending / Ongoing', 'Remarks / Status'],
        gen_syl_row,
        syl_items
    ))

    # -------------------------------------------------------------
    # 9. Clubs & Student Engagement Activity
    # -------------------------------------------------------------
    clb_items = gather_items('studentEngagement')
    def gen_clb_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled Activity'))}}}}}}}"
        t_span = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('type', 'Workshop'))}}}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('dates', it.get('noOfDays', '1 day')))}}}}}"
        pts = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{brandgreen}}{{{escape_latex(it.get('participantsCount', '-'))}}}}}}}"
        coord = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('coordinator', '-'))}}}}}}}"
        rem = f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textit{{\\textcolor{{slatelight}}{{{escape_latex(it.get('remarks', '-'))}}}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Club Report]')}" if it.get('link') else "")
        return [sno, branch, title, t_span, pts, coord, rem]

    tex.append(render_section(
        '9. STUDENT ENGAGEMENT & CLUBS',
        ['0.75cm', '1.15cm', '4.50cm', '3.20cm', '1.80cm', '2.60cm', '3.20cm'],
        ['#', 'Branch', 'Activity / Event Title', 'Type & Duration', 'Participants', 'Coordinator', 'Remarks / Outcomes'],
        gen_clb_row,
        clb_items
    ))

    # -------------------------------------------------------------
    # 10. NSS & Community Engagement
    # -------------------------------------------------------------
    nss_items = gather_items('nss')
    def gen_nss_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        ev = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('event', '-'))}}}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{Type: {escape_latex(it.get('type', '-'))}}}}}"
        vn = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('date', '-'))}}}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatemed}}{{Venue: {escape_latex(it.get('venue', '-'))}}}}}"
        ben = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('participantsCount', '-'))} participants}}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('typeOfParticipants', '-'))}}}}}"
        outc = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('outcomes', '-'))}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{\\textcolor{{slatemed}}{{Coord: {escape_latex(it.get('coordinator', '-'))}}}}}}}" + (f" \\newline {format_latex_link(it['link'], '[NSS Report]')}" if it.get('link') else "")
        return [sno, branch, ev, vn, ben, outc]

    tex.append(render_section(
        '10. NSS & COMMUNITY ENGAGEMENT',
        ['0.80cm', '1.20cm', '4.40cm', '3.10cm', '3.00cm', '4.95cm'],
        ['#', 'Branch', 'Event / Activity Name', 'Date & Venue', 'Participants & Target', 'Outcomes & Coord.'],
        gen_nss_row,
        nss_items
    ))

    # -------------------------------------------------------------
    # 11. Additional Relevant Initiatives
    # -------------------------------------------------------------
    add_items = gather_items('additionalInitiatives')
    def gen_add_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', ''))}}}}}}}"
        init = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{escape_latex(it.get('initiative', '-'))}}}}}}}"
        dt = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatedark}}{{{escape_latex(it.get('date', '-'))}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatemed}}{{Coord: {escape_latex(it.get('coordinator', '-'))}}}}}"
        desc = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('description', '-'))}}}}}" + (f" \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{\\textcolor{{brandgreen}}{{Outcome: {escape_latex(it['outcomes'])}}}}}}}" if it.get('outcomes') else "") + (f" \\newline {format_latex_link(it['link'], '[Proof Link]')}" if it.get('link') else "")
        return [sno, branch, init, dt, desc]

    tex.append(render_section(
        '11. ADDITIONAL/OTHER RELEVANT INITIATIVES',
        ['0.80cm', '1.20cm', '5.50cm', '3.20cm', '7.00cm'],
        ['#', 'Branch', 'Initiative / Activity', 'Date & Coordinator', 'Description & Key Outcomes'],
        gen_add_row,
        add_items
    ))

    # -------------------------------------------------------------
    # 12. Minutes of the Meeting (MOM / Institutional Committees)
    # -------------------------------------------------------------
    raw_mom = gather_items('deptMeetings')
    seen_moms = set()
    mom_items = []
    for m in raw_mom:
        m_title = str(m.get('title') or "HoD's Meeting").strip()
        m_date = str(m.get('date', '-')).strip()
        key = (m_title, m_date)
        if key not in seen_moms and is_meaningful_item(m):
            seen_moms.add(key)
            mom_items.append(m)

    def gen_mom_rows(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{idx + 1}}}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{escape_latex(it.get('deptCode', 'MOM'))}}}}}}}"
        m_title = escape_latex(it.get('title') or "HoD's Meeting")
        m_date = escape_latex(it.get('date', '-'))
        mtg_lines = [
            f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{brandnavy}}{{{m_title}}}}}}}",
            f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{slatedark}}{{{m_date}}}}}}}"
        ]
        if it.get('time'):
            mtg_lines.append(f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it['time'])}}}}}")
        if it.get('venue'):
            mtg_lines.append(f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textcolor{{slatelight}}{{Venue: {escape_latex(it['venue'])}}}}}")
        mtg_first = r" \newline ".join(mtg_lines)
        
        pol = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('policyChanges', 'Standard operations and administrative resolutions confirmed.'))}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Proof Link]')}" if it.get('link') else "")

        discussions = it.get('discussions', [])
        if isinstance(discussions, list) and len(discussions) > 0:
            att_prefix = ""
            if it.get('attendees') and isinstance(it['attendees'], list):
                att_names = ", ".join([escape_latex(a.get('name', '')) for a in it['attendees'] if a.get('name')])
                if att_names:
                    att_prefix = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Attendees ({len(it['attendees'])}):}} \\textcolor{{slatelight}}{{{att_names}}}}} \\newline\\vspace{{2pt}} "

            rows = []
            for d_idx, d in enumerate(discussions):
                d_head = escape_latex(d.get('heading', f'Topic {d_idx+1}'))
                raw_det = str(d.get('details', 'Discussed & recorded.')).strip()
                d_det_lines = [l.strip().lstrip('•*-0123456789.) ') for l in raw_det.split('\n') if l.strip()]
                if len(d_det_lines) > 1:
                    det_formatted = r" \newline ".join([r"\textcolor{brandnavy}{\textbf{\textbullet}} {\fontsize{7}{8.5}\selectfont\textcolor{slatelight}{" + escape_latex(l) + "}}" for l in d_det_lines])
                else:
                    det_formatted = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(raw_det)}}}}}"

                disc_cell = (att_prefix if d_idx == 0 else "") + f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{branddark}}{{{d_head}}}}}}}: \\newline {det_formatted}"
                
                if d_idx == 0:
                    rows.append([sno, branch, mtg_first, disc_cell, pol])
                else:
                    rows.append(["", "", r"{\fontsize{6.5}{8}\selectfont\textcolor{slatelight}{(Cont.)}}", disc_cell, ""])
            return rows
        else:
            disc_str = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textcolor{{slatelight}}{{{escape_latex(it.get('decisions', '-'))}}}}}"
            return [[sno, branch, mtg_first, disc_str, pol]]

    if mom_items:
        tex.append(render_section(
            '12. MINUTES OF THE MEETING (MOM)',
            ['0.80cm', '1.20cm', '3.60cm', '8.00cm', '4.10cm'],
            ['#', 'Branch', 'Meeting & Venue', 'Key Decisions & Topics Discussed', 'Policy Directives & Action Plan'],
            gen_mom_rows,
            mom_items
        ))

    # -------------------------------------------------------------
    # Final Sign-Off Block (Last Page)
    # -------------------------------------------------------------
    tex.append(r'''
\needspace{4.5cm}
\vspace{24pt}
\noindent{\color{brandborder}\rule{\textwidth}{1.0pt}}\vspace{18pt}

\noindent
\begin{tabular*}{\textwidth}{@{\extracolsep{\fill}}ccc@{}}
  \parbox{5.2cm}{\centering
    \rule{4.0cm}{1.0pt}\\[3pt]
    \textbf{\fontsize{9}{11}\selectfont \textcolor{branddark}{Dr. Sreenivas Prasad}}\\[1pt]
    {\fontsize{7.5}{9.5}\selectfont \textbf{\textcolor{slatemed}{IQAC Coordinator}}}\\[1pt]
    {\fontsize{6.5}{8}\selectfont \textcolor{slatelight}{Sanskrithi School of Engineering}}
  } &
  \parbox{5.2cm}{\centering
    \rule{4.0cm}{1.0pt}\\[3pt]
    \textbf{\fontsize{9}{11}\selectfont \textcolor{branddark}{Dean of Academics}}\\[1pt]
    {\fontsize{7.5}{9.5}\selectfont \textbf{\textcolor{slatemed}{Academic Governance}}}\\[1pt]
    {\fontsize{6.5}{8}\selectfont \textcolor{slatelight}{Sanskrithi School of Engineering}}
  } &
  \parbox{5.2cm}{\centering
    \rule{4.0cm}{1.0pt}\\[3pt]
    \textbf{\fontsize{9}{11}\selectfont \textcolor{branddark}{Principal}}\\[1pt]
    {\fontsize{7.5}{9.5}\selectfont \textbf{\textcolor{slatemed}{Institutional Endorsement}}}\\[1pt]
    {\fontsize{6.5}{8}\selectfont \textcolor{slatelight}{Sanskrithi School of Engineering}}
  }
\end{tabular*}

\end{document}
''')

    return "".join(tex)

def compile_master_latex_pdf(json_input_path, output_pdf_path):
    with open(json_input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    departments_data = data.get('departmentsData', {})
    period = data.get('period', 'September 2026')
    college_name = data.get('collegeName', 'SANSKRITHI SCHOOL OF ENGINEERING')

    latex_code = build_latex_document(departments_data, period, college_name)

    temp_dir = tempfile.mkdtemp(prefix="consolidated_latex_")
    tex_file = os.path.join(temp_dir, "report.tex")
    
    with open(tex_file, 'w', encoding='utf-8') as f:
        f.write(latex_code)

    tectonic_bin = get_tectonic_bin()
    cmd = [tectonic_bin, "--outdir", temp_dir, tex_file]

    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', errors='replace', check=True)
        compiled_pdf = os.path.join(temp_dir, "report.pdf")
        if os.path.exists(compiled_pdf):
            os.makedirs(os.path.dirname(os.path.abspath(output_pdf_path)), exist_ok=True)
            shutil.copyfile(compiled_pdf, output_pdf_path)
            print(f"Master Consolidated LaTeX PDF compiled successfully to {output_pdf_path}")
            return True
        else:
            print("Error: Compiled PDF not found in temp directory.", file=sys.stderr)
            return False
    except Exception as e:
        print(f"Tectonic compilation failed ({e}), attempting pdflatex/xelatex fallback...", file=sys.stderr)
        latex_cmd = shutil.which('xelatex') or shutil.which('pdflatex')
        if latex_cmd:
            try:
                subprocess.run([latex_cmd, "-interaction=nonstopmode", f"-output-directory={temp_dir}", tex_file], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
                compiled_pdf = os.path.join(temp_dir, "report.pdf")
                if os.path.exists(compiled_pdf):
                    os.makedirs(os.path.dirname(os.path.abspath(output_pdf_path)), exist_ok=True)
                    shutil.copyfile(compiled_pdf, output_pdf_path)
                    print(f"Master Consolidated PDF compiled via {latex_cmd} to {output_pdf_path}")
                    return True
            except Exception as le:
                print(f"Fallback {latex_cmd} failed: {le}", file=sys.stderr)
        return False
    finally:
        try:
            shutil.rmtree(temp_dir)
        except Exception:
            pass

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python generate_consolidated_master_latex.py <input_json> <output_pdf>")
        sys.exit(1)
    
    input_json = sys.argv[1]
    output_pdf = sys.argv[2]

    success = compile_master_latex_pdf(input_json, output_pdf)
    if not success:
        sys.exit(1)
