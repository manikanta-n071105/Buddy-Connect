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

    # Clean errant math/dollar superscript patterns such as $ {-}$, $^{ - }$, etc. into clean Unicode superscript
    text = re.sub(r'([A-Za-z0-9]+)\s*\\?\$\s*\\?\{?\s*-\s*\\?\}?\s*\\?\$', r'\1⁻', text)
    text = text.replace('$ {-}$', '⁻').replace('$^{-}$', '⁻').replace('$ - $', '⁻')

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
    text = re.sub(r'\$\s*\^\s*\{([^}]+)\}\s*\$', lambda m: add_token(r'\textsuperscript{' + ('$-$' if m.group(1).strip() == '-' else m.group(1).strip()) + r'}'), text)
    text = re.sub(r'\$\s*\^\s*([^\s\$]+)\s*\$', lambda m: add_token(r'\textsuperscript{' + ('$-$' if m.group(1).strip() == '-' else m.group(1).strip()) + r'}'), text)
    text = re.sub(r'\$\s*\{([-+0-9a-zA-Z]+)\}\s*\$', lambda m: add_token(r'\textsuperscript{' + ('$-$' if m.group(1).strip() == '-' else m.group(1).strip()) + r'}'), text)
    text = re.sub(r'\$\s*([-+])\s*\$', lambda m: add_token(r'\textsuperscript{' + ('$-$' if m.group(1).strip() == '-' else m.group(1).strip()) + r'}'), text)
    # Errant literal dollar/brace superscript attempts like CO$ {-}$, CO$^{-}$, CO^{-}, CO$ - $
    text = re.sub(r'([A-Za-z0-9]+)\s*\\?\$\s*\\?\{?\s*([+-])\s*\\?\}?\s*\\?\$', lambda m: m.group(1) + add_token(r'\textsuperscript{' + ('$-$' if m.group(2) == '-' else m.group(2)) + r'}'), text)

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
        '\u207A': '+', '\u207B': '$-$', '\u207C': '=', '\u207D': '(', '\u207E': ')',
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
        val = (braced if braced is not None else m.group(2)).strip()
        val = '$-$' if val == '-' else val
        return base + add_token(r'\textsuperscript{' + val + r'}')
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
    if 'EXPERIMENT' in cUpper: return c
    if 'GENERAL TOPICS' in cUpper: return '100% Completed'

    unit_match = re.search(r'(\d+(?:\.\d+)?)\s*Unit', c, re.I)
    pct_match = re.search(r'(\d+)%', c)
    if unit_match:
        u = float(unit_match.group(1))
        pct = round((u / 5.0) * 100)
        u_label = "Unit" if u == 1.0 else "Units"
        return f"{u:g} {u_label} ({pct}%)"
    elif pct_match:
        pct = int(pct_match.group(1))
        u = round((pct / 20.0) * 10) / 10
        u_label = "Unit" if u == 1.0 else "Units"
        return f"{u:g} {u_label} ({pct}%)"
    elif re.match(r'^\d+(?:\.\d+)?$', c):
        u = float(c)
        pct = round((u / 5.0) * 100)
        u_label = "Unit" if u == 1.0 else "Units"
        return f"{u:g} {u_label} ({pct}%)"
    elif '1,2,3,4' in cUpper or 'I,II,III,IV' in cUpper:
        return '4 Units (80%)'
    elif '1,2,3' in cUpper or 'I,II,III' in cUpper:
        return '3 Units (60%)'
    elif '1,2' in cUpper or 'I,II' in cUpper:
        return '2 Units (40%)'
    return c

