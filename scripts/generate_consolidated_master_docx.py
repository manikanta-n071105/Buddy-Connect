import os
import sys
import json
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn

NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

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
    return DEPARTMENT_CODE_MAP.get(dept_name, dept_name[:6].upper())

def apply_table_styling(table):
    tbl_elem = table._element
    tblPr = tbl_elem.find(f'{{{NS_W}}}tblPr')
    if tblPr is None:
        tblPr = parse_xml(f'<w:tblPr {nsdecls("w")}/>')
        tbl_elem.insert(0, tblPr)

    # Table Borders
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

    # Cell Margins
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

    # Header Row Styling
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

        for tc in hdr_tr.findall(f'.//{{{NS_W}}}tc'):
            tcPr = tc.find(f'{{{NS_W}}}tcPr')
            if tcPr is None:
                tcPr = parse_xml(f'<w:tcPr {nsdecls("w")}/>')
                tc.insert(0, tcPr)
            shd = tcPr.find(f'{{{NS_W}}}shd')
            if shd is not None:
                tcPr.remove(shd)
            tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="1E3A8A"/>'))

            for p in tc.findall(f'.//{{{NS_W}}}p'):
                pPr = p.find(f'{{{NS_W}}}pPr')
                if pPr is None:
                    pPr = parse_xml(f'<w:pPr {nsdecls("w")}/>')
                    p.insert(0, pPr)
                jc = pPr.find(f'{{{NS_W}}}jc')
                if jc is not None:
                    pPr.remove(jc)
                pPr.append(parse_xml(f'<w:jc {nsdecls("w")} w:val="center"/>'))

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

    # Data Rows Styling
    for r_idx, tr in enumerate(tr_elems[1:]):
        trPr = tr.find(f'{{{NS_W}}}trPr')
        if trPr is None:
            trPr = parse_xml(f'<w:trPr {nsdecls("w")}/>')
            tr.insert(0, trPr)
        if trPr.find(f'{{{NS_W}}}cantSplit') is None:
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

        bg = 'F8FAFC' if r_idx % 2 == 1 else 'FFFFFF'
        for tc in tr.findall(f'.//{{{NS_W}}}tc'):
            tcPr = tc.find(f'{{{NS_W}}}tcPr')
            if tcPr is None:
                tcPr = parse_xml(f'<w:tcPr {nsdecls("w")}/>')
                tc.insert(0, tcPr)
            shd = tcPr.find(f'{{{NS_W}}}shd')
            if shd is not None:
                tcPr.remove(shd)
            tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="{bg}"/>'))

def is_meaningful_item(item):
    if not item or not isinstance(item, dict):
        return False
    primary_keys = ['title', 'event', 'subject', 'initiative', 'name', 'nameRoll', 'decisions', 'award', 'platform', 'purpose', 'activity']
    for k in primary_keys:
        val = str(item.get(k, '') or '').strip()
        if len(val) >= 2:
            return True
    return any(len(str(v).strip()) >= 2 for k, v in item.items() if k not in ['status', 'mode', 'deptCode', 'noOfDays', 'link'])

