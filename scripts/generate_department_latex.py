import os
import sys
import json
import re
import subprocess
import shutil
import tempfile

PRESERVED_ACRONYMS = {
    'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'H&S', 'AI', 'ML', 'DS', 'IOT', 'IT',
    'IQAC', 'NSS', 'EDC', 'IIC', 'FDP', 'SDP', 'MOU', 'MOUS', 'IEEE', 'UGC',
    'AICTE', 'NBA', 'NAAC', 'HOD', 'CO', 'PO', 'PEO', 'PSO', 'IV', 'III', 'II', 'I',
    'B.TECH', 'M.TECH', 'PH.D', 'R&D', 'T&P', 'DISCIP', 'MOM', 'ATR', 'PDF', 'DOCX',
    'API', 'URL', 'CAD', 'CAM', 'GIS', 'VLSI', 'MATLAB', 'HTML', 'CSS', 'JS', 'SQL',
    'II-I', 'II-II', 'III-I', 'III-II', 'IV-I', 'IV-II'
}

def format_fixed_caps(text):
    if text is None:
        return ""
    text = str(text)
    if not text.strip():
        return text

    def repl(m):
        tok = m.group(1)
        up = tok.upper()
        if up in PRESERVED_ACRONYMS:
            return up
        if re.match(r'^[A-Za-z]\.?$', tok):
            return tok.upper()
        if re.match(r'^DR\.?$', tok, re.I): return 'Dr.'
        if re.match(r'^MR\.?$', tok, re.I): return 'Mr.'
        if re.match(r'^MS\.?$', tok, re.I): return 'Ms.'
        if re.match(r'^MRS\.?$', tok, re.I): return 'Mrs.'
        if re.match(r'^PROF\.?$', tok, re.I): return 'Prof.'
        if tok == tok.upper() and any(c.isalpha() for c in tok) and len(tok) > 1:
            return tok[0].upper() + tok[1:].lower()
        return tok

    return re.sub(r'([A-Za-z0-9&.\-\/]+)', repl, text)

def escape_latex(text):
    """Escapes special LaTeX characters and handles superscripts, subscripts, power values, and math expressions."""
    if text is None:
        return ""
    text = str(text)
    if not text.strip():
        return ""
    text = format_fixed_caps(text)

    # Clean errant patterns and unicode characters
    text = (text
        .replace('\u2014', '---')  # em dash
        .replace('\u2013', '--')   # en dash
        .replace('\u2212', '-')    # minus
        .replace('\u2018', "'")    # single quotes
        .replace('\u2019', "'")
        .replace('\u201C', '"')    # double quotes
        .replace('\u201D', '"')
        .replace('\u00A0', ' ')    # non-breaking space
        .replace('\u200B', '')     # zero-width space
    )
    text = re.sub(r'/{2,}', '/ ', text)              # double slashes // -> /
    text = re.sub(r'\s+\.\s*([A-Za-z])', r' \1', text) # " .Vinitha" -> " Vinitha"
    text = re.sub(r'\)(\d+\.)', r') \1', text)        # ")6." -> ") 6."

    tokens = {}
    token_idx = 0

    def add_token(latex_str):
        nonlocal token_idx
        key = f'ZZZLATEXTOKEN{token_idx}ZZZ'
        token_idx += 1
        tokens[key] = latex_str
        return key

    # 1. User LaTeX math superscript attempts: $^{...}$, $^{-}$, $^{5}$, $ ^{-} $, $ {-}$, $ - $, $ + $
    text = re.sub(r'\$\s*\^\s*\{([^}]+)\}\s*\$', lambda m: add_token(r'\textsuperscript{' + m.group(1).strip() + r'}'), text)
    text = re.sub(r'\$\s*\^\s*([^\s\$]+)\s*\$', lambda m: add_token(r'\textsuperscript{' + m.group(1).strip() + r'}'), text)
    text = re.sub(r'\$\s*\{([-+0-9a-zA-Z]+)\}\s*\$', lambda m: add_token(r'\textsuperscript{' + m.group(1).strip() + r'}'), text)
    text = re.sub(r'\$\s*([-+])\s*\$', lambda m: add_token(r'\textsuperscript{' + m.group(1).strip() + r'}'), text)

    # 2. User LaTeX math subscript attempts: $_{...}$, $_2$, $ _2 $
    text = re.sub(r'\$\s*_\s*\{([^}]+)\}\s*\$', lambda m: add_token(r'\textsubscript{' + m.group(1).strip() + r'}'), text)
    text = re.sub(r'\$\s*_\s*([^\s\$]+)\s*\$', lambda m: add_token(r'\textsubscript{' + m.group(1).strip() + r'}'), text)

    # 3. General inline math: $10^{-5}$, $10^5$, $CO^{-}$, $CO_2$, etc.
    def math_sub(m):
        content = m.group(1).strip()
        m_pow = re.fullmatch(r'([A-Za-z0-9]+)\s*\^\s*\{?([^}]+)\}?', content)
        if m_pow:
            return m_pow.group(1) + add_token(r'\textsuperscript{' + m_pow.group(2) + r'}')
        m_sub = re.fullmatch(r'([A-Za-z0-9]+)\s*_\s*\{?([^}]+)\}?', content)
        if m_sub:
            return m_sub.group(1) + add_token(r'\textsubscript{' + m_sub.group(2) + r'}')
        return add_token(r'\ensuremath{' + content + r'}')
    text = re.sub(r'\$([^\$]+)\$', math_sub, text)

    # 4. HTML tags <sup> and <sub>
    text = re.sub(r'(?i)<sup>(.*?)</sup>', lambda m: add_token(r'\textsuperscript{' + m.group(1).strip() + r'}'), text)
    text = re.sub(r'(?i)<sub>(.*?)</sub>', lambda m: add_token(r'\textsubscript{' + m.group(1).strip() + r'}'), text)

    # 5. Unicode superscripts: ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ
    sup_map = {
        '\u2070': '0', '\u00B9': '1', '\u00B2': '2', '\u00B3': '3', '\u2074': '4',
        '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9',
        '\u207A': '+', '\u207B': '-', '\u207C': '=', '\u207D': '(', '\u207E': ')',
        '\u207F': 'n', '\u2071': 'i'
    }
    sup_chars = ''.join(sup_map.keys())
    def sup_replace(m):
        chars = m.group(0)
        converted = ''.join(sup_map.get(c, c) for c in chars)
        return add_token(r'\textsuperscript{' + converted + r'}')
    text = re.sub(f'[{re.escape(sup_chars)}]+', sup_replace, text)

    # 6. Unicode subscripts: ₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓᵤ
    sub_map = {
        '\u2080': '0', '\u2081': '1', '\u2082': '2', '\u2083': '3', '\u2084': '4',
        '\u2085': '5', '\u2086': '6', '\u2087': '7', '\u2088': '8', '\u2089': '9',
        '\u208A': '+', '\u208B': '-', '\u208C': '=', '\u208D': '(', '\u208E': ')',
        '\u2090': 'a', '\u2091': 'e', '\u2092': 'o', '\u2093': 'x', '\u2095': 'h',
        '\u2096': 'k', '\u2097': 'l', '\u2098': 'm', '\u2099': 'n', '\u209A': 'p',
        '\u209B': 's', '\u209C': 't'
    }
    sub_chars = ''.join(sub_map.keys())
    def sub_replace(m):
        chars = m.group(0)
        converted = ''.join(sub_map.get(c, c) for c in chars)
        return add_token(r'\textsubscript{' + converted + r'}')
    text = re.sub(f'[{re.escape(sub_chars)}]+', sub_replace, text)

    # 7. Shorthand "10 power 5" or "10 power -5"
    text = re.sub(r'\b(\d+)\s+power\s+([-+]?\d+)\b', lambda m: m.group(1) + add_token(r'\textsuperscript{' + m.group(2) + r'}'), text, flags=re.I)

    # 8. Caret power notation: e.g. 10^5, 10^-5, 10^{-5}, CO^-, CO^+, CO^{2+}, x^2, m^3, km^2
    def caret_replace(m):
        base = m.group(1)
        braced = m.group(3)
        val = braced if braced is not None else m.group(2)
        return base + add_token(r'\textsuperscript{' + val.strip() + r'}')
    text = re.sub(r'([A-Za-z0-9]+)\s*\^\s*(\{([^}]+)\}|[-+]?[0-9a-zA-Z]+|[-+])', caret_replace, text)

    # 9. Subscript notation: CO_{2}, N_2, H_2O, etc.
    text = re.sub(r'([A-Za-z0-9]+)\s*_\s*\{([^}]+)\}', lambda m: m.group(1) + add_token(r'\textsubscript{' + m.group(2).strip() + r'}'), text)
    text = re.sub(r'([A-Z][a-z]?)\s*_\s*([0-9]+)', lambda m: m.group(1) + add_token(r'\textsubscript{' + m.group(2).strip() + r'}'), text)
    # Chemical molecule names with explicit suffix e.g. N2 Molecule, O2 Gas
    text = re.sub(r'\b([A-Z][a-z]?)([0-9]+)\s+(Molecule|Gas|Ion|Atom)\b', lambda m: m.group(1) + add_token(r'\textsubscript{' + m.group(2) + r'}') + f' {m.group(3)}', text, flags=re.I)

    # Standard LaTeX escaping
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

    # Restore protected tokens
    for k, v in tokens.items():
        text = text.replace(k, v)

    # Convert bullet characters to LaTeX \textbullet AFTER backslash/brace escaping
    text = re.sub(r'[\u2022\uf0b7\uf000-\uf0ff]', r'\\textbullet\ ', text)
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
    return r'\href{' + escaped_url + r'}{\textcolor{linkblue}{\underline{\textbf{' + clean_label + r'}}}}'

