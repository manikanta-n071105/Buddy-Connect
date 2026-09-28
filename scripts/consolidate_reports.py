import os
import re
import copy
import html
import zipfile
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def normalize_key(text):
    """Normalize heading to standardized section key."""
    t = (text or '').lower().strip()
    if 'journal' in t: return '1a_journals'
    if 'conference' in t: return '1b_conferences'
    if 'patent' in t: return '1c_patents'
    if 'entrepreneurship' in t or 'start-up' in t: return '1d_entrepreneurship'
    if 'nss' in t or 'extension' in t: return '2_nss'
    if 'fdp' in t or 'faculty development' in t: return '3_fdp'
    if 'sdp' in t or 'student development' in t: return '4_sdp'
    if 'student achievements' in t or ('student' in t and 'achievement' in t): return '5b_student_achievements'
    if 'faculty achievements' in t or ('faculty' in t and 'achievement' in t): return '5a_faculty_achievements'
    if 'certification' in t: return '5c_certifications'
    if 'department meetings' in t or 'department meeting' in t: return '6a_dept_meetings'
    if 'collaboration' in t or 'mou' in t: return '6b_mous'
    if 'additional' in t or 'initiatives' in t: return '7_additional_initiatives'
    if 'technical association' in t: return '8_tech_association'
    # Branch specific syllabus tables (must check before generic syllabus)
    if 'branch:' in t or 'branch' in t or 'syllabus' in t or 'coverage' in t:
        if 'cse - a' in t or 'cse a' in t or 'cse  a' in t: return '10_syllabus_cse_a'
        if 'cse - b' in t or 'cse b' in t: return '10_syllabus_cse_b'
        if 'cse - c' in t or 'cse c' in t: return '10_syllabus_cse_c'
        if 'eee' in t: return '10_syllabus_eee'
        if 'ece' in t: return '10_syllabus_ece'
        if 'civl' in t or 'civil' in t: return '10_syllabus_civil'
        if 'mech' in t: return '10_syllabus_mech'
        return '10_syllabus_general'
    if 'iic' in t or 'innovation council' in t: return '9_iic_cell'
    if 'attendance' in t: return '11_attendance'
    return 'UNKNOWN'

def extract_tables_with_headings(doc):
    """Walk through body elements in linear order to associate each table with its preceding heading."""
    body_elements = doc._body._element
    current_major = 'General'
    current_sub = ''
    
    tables_found = []
    for elem in body_elements:
        tag = elem.tag.split('}')[-1]
        if tag == 'p':
            text = ''.join(t.text for t in elem.iter(f'{{{NS_W}}}t') if t.text).strip()
            if text:
                text_lower = text.lower()
                # Major heading: e.g. "1. Research...", "2. NSS...", "Syllabus coverage report", "Branch: CSE"
                if re.match(r'^\d+\.\s*', text) or 'syllabus' in text_lower or text_lower.startswith('branch:') or 'coverage' in text_lower:
                    current_major = text
                    current_sub = ''
                # Sub heading: e.g. "a) Journal Publications", "b) Conference..."
                elif re.match(r'^[a-z]\)\s*', text, re.IGNORECASE):
                    current_sub = text
        elif tag == 'tbl':
            heading_combo = f"{current_major} {current_sub}".strip()
            cat = normalize_key(heading_combo)
            # If still unknown, inspect first row text
            if cat == 'UNKNOWN':
                hdr_raw = ''.join(t.text for t in elem.iter(f'{{{NS_W}}}t') if t.text).strip()
                cat = normalize_key(hdr_raw)
            tables_found.append({
                'category': cat,
                'heading': heading_combo,
                'tbl_elem': elem
            })
    return tables_found