def normalize_syllabus_pending(completed, pending):
    p = str(pending or '').strip()
    c = str(completed or '').strip()
    pUpper = p.upper()

    # Determine done units
    done_units = None
    unit_match = re.search(r'(\d+(?:\.\d+)?)\s*Unit', c, re.I)
    pct_match = re.search(r'(\d+)%', c)
    if unit_match:
        done_units = float(unit_match.group(1))
    elif pct_match:
        done_units = round((float(pct_match.group(1)) / 20.0) * 10) / 10
    elif re.match(r'^\d+(?:\.\d+)?$', c):
        done_units = float(c)

    # 1. If pending is already a formatted string like '3.5 Units (70%)' or '5 Exp Pending (50%)', keep it!
    if p and p not in ['-', '--', 'NIL']:
        if re.search(r'^\d+(?:\.\d+)?\s*(?:Units?|Exp\s*Pending|\s*Exp(?:eriments?)?)(?:\s*\(\d+%\))?$', p, re.I):
            return p
        if '5-80%' in pUpper or '5-60%' in pUpper or '5-50%' in pUpper or '5 STARTED' in pUpper:
            return 'Unit 5 (In Progress)'
        # If ~4 units are done and user wrote Unit 5:
        if done_units is not None and done_units >= 3.8 and re.search(r'\b(?:5\s*UNIT|V\s*UNIT|5TH\s*UNIT|UNIT\s*5)\b', pUpper):
            return 'Unit 5'
        # If ~3 units are done and user wrote Units 4 & 5:
        if done_units is not None and 2.5 <= done_units <= 3.5 and ('4,5' in pUpper or '4, 5' in pUpper or 'IV,V' in pUpper or '4 UNIT AND 5' in pUpper):
            return 'Units 4 & 5'

    # 2. Auto-calculate from done_units if known
    if done_units is not None:
        rem_units = round((5.0 - done_units) * 10) / 10
        if rem_units <= 0:
            return 'Nil (Complete)'
        rem_pct = round((rem_units / 5.0) * 100)
        unit_str = 'Unit' if rem_units == 1.0 else 'Units'
        return f'{rem_units:g} {unit_str} ({rem_pct}%)'

    # 3. Fallbacks
    if re.search(r'\b(?:5\s*UNIT|V\s*UNIT|5TH\s*UNIT|UNIT\s*5)\b', pUpper) or p == '5':
        return 'Unit 5'
    if '4,5' in pUpper or '4, 5' in pUpper or 'IV,V' in pUpper:
        return 'Units 4 & 5'
    if '3 UNIT RUNNING' in pUpper or '3 RUNNING' in pUpper or 'III RUNNING' in pUpper:
        return 'Units 3, 4 & 5'

    return 'On Schedule' if not p or p in ['-', 'NIL', '--'] else p

def normalize_syllabus_remarks(remarks, completed=None):
    r = str(remarks or '').strip()
    if not r or r == '-' or r == 'NIL' or r == '--':
        return 'On Schedule as per Lesson Plan'
    return r

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

def build_latex_document(all_dept_data, period, college_name="SANSKRITHI SCHOOL OF ENGINEERING", has_logo=True):
    escaped_period = escape_latex(period)
    escaped_college = escape_latex(college_name)

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
\usepackage{libertinus}
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
\definecolor{branddark}{HTML}{000000}      % Pure black #000000
\definecolor{headerdark}{HTML}{000000}     % Pure black #000000
\definecolor{brandamber}{HTML}{C2410C}     % Burnt orange #C2410C
\definecolor{brandgreen}{HTML}{15803D}     % Green #15803D
\definecolor{brandborder}{HTML}{E2E8F0}    % Thin light-grey #E2E8F0
\definecolor{rowalt}{HTML}{F8FAFC}         % Very light grey-blue #F8FAFC
\definecolor{slatedark}{HTML}{000000}      % Pure black #000000
\definecolor{slatemed}{HTML}{000000}       % Pure black #000000
\definecolor{slatelight}{HTML}{000000}     % Pure black #000000
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
    pdftitle={Institutional Progress Report - ''' + escaped_period + r'''},
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
\fancyhead[R]{\fontsize{6.5}{8}\selectfont\textbf{\textcolor{slatemed}{INSTITUTIONAL PROGRESS REPORT \textbullet\ ''' + escaped_period.upper() + r'''}}}
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
    {\fontsize{9.5}{11.5}\selectfont \textbf{\textcolor{headerdark}{SANSKRITHI SCHOOL OF ENGINEERING}}}\\[2pt]
    {\fontsize{7.5}{9.5}\selectfont \textbf{\textcolor{brandamber}{AUTONOMOUS}}}
  }
\end{tabular*}
\vspace{2pt}
\noindent{\color{brandnavy}\rule{\textwidth}{1.2pt}}
\vspace{6pt}