def add_consolidated_table(doc, headers, items_with_dept, keys_mapping):
    col_count = len(headers)
    table = doc.add_table(rows=1, cols=col_count)
    table.autofit = False

    # Header Row
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.bold = True
            r.font.size = Pt(9)
            r.font.color.rgb = RGBColor(255, 255, 255)

    valid_items = [it for it in items_with_dept if is_meaningful_item(it)]

    if valid_items:
        for idx, item in enumerate(valid_items):
            row_cells = table.add_row().cells
            row_cells[0].text = str(idx + 1)
            p0 = row_cells[0].paragraphs[0]
            p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p0.runs:
                r.bold = True
                r.font.size = Pt(8.5)
                r.font.color.rgb = RGBColor(15, 23, 42)

            for col_idx, k in enumerate(keys_mapping):
                target_cell = row_cells[col_idx + 1]
                if k == 'deptCode':
                    val = item.get('deptCode') or get_dept_code(item.get('department', ''))
                    target_cell.text = str(val)
                    p = target_cell.paragraphs[0]
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    for r in p.runs:
                        r.bold = True
                        r.font.size = Pt(8.5)
                        r.font.color.rgb = RGBColor(30, 58, 138)
                else:
                    val = str(item.get(k, '') or '').strip()
                    target_cell.text = val if val else '-'
                    p = target_cell.paragraphs[0]
                    for r in p.runs:
                        r.font.size = Pt(8.5)
                        r.font.color.rgb = RGBColor(15, 23, 42)
    else:
        nil_row = table.add_row().cells
        for col_idx in range(col_count):
            nil_row[col_idx].text = "1" if col_idx == 0 else "NIL"
            p = nil_row[col_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.italic = True
                r.font.size = Pt(8.5)
                r.font.color.rgb = RGBColor(148, 163, 184)

    apply_table_styling(table)
    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(2)
    p_space.paragraph_format.space_after = Pt(6)
    return len(valid_items)

def generate_consolidated_master_docx(all_dept_data, period, output_path, college_name="SANSKRITHI SCHOOL OF ENGINEERING"):
    doc = docx.Document()

    # Standard Page Margins: 0.75 in
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # 1. Master Header Banner
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    r_col = p_title.add_run(f"{college_name}\n")
    r_col.bold = True
    r_col.font.size = Pt(14)
    r_col.font.color.rgb = RGBColor(30, 58, 138)

    r_sub = p_title.add_run(f"CONSOLIDATED INSTITUTIONAL PROGRESS REPORT — {period.upper()}\n")
    r_sub.bold = True
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(194, 65, 12)

    unique_depts = list(all_dept_data.keys())
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(4)
    p_meta.paragraph_format.space_after = Pt(12)
    r_meta = p_meta.add_run(f"Reporting Period: {period}  |  Participating Entities: {', '.join(unique_depts)}")
    r_meta.font.size = Pt(9)
    r_meta.font.color.rgb = RGBColor(71, 85, 105)

    def add_major_heading(text, desc=""):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(11)
        r.font.color.rgb = RGBColor(15, 23, 42)
        if desc:
            pd = doc.add_paragraph()
            pd.paragraph_format.space_before = Pt(0)
            pd.paragraph_format.space_after = Pt(5)
            rd = pd.add_run(desc)
            rd.font.size = Pt(9)
            rd.font.color.rgb = RGBColor(71, 85, 105)

    def add_sub_heading(text, desc=""):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(30, 58, 138)
        if desc:
            pd = doc.add_paragraph()
            pd.paragraph_format.space_before = Pt(0)
            pd.paragraph_format.space_after = Pt(4)
            rd = pd.add_run(desc)
            rd.font.size = Pt(8.5)
            rd.font.color.rgb = RGBColor(100, 116, 139)

    # 2. Executive Summary Performance Matrix Table
    add_major_heading("INSTITUTIONAL EXECUTIVE SUMMARY MATRIX", "Cross-departmental consolidated performance metrics across all academic and research domains.")
    
    matrix_headers = ['Domain / Metric Category', 'CIVIL', 'CSE', 'ECE', 'EEE', 'MECH', 'H&S', 'TOTAL']
    matrix_table = doc.add_table(rows=1, cols=len(matrix_headers))
    matrix_table.autofit = False

    for i, h in enumerate(matrix_headers):
        matrix_table.rows[0].cells[i].text = h
        p = matrix_table.rows[0].cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.bold = True
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(255, 255, 255)

    academic_codes = ['CIVIL', 'CSE', 'ECE', 'EEE', 'MECH', 'H&S']
    
    metric_categories = [
        ('1a. Journal Publications', 'journals'),
        ('1b. Conference Presentations', 'conferences'),
        ('2a. Patents', 'patents'),
        ('2b. Activities and Initiatives', 'entrepreneurship'),
        ('3a. FDPs Attended', 'fdpAttended'),
        ('3b. FDPs Organized', 'fdpOrganized'),
        ('4. Student Development Programs (SDPs)', 'sdp'),
        ('5a. Faculty Achievements', 'facultyAchievements'),
        ('5b. Student Achievements', 'studentAchievements'),
        ('5c. Certifications', 'certifications'),
        ('6a. Meetings & Governance', 'deptMeetings'),
        ('6b. Collaborations & MoUs', 'mous'),
        ('7. Additional Initiatives', 'additionalInitiatives'),
        ('8. Technical Association Activities', 'techAssociation'),
        ('9. Clubs & Student Engagement Activity', 'studentEngagement'),
        ('10. NSS and Other Extension Activities', 'nss'),
        ('11. Syllabus Coverage Reports', 'syllabus'),
    ]

    col_totals = {c: 0 for c in academic_codes}
    grand_total = 0

    for label, sec_key in metric_categories:
        row_cells = matrix_table.add_row().cells
        row_cells[0].text = label
        p0 = row_cells[0].paragraphs[0]
        for r in p0.runs:
            r.bold = True
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(15, 23, 42)

        row_sum = 0
        for idx, code in enumerate(academic_codes):
            # Find matching department
            matching_sec = None
            for d_name, sec_data in all_dept_data.items():
                if get_dept_code(d_name) == code or d_name.upper().startswith(code):
                    matching_sec = sec_data
                    break
            
            cnt = 0
            if matching_sec and isinstance(matching_sec, dict):
                items = matching_sec.get(sec_key, [])
                if sec_key == 'fdpAttended' and not items:
                    items = matching_sec.get('fdp', [])
                cnt = len([it for it in items if is_meaningful_item(it)])

            col_totals[code] += cnt
            row_sum += cnt
            cell = row_cells[idx + 1]
            cell.text = str(cnt) if cnt > 0 else '-'
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.size = Pt(8.5)
                if cnt > 0:
                    r.bold = True
                    r.font.color.rgb = RGBColor(30, 58, 138)
                else:
                    r.font.color.rgb = RGBColor(148, 163, 184)

        grand_total += row_sum
        tot_cell = row_cells[-1]
        tot_cell.text = str(row_sum)
        pt = tot_cell.paragraphs[0]
        pt.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in pt.runs:
            r.bold = True
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(194, 65, 12)

    # Total row
    tot_row = matrix_table.add_row().cells
    tot_row[0].text = "OVERALL TOTAL METRICS"
    p_tot_lbl = tot_row[0].paragraphs[0]
    for r in p_tot_lbl.runs:
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(30, 58, 138)

    for idx, code in enumerate(academic_codes):
        c_cell = tot_row[idx + 1]
        c_cell.text = str(col_totals[code])
        p = c_cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.bold = True
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(30, 58, 138)

    g_cell = tot_row[-1]
    g_cell.text = str(grand_total)
    p_g = g_cell.paragraphs[0]
    p_g.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for r in p_g.runs:
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(194, 65, 12)

    apply_table_styling(matrix_table)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Helper to gather all items for a section key across all departments
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

    total_records = 0

    # -------------------------------------------------------------
    # 1. Research, Publications & Academic Contributions
    # -------------------------------------------------------------
    add_major_heading("1. Research, Publications and Academic Contributions", "Consolidated peer-reviewed journal publications and conference presentations across all engineering and science departments.")

    # 1a Journals
    add_sub_heading("a) Journal Publications", "Peer-reviewed research articles published in indexed journals (Scopus, WoS, UGC, etc.).")
    headers_1a = ['S.No', 'Branch', 'Title of Publication', 'Authors', 'Journal Name', 'ISSN / ISBN', 'Vol / Issue / Year', 'Page Nos', 'Indexed In', 'Link to Publication']
    keys_1a = ['deptCode', 'title', 'authors', 'journalName', 'issnIsbn', 'volIssueYear', 'pageNos', 'indexedIn', 'link']
    total_records += add_consolidated_table(doc, headers_1a, gather_items('journals'), keys_1a)

    # 1b Conferences
    add_sub_heading("b) Conference Presentations", "Papers presented at national and international conferences, symposiums, and proceedings.")
    headers_1b = ['S.No', 'Branch', 'Title of Paper', 'Authors', 'Conference Name', 'Date', 'Location / Mode', 'Issue / Pages / ISBN', 'Indexed In', 'Link / Proof']
    keys_1b = ['deptCode', 'title', 'authors', 'conferenceName', 'date', 'locationMode', 'volIssueYear', 'indexedIn', 'link']
    total_records += add_consolidated_table(doc, headers_1b, gather_items('conferences'), keys_1b)

    # -------------------------------------------------------------
    # 2. Innovation, Patents & Entrepreneurship
    # -------------------------------------------------------------
    add_major_heading("2. Innovation, Patents and Entrepreneurship", "Intellectual property filings, published/granted patents, incubation programs, and startup initiatives.")

    # 2a Patents
    add_sub_heading("2a) Patents", "Granted or published patents and official patent applications filed by faculty and student inventors.")
    headers_2a = ['S.No', 'Branch', 'Patent / Innovation Title', 'Inventors', 'Applicants', 'Patent Number', 'Status', 'Awarded Date', 'Link to Proof']
    keys_2a = ['deptCode', 'title', 'inventors', 'applicants', 'patentNumber', 'status', 'awardedDate', 'link']
    total_records += add_consolidated_table(doc, headers_2a, gather_items('patents'), keys_2a)

    # 2b Activities & Initiatives
    add_sub_heading("2b) Activities and Initiatives", "Start-ups, business idea competitions, incubation activities, and innovation mentoring sessions.")
    headers_2b = ['S.No', 'Branch', 'Program / Activity Title', 'Date', 'Type of Activity', 'Participants', 'Organized By', 'No. of Participants', 'Status', 'Report / Proof Link']
    keys_2b = ['deptCode', 'title', 'date', 'type', 'participants', 'organizedBy', 'participantsCount', 'status', 'link']
    total_records += add_consolidated_table(doc, headers_2b, gather_items('entrepreneurship'), keys_2b)

    # -------------------------------------------------------------
    # 3. NSS and Other Extension Activities
    # -------------------------------------------------------------
    add_major_heading("3. NSS and Other Extension Activities", "Community engagement, social outreach camps, blood donation drives, and sustainability projects.")
    headers_3 = ['S.No', 'Branch', 'Event / Activity Name', 'Date', 'Venue', 'Type', 'No. of Participants', 'Outcomes', 'Coordinator', 'Report / Photo Link']
    keys_3 = ['deptCode', 'event', 'date', 'venue', 'type', 'participantsCount', 'outcomes', 'coordinator', 'link']
    total_records += add_consolidated_table(doc, headers_3, gather_items('nss'), keys_3)

    # -------------------------------------------------------------
    # 4. Faculty Development Programs (FDPs)
    # -------------------------------------------------------------
    add_major_heading("4. Faculty Development Programs (FDPs)", "Professional development programs, short-term training courses, and workshops attended or organized.")

    # 4a Attended
    add_sub_heading("a) Faculty Development Programs Attended", "Details of FDPs, STTPs, and national/international workshops attended by faculty.")
    headers_4a = ['S.No', 'Branch', 'Program Title', 'Type', 'Dates', 'Organizing Body', 'Mode', 'Faculty Name', 'Proof Link']
    keys_4a = ['deptCode', 'title', 'type', 'dates', 'organizingBody', 'mode', 'facultyAttended', 'link']
    total_records += add_consolidated_table(doc, headers_4a, gather_items('fdpAttended', 'fdp'), keys_4a)

    # 4b Organized
    add_sub_heading("b) Faculty Development Programs Organized", "Workshops, training sessions, and faculty seminars hosted by departments.")
    headers_4b = ['S.No', 'Branch', 'Program Title', 'Type', 'Dates', 'Dept. Organized', 'Resource Person Details', 'Faculty Coordinator(s)', 'Certificate / Proof Link']
    keys_4b = ['deptCode', 'title', 'type', 'dates', 'deptOrganized', 'resourcePersonDetails', 'facultyCoordinators', 'link']
    total_records += add_consolidated_table(doc, headers_4b, gather_items('fdpOrganized'), keys_4b)

    # -------------------------------------------------------------
    # 5. Student Development Programs (SDPs)
    # -------------------------------------------------------------
    add_major_heading("5. Student Development Programs (SDPs)", "Hands-on workshops, technical training, industry expert talks, and student capability enhancement programs.")
    headers_5 = ['S.No', 'Branch', 'Event Title', 'Date', 'Type of SDP', 'Resource Person & Org', 'Mode', 'Key Outcomes', 'Participants', 'Coordinator', 'Report / Photo Link']
    keys_5 = ['deptCode', 'title', 'date', 'type', 'resourcePerson', 'mode', 'keyOutcomes', 'participantsCount', 'coordinator', 'link']
    total_records += add_consolidated_table(doc, headers_5, gather_items('sdp'), keys_5)

    # -------------------------------------------------------------
    # 6. Achievements & Certifications
    # -------------------------------------------------------------
    add_major_heading("6. Achievements & Certifications", "Prestigious academic awards, student competition prizes, and elite professional certifications.")

    # 6a Faculty Achievements
    add_sub_heading("a) Faculty Achievements", "Recognitions for exemplary teaching, research excellence, patents, or institutional leadership.")
    headers_6a = ['S.No', 'Branch', 'Faculty Name', 'Award / Recognition', 'Organization / Agency', 'Date', 'Proof Link']
    keys_6a = ['deptCode', 'name', 'award', 'organization', 'date', 'link']
    total_records += add_consolidated_table(doc, headers_6a, gather_items('facultyAchievements'), keys_6a)

    # 6b Student Achievements
    add_sub_heading("b) Student Achievements", "Awards and top ranks in hackathons, technical symposiums, sports, and cultural contests.")
    headers_6b = ['S.No', 'Branch', 'Student Name & Roll No', 'Award / Recognition', 'Event / Competition', 'Organization', 'Date / Duration', 'Certificate Link']
    keys_6b = ['deptCode', 'nameRoll', 'award', 'event', 'organization', 'durationDate', 'link']
    total_records += add_consolidated_table(doc, headers_6b, gather_items('studentAchievements'), keys_6b)

    # 6c Online Certifications
    add_sub_heading("c) Online Certifications", "NPTEL, Coursera, EdX, and professional industry certifications completed.")
    headers_6c = ['S.No', 'Branch', 'Course Title', 'Type', 'Duration', 'Platform / Resource', 'Enrolled', 'Certified', 'Key Outcomes', 'Certificate Link']
    keys_6c = ['deptCode', 'title', 'type', 'duration', 'platform', 'enrolled', 'certified', 'keyOutcomes', 'link']
    total_records += add_consolidated_table(doc, headers_6c, gather_items('certifications'), keys_6c)

    # -------------------------------------------------------------
    # 7. Department Meetings, Minutes & MoUs
    # -------------------------------------------------------------
    add_major_heading("7. Department Meetings, Minutes & MoUs", "Official academic committee hearings, DAC meetings, policy implementations, and industry partnerships.")

    # 7a Department Meetings & Minutes
    add_sub_heading("a) Departmental & Committee Meetings (Minutes of Meeting)", "Formal discussions, DAC decisions, curriculum reviews, and student grievance resolutions.")
    headers_7a = ['S.No', 'Branch', 'Date', 'Key Decisions / Topics Discussed', 'Policy Changes (if any)', 'Minutes / Document Link']
    keys_7a = ['deptCode', 'date', 'decisions', 'policyChanges', 'link']
    total_records += add_consolidated_table(doc, headers_7a, gather_items('deptMeetings'), keys_7a)

    # 7b MoUs & Collaborations
    add_sub_heading("b) Collaborations & MoUs", "Formal agreements with corporate partners, research labs, and academic institutions.")
    headers_7b = ['S.No', 'Branch', 'Industry / Academic Body', 'Nature & Purpose', 'Active Period', 'Faculty SPOC', 'MoU Document Link']
    keys_7b = ['deptCode', 'name', 'purpose', 'datePeriod', 'facultySpoc', 'link']
    total_records += add_consolidated_table(doc, headers_7b, gather_items('mous'), keys_7b)

    # -------------------------------------------------------------
    # 8. Additional / Other Relevant Initiatives
    # -------------------------------------------------------------
    add_major_heading("8. Additional / Other Relevant Initiatives", "Alumni interactions, quality enhancement projects, lab modernizations, and departmental special initiatives.")
    headers_8 = ['S.No', 'Branch', 'Initiative / Activity', 'Date', 'Description', 'Key Outcomes', 'Coordinator(s)', 'Report / Proof Link']
    keys_8 = ['deptCode', 'initiative', 'date', 'description', 'outcomes', 'coordinator', 'link']
    total_records += add_consolidated_table(doc, headers_8, gather_items('additionalInitiatives'), keys_8)

    # -------------------------------------------------------------
    # 9. Technical Association Activities
    # -------------------------------------------------------------
    add_major_heading("9. Technical Association Activities", "Student branch activities, coding competitions, project exhibitions, and technical symposiums.")
    headers_9 = ['S.No', 'Branch', 'Event / Activity', 'Date', 'Type of Activity', 'Resource Person / Coordinator', 'Participants', 'Evidence Link']
    keys_9 = ['deptCode', 'event', 'date', 'type', 'resourcePersonCoordinator', 'participants', 'link']
    total_records += add_consolidated_table(doc, headers_9, gather_items('techAssociation'), keys_9)

    # -------------------------------------------------------------
    # 10. IIC Cell & Innovation Initiatives
    # -------------------------------------------------------------
    add_major_heading("10. IIC Cell (Institution’s Innovation Council)", "Events fostering startup culture, innovation prototypes, and intellectual property development.")
    headers_10 = ['S.No', 'Branch', 'Activity / Initiative', 'Date', 'Description / Objective', 'Partner / Resource', 'Beneficiaries', 'Outcomes', 'Evidence Link']
    keys_10 = ['deptCode', 'activity', 'date', 'description', 'partner', 'beneficiaries', 'outcomes', 'link']
    total_records += add_consolidated_table(doc, headers_10, gather_items('iicCell'), keys_10)

    # -------------------------------------------------------------
    # 11. Comprehensive Syllabus Coverage Report
    # -------------------------------------------------------------
    add_major_heading("11. Comprehensive Syllabus Coverage Report", "Branch-wise academic syllabus delivery status across all theory courses and practical laboratories.")
    headers_11 = ['S.No', 'Branch', 'Subject / Course Name', 'Year / Sem', 'Faculty Name', 'Syllabus Completed (5 Units)', 'Syllabus Pending', 'Remarks / Lesson Plan Status']
    keys_11 = ['deptCode', 'subject', 'yearSem', 'faculty', 'completed', 'pending', 'remarks']
    total_records += add_consolidated_table(doc, headers_11, gather_items('syllabus'), keys_11)

    # -------------------------------------------------------------
    # Student Engagement & Clubs Activity
    # -------------------------------------------------------------
    eng_items = gather_items('studentEngagement')
    if eng_items:
        add_major_heading("12. Student Engagement & Club Activities", "Club events, cultural fests, sports competitions, and campus student life initiatives.")
        headers_12 = ['S.No', 'Branch', 'Title of the Activity', 'Type of Activity', 'Dates', 'Participants', 'Coordinator', 'Remarks']
        keys_12 = ['deptCode', 'title', 'type', 'dates', 'participantsCount', 'coordinator', 'remarks']
        total_records += add_consolidated_table(doc, headers_12, eng_items, keys_12)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    doc.save(output_path)

    return {
        'success': True,
        'output_path': output_path,
        'total_records': total_records,
        'departments_count': len(unique_depts),
        'period': period
    }

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python generate_consolidated_master_docx.py <input_json_file_or_string> <output_docx_path>")
        sys.exit(1)

    input_source = sys.argv[1]
    output_docx = sys.argv[2]

    if os.path.exists(input_source):
        with open(input_source, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        data = json.loads(input_source)

    period_val = data.get('period', 'September 2026')
    depts_data = data.get('departmentsData', {})

    res = generate_consolidated_master_docx(depts_data, period_val, output_docx)
    print(json.dumps(res))