def extract_department_info(doc, filepath=""):
    """Extract department, period, HOD name from first few paragraphs/tables or filename."""
    lines = [p.text.strip() for p in doc.paragraphs[:15] if p.text.strip()]
    if doc.tables:
        for row in doc.tables[0].rows[:3]:
            for cell in row.cells:
                if cell.text.strip():
                    lines.append(cell.text.strip())
    full_header_text = '\n'.join(lines)
    text_to_check = full_header_text + '\n' + os.path.basename(filepath)
    text_norm = text_to_check.lower()
    
    dept = 'General'
    if 'civil' in text_norm:
        dept = 'Civil Engineering'
    elif 'cse' in text_norm or 'computer science' in text_norm:
        dept = 'Computer Science & Engineering'
    elif 'ece' in text_norm or 'electronics and communication' in text_norm:
        dept = 'Electronics & Communication Engineering'
    elif 'eee' in text_norm or 'electrical' in text_norm:
        dept = 'Electrical & Electronics Engineering'
    elif 'humanities' in text_norm or 'has' in text_norm or 'h&s' in text_norm:
        dept = 'Humanities & Sciences'
        
    period = 'April 2026'
    period_match = re.search(r'Reporting Period:\s*([^\n\r]+)', full_header_text, re.IGNORECASE)
    if period_match:
        raw_p = period_match.group(1).strip()
        raw_p = re.split(r'HOD Name|Date of Submission|Department', raw_p, flags=re.IGNORECASE)[0].strip()
        if len(raw_p) > 2 and len(raw_p) < 60:
            period = raw_p
    elif 'aug' in text_norm:
        period = 'August 2026'
        
    hod = ''
    hod_match = re.search(r'HOD Name:\s*([^\n\r]+)', full_header_text, re.IGNORECASE)
    if hod_match:
        raw_h = hod_match.group(1).strip()
        raw_h = re.split(r'Date of Submission|Reporting Period|Department', raw_h, flags=re.IGNORECASE)[0].strip()
        if len(raw_h) < 60:
            hod = raw_h
        
    return {
        'department': dept,
        'period': period,
        'hod': hod
    }

def is_meaningful_row(cells_text):
    """Determine if a row contains actual content or is just empty/NIL/placeholder."""
    if not cells_text or len(cells_text) < 2:
        return False
    col1 = cells_text[1].strip()
    combined = ' '.join(c.strip() for c in cells_text[1:])
    clean = combined.lower()
    for placeholder in [
        'nil', 'none', '-', 'na', 'n/a', '[patent link]', '[link]', 
        '[report link]', '[insert link]', '[proof]', '[insert proof]', 
        '[insert link here]', '[insert document link]', '[certificate link]',
        '[insert proof/certificate link here]', '[insert certificate link here]'
    ]:
        clean = clean.replace(placeholder, '')
    clean = clean.strip()
    
    # If the main content cell is empty and total content without placeholders is trivial, skip
    if len(col1) == 0 and len(clean) < 5:
        return False
    return len(clean) >= 3