{\centering
  {\fontsize{14}{16}\selectfont \textbf{\textcolor{brandnavy}{INSTITUTIONAL PROGRESS REPORT}}}\\[3pt]
  {\fontsize{9}{11}\selectfont \textbf{\textcolor{slatemed}{Comprehensive Performance Dossier \& Departmental Analytics}}}\\[2pt]
  {\fontsize{8}{10}\selectfont \textcolor{slatelight}{Reporting Period: \textbf{\textcolor{branddark}{''' + escaped_period + r'''}}}}\\[6pt]
\par}
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
        out.append(f"\\Needspace*{{6.5cm}}\n")
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('title', 'Untitled'))}}}}}"
        
        details = []
        if it.get('authors'): details.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Authors:}} {escape_latex(it['authors'])}}}")
        if it.get('journalName'): details.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Journal:}} {escape_latex(it['journalName'])} ({escape_latex(it.get('volIssueYear', ''))})}}")
        if it.get('pageNos'): details.append(f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Pages:}} {escape_latex(it['pageNos'])}}}")
        pub_details = r" \newline ".join(details) if details else r"--"
        
        verif = []
        if it.get('issnIsbn'): verif.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{ISSN:}} {escape_latex(it['issnIsbn'])}}}")
        if it.get('indexedIn'):
            idx_in = escape_latex(it['indexedIn'])
            if 'proof' in idx_in.lower():
                verif.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Indexed:}} \\textcolor{{linkblue}}{{{idx_in}}}}}")
            else:
                verif.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Indexed:}} {idx_in}}}")
        if it.get('link'): verif.append(format_latex_link(it['link'], '[Paper Link]'))
        verif_details = r" \newline ".join(verif) if verif else r"--"
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('title', 'Untitled Presentation'))}}}}}"
        
        details = []
        if it.get('authors'): details.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Authors:}} {escape_latex(it['authors'])}}}")
        if it.get('conferenceName'): details.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Conference:}} {escape_latex(it['conferenceName'])}}}")
        sub = []
        if it.get('volIssueYear'): sub.append(f"\\textbf{{Issue:}} {escape_latex(it['volIssueYear'])}")
        if it.get('pageNos'): sub.append(f"\\textbf{{Pages:}} {escape_latex(it['pageNos'])}")
        if it.get('issnIsbn'): sub.append(f"\\textbf{{ISBN:}} {escape_latex(it['issnIsbn'])}")
        if sub: details.append(r"{\fontsize{6.5}{8}\selectfont " + " ".join(sub) + "}")
        conf_details = r" \newline ".join(details) if details else r"--"
        
        verif = []
        if it.get('date'): verif.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Date:}} {escape_latex(it['date'])}}}")
        loc_val = it.get('location') or it.get('locationMode', '')
        mode_val = it.get('mode', '')
        if loc_val and mode_val and mode_val not in loc_val:
            venue_display = f"{loc_val} ({mode_val})"
        else:
            venue_display = loc_val or mode_val or '-'
        if venue_display and venue_display != '-':
            verif.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Venue:}} {escape_latex(venue_display)}}}")
        if it.get('indexedIn'): verif.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Indexed:}} {escape_latex(it['indexedIn'])}}}")
        if it.get('link'): verif.append(format_latex_link(it['link'], '[Proceedings]'))
        verif_details = r" \newline ".join(verif) if verif else r"--"
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('title', 'Untitled Patent'))}}}}}"
        inv_lines = []
        if it.get('inventors'):
            inv_lines.append(f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Inventor/s:}} {escape_latex(it['inventors'])}}}")
        if it.get('applicants'):
            inv_lines.append(f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Applicant/s:}} {escape_latex(it['applicants'])}}}")
        if it.get('patentNumber'):
            inv_lines.append(f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Pat No:}} {escape_latex(it['patentNumber'])}}}")
        inv = r" \newline ".join(inv_lines) if inv_lines else r"--"
        status = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{brandgreen}}{{{escape_latex(it.get('status', 'Published'))}}}}}}}" + (f" \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Date:}} {escape_latex(it.get('awardedDate', ''))}}}" if it.get('awardedDate') else "")
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('title', 'Untitled Activity'))}}}}}" + f" \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Type:}} {escape_latex(it.get('type', '-'))} \\textbullet\\ \\textbf{{Mode:}} {escape_latex(it.get('mode', 'Offline'))}}}"
        meta = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Date:}} {escape_latex(it.get('date', '-'))}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{By:}} {escape_latex(it.get('organizedBy', '-'))}}}"
        tgt = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Participants:}} {escape_latex(it.get('participantsCount', '-'))} parts}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont {escape_latex(it.get('participants', '-'))}}}"
        outc = f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Coord:}} {escape_latex(it.get('mentorCoordinator', '-'))}}} \\newline {{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{brandgreen}}{{Status: {escape_latex(it.get('status', 'Completed'))}}}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Report Link]')}" if it.get('link') else "")
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('title', 'Untitled FDP'))}}}}}" + f" \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Type:}} {escape_latex(it.get('type', 'FDP'))}}}"
        org = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Org:}} {escape_latex(it.get('organizingBody', '-'))}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Dates:}} {escape_latex(it.get('dates', '-'))} ({escape_latex(it.get('mode', 'Offline'))})}}"
        fac = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('facultyAttended', it.get('role', '-')))}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Certificate]')}" if it.get('link') else "")
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('title', 'Untitled FDP Organized'))}}}}}" + f" \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Type:}} {escape_latex(it.get('type', 'FDP'))} \\textbullet\\ \\textbf{{Dates:}} {escape_latex(it.get('dates', '-'))} ({escape_latex(it.get('mode', 'Offline'))})}}"
        rp = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{RP:}} {escape_latex(it.get('resourcePersonDetails', '-'))}}}"
        coords = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Coord:}} {escape_latex(it.get('facultyCoordinators', '-'))}}}" + (f" \\newline {format_latex_link(it['link'], '[Proof Link]')}" if it.get('link') else "")
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('title', 'Untitled SDP'))}}}}}" + f" \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Type:}} {escape_latex(it.get('type', 'Workshop'))}}}"
        dt_rp = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Date:}} {escape_latex(it.get('date', '-'))}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{RP:}} {escape_latex(it.get('resourcePerson', '-'))}}}"
        mode_str = f" ({escape_latex(it['mode'])})" if it.get('mode') else ""
        parts = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Participants:}} {escape_latex(it.get('participantsCount', '-'))} participants{mode_str}}}" + (f" \\newline {format_latex_link(it['link'], '[Report Link]')}" if it.get('link') else "")
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        fac = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('name', '-'))}}}}}"
        awd = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('award', '-'))}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Proof Link]')}" if it.get('link') else "")
        ev = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {escape_latex(it.get('event', '-'))}}}"
        org_dt = f" ({escape_latex(it['date'])})" if it.get('date') else ""
        org = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {escape_latex(it.get('organization', '-'))}{org_dt}}}"
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        st = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('nameRoll', '-'))}}}}}"
        awd = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('award', '-'))}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Proof Link]')}" if it.get('link') else "")
        ev_org = f" ({escape_latex(it['organization'])})" if it.get('organization') else ""
        ev = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {escape_latex(it.get('event', '-'))}{ev_org}}}"
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('title', 'Untitled Certification'))}}}}}"
        plt = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Platform:}} {escape_latex(it.get('platform', '-'))}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Type:}} {escape_latex(it.get('type', '-'))}}}"
        enr = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Duration:}} {escape_latex(it.get('duration', '-'))}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Enrolled:}} {escape_latex(it.get('enrolled', '-'))}}}"
        outc = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{brandgreen}}{{{escape_latex(it.get('certified', '-'))} Certified}}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont {escape_latex(it.get('keyOutcomes', ''))}}}" + (f" \\newline {format_latex_link(it['link'], '[Certificate]')}" if it.get('link') else "")
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        ptn = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('name', '-'))}}}}}"
        dt = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Date:}} {escape_latex(it.get('datePeriod', '-'))}}}"
        spoc = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{SPOC:}} {escape_latex(it.get('facultySpoc', '-'))}}}"
        purp = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {escape_latex(it.get('purpose', '-'))}}}" + (f" \\newline {format_latex_link(it['link'], '[MoU Copy]')}" if it.get('link') else "")
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        ev = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('event', '-'))}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Type:}} {escape_latex(it.get('type', '-'))}}}"
        dt = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Date:}} {escape_latex(it.get('date', '-'))}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Coord:}} {escape_latex(it.get('resourcePersonCoordinator', '-'))}}}"
        outc = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Participants:}} {escape_latex(it.get('participants', '-'))}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont {escape_latex(it.get('outcomes', '-'))}}}" + (f" \\newline {format_latex_link(it['link'], '[Event Report]')}" if it.get('link') else "")
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        sub = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('subject', 'Untitled Course'))}}}}}"
        yr_clean = escape_latex(normalize_syllabus_year_sem(it.get('yearSem', '-')))
        yr = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{yr_clean}}}}}"
        fac = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {escape_latex(it.get('faculty', '-'))}}}"
        
        comp_clean = escape_latex(normalize_syllabus_completed(it.get('completed', '')))
        comp = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{brandgreen}}{{{comp_clean}}}}}}}"
        
        pend_clean = escape_latex(normalize_syllabus_pending(it.get('completed', ''), it.get('pending', '')))
        pend = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{brandamber}}{{{pend_clean}}}}}}}"
        
        return [sno, branch, sub, yr, fac, comp, pend]

    tex.append(render_section(
        '8. SYLLABUS COVERAGE REPORT',
        ['0.75cm', '1.20cm', '5.50cm', '1.60cm', '3.65cm', '2.50cm', '2.50cm'],
        ['#', 'Branch', 'Course / Subject Title', 'Year / Sem', 'Faculty In-Charge', 'Done (5 Units)', 'Pending / Ongoing'],
        gen_syl_row,
        syl_items
    ))

    # -------------------------------------------------------------
    # 9. Clubs & Student Engagement Activity
    # -------------------------------------------------------------
    clb_items = gather_items('studentEngagement')
    def gen_clb_row(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        title = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('title', 'Untitled Activity'))}}}}}"
        t_span = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Type:}} {escape_latex(it.get('type', 'Workshop'))}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Dates:}} {escape_latex(it.get('dates', it.get('noOfDays', '1 day')))}}}"
        pts = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{\\textcolor{{brandgreen}}{{{escape_latex(it.get('participantsCount', '-'))}}}}}}}"
        coord = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Coord:}} {escape_latex(it.get('coordinator', '-'))}}}"
        rem = f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textit{{{escape_latex(it.get('remarks', '-'))}}}}}" + (f" \\newline {format_latex_link(it['link'], '[Club Report]')}" if it.get('link') else "")
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        ev = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('event', '-'))}}}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Type:}} {escape_latex(it.get('type', '-'))}}}"
        vn = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Date:}} {escape_latex(it.get('date', '-'))}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Venue:}} {escape_latex(it.get('venue', '-'))}}}"
        ben = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Participants:}} {escape_latex(it.get('participantsCount', '-'))} participants}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont {escape_latex(it.get('typeOfParticipants', '-'))}}}"
        outc = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {escape_latex(it.get('outcomes', '-'))}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Coord:}} {escape_latex(it.get('coordinator', '-'))}}}" + (f" \\newline {format_latex_link(it['link'], '[NSS Report]')}" if it.get('link') else "")
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
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', ''))}}}}}"
        init = f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{escape_latex(it.get('initiative', '-'))}}}}}"
        dt = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Date:}} {escape_latex(it.get('date', '-'))}}} \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Coord:}} {escape_latex(it.get('coordinator', '-'))}}}"
        desc = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {escape_latex(it.get('description', '-'))}}}" + (f" \\newline {{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{\\textcolor{{brandgreen}}{{Outcome: {escape_latex(it['outcomes'])}}}}}}}" if it.get('outcomes') else "") + (f" \\newline {format_latex_link(it['link'], '[Proof Link]')}" if it.get('link') else "")
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

    has_atr = any(bool((it.get('actionTaken') or it.get('actionTakenReport') or '').strip()) for it in mom_items)
    has_ap = any(bool((it.get('actionPoints') or '').strip()) for it in mom_items)

    def gen_mom_rows(it, idx):
        sno = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {idx + 1}}}"
        branch = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{{escape_latex(it.get('deptCode', 'MOM'))}}}}}"
        
        atr_text = (it.get('actionTaken') or it.get('actionTakenReport') or '').strip()
        if atr_text:
            atr_lines = [re.sub(r'^[•*\-\uf000-\uf0ff\s]+', '', l).strip() for l in atr_text.split('\n') if l.strip()]
            if atr_lines:
                atr_formatted = r" \newline ".join([r"\textcolor{brandnavy}{\textbf{\textbullet}} {\fontsize{7}{8.5}\selectfont " + escape_latex(l) + "}" for l in atr_lines])
            else:
                atr_formatted = escape_latex(atr_text)
            atr_cell = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {atr_formatted}}}"
        else:
            atr_cell = r"{\fontsize{6.5}{8}\selectfont --}"
        
        m_title = escape_latex(it.get('title') or "HoD's Meeting")
        m_date = escape_latex(it.get('date', '-'))
        mtg_lines = [
            f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{\\textcolor{{brandnavy}}{{{m_title}}}}}}}",
            f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Date:}} {m_date}}}"
        ]
        if it.get('time'):
            mtg_lines.append(f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Time:}} {escape_latex(it['time'])}}}")
        if it.get('venue'):
            mtg_lines.append(f"{{\\fontsize{{6.5}}{{8}}\\selectfont\\textbf{{Venue:}} {escape_latex(it['venue'])}}}")
        mtg_first = r" \newline ".join(mtg_lines)
        
        pol = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {escape_latex(it.get('policyChanges', 'Standard operations and administrative resolutions confirmed.'))}}}" + (f" \\newline {format_latex_link(it['link'], '[Proof Link]')}" if it.get('link') else "")

        ap_text = (it.get('actionPoints') or '').strip()
        if ap_text:
            ap_lines = [re.sub(r'^[•*\-\uf000-\uf0ff\s]+', '', l).strip() for l in ap_text.split('\n') if l.strip()]
            if ap_lines:
                ap_formatted = r" \newline ".join([r"\textcolor{brandamber}{\textbf{\textbullet}} {\fontsize{7}{8.5}\selectfont\textbf{" + escape_latex(l) + "}}" for l in ap_lines])
            else:
                ap_formatted = f"\\textbf{{{escape_latex(ap_text)}}}"
            ap_cell = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {ap_formatted}}}"
        else:
            ap_cell = r"{\fontsize{6.5}{8}\selectfont --}"

        discussions = it.get('discussions', [])
        if isinstance(discussions, list) and len(discussions) > 0:
            att_prefix = ""
            if it.get('attendees') and isinstance(it['attendees'], list):
                att_names = ", ".join([escape_latex(a.get('name', '')) for a in it['attendees'] if a.get('name')])
                if att_names:
                    att_prefix = f"{{\\fontsize{{7}}{{8.5}}\\selectfont\\textbf{{Attendees ({len(it['attendees'])}):}} {att_names}}} \\newline\\vspace{{2pt}} "

            rows = []
            for d_idx, d in enumerate(discussions):
                raw_head = str(d.get('heading', f'Topic {d_idx+1}')).strip()
                # Topic headings are titles, not bullet points. Strip any leading bullet markers or symbols
                clean_head = re.sub(r'^[•*\-\uf000-\uf0ff\s]+', '', raw_head).strip()
                d_head = escape_latex(clean_head or f'Topic {d_idx+1}')

                raw_det = str(d.get('details', 'Discussed & recorded.')).strip()
                norm_head = re.sub(r'^[•*\-0-9.)\s\uf000-\uf0ff]+', '', raw_head).strip().lower()
                d_det_lines = [
                    re.sub(r'^[•*\-0-9.)\s\uf000-\uf0ff]+', '', l).strip()
                    for l in raw_det.split('\n')
                    if l.strip() and re.sub(r'^[•*\-0-9.)\s\uf000-\uf0ff]+', '', l).strip().lower() != norm_head
                ]
                if d_det_lines:
                    det_formatted = r" \newline ".join([r"\textcolor{brandnavy}{\textbf{\textbullet}} {\fontsize{7}{8.5}\selectfont " + escape_latex(l) + "}" for l in d_det_lines])
                else:
                    det_formatted = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {escape_latex(raw_det)}}}"

                disc_cell = (att_prefix if d_idx == 0 else "") + f"{{\\fontsize{{7.5}}{{9}}\\selectfont\\textbf{{{d_head}}}}}: \\newline {det_formatted}"
                
                row_items = [sno if d_idx == 0 else "", branch if d_idx == 0 else ""]
                if has_atr:
                    row_items.append(atr_cell if d_idx == 0 else "")
                row_items.append(mtg_first if d_idx == 0 else r"{\fontsize{6.5}{8}\selectfont (Cont.)}")
                row_items.append(disc_cell)
                row_items.append(pol if d_idx == 0 else "")
                if has_ap:
                    row_items.append(ap_cell if d_idx == 0 else "")
                rows.append(row_items)
            return rows
        else:
            disc_str = f"{{\\fontsize{{7}}{{8.5}}\\selectfont {escape_latex(it.get('decisions', '-'))}}}"
            row_items = [sno, branch]
            if has_atr:
                row_items.append(atr_cell)
            row_items.append(mtg_first)
            row_items.append(disc_str)
            row_items.append(pol)
            if has_ap:
                row_items.append(ap_cell)
            return [row_items]

    if mom_items:
        mom_cols = ['0.80cm', '1.20cm']
        mom_headers = ['#', 'Branch']
        if has_atr:
            mom_headers.append('Action Taken Report')
            mom_cols.append('2.80cm')
        if has_atr and has_ap:
            mom_cols.extend(['2.80cm', '5.20cm', '2.50cm'])
        elif has_atr or has_ap:
            mom_cols.extend(['3.10cm', '6.30cm', '3.10cm'])
        else:
            mom_cols.extend(['3.60cm', '8.00cm', '4.10cm'])
        mom_headers.extend(['Meeting & Venue', 'Key Decisions & Topics Discussed', 'Policy Directives & Action Plan'])
        if has_ap:
            mom_headers.append('Action Points')
            mom_cols.append('2.50cm' if has_atr else '3.10cm')

        tex.append(render_section(
            '12. MINUTES OF THE MEETING (MOM)',
            mom_cols,
            mom_headers,
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
\begin{tabular*}{\textwidth}{@{\extracolsep{\fill}}lr@{}}
  \parbox{6.5cm}{\centering
    \rule{5.0cm}{1.0pt}\\[4pt]
    \textbf{\fontsize{9.5}{11.5}\selectfont \textcolor{branddark}{IQAC Coordinator}}\\[2pt]
    {\fontsize{7}{8.5}\selectfont \textcolor{slatelight}{Sanskrithi School of Engineering}}
  } &
  \parbox{6.5cm}{\centering
    \rule{5.0cm}{1.0pt}\\[4pt]
    \textbf{\fontsize{9.5}{11.5}\selectfont \textcolor{branddark}{Principal}}\\[2pt]
    {\fontsize{7}{8.5}\selectfont \textcolor{slatelight}{Sanskrithi School of Engineering}}
  }
\end{tabular*}

\end{document}
''')

    return "".join(tex)

def compile_master_latex_pdf(json_input_path, output_pdf_path):
    with open(json_input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    departments_data = data.get('departmentsData', data if not any(k in data for k in ['period', 'collegeName']) else {})
    if not departments_data and 'departmentsData' not in data:
        departments_data = {k: v for k, v in data.items() if k not in ['period', 'collegeName']}
    period = data.get('period', 'September 2026')
    college_name = data.get('collegeName', 'SANSKRITHI SCHOOL OF ENGINEERING')

    temp_dir = tempfile.mkdtemp(prefix="consolidated_latex_")
    logo_src = get_logo_path()
    has_logo = False
    if logo_src and os.path.exists(logo_src):
        try:
            shutil.copyfile(logo_src, os.path.join(temp_dir, "sse-header-logo.png"))
            has_logo = True
        except Exception as e:
            print(f"Warning: could not copy logo to temp dir: {e}")

    if not has_logo:
        try:
            from logo_data import SSE_HEADER_LOGO_RAW
            import base64
            with open(os.path.join(temp_dir, "sse-header-logo.png"), "wb") as f:
                f.write(base64.b64decode(SSE_HEADER_LOGO_RAW))
            has_logo = True
        except Exception:
            try:
                from scripts.logo_data import SSE_HEADER_LOGO_RAW
                import base64
                with open(os.path.join(temp_dir, "sse-header-logo.png"), "wb") as f:
                    f.write(base64.b64decode(SSE_HEADER_LOGO_RAW))
                has_logo = True
            except Exception:
                pass

    latex_code = build_latex_document(departments_data, period, college_name, has_logo=has_logo)
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