def format_bullet_points_latex(text, theme_color="brandgreen"):
    if not text or not str(text).strip():
        return ""
    raw = str(text).strip()
    
    lines = []
    if '\n' in raw:
        lines = [l.strip().lstrip('•*-0123456789.) ') for l in raw.split('\n') if l.strip()]
    elif '•' in raw or '▪' in raw or '–' in raw:
        lines = [l.strip() for l in re.split(r'[•▪–]', raw) if l.strip()]
    elif re.search(r'(?:^|\s)(?:PO\d+:|CO\d+:|Outcome\s*\d+:)', raw, re.I):
        lines = [l.strip() for l in re.split(r'(?=(?:PO\d+:|CO\d+:|Outcome\s*\d+:))', raw, flags=re.I) if l.strip()]
    elif ';' in raw and len([s for s in raw.split(';') if len(s.strip()) > 5]) > 1:
        lines = [s.strip() for s in raw.split(';') if s.strip()]
    else:
        lines = [raw]
        
    if not lines:
        return ""
        
    res = []
    for l in lines:
        if l:
            res.append(f"\\textcolor{{{theme_color}}}{{\\textbf{{\\textbullet}}}} " + escape_latex(l))
    return r' \\newline '.join(res)

def is_meaningful(item):
    if not item or not isinstance(item, dict):
        return False
    primary_keys = ['title', 'event', 'subject', 'initiative', 'name', 'nameRoll', 'decisions', 'award', 'platform', 'purpose', 'activity']
    for k in primary_keys:
        val = str(item.get(k, '') or '').strip()
        if len(val) >= 2:
            return True
    return any(len(str(v).strip()) >= 2 for k, v in item.items() if k not in ['status', 'mode', 'deptCode', 'noOfDays', 'link'])

def get_tectonic_bin():
    is_win = sys.platform.startswith('win')
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    candidates = [
        os.path.join(root_dir, 'bin', 'tectonic.exe'),
        os.path.join(root_dir, 'backend', 'bin', 'tectonic.exe'),
        os.path.join(root_dir, 'bin', 'tectonic'),
        os.path.join(root_dir, 'backend', 'bin', 'tectonic'),
        'tectonic.exe' if is_win else 'tectonic'
    ]
        
    for p in candidates:
        if os.path.isabs(p) and os.path.exists(p):
            return p
        if shutil.which(p):
            return p

    return 'tectonic.exe' if is_win else 'tectonic'