def apply_professional_table_styling(tbl_elem):
    """
    Apply clean, robust, professional borders and margins to a table element.
    Ensures that Word, LibreOffice, and PDF converters render every border crisply.
    """
    tblPr = tbl_elem.find(f'{{{NS_W}}}tblPr')
    if tblPr is None:
        tblPr = parse_xml(f'<w:tblPr {nsdecls("w")}/>')
        tbl_elem.insert(0, tblPr)
        
    # 1. Table Borders (Clean Slate/Navy borders)
    old_b = tblPr.find(f'{{{NS_W}}}tblBorders')
    if old_b is not None:
        tblPr.remove(old_b)
        
    new_borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>'
        f'<w:left w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>'
        f'<w:right w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(new_borders)

    # 2. Cell Margins (Top/Bottom 120 dxa = 6pt, Left/Right 160 dxa = 8pt)
    old_mar = tblPr.find(f'{{{NS_W}}}tblCellMar')
    if old_mar is not None:
        tblPr.remove(old_mar)
        
    tblMar = parse_xml(
        f'<w:tblCellMar {nsdecls("w")}>'
        f'<w:top w:w="120" w:type="dxa"/>'
        f'<w:bottom w:w="120" w:type="dxa"/>'
        f'<w:left w:w="160" w:type="dxa"/>'
        f'<w:right w:w="160" w:type="dxa"/>'
        f'</w:tblCellMar>'
    )
    tblPr.append(tblMar)

    # 3. Format header row: cantSplit + tblHeader (repeats header across page breaks)
    tr_elems = tbl_elem.findall(f'{{{NS_W}}}tr')
    if tr_elems:
        hdr_tr = tr_elems[0]
        trPr = hdr_tr.find(f'{{{NS_W}}}trPr')
        if trPr is None:
            trPr = parse_xml(f'<w:trPr {nsdecls("w")}/>')
            hdr_tr.insert(0, trPr)
        if trPr.find(f'{{{NS_W}}}tblHeader') is None:
            trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
        if trPr.find(f'{{{NS_W}}}cantSplit') is None:
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

        # Style header cells background and text
        for tc in hdr_tr.findall(f'.//{{{NS_W}}}tc'):
            tcPr = tc.find(f'{{{NS_W}}}tcPr')
            if tcPr is None:
                tcPr = parse_xml(f'<w:tcPr {nsdecls("w")}/>')
                tc.insert(0, tcPr)
            shd = tcPr.find(f'{{{NS_W}}}shd')
            if shd is not None:
                tcPr.remove(shd)
            tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="1E3A8A"/>'))
            
            # Make header text bold white
            for p in tc.findall(f'.//{{{NS_W}}}p'):
                for r in p.findall(f'.//{{{NS_W}}}r'):
                    rPr = r.find(f'{{{NS_W}}}rPr')
                    if rPr is None:
                        rPr = parse_xml(f'<w:rPr {nsdecls("w")}/>')
                        r.insert(0, rPr)
                    if rPr.find(f'{{{NS_W}}}b') is None:
                        rPr.append(parse_xml(f'<w:b {nsdecls("w")}/>'))
                    c = rPr.find(f'{{{NS_W}}}color')
                    if c is not None:
                        rPr.remove(c)
                    rPr.append(parse_xml(f'<w:color {nsdecls("w")} w:val="FFFFFF"/>'))

def append_row_xml(target_tbl_elem, source_tr_elem, s_no, dept_name):
    """
    Safely append a table row by cloning its XML and normalizing column count and widths
    to exactly match the target table header. This prevents jagged tables and missing borders.
    """
    new_tr = copy.deepcopy(source_tr_elem)
    
    # Add cantSplit so rows don't awkwardly break halfway across pages
    trPr = new_tr.find(f'{{{NS_W}}}trPr')
    if trPr is None:
        trPr = parse_xml(f'<w:trPr {nsdecls("w")}/>')
        new_tr.insert(0, trPr)
    if trPr.find(f'{{{NS_W}}}cantSplit') is None:
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
    
    # Inspect target table grid to determine exact column count and column widths
    tblGrid = target_tbl_elem.find(f'{{{NS_W}}}tblGrid')
    grid_cols = tblGrid.findall(f'{{{NS_W}}}gridCol') if tblGrid is not None else []
    
    hdr_tr = target_tbl_elem.find(f'{{{NS_W}}}tr')
    target_hdr_tcs = hdr_tr.findall(f'{{{NS_W}}}tc') if hdr_tr is not None else []

    if grid_cols:
        target_col_count = len(grid_cols)
    elif target_hdr_tcs:
        target_col_count = 0
        for tc in target_hdr_tcs:
            gs = tc.find(f'{{{NS_W}}}tcPr/{{{NS_W}}}gridSpan')
            span = int(gs.get(qn('w:val'), 1)) if gs is not None else 1
            target_col_count += span
    else:
        target_col_count = len(target_hdr_tcs)

    # Clean source cells: remove vMerge, gridSpan, and conflicting tcBorders that hide borders
    tcs = new_tr.findall(f'{{{NS_W}}}tc')
    for tc in tcs:
        tcPr = tc.find(f'{{{NS_W}}}tcPr')
        if tcPr is not None:
            vMerge = tcPr.find(f'{{{NS_W}}}vMerge')
            if vMerge is not None:
                tcPr.remove(vMerge)
            gridSpan = tcPr.find(f'{{{NS_W}}}gridSpan')
            if gridSpan is not None:
                tcPr.remove(gridSpan)
            # Remove any cell-level border overrides so table borders render uniformly
            tcBorders = tcPr.find(f'{{{NS_W}}}tcBorders')
            if tcBorders is not None:
                tcPr.remove(tcBorders)

    # Normalize column count to match target table grid
    if target_col_count > 0:
        current_count = len(tcs)
        if current_count < target_col_count:
            # Pad with empty cells
            for _ in range(target_col_count - current_count):
                empty_tc = parse_xml(f'<w:tc {nsdecls("w")}><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>-</w:t></w:r></w:p></w:tc>')
                new_tr.append(empty_tc)
            tcs = new_tr.findall(f'{{{NS_W}}}tc')
        elif current_count > target_col_count:
            # Consolidate surplus cells into the last allowed column
            last_allowed_tc = tcs[target_col_count - 1]
            last_p = last_allowed_tc.find(f'{{{NS_W}}}p')
            if last_p is None:
                last_p = parse_xml(f'<w:p {nsdecls("w")}/>')
                last_allowed_tc.append(last_p)
                
            for extra_tc in tcs[target_col_count:]:
                extra_text = ''.join(t.text for t in extra_tc.iter(f'{{{NS_W}}}t') if t.text).strip()
                if extra_text:
                    surplus_r = parse_xml(f'<w:r {nsdecls("w")}><w:t xml:space="preserve"> | {html.escape(extra_text)}</w:t></w:r>')
                    last_p.append(surplus_r)
                new_tr.remove(extra_tc)
            tcs = new_tr.findall(f'{{{NS_W}}}tc')

        # Copy target column widths from gridCol or header to keep columns straight
        for col_idx, tc in enumerate(tcs[:target_col_count]):
            col_w_xml = None
            if col_idx < len(grid_cols):
                w_val = grid_cols[col_idx].get(qn('w:w'))
                if w_val:
                    col_w_xml = f'<w:tcW {nsdecls("w")} w:w="{w_val}" w:type="dxa"/>'
            elif col_idx < len(target_hdr_tcs):
                hdr_w = target_hdr_tcs[col_idx].find(f'{{{NS_W}}}tcPr/{{{NS_W}}}tcW')
                if hdr_w is not None:
                    col_w_xml = f'<w:tcW {nsdecls("w")} w:w="{hdr_w.get(qn("w:w"))}" w:type="dxa"/>'
                    
            if col_w_xml:
                tcPr = tc.find(f'{{{NS_W}}}tcPr')
                if tcPr is None:
                    tcPr = parse_xml(f'<w:tcPr {nsdecls("w")}/>')
                    tc.insert(0, tcPr)
                cur_w = tcPr.find(f'{{{NS_W}}}tcW')
                if cur_w is not None:
                    tcPr.remove(cur_w)
                tcPr.append(parse_xml(col_w_xml))
                
    # Update S.No in the first cell
    if tcs and s_no is not None:
        p = tcs[0].find(f'{{{NS_W}}}p')
        if p is not None:
            for r in list(p.findall(f'{{{NS_W}}}r')):
                p.remove(r)
            new_r = parse_xml(f'<w:r {nsdecls("w")}><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>{s_no}</w:t></w:r>')
            p.append(new_r)
            
    # Tag department at the beginning of the second cell
    if len(tcs) > 1 and dept_name:
        p = tcs[1].find(f'{{{NS_W}}}p')
        if p is not None:
            dept_tag = f"[{dept_name}] "
            escaped_dept_tag = html.escape(dept_tag)
            full_c2 = ''.join(t.text for t in p.iter(f'{{{NS_W}}}t') if t.text)
            if dept_name not in full_c2:
                new_r = parse_xml(f'<w:r {nsdecls("w")}><w:rPr><w:b/><w:color w:val="C2410C"/></w:rPr><w:t xml:space="preserve">{escaped_dept_tag}</w:t></w:r>')
                p.insert(0, new_r)
                
    target_tbl_elem.append(new_tr)