def get_logo_path():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    candidates = [
        os.path.join(root, 'backend', 'assets', 'sse-header-logo.png'),
        os.path.join(root, 'frontend', 'public', 'assets', 'sse-header-logo.png'),
        os.path.join(root, 'public', 'assets', 'sse-header-logo.png'),
        os.path.join(root, 'assets', 'sse-header-logo.png'),
        os.path.join(os.getcwd(), 'backend', 'assets', 'sse-header-logo.png'),
        os.path.join(os.getcwd(), 'frontend', 'public', 'assets', 'sse-header-logo.png'),
        os.path.join(os.getcwd(), 'assets', 'sse-header-logo.png'),
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return None

def generate_department_latex_document(data, has_logo=True):
    dept = data.get('department', 'Civil Engineering')
    period = data.get('period', 'September 2026')
    hod_name = data.get('hodName', 'Head of the Department')
    submission_date = data.get('submissionDate', '30/09/2026')
    college_name = data.get('collegeName', 'SANSKRITHI SCHOOL OF ENGINEERING')
    sections = data.get('sections', {})

    escaped_dept = escape_latex(dept)
    escaped_period = escape_latex(period)
    escaped_hod = escape_latex(hod_name)
    escaped_sub_date = escape_latex(submission_date)
    escaped_college = escape_latex(college_name)

    # Calculate summary metrics
    journals_list = [it for it in sections.get('journals', []) if is_meaningful(it)]
    conferences_list = [it for it in sections.get('conferences', []) if is_meaningful(it)]
    patents_list = [it for it in sections.get('patents', []) if is_meaningful(it)]
    entrepreneurship_list = [it for it in sections.get('entrepreneurship', []) if is_meaningful(it)]
    fdp_att_list = [it for it in (sections.get('fdpAttended', []) or sections.get('fdp', [])) if is_meaningful(it)]
    fdp_org_list = [it for it in sections.get('fdpOrganized', []) if is_meaningful(it)]
    sdp_list = [it for it in sections.get('sdp', []) if is_meaningful(it)]
    fa_list = [it for it in sections.get('facultyAchievements', []) if is_meaningful(it)]
    sa_list = [it for it in sections.get('studentAchievements', []) if is_meaningful(it)]
    cert_list = [it for it in sections.get('certifications', []) if is_meaningful(it)]
    mous_list = [it for it in sections.get('mous', []) if is_meaningful(it)]
    ta_list = [it for it in sections.get('techAssociation', []) if is_meaningful(it)]
    syllabus_list = [it for it in sections.get('syllabus', []) if is_meaningful(it)]
    clubs_list = [it for it in sections.get('studentEngagement', []) if is_meaningful(it)]
    nss_list = [it for it in sections.get('nss', []) if is_meaningful(it)]
    add_list = [it for it in sections.get('additionalInitiatives', []) if is_meaningful(it)]
    mom_list = [it for it in sections.get('deptMeetings', []) if is_meaningful(it)]

    total_activities = sum(len(arr) for arr in [
        journals_list, conferences_list, patents_list, entrepreneurship_list,
        fdp_att_list, fdp_org_list, sdp_list, fa_list, sa_list, cert_list,
        mous_list, ta_list, syllabus_list, clubs_list, nss_list, add_list, mom_list
    ])
    total_pubs = len(journals_list) + len(conferences_list)
    total_courses = len(syllabus_list)

    tex = []
    tex.append(r'''\documentclass[a4paper,9pt]{article}
\usepackage[margin=10mm,top=7mm,bottom=10mm,headheight=11pt,headsep=6pt,includehead,includefoot]{geometry}
\usepackage{libertinus}
\usepackage[table]{xcolor}
\usepackage{longtable}
\usepackage{booktabs}
\usepackage{array}
\usepackage{fancyhdr}
\usepackage{lastpage}
\usepackage{hyperref}
\usepackage{colortbl}
\usepackage{graphicx}


\definecolor{brandnavy}{HTML}{1A365D}
\definecolor{brandblue}{HTML}{2563EB}
\definecolor{branddark}{HTML}{000000}
\definecolor{brandamber}{HTML}{C2410C}
\definecolor{brandgreen}{HTML}{047857}
\definecolor{brandborder}{HTML}{CBD5E1}
\definecolor{rowalt}{HTML}{F8FAFC}
\definecolor{slatedark}{HTML}{000000}
\definecolor{slatelight}{HTML}{000000}
\definecolor{linkblue}{HTML}{1D4ED8}
\definecolor{badgebg}{HTML}{EFF6FF}

% Distinct Category Colors matching HODProfessionalPDFView
\definecolor{themeJournals}{HTML}{1E3A8A}
\definecolor{themePatents}{HTML}{6B21A8}
\definecolor{themeEntrepreneurship}{HTML}{0F766E}
\definecolor{themeFdp}{HTML}{0369A1}
\definecolor{themeSdp}{HTML}{047857}
\definecolor{themeAchievements}{HTML}{B45309}
\definecolor{themeMous}{HTML}{4338CA}
\definecolor{themeTechAssoc}{HTML}{0E7490}
\definecolor{themeSyllabus}{HTML}{1D4ED8}
\definecolor{themeClubs}{HTML}{BE123C}
\definecolor{themeNss}{HTML}{15803D}
\definecolor{themeAdditional}{HTML}{4F46E5}
\definecolor{themeMeetings}{HTML}{1E293B}

\hypersetup{
    colorlinks=true,
    linkcolor=brandnavy,
    filecolor=brandblue,
    urlcolor=linkblue,
    pdftitle={''' + escaped_dept + r''' Monthly Report - ''' + escaped_period + r'''},
    pdfauthor={Sanskrithi School of Engineering}
}

\setlength{\parindent}{0pt}
\setlength{\parskip}{1.5pt}

% Crisp table borders and layout tuning
\arrayrulecolor{brandborder}
\setlength{\arrayrulewidth}{0.8pt}
\setlength{\tabcolsep}{3.5pt}
\setlength{\LTleft}{0pt}
\setlength{\LTright}{\fill}
\renewcommand{\arraystretch}{1.25}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\fontsize{8}{9.5}\selectfont\textbf{\textcolor{slatedark}{SANSKRITHI SCHOOL OF ENGINEERING (AUTONOMOUS)}}}
\fancyhead[R]{\fontsize{8}{9.5}\selectfont\textcolor{slatedark}{DEPARTMENT OF ''' + escaped_dept.upper() + r''' \textbullet\ ''' + escaped_period.upper() + r'''}}
\fancyfoot[L]{}
\fancyfoot[R]{\fontsize{8}{9.5}\selectfont\textbf{\textcolor{slatedark}{Page \thepage\ of \pageref{LastPage}}}}
\renewcommand{\headrulewidth}{0.8pt}
\renewcommand{\footrulewidth}{0.6pt}

% Section title bar with left colored pill + underline rule
\newcommand{\deptsectionheader}[3]{%
  \vspace{8pt}%
  \noindent%
  \begin{tabular}{@{}l@{\hspace{5pt}}l@{}}
    \textcolor{#1}{\rule{3.5pt}{10pt}} & \textbf{\fontsize{9.5}{11}\selectfont \textcolor{#1}{#2 (#3)}} \\
  \end{tabular}\\[-2pt]%
  {\color{#1}\rule{\textwidth}{1.5pt}}\vspace{4pt}%
}

\begin{document}
''')

    # 1. Official Header matching HODProfessionalPDFView.tsx without wasted top margin
    logo_element = r'\includegraphics[height=1.2cm]{sse-header-logo.png}' if has_logo else r'{\Large\textbf{\textcolor{brandnavy}{SSE}}}'
    
    tex.append(r'''
\thispagestyle{empty}
\vspace*{-20pt}
\noindent
\begin{tabular*}{\textwidth}{@{}l@{\extracolsep{\fill}}r@{}}
  \parbox{8.5cm}{
    ''' + logo_element + r'''
  } &
  \parbox{8.5cm}{\raggedleft
    {\fontsize{10.5}{12}\selectfont \textbf{\textcolor{branddark}{DEPARTMENT OF ''' + escaped_dept.upper() + r'''}}}\\[2pt]
    {\fontsize{8.5}{10}\selectfont \textbf{\textcolor{brandamber}{AUTONOMOUS}}}
  }
\end{tabular*}
\vspace{2pt}
\noindent{\color{branddark}\rule{\textwidth}{2pt}}
\vspace{6pt}

% Title block
{\centering
  {\fontsize{14}{16}\selectfont \textbf{\textcolor{brandnavy}{MONTHLY DEPARTMENTAL PROGRESS REPORT}}}\\[2pt]
  {\fontsize{11}{13}\selectfont \textbf{\textcolor{branddark}{Department of ''' + escaped_dept + r'''}}}\\[2pt]
  {\fontsize{9}{10.5}\selectfont \textcolor{slatedark}{Reporting Period: ''' + escaped_period + r''' \quad\textbullet\quad Date of Submission: ''' + escaped_sub_date + r'''}}\\[4pt]
\par}
\vspace{6pt}

% Department Profile Overview Table
\noindent{\fontsize{9}{11}\selectfont \textbf{\textcolor{brandnavy}{REPORTING OVERVIEW \& DEPARTMENT PROFILE}}}\\[-2pt]
{\color{brandnavy}\rule{\textwidth}{1.2pt}}\vspace{4pt}

\noindent\begin{tabular}{|p{4.8cm}|p{12.2cm}|}
\hline
\rowcolor{rowalt} \textbf{\textcolor{brandnavy}{Department Name}} & \textbf{\textcolor{branddark}{Department of ''' + escaped_dept + r'''}} \\ \hline
\rowcolor{rowalt} \textbf{\textcolor{brandnavy}{Head of Department (HOD)}} & \textcolor{slatedark}{''' + escaped_hod + r'''} \\ \hline
\rowcolor{rowalt} \textbf{\textcolor{brandnavy}{Reporting Cycle Period}} & \textcolor{slatedark}{''' + escaped_period + r'''} \\ \hline
\rowcolor{rowalt} \textbf{\textcolor{brandnavy}{Date of Submission}} & \textcolor{slatedark}{''' + escaped_sub_date + r'''} \\ \hline
\rowcolor{rowalt} \textbf{\textcolor{brandnavy}{Activities Summary}} & \textbf{\textcolor{branddark}{''' + str(total_activities) + r''' recorded activities \textbullet\ ''' + str(total_pubs) + r''' Publications \textbullet\ ''' + str(total_courses) + r''' Syllabus Course(s)}} \\ \hline
\end{tabular}
\vspace{10pt}
''')

    # Helper for rendering activity card items matching HODProfessionalPDFView
    def render_items_list(items, renderer):
        out = []
        for idx, it in enumerate(items):
            sno_str = f"{idx + 1:02d}"
            content = renderer(it, idx)
            out.append(r'''
\noindent
\begin{tabular}{@{}p{0.7cm}@{\hspace{6pt}}p{16.0cm}@{}}
  \textbf{\textcolor{brandnavy}{''' + sno_str + r'''}} & 
  \parbox{16.0cm}{''' + content + r'''}
\end{tabular}
\vspace{2pt}
\noindent{\color{brandborder}\rule{\textwidth}{0.6pt}}\vspace{4pt}
''')
        return "".join(out)

    # 1A. Journal Publications
    if journals_list:
        tex.append(f"\\deptsectionheader{{themeJournals}}{{1. RESEARCH --- a) JOURNAL PUBLICATIONS}}{{{len(journals_list)}}}\n")
        def render_journal(it, idx):
            t = f"\\textbf{{\\fontsize{9.5}{11}\\selectfont \\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled Article'))}}}}}\\\\"
            a_j = f"\\textcolor{{slatedark}}{{\\textbf{{Author(s):}} {escape_latex(it.get('authors', '-'))} \\quad\\textbullet\\quad \\textbf{{Journal:}} {escape_latex(it.get('journalName', '-'))}}}\\\\"
            sub = []
            if it.get('issnIsbn'): sub.append(f"\\textbf{{ISSN/ISBN:}} {escape_latex(it['issnIsbn'])}")
            if it.get('volIssueYear'): sub.append(f"\\textbf{{Issue:}} {escape_latex(it['volIssueYear'])}")
            if it.get('pageNos'): sub.append(f"\\textbf{{Pages:}} {escape_latex(it['pageNos'])}")
            if it.get('indexedIn'): sub.append(f"\\textbf{{\\textcolor{{brandnavy}}{{Indexed in: {escape_latex(it['indexedIn'])}}}}}")
            sub_line = (" \\quad ".join(sub) + "\\\\") if sub else ""
            link_line = f"\\textbf{{Paper Link / DOI:}} {format_latex_link(it['link'], '[Paper Link / DOI]')}" if it.get('link') else ""
            return t + a_j + sub_line + link_line
        tex.append(render_items_list(journals_list, render_journal))

    # 1B. Conference Presentations
    if conferences_list:
        tex.append(f"\\deptsectionheader{{themeJournals}}{{1. RESEARCH --- b) CONFERENCE PRESENTATIONS}}{{{len(conferences_list)}}}\n")
        def render_conf(it, idx):
            t = f"\\textbf{{\\fontsize{9.5}{11}\\selectfont \\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled Presentation'))}}}}}\\\\"
            a_c = f"\\textcolor{{slatedark}}{{\\textbf{{Author(s):}} {escape_latex(it.get('authors', '-'))} \\quad\\textbullet\\quad \\textbf{{Conference:}} {escape_latex(it.get('conferenceName', '-'))}}}\\\\"
            sub = []
            if it.get('date'): sub.append(f"\\textbf{{Date:}} {escape_latex(it['date'])}")
            if it.get('locationMode'): sub.append(f"\\textbf{{Venue:}} {escape_latex(it['locationMode'])}")
            if it.get('volIssueYear'): sub.append(f"\\textbf{{Issue:}} {escape_latex(it['volIssueYear'])}")
            if it.get('pageNos'): sub.append(f"\\textbf{{Pages:}} {escape_latex(it['pageNos'])}")
            if it.get('issnIsbn'): sub.append(f"\\textbf{{ISBN:}} {escape_latex(it['issnIsbn'])}")
            if it.get('indexedIn'): sub.append(f"\\textbf{{\\textcolor{{brandnavy}}{{Indexing: {escape_latex(it['indexedIn'])}}}}}")
            sub_line = (" \\quad ".join(sub) + "\\\\") if sub else ""
            link_line = f"\\textbf{{Proceedings Link:}} {format_latex_link(it['link'], '[Proceedings Link]')}" if it.get('link') else ""
            return t + a_c + sub_line + link_line
        tex.append(render_items_list(conferences_list, render_conf))

    # 2A. Patents
    if patents_list:
        tex.append(f"\\deptsectionheader{{themePatents}}{{2A. PATENTS}}{{{len(patents_list)}}}\n")
        def render_pat(it, idx):
            t = f"\\textbf{{\\fontsize{9.5}{11}\\selectfont \\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled Patent'))}}}}}\\\\"
            inv = f"\\textcolor{{slatedark}}{{\\textbf{{Inventors:}} {escape_latex(it.get('inventors', '-'))} \\quad\\textbullet\\quad \\textbf{{Applicants:}} {escape_latex(it.get('applicants', '-'))}}}\\\\"
            meta = f"\\textcolor{{slatelight}}{{\\textbf{{Patent No:}} {escape_latex(it.get('patentNumber', '-'))} \\quad|\\quad \\textbf{{Status:}} \\textbf{{{escape_latex(it.get('status', 'Published'))}}} \\quad|\\quad \\textbf{{Date:}} {escape_latex(it.get('awardedDate', '-'))}}}"
            return t + inv + meta
        tex.append(render_items_list(patents_list, render_pat))

    # 2B. Activities and Initiatives
    if entrepreneurship_list:
        tex.append(f"\\deptsectionheader{{themeEntrepreneurship}}{{2B. ACTIVITIES AND INITIATIVES}}{{{len(entrepreneurship_list)}}}\n")
        def render_ent(it, idx):
            t = f"\\textbf{{\\fontsize{9.5}{11}\\selectfont \\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled Activity'))}}}}}\\\\"
            dt = f"\\textcolor{{slatedark}}{{\\textbf{{Date:}} {escape_latex(it.get('date', '-'))} \\quad\\textbullet\\quad \\textbf{{Type:}} {escape_latex(it.get('type', '-'))} \\quad\\textbullet\\quad \\textbf{{Mode:}} {escape_latex(it.get('mode', 'Offline'))} ({escape_latex(it.get('participantsCount', '-'))} participants)}}\\\\"
            org = f"\\textcolor{{slatelight}}{{\\textbf{{Organized By:}} {escape_latex(it.get('organizedBy', '-'))} \\quad\\textbullet\\quad \\textbf{{Target:}} {escape_latex(it.get('participants', '-'))} \\quad\\textbullet\\quad \\textbf{{\\textcolor{{brandnavy}}{{Coordinator:}}}} {escape_latex(it.get('mentorCoordinator', '-'))}}}\\\\"
            st = f"\\textbf{{Status:}} \\textcolor{{brandgreen}}{{\\textbf{{{escape_latex(it.get('status', 'Completed'))}}}}}" + (f" \\quad\\textbullet\\quad \\textbf{{Proof:}} {format_latex_link(it['link'], '[Report / Proof]')}" if it.get('link') else "")
            return t + dt + org + st
        tex.append(render_items_list(entrepreneurship_list, render_ent))

    # 3A. FDPs Attended
    if fdp_att_list:
        tex.append(f"\\deptsectionheader{{themeFdp}}{{3A. FACULTY DEVELOPMENT PROGRAMS (FDPS) — ATTENDED}}{{{len(fdp_att_list)}}}\n")
        def render_fdpa(it, idx):
            t = f"\\textbf{{\\fontsize{9.5}{11}\\selectfont \\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled FDP'))}}}}}\\\\"
            dt = f"\\textcolor{{slatedark}}{{\\textbf{{Type:}} {escape_latex(it.get('type', 'FDP'))} \\quad\\textbullet\\quad \\textbf{{Dates:}} {escape_latex(it.get('dates', '-'))} \\quad\\textbullet\\quad \\textbf{{Mode:}} {escape_latex(it.get('mode', 'Offline'))}}}\\\\"
            org = f"\\textcolor{{slatelight}}{{\\textbf{{Organizing Body:}} {escape_latex(it.get('organizingBody', '-'))} \\quad\\textbullet\\quad \\textbf{{\\textcolor{{brandnavy}}{{Faculty Attended:}}}} {escape_latex(it.get('facultyAttended', it.get('role', '-')))}}}" + (f"\\\\\\textbf{{Certificate Link:}} {format_latex_link(it['link'], '[Certificate Link]')}" if it.get('link') else "")
            return t + dt + org
        tex.append(render_items_list(fdp_att_list, render_fdpa))

    # 3B. FDPs Organized
    if fdp_org_list:
        tex.append(f"\\deptsectionheader{{themeFdp}}{{3B. FACULTY DEVELOPMENT PROGRAMS (FDPS) — ORGANIZED}}{{{len(fdp_org_list)}}}\n")
        def render_fdpo(it, idx):
            t = f"\\textbf{{\\fontsize{9.5}{11}\\selectfont \\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled FDP Organized'))}}}}}\\\\"
            dt = f"\\textcolor{{slatedark}}{{\\textbf{{Type:}} {escape_latex(it.get('type', 'FDP'))} \\quad\\textbullet\\quad \\textbf{{Dates:}} {escape_latex(it.get('dates', '-'))} \\quad\\textbullet\\quad \\textbf{{Dept:}} {escape_latex(it.get('deptOrganized', dept))} ({escape_latex(it.get('mode', 'Offline'))})}}\\\\"
            rp = f"\\textcolor{{slatelight}}{{\\textbf{{Resource Person:}} {escape_latex(it.get('resourcePersonDetails', '-'))}}}\\\\"
            coord = f"\\textcolor{{brandnavy}}{{\\textbf{{Coordinators:}} {escape_latex(it.get('facultyCoordinators', '-'))}}}" + (f" \\quad\\textbullet\\quad \\textbf{{Proof:}} {format_latex_link(it['link'], '[Proof Link]')}" if it.get('link') else "")
            return t + dt + rp + coord
        tex.append(render_items_list(fdp_org_list, render_fdpo))

    # 4. SDPs
    if sdp_list:
        tex.append(f"\\deptsectionheader{{themeSdp}}{{4. STUDENT DEVELOPMENT PROGRAMS (SDPS)}}{{{len(sdp_list)}}}\n")
        def render_sdp(it, idx):
            t = f"\\textbf{{\\fontsize{9.5}{11}\\selectfont \\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled SDP'))}}}}}\\\\"
            dt = f"\\textcolor{{slatedark}}{{\\textbf{{Date:}} {escape_latex(it.get('date', '-'))} \\quad\\textbullet\\quad \\textbf{{Type:}} {escape_latex(it.get('type', 'SDP'))} \\quad\\textbullet\\quad \\textbf{{Resource Person:}} {escape_latex(it.get('resourcePerson', '-'))} \\quad\\textbullet\\quad \\textbf{{Participants:}} {escape_latex(it.get('participantsCount', '-'))} ({escape_latex(it.get('mode', 'Offline'))})}}\\\\"
            coord_line = (f"\\textcolor{{brandnavy}}{{\\textbf{{Coordinator:}} {escape_latex(it['coordinator'])}}}\\\\" if it.get('coordinator') else "")
            pts = format_bullet_points_latex(it.get('keyOutcomes', ''), 'themeSdp')
            pts_line = (f"\\textbf{{Key Outcomes:}}\\\\{pts}\\\\" if pts else "")
            link_line = f"\\textbf{{Proof Link:}} {format_latex_link(it['link'], '[Report / Proof Link]')}" if it.get('link') else ""
            return t + dt + coord_line + pts_line + link_line
        tex.append(render_items_list(sdp_list, render_sdp))

    # 5. Honors, Awards & Certifications
    if fa_list or sa_list or cert_list:
        total_5 = len(fa_list) + len(sa_list) + len(cert_list)
        tex.append(f"\\deptsectionheader{{themeAchievements}}{{5. HONORS, AWARDS \\& CERTIFICATIONS}}{{{total_5}}}\n")
        honors_out = []
        for fa in fa_list:
            link = f" {format_latex_link(fa['link'], '[Proof Link]')}" if fa.get('link') else ""
            honors_out.append(f"\\noindent \\textbf{{\\textcolor{{brandnavy}}{{Faculty Honor:}}}} {escape_latex(fa.get('name', '-'))} --- \\textbf{{{escape_latex(fa.get('award', '-'))}}} ({escape_latex(fa.get('organization', '-'))}, {escape_latex(fa.get('date', '-'))}){link}\\\\[2pt]")
        for sa in sa_list:
            honors_out.append(f"\\noindent \\textbf{{\\textcolor{{brandnavy}}{{Student Honor:}}}} {escape_latex(sa.get('nameRoll', '-'))} --- \\textbf{{{escape_latex(sa.get('award', '-'))}}} at {escape_latex(sa.get('event', '-'))} ({escape_latex(sa.get('organization', '-'))}, {escape_latex(sa.get('durationDate', '-'))})\\\\[2pt]")
        for c in cert_list:
            honors_out.append(f"\\noindent \\textbf{{\\textcolor{{brandnavy}}{{Certification:}}}} \\textbf{{{escape_latex(c.get('title', '-'))}}} ({escape_latex(c.get('type', '-'))}) on {escape_latex(c.get('platform', '-'))} --- \\textbf{{\\textcolor{{brandgreen}}{{Certified: {escape_latex(c.get('certified', '-'))}}}}}\\\\[2pt]")
        tex.append("".join(honors_out) + "\n\\vspace{6pt}\n")

    # 6. MoUs & Collaborations
    if mous_list:
        tex.append(f"\\deptsectionheader{{themeMous}}{{6. COLLABORATIONS \\& MOUS}}{{{len(mous_list)}}}\n")
        def render_mou(it, idx):
            t = f"\\textbf{{\\fontsize{9.5}{11}\\selectfont \\textcolor{{branddark}}{{{escape_latex(it.get('name', 'Partner Institution'))}}}}}\\\\"
            p = f"\\textcolor{{slatedark}}{{\\textbf{{Purpose:}} {escape_latex(it.get('purpose', '-'))}}}\\\\"
            s = f"\\textcolor{{slatelight}}{{\\textbf{{Period:}} {escape_latex(it.get('datePeriod', '-'))} \\quad\\textbullet\\quad \\textbf{{SPOC:}} {escape_latex(it.get('facultySpoc', '-'))}}}"
            return t + p + s
        tex.append(render_items_list(mous_list, render_mou))

    # 7. Technical Association Activities
    if ta_list:
        tex.append(f"\\deptsectionheader{{themeTechAssoc}}{{7. TECHNICAL ASSOCIATION ACTIVITIES}}{{{len(ta_list)}}}\n")
        def render_ta(it, idx):
            t = f"\\textbf{{\\fontsize{9.5}{11}\\selectfont \\textcolor{{branddark}}{{{escape_latex(it.get('event', 'Untitled Association Event'))}}}}}\\\\"
            dt = f"\\textcolor{{slatedark}}{{\\textbf{{Date:}} {escape_latex(it.get('date', '-'))} \\quad\\textbullet\\quad \\textbf{{Type:}} {escape_latex(it.get('type', '-'))} \\quad\\textbullet\\quad \\textbf{{Participants:}} {escape_latex(it.get('participants', '-'))}}}\\\\"
            rp = f"\\textcolor{{slatelight}}{{\\textbf{{Resource Person / Coord:}} {escape_latex(it.get('resourcePersonCoordinator', '-'))}}}\\\\"
            outc = f"\\textbf{{Outcomes:}} {escape_latex(it.get('outcomes', '-'))}"
            return t + dt + rp + outc
        tex.append(render_items_list(ta_list, render_ta))

    # 8. Syllabus Coverage Report
    if syllabus_list:
        tex.append(f"\\deptsectionheader{{themeSyllabus}}{{8. SYLLABUS COVERAGE REPORT}}{{{len(syllabus_list)}}}\n")
        tex.append(r'''
\begin{longtable}{|p{0.7cm}|p{5.5cm}|p{2.0cm}|p{3.8cm}|p{2.4cm}|p{2.4cm}|}
\hline
\rowcolor{themeSyllabus}
\textbf{\textcolor{white}{S.No}} & 
\textbf{\textcolor{white}{Subject Name}} & 
\textbf{\textcolor{white}{Year / Sem}} & 
\textbf{\textcolor{white}{Faculty}} & 
\textbf{\textcolor{white}{Completed}} & 
\textbf{\textcolor{white}{Pending}} \\
\hline
\endfirsthead
\hline
\rowcolor{themeSyllabus}
\textbf{\textcolor{white}{S.No}} & 
\textbf{\textcolor{white}{Subject Name}} & 
\textbf{\textcolor{white}{Year / Sem}} & 
\textbf{\textcolor{white}{Faculty}} & 
\textbf{\textcolor{white}{Completed}} & 
\textbf{\textcolor{white}{Pending}} \\
\hline
\endhead
\hline
\endfoot
''')
        for idx, it in enumerate(syllabus_list):
            bg = r'\rowcolor{rowalt} ' if idx % 2 == 1 else ''
            sno = f"{bg}\\centering {idx + 1}"
            sub = f"\\textbf{{{escape_latex(it.get('subject', '-'))}}}"
            yr = f"\\centering {escape_latex(it.get('yearSem', '-'))}"
            fac = escape_latex(it.get('faculty', '-'))
            comp = f"\\textbf{{\\textcolor{{brandnavy}}{{{escape_latex(it.get('completed', '-'))}}}}}"
            pend = escape_latex(it.get('pending', '-'))
            tex.append(f"{sno} & {sub} & {yr} & {fac} & {comp} & {pend} \\\\ \\hline\n")
        tex.append(r"\end{longtable}" + "\n\n")

    # 9. Clubs & Student Engagement Activity
    if clubs_list:
        tex.append(f"\\deptsectionheader{{themeClubs}}{{9. CLUBS \\& STUDENT ENGAGEMENT ACTIVITY}}{{{len(clubs_list)}}}\n")
        def render_club(it, idx):
            t = f"\\textbf{{\\fontsize{9.5}{11}\\selectfont \\textcolor{{branddark}}{{{escape_latex(it.get('title', 'Untitled Activity'))}}}}}\\\\"
            dt = f"\\textcolor{{slatedark}}{{\\textbf{{Type:}} {escape_latex(it.get('type', 'Workshop'))} ({escape_latex(it.get('noOfDays', '1 day'))}) \\quad\\textbullet\\quad \\textbf{{Dates:}} {escape_latex(it.get('dates', '-'))} \\quad\\textbullet\\quad \\textbf{{Participants:}} {escape_latex(it.get('participantsCount', '-'))}}}\\\\"
            coord = f"\\textcolor{{slatelight}}{{\\textbf{{Coordinator:}} {escape_latex(it.get('coordinator', '-'))} \\quad\\textbullet\\quad \\textbf{{Remarks:}} {escape_latex(it.get('remarks', '-'))}}}"
            return t + dt + coord
        tex.append(render_items_list(clubs_list, render_club))

    # 10. NSS & Extension Activities
    if nss_list:
        tex.append(f"\\deptsectionheader{{themeNss}}{{10. NSS \\& EXTENSION ACTIVITIES}}{{{len(nss_list)}}}\n")
        def render_nss(it, idx):
            t = f"\\textbf{{\\fontsize{9.5}{11}\\selectfont \\textcolor{{branddark}}{{{escape_latex(it.get('event', 'Untitled Event'))}}}}}\\\\"
            dt = f"\\textcolor{{slatedark}}{{\\textbf{{Venue:}} {escape_latex(it.get('venue', '-'))} \\quad\\textbullet\\quad \\textbf{{Date:}} {escape_latex(it.get('date', '-'))} \\quad\\textbullet\\quad \\textbf{{Participants:}} {escape_latex(it.get('participantsCount', '-'))} ({escape_latex(it.get('typeOfParticipants', '-'))})}}\\\\"
            coord = f"\\textcolor{{slatelight}}{{\\textbf{{Coordinator:}} {escape_latex(it.get('coordinator', '-'))} \\quad\\textbullet\\quad \\textbf{{Outcomes:}} {escape_latex(it.get('outcomes', '-'))}}}"
            return t + dt + coord
        tex.append(render_items_list(nss_list, render_nss))

    # 11. Additional Initiatives
    if add_list:
        tex.append(f"\\deptsectionheader{{themeAdditional}}{{11. ADDITIONAL / OTHER RELEVANT INITIATIVES}}{{{len(add_list)}}}\n")
        def render_add(it, idx):
            t = f"\\textbf{{\\fontsize{9.5}{11}\\selectfont \\textcolor{{branddark}}{{{escape_latex(it.get('initiative', 'Untitled Initiative'))}}}}}\\\\"
            dt = f"\\textcolor{{slatedark}}{{\\textbf{{Date:}} {escape_latex(it.get('date', '-'))} \\quad\\textbullet\\quad \\textbf{{Coordinator:}} {escape_latex(it.get('coordinator', '-'))}}}\\\\"
            desc = f"\\textcolor{{slatelight}}{{\\textbf{{Description:}} {escape_latex(it.get('description', '-'))} \\quad\\textbullet\\quad \\textbf{{Outcomes:}} {escape_latex(it.get('outcomes', '-'))}}}"
            return t + dt + desc
        tex.append(render_items_list(add_list, render_add))

    # Signatures block
    tex.append(r'''
\vfill
\vspace{25pt}
\noindent{\color{brandborder}\rule{\textwidth}{1.2pt}}\vspace{18pt}

\begin{table*}[b]
\begin{tabular*}{\textwidth}{@{\extracolsep{\fill}}lcr@{}}
  \parbox{5.5cm}{\centering
    \rule{4.5cm}{1.2pt}\\[4pt]
    \textbf{\fontsize{9.5}{11.5}\selectfont \textcolor{branddark}{''' + escaped_hod + r'''}}\\[2pt]
    {\fontsize{8}{10}\selectfont \textbf{\textcolor{slatedark}{Head of Department (HOD)}}}\\[1pt]
    {\fontsize{7}{9}\selectfont \textcolor{slatelight}{Department of ''' + escaped_dept + r'''}}
  } &
  \parbox{5.5cm}{\centering
    \rule{4.5cm}{1.2pt}\\[4pt]
    \textbf{\fontsize{9.5}{11.5}\selectfont \textcolor{branddark}{S. HariKrishnan}}\\[2pt]
    {\fontsize{8}{10}\selectfont \textbf{\textcolor{slatedark}{IQAC Coordinator}}}\\[1pt]
    {\fontsize{7}{9}\selectfont \textcolor{slatelight}{Sanskrithi School of Engineering}}
  } &
  \parbox{5.5cm}{\centering
    \rule{4.5cm}{1.2pt}\\[4pt]
    \textbf{\fontsize{9.5}{11.5}\selectfont \textcolor{branddark}{S. Hemachandra}}\\[2pt]
    {\fontsize{8}{10}\selectfont \textbf{\textcolor{slatedark}{Principal}}}\\[1pt]
    {\fontsize{7}{9}\selectfont \textcolor{slatelight}{Sanskrithi School of Engineering}}
  }
\end{tabular*}
\end{table*}

\end{document}
''')

    return "".join(tex)

def compile_department_latex_pdf(json_input_path, output_pdf_path):
    with open(json_input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    temp_dir = tempfile.mkdtemp(prefix="dept_latex_")
    logo_src = get_logo_path()
    has_logo = False
    if logo_src and os.path.exists(logo_src):
        try:
            shutil.copyfile(logo_src, os.path.join(temp_dir, "sse-header-logo.png"))
            has_logo = True
        except Exception as e:
            print(f"Warning: could not copy logo to temp dir: {e}")

    latex_code = generate_department_latex_document(data, has_logo=has_logo)
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
            print(f"Department LaTeX PDF compiled successfully to {output_pdf_path}")
            return True
        else:
            print("Error: Compiled PDF not found in temp directory.", file=sys.stderr)
            return False
    except subprocess.CalledProcessError as e:
        print(f"Tectonic compilation failed with return code {e.returncode}", file=sys.stderr)
        print(f"STDOUT: {e.stdout}", file=sys.stderr)
        print(f"STDERR: {e.stderr}", file=sys.stderr)
        return False
    finally:
        try:
            shutil.rmtree(temp_dir)
        except Exception:
            pass

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python generate_department_latex.py <input_json> <output_pdf>")
        sys.exit(1)
    
    input_json = sys.argv[1]
    output_pdf = sys.argv[2]

    success = compile_department_latex_pdf(input_json, output_pdf)
    if not success:
        sys.exit(1)