def create_summary_matrix_xml(departments, category_data):
    """Generates an XML table element for the Executive Summary Department Matrix."""
    CATEGORY_LABELS = [
        ('1a_journals', 'Journal Publications'),
        ('1b_conferences', 'Conference Papers'),
        ('1c_patents', 'Patents Filed / Published'),
        ('1d_entrepreneurship', 'Entrepreneurship & Start-ups'),
        ('2_nss', 'NSS & Extension Activities'),
        ('3_fdp', 'Faculty Development (FDP)'),
        ('4_sdp', 'Student Development (SDP)'),
        ('5a_faculty_achievements', 'Faculty Achievements & Awards'),
        ('5b_student_achievements', 'Student Achievements & Awards'),
        ('5c_certifications', 'Certifications (NPTEL / Coursera)'),
        ('6a_dept_meetings', 'Department Meetings & Mentoring'),
        ('6b_mous', 'MoUs & Collaborations'),
        ('7_additional_initiatives', 'Additional Initiatives'),
        ('8_tech_association', 'Technical Association Activities'),
        ('9_iic_cell', 'IIC & Innovation Activities'),
    ]
    
    # Calculate counts per category per department
    dept_short = {}
    for d in departments:
        if 'Civil' in d: dept_short[d] = 'CIVIL'
        elif 'Computer' in d: dept_short[d] = 'CSE'
        elif 'Communication' in d: dept_short[d] = 'ECE'
        elif 'Electrical' in d: dept_short[d] = 'EEE'
        elif 'Humanities' in d or 'H&S' in d: dept_short[d] = 'H&S'
        else: dept_short[d] = d[:6].upper()

    matrix_rows = []
    
    # Header row
    hdr_cells = ['<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="1E3A8A"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Activity Category</w:t></w:r></w:p></w:tc>']
    for d in departments:
        code = dept_short.get(d, d)
        escaped_code = html.escape(code)
        hdr_cells.append(f'<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="1E3A8A"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>{escaped_code}</w:t></w:r></w:p></w:tc>')
    hdr_cells.append('<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="C2410C"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Institutional Total</w:t></w:r></w:p></w:tc>')
    matrix_rows.append(f'<w:tr {nsdecls("w")}><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>' + ''.join(hdr_cells) + '</w:tr>')
    
    # Data rows
    dept_totals = {d: 0 for d in departments}
    grand_total = 0
    
    for row_idx, (cat_key, cat_label) in enumerate(CATEGORY_LABELS):
        items = category_data.get(cat_key, [])
        cat_dept_counts = {}
        for it in items:
            d_name = it['dept']
            cat_dept_counts[d_name] = cat_dept_counts.get(d_name, 0) + 1
            
        cat_total = len(items)
        grand_total += cat_total
        bg = 'F8FAFC' if row_idx % 2 == 0 else 'FFFFFF'
        
        row_cells = [f'<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{bg}"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>{html.escape(cat_label)}</w:t></w:r></w:p></w:tc>']
        for d in departments:
            cnt = cat_dept_counts.get(d, 0)
            dept_totals[d] += cnt
            val_display = str(cnt) if cnt > 0 else '-'
            color = '0F172A' if cnt > 0 else '94A3B8'
            bold = '<w:b/>' if cnt > 0 else ''
            row_cells.append(f'<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{bg}"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr>{bold}<w:color w:val="{color}"/></w:rPr><w:t>{val_display}</w:t></w:r></w:p></w:tc>')
            
        row_cells.append(f'<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{bg}"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="C2410C"/></w:rPr><w:t>{cat_total}</w:t></w:r></w:p></w:tc>')
        matrix_rows.append(f'<w:tr {nsdecls("w")}><w:trPr><w:cantSplit/></w:trPr>' + ''.join(row_cells) + '</w:tr>')
        
    # Grand Total row
    tot_cells = ['<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="E2E8F0"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>Total Activities Reported</w:t></w:r></w:p></w:tc>']
    for d in departments:
        cnt = dept_totals[d]
        tot_cells.append(f'<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="E2E8F0"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>{cnt}</w:t></w:r></w:p></w:tc>')
    tot_cells.append(f'<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="FED7AA"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="C2410C"/></w:rPr><w:t>{grand_total}</w:t></w:r></w:p></w:tc>')
    matrix_rows.append(f'<w:tr {nsdecls("w")}><w:trPr><w:cantSplit/></w:trPr>' + ''.join(tot_cells) + '</w:tr>')

    tbl_xml = f'''<w:tbl {nsdecls("w")}>
        <w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:tblBorders>
                <w:top w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
                <w:left w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
                <w:bottom w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
                <w:right w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
                <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            </w:tblBorders>
            <w:tblCellMar>
                <w:top w:w="120" w:type="dxa"/>
                <w:bottom w:w="120" w:type="dxa"/>
                <w:left w:w="160" w:type="dxa"/>
                <w:right w:w="160" w:type="dxa"/>
            </w:tblCellMar>
        </w:tblPr>
        {''.join(matrix_rows)}
    </w:tbl>'''
    return parse_xml(tbl_xml)

def consolidate_reports(report_paths, output_path, college_name="SANSKRITHI SCHOOL OF ENGINEERING"):
    """
    Consolidate multiple departmental DOCX reports into a single unified DOCX report
    matching the exact institutional template format with flawless borders and formatting.
    """
    if not report_paths:
        raise ValueError("No report paths provided")

    print(f"Loading master template from: {os.path.basename(report_paths[0])}")
    master_doc = docx.Document(report_paths[0])
    
    # Extract master tables with linear headings
    master_tables = extract_tables_with_headings(master_doc)
    print(f"Discovered {len(master_tables)} section tables in template.")

    # Parse and index data from all input documents
    departments_found = []
    periods_found = set()
    category_data = {} # category_key -> list of {dept, tr_elem, cells}

    for path in report_paths:
        d = docx.Document(path)
        meta = extract_department_info(d, path)
        dept_name = meta['department']
        departments_found.append(dept_name)
        if meta['period']:
            periods_found.add(meta['period'])
            
        print(f"\nProcessing Report: {os.path.basename(path)}")
        print(f"   Department: {dept_name} | Period: {meta['period']} | HOD: {meta['hod']}")
        
        doc_tables = extract_tables_with_headings(d)
        for t_info in doc_tables:
            cat = t_info['category']
            if cat == 'UNKNOWN':
                continue
            if cat not in category_data:
                category_data[cat] = []
                
            tbl_elem = t_info['tbl_elem']
            tr_elems = tbl_elem.findall(f'{{{NS_W}}}tr')
            
            # Iterate through rows (skipping header row 0)
            for r_elem in tr_elems[1:]:
                cells_text = []
                for tc in r_elem.findall(f'.//{{{NS_W}}}tc'):
                    c_text = ''.join(elem.text for elem in tc.iter(f'{{{NS_W}}}t') if elem.text).strip()
                    cells_text.append(c_text)
                    
                if is_meaningful_row(cells_text):
                    category_data[cat].append({
                        'dept': dept_name,
                        'tr_elem': r_elem,
                        'cells': cells_text
                    })

    common_period = sorted(list(periods_found))[0] if periods_found else 'April 2026'
    unique_depts = sorted(list(set(departments_found)))
    print(f"\nParticipating Departments: {', '.join(unique_depts)}")

    # 1. Update Master Document Header Paragraphs
    for p in master_doc.paragraphs[:10]:
        if 'Department:' in p.text:
            p.text = f"Institution: {college_name} | CONSOLIDATED INSTITUTIONAL REPORT"
            if p.runs:
                p.runs[0].bold = True
                p.runs[0].font.size = Pt(13)
                p.runs[0].font.color.rgb = RGBColor(194, 65, 12)
        elif 'Reporting Period:' in p.text:
            p.text = f"Reporting Period: {common_period}  |  Participating Departments: {', '.join(unique_depts)}"
            if p.runs:
                p.runs[0].bold = True
        elif 'HOD Name:' in p.text:
            p.text = "Authority: Principal / Academic Director & All Department HODs"
        elif 'Date of Submission:' in p.text:
            p.text = "Compilation: Institutional Internal Quality Assurance Cell (IQAC)"

    # Find where Section 1 begins to insert the Executive Summary Matrix
    first_major_section_elem = None
    for p in master_doc.paragraphs:
        if '1. Research, Innovation' in p.text:
            first_major_section_elem = p._element
            break

    # Insert Executive Summary Matrix heading & table
    if first_major_section_elem is not None:
        p_exec_heading = parse_xml(
            f'<w:p {nsdecls("w")}><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>'
            f'<w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="1E3A8A"/></w:rPr>'
            f'<w:t>INSTITUTIONAL EXECUTIVE SUMMARY MATRIX ({html.escape(common_period.upper())})</w:t></w:r></w:p>'
        )
        p_exec_desc = parse_xml(
            f'<w:p {nsdecls("w")}><w:pPr><w:spacing w:before="0" w:after="160"/></w:pPr>'
            f'<w:r><w:rPr><w:i/><w:color w:val="64748B"/></w:rPr>'
            f'<w:t>Cross-departmental consolidated performance metrics across all academic and research domains.</w:t></w:r></w:p>'
        )
        matrix_tbl_elem = create_summary_matrix_xml(unique_depts, category_data)
        p_spacer = parse_xml(f'<w:p {nsdecls("w")}><w:pPr><w:spacing w:before="200" w:after="200"/></w:pPr></w:p>')

        body_elem = master_doc._body._element
        target_idx = list(body_elem).index(first_major_section_elem)
        body_elem.insert(target_idx, p_exec_heading)
        body_elem.insert(target_idx + 1, p_exec_desc)
        body_elem.insert(target_idx + 2, matrix_tbl_elem)
        body_elem.insert(target_idx + 3, p_spacer)

    # 2. Populate each classified table in master document & style borders
    total_aggregated_rows = 0

    for idx, t_info in enumerate(master_tables):
        cat = t_info['category']
        tbl_elem = t_info['tbl_elem']
        
        # Apply crisp, complete borders & margins to every table
        apply_professional_table_styling(tbl_elem)
        
        # If it's a specific syllabus branch table, check if we have data for this branch or keep original
        if cat.startswith('10_syllabus'):
            items = category_data.get(cat, [])
            if not items and cat == '10_syllabus_general':
                items = category_data.get('10_syllabus', [])
            # If still no items, check if the table already has meaningful rows from the template (e.g. H&S branches)
            existing_tr = tbl_elem.findall(f'{{{NS_W}}}tr')
            if len(existing_tr) > 1 and not items:
                print(f"Preserving existing syllabus content in '{cat}' (Table #{idx}): {len(existing_tr)-1} rows")
                continue
        else:
            items = category_data.get(cat, [])

        print(f"Populating '{cat}' (Table #{idx}): {len(items)} items")

        # Clear existing rows (keep header row 0)
        tr_list = tbl_elem.findall(f'{{{NS_W}}}tr')
        for old_tr in tr_list[1:]:
            tbl_elem.remove(old_tr)

        if items:
            s_no = 1
            for it in items:
                append_row_xml(tbl_elem, it['tr_elem'], s_no=s_no, dept_name=it['dept'])
                s_no += 1
                total_aggregated_rows += 1
        else:
            # Single NIL row if no department has entries for this category
            first_tr = tbl_elem.find(f'{{{NS_W}}}tr')
            col_count = len(first_tr.findall(f'{{{NS_W}}}tc')) if first_tr is not None else 6
            hdr_tcs = first_tr.findall(f'{{{NS_W}}}tc') if first_tr is not None else []
            
            nil_cells = []
            for i in range(col_count):
                tc_w_xml = ''
                if i < len(hdr_tcs):
                    w_elem = hdr_tcs[i].find(f'{{{NS_W}}}tcPr/{{{NS_W}}}tcW')
                    if w_elem is not None:
                        tc_w_xml = f'<w:tcW w:w="{w_elem.get(qn("w:w"))}" w:type="dxa"/>'
                text_val = "1" if i == 0 else "NIL"
                nil_cells.append(
                    f'<w:tc><w:tcPr>{tc_w_xml}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr>'
                    f'<w:r><w:rPr><w:i/><w:color w:val="64748B"/></w:rPr><w:t>{text_val}</w:t></w:r></w:p></w:tc>'
                )
            nil_tr = parse_xml(
                f'<w:tr {nsdecls("w")}><w:trPr><w:cantSplit/></w:trPr>'
                + ''.join(nil_cells)
                + '</w:tr>'
            )
            tbl_elem.append(nil_tr)

    # Save output
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    master_doc.save(output_path)
    print(f"\n============================================================")
    print(f"SUCCESS: Generated Overall Consolidated Report!")
    print(f"File Saved: {output_path}")
    print(f"Total Aggregated Items: {total_aggregated_rows}")
    print(f"Departments Covered: {', '.join(unique_depts)}")
    print(f"============================================================")
    return {
        'output_path': output_path,
        'total_items': total_aggregated_rows,
        'departments': unique_depts,
        'period': common_period
    }

def consolidate_from_zip(zip_path, output_path=None):
    """Extracts zip archive and runs consolidation on all contained docx reports."""
    extract_folder = os.path.join(os.path.dirname(zip_path), 'temp_extracted_reports')
    os.makedirs(extract_folder, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(extract_folder)
        
    docx_files = [
        os.path.join(extract_folder, f) for f in os.listdir(extract_folder)
        if f.endswith('.docx') and not f.startswith('~$')
    ]
    
    if not output_path:
        output_path = os.path.join(os.path.dirname(zip_path), 'Consolidated_Institutional_HOD_Report_April_2026.docx')
        
    return consolidate_reports(docx_files, output_path)

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        zip_file = r'c:\Users\nmani\OneDrive\Desktop\Buddy\Reports Zip File.zip'
        out_file = r'c:\Users\nmani\OneDrive\Desktop\Buddy\Consolidated_Institutional_HOD_Report_April_2026.docx'
        consolidate_from_zip(zip_file, out_file)
    else:
        first_arg = sys.argv[1]
        out_file = sys.argv[2] if len(sys.argv) > 2 else r'c:\Users\nmani\OneDrive\Desktop\Buddy\Consolidated_Institutional_HOD_Report_April_2026.docx'
        
        if os.path.isdir(first_arg):
            docx_files = [
                os.path.join(first_arg, f) for f in os.listdir(first_arg)
                if f.endswith('.docx') and not f.startswith('~$')
            ]
            consolidate_reports(docx_files, out_file)
        elif first_arg.lower().endswith('.zip'):
            consolidate_from_zip(first_arg, out_file)
        else:
            # List of docx files or single file
            docx_files = [f for f in sys.argv[1:-1] if f.endswith('.docx')]
            if not docx_files:
                docx_files = [first_arg]
            out_file = sys.argv[-1]
            consolidate_reports(docx_files, out_file)
