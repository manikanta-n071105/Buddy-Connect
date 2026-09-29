import React, { useState, useEffect, useLayoutEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ReportSectionsData, normalizeSections } from './HODManualReportBuilder';
import { getDepartmentSampleData } from './departmentSampleData';

interface ConsolidatedInstitutionalPDFViewProps {
  id?: string;
  period: string;
  submissionDate?: string;
  customData?: Record<string, ReportSectionsData>;
}

interface ColumnConfig<T = any> {
  header: string;
  width: string;
  align?: 'left' | 'center' | 'right';
  render: (item: T, globalIdx: number) => React.ReactNode;
}

interface SectionConfig<T = any> {
  key: string;
  title: string;
  tall?: boolean;
  rowsPerPage: number;
  getItems: (deptDataMap: Record<string, ReportSectionsData>, departmentList: Array<{ code: string; name: string }>) => T[];
  columns: ColumnConfig<T>[];
}

/**
 * Robust Multi-Page PDF Exporter:
 * Captures each `.pdf-page` element individually on a dedicated A4 sheet.
 * Completely eliminates auto-slicing and mid-table page breaks.
 */
export const exportPagesToPdf = async (containerId: string, filename?: string): Promise<Blob> => {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`PDF container #${containerId} not found in DOM`);

  const bad = Array.from(container.querySelectorAll<HTMLElement>('[data-body]'))
    .findIndex(b => b.scrollHeight - b.clientHeight > 1);
  if (bad !== -1) throw new Error(`Page ${bad + 2} content overflows; export aborted.`);

  const pages = container.querySelectorAll<HTMLElement>('.pdf-page');
  if (pages.length === 0) throw new Error('No .pdf-page elements found');

  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 750,
      height: 1060,
      windowWidth: 1024,
      scrollX: 0,
      scrollY: 0
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  }

  return pdf.output('blob');
};

// Helper to check if an item contains meaningful content (not just blank strings or default status)
export const isMeaningfulItem = (item: any): boolean => {
  if (!item || typeof item !== 'object') return false;
  const primaryKeys = ['title', 'event', 'subject', 'initiative', 'name', 'nameRoll', 'decisions', 'award', 'platform', 'purpose'];
  for (const k of primaryKeys) {
    if (typeof item[k] === 'string' && item[k].trim().length >= 2) {
      return true;
    }
  }
  const values = Object.entries(item)
    .filter(([k]) => k !== 'status' && k !== 'mode' && k !== 'deptCode' && k !== 'noOfDays' && k !== 'link')
    .map(([, v]) => (typeof v === 'string' ? v.trim() : ''))
    .filter(v => v.length > 0);
  return values.some(v => v.length >= 2);
};

export const hasAnyMeaningfulData = (sec: ReportSectionsData | undefined): boolean => {
  if (!sec || typeof sec !== 'object') return false;
  return Object.values(sec).some(arr => Array.isArray(arr) && arr.some(isMeaningfulItem));
};

export const ConsolidatedInstitutionalPDFView: React.FC<ConsolidatedInstitutionalPDFViewProps> = ({
  id = 'consolidated-pdf-document',
  period,
  customData
}) => {
  const [logoBase64, setLogoBase64] = useState<string>('/assets/sse-header-logo.png');
  const SAFETY_DEFAULT = 20;
  const [safety, setSafety] = useState<number>(SAFETY_DEFAULT);

  // Monitor DOM rendering: if any page body overflows, automatically widen safety margin to re-paginate
  useLayoutEffect(() => {
    const root = document.getElementById(id);
    if (!root) return;
    const overflowing = Array.from(root.querySelectorAll<HTMLElement>('[data-body]'))
      .some(b => b.scrollHeight - b.clientHeight > 1);
    if (overflowing && safety < 140) {
      setSafety(s => s + 16);
    }
  }, [safety, id]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/assets/sse-header-logo.png');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setLogoBase64(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        // Fallback to static path
      }
    };
    fetchLogo();
  }, []);

  // Standard 6 Academic Departments
  const academicDepartments = [
    { code: 'CIVIL', name: 'Civil Engineering', hod: 'Prof. K. Siva Prasad', type: 'ACADEMIC' as const },
    { code: 'CSE', name: 'Computer Science & Engineering', hod: 'Dr. Kethineni Vinod Kumar', type: 'ACADEMIC' as const },
    { code: 'ECE', name: 'Electronics & Communication Engineering', hod: 'Dr. V. Annapurna', type: 'ACADEMIC' as const },
    { code: 'EEE', name: 'Electrical & Electronics Engineering', hod: 'Mr. K. Gangadhar', type: 'ACADEMIC' as const },
    { code: 'MECH', name: 'Mechanical Engineering', hod: 'Prof. C. Anil Kumar Reddy', type: 'ACADEMIC' as const },
    { code: 'H&S', name: 'Humanities & Sciences', hod: 'Dr. Samba Sivaiah B', type: 'ACADEMIC' as const }
  ];

  // Specialized Institutional Committees & Bodies
  const institutionalCommittees = [
    { code: 'IIC/EDC', name: 'Innovation And Entrepreneurship', hod: 'Dean / Convener - IIC & EDC', type: 'COMMITTEE' as const },
    { code: 'CLUBS', name: 'Student Engagement and Clubs', hod: 'Faculty Advisor - Student Affairs', type: 'COMMITTEE' as const },
    { code: 'NSS', name: 'NSS & Community Engagement', hod: 'Dr. Samba Sivaiah B (NSS Officer)', type: 'COMMITTEE' as const },
    { code: 'DISCIP', name: 'Disciplinary Committee', hod: 'Disciplinary Committee Convener', type: 'COMMITTEE' as const },
    { code: 'MOM', name: 'Minutes of the Meeting', hod: 'Member Secretary - Academic Committee', type: 'COMMITTEE' as const },
    { code: 'T&P', name: 'Training & Placement Cell', hod: 'Head - Training & Placements', type: 'COMMITTEE' as const },
    { code: 'R&D', name: 'Research & Development (R&D)', hod: 'Dean - Research & Development', type: 'COMMITTEE' as const }
  ];

  const allEntities = [...academicDepartments, ...institutionalCommittees];
  const departmentList = allEntities;

  // Gather data for all departments and committees with robust normalization and valid data fallback
  const deptDataMap: Record<string, ReportSectionsData> = {};
  allEntities.forEach(ent => {
    const custom = customData?.[ent.name] || customData?.[ent.code];
    const raw = (custom && hasAnyMeaningfulData(custom)) ? custom : getDepartmentSampleData(ent.name);
    deptDataMap[ent.code] = normalizeSections(raw);
  });

  // Aggregate matrix metrics matching Monthly Department Report Entry order (1a - 11)
  const matrixCategories = [
    { key: 'journals', label: '1a. Journal Publications' },
    { key: 'conferences', label: '1b. Conference Presentations' },
    { key: 'patents', label: '2a. Patents' },
    { key: 'entrepreneurship', label: '2b. Activities and Iniativies' },
    { key: 'fdpAttended', label: '3a. FDPs Attended' },
    { key: 'fdpOrganized', label: '3b. FDPs Organized' },
    { key: 'sdp', label: '4. Student Development Programs (SDPs)' },
    { key: 'facultyAchievements', label: '5a. Faculty Achievements' },
    { key: 'studentAchievements', label: '5b. Student Achievements' },
    { key: 'certifications', label: '5c. Certifications' },
    { key: 'deptMeetings', label: '6a. Meetings' },
    { key: 'mous', label: '6b. Collaborations & MoUs' },
    { key: 'techAssociation', label: '7. Technical Association Activities' },
    { key: 'syllabus', label: '8. Syllabus coverage Report' },
    { key: 'studentEngagement', label: '9. Clubs & Student Engagement Activity' },
    { key: 'nss', label: '10. NSS and Other Extension Activities' },
    { key: 'additionalInitiatives', label: '11. Additional/Other Relevant Initiatives' }
  ];

  const deptTotals: Record<string, number> = { CIVIL: 0, CSE: 0, ECE: 0, EEE: 0, MECH: 0, 'H&S': 0 };
  let committeeTotalGrand = 0;
  let grandTotal = 0;

  const matrixRows = matrixCategories.map(cat => {
    const counts: Record<string, number> = {};
    let catTotal = 0;
    let commTotal = 0;

    academicDepartments.forEach(dept => {
      const arr = (deptDataMap[dept.code] as any)?.[cat.key];
      const count = Array.isArray(arr) ? arr.filter(isMeaningfulItem).length : 0;
      counts[dept.code] = count;
      deptTotals[dept.code] += count;
      catTotal += count;
    });

    institutionalCommittees.forEach(comm => {
      const arr = (deptDataMap[comm.code] as any)?.[cat.key];
      const count = Array.isArray(arr) ? arr.filter(isMeaningfulItem).length : 0;
      commTotal += count;
      catTotal += count;
    });

    committeeTotalGrand += commTotal;
    grandTotal += catTotal;
    return { label: cat.label, counts, committeeTotal: commTotal, total: catTotal };
  });

  // Standard Section Configurations matching Monthly Department Report Entry (1a - 11)
  const sectionsConfig: SectionConfig[] = [
    // 1A. Journal Publications
    {
      key: 'journals',
      title: '1A. JOURNAL PUBLICATIONS',
      tall: true,
      rowsPerPage: 8,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.journals || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Paper Title', width: '38%', align: 'left', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>{it.title}</div> },
        {
          header: 'Authors & Publication Details',
          width: '30%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div><strong>Authors:</strong> {it.authors}</div>
              <div style={{ color: '#475569' }}><strong>Journal:</strong> {it.journalName} ({it.volIssueYear})</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Pages: {it.pageNos}</div>
            </div>
          )
        },
        {
          header: 'Indexing & Verification',
          width: '18%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div>ISSN: <strong>{it.issnIsbn}</strong></div>
              <div style={{ color: '#1a365d', fontWeight: 700 }}>Indexed: {it.indexedIn}</div>
              <div style={{ color: '#1d4ed8', wordBreak: 'break-all', fontSize: '7.5px' }}>{it.link}</div>
            </div>
          )
        }
      ]
    },
    // 1B. Conference Presentations
    {
      key: 'conferences',
      title: '1B. CONFERENCE PRESENTATIONS',
      tall: true,
      rowsPerPage: 8,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.conferences || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Presentation Title', width: '38%', align: 'left', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>{it.title}</div> },
        {
          header: 'Authors & Conference Name',
          width: '30%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div><strong>Authors:</strong> {it.authors}</div>
              <div style={{ color: '#475569' }}><strong>Conference:</strong> {it.conferenceName}</div>
            </div>
          )
        },
        {
          header: 'Date, Venue & Indexing',
          width: '18%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div>Date: <strong>{it.date}</strong></div>
              <div style={{ color: '#475569' }}>Venue: {it.locationMode}</div>
              <div style={{ color: '#1a365d', fontWeight: 700 }}>Indexed: {it.indexedIn}</div>
              <div style={{ color: '#1d4ed8', wordBreak: 'break-all', fontSize: '7.5px' }}>{it.link}</div>
            </div>
          )
        }
      ]
    },
    // 2A. Patents
    {
      key: 'patents',
      title: '2A. PATENTS',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.patents || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Patent / Innovation Title', width: '42%', align: 'left', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>{it.title}</div> },
        {
          header: 'Inventors & Registration',
          width: '28%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div><strong>Inv:</strong> {it.inventors}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Pat: {it.patentNumber}</div>
            </div>
          )
        },
        {
          header: 'Status & Date',
          width: '16%',
          align: 'center',
          render: (it) => (
            <div style={{ lineHeight: 1.35 }}>
              <div style={{ fontWeight: 800, color: '#1a365d' }}>{it.status || 'Published'}</div>
              <div style={{ fontSize: '8px', color: '#64748b', marginTop: '1px' }}>{it.awardedDate}</div>
            </div>
          )
        }
      ]
    },
    // 2B. Activities and Iniativies
    {
      key: 'entrepreneurship',
      title: '2B. Activities and Iniativies',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.entrepreneurship || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        {
          header: 'Program / Activity Title',
          width: '36%',
          align: 'left',
          render: (it) => (
            <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
              <div>{it.title}</div>
              <div style={{ color: '#475569', fontSize: '8px' }}>Type: {it.type}</div>
            </div>
          )
        },
        {
          header: 'Date & Mode',
          width: '18%',
          align: 'center',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div>{it.date}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>{it.mode}</div>
            </div>
          )
        },
        {
          header: 'Participants & Organizer',
          width: '18%',
          align: 'center',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div><strong>{it.participantsCount}</strong> parts</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>By: {it.organizedBy}</div>
            </div>
          )
        },
        {
          header: 'Key Outcomes',
          width: '14%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#475569', lineHeight: 1.35 }}>
              <div style={{ fontWeight: 600, color: '#047857' }}>{it.status || 'Active'}</div>
              <div style={{ fontSize: '8px' }}>{it.keyOutcomes}</div>
            </div>
          )
        }
      ]
    },
    // 3A. Faculty Development Programs (Attended)
    {
      key: 'fdpAttended',
      title: '3A. FACULTY DEVELOPMENT PROGRAMS (FDP) — ATTENDED',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.fdpAttended || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        {
          header: 'Program Title & Type',
          width: '36%',
          align: 'left',
          render: (it) => (
            <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
              <div>{it.title}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Type: {it.type}</div>
            </div>
          )
        },
        {
          header: 'Organizing Body & Dates',
          width: '24%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div>{it.organizingBody}</div>
              <div style={{ color: '#475569', fontSize: '8px' }}>Dates: {it.dates} ({it.mode})</div>
            </div>
          )
        },
        {
          header: 'Faculty Attended & Proof',
          width: '26%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div style={{ fontWeight: 700, color: '#1a365d' }}>{it.facultyAttended}</div>
              {it.link && <div style={{ color: '#1d4ed8', wordBreak: 'break-all', fontSize: '7.5px' }}>{it.link}</div>}
            </div>
          )
        }
      ]
    },
    // 3B. Faculty Development Programs (Organized)
    {
      key: 'fdpOrganized',
      title: '3B. FACULTY DEVELOPMENT PROGRAMS (FDP) — ORGANIZED',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.fdpOrganized || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        {
          header: 'Program Title & Type',
          width: '32%',
          align: 'left',
          render: (it) => (
            <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
              <div>{it.title}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Type: {it.type} &bull; {it.dates} ({it.mode})</div>
            </div>
          )
        },
        {
          header: 'Resource Person Details',
          width: '30%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#334155', fontSize: '8.5px', lineHeight: 1.35 }}>
              {it.resourcePersonDetails}
            </div>
          )
        },
        {
          header: 'Coordinators & Proof',
          width: '24%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div style={{ fontWeight: 700, color: '#1a365d' }}>{it.facultyCoordinators}</div>
              {it.link && <div style={{ color: '#1d4ed8', wordBreak: 'break-all', fontSize: '7.5px' }}>{it.link}</div>}
            </div>
          )
        }
      ]
    },
    // 4. Student Development Programs (SDPs)
    {
      key: 'sdp',
      title: '4. STUDENT DEVELOPMENT PROGRAMS (SDPS)',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.sdp || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        {
          header: 'Event Title & Type',
          width: '34%',
          align: 'left',
          render: (it) => (
            <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
              <div>{it.title}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Type: {it.type}</div>
            </div>
          )
        },
        {
          header: 'Date & Resource Person',
          width: '22%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div>{it.date}</div>
              <div style={{ color: '#475569', fontSize: '8px' }}>{it.resourcePerson}</div>
            </div>
          )
        },
        {
          header: 'Participants',
          width: '12%',
          align: 'center',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div style={{ fontWeight: 800, color: '#1a365d' }}>{it.participantsCount}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>{it.mode}</div>
            </div>
          )
        },
        {
          header: 'Key Outcomes & Coord.',
          width: '18%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#475569', lineHeight: 1.35 }}>
              <div style={{ fontSize: '8px' }}>{it.keyOutcomes}</div>
              <div style={{ color: '#1a365d', fontWeight: 600, fontSize: '8px' }}>Coord: {it.coordinator}</div>
            </div>
          )
        }
      ]
    },
    // 5A. Faculty Achievements
    {
      key: 'facultyAchievements',
      title: '5A. FACULTY ACHIEVEMENTS',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.facultyAchievements || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Faculty Member', width: '28%', align: 'left', render: (it) => <span style={{ fontWeight: 700, color: '#1a365d' }}>{it.name}</span> },
        { header: 'Award / Recognition', width: '34%', align: 'left', render: (it) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{it.award}</span> },
        { header: 'Conferring Body & Date', width: '24%', align: 'left', render: (it) => <span style={{ color: '#475569' }}>{it.organization}{it.date ? ` (${it.date})` : ''}</span> }
      ]
    },
    // 5B. Student Achievements
    {
      key: 'studentAchievements',
      title: '5B. STUDENT ACHIEVEMENTS',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.studentAchievements || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Student Name & ID', width: '30%', align: 'left', render: (it) => <span style={{ fontWeight: 700, color: '#0f172a' }}>{it.nameRoll}</span> },
        { header: 'Prize / Accomplishment', width: '32%', align: 'left', render: (it) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{it.award}</span> },
        { header: 'Event & Host Institution', width: '24%', align: 'left', render: (it) => <span style={{ color: '#475569' }}>{it.event} {it.organization ? `(${it.organization})` : ''}</span> }
      ]
    },
    // 5C. Certifications
    {
      key: 'certifications',
      title: '5C. CERTIFICATIONS',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.certifications || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Course / Certification Title', width: '36%', align: 'left', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.title}</div> },
        {
          header: 'Platform & Type',
          width: '20%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.3 }}>
              <div style={{ fontWeight: 600, color: '#1a365d' }}>{it.platform}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Type: {it.type}</div>
            </div>
          )
        },
        {
          header: 'Duration & Enrolled',
          width: '14%',
          align: 'center',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.3 }}>
              <div>{it.duration}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Enrolled: {it.enrolled}</div>
            </div>
          )
        },
        {
          header: 'Certified & Status',
          width: '16%',
          align: 'center',
          render: (it) => (
            <div style={{ color: '#047857', lineHeight: 1.3 }}>
              <div style={{ fontWeight: 800 }}>{it.certified} Certified</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>{it.keyOutcomes}</div>
            </div>
          )
        }
      ]
    },
    // 6A. Meetings
    {
      key: 'deptMeetings',
      title: '6A. MEETINGS',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.deptMeetings || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        {
          header: 'Date & Forum',
          width: '18%',
          align: 'center',
          render: (it) => (
            <div style={{ color: '#0f172a', fontWeight: 700 }}>
              <div>{it.date}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Dept DAC / BOS</div>
            </div>
          )
        },
        { header: 'Key Decisions & Topics Discussed', width: '42%', align: 'left', render: (it) => <div style={{ color: '#334155', lineHeight: 1.35 }}>{it.decisions}</div> },
        { header: 'Policy Changes & Action Plan', width: '26%', align: 'left', render: (it) => <div style={{ color: '#475569', lineHeight: 1.35 }}>{it.policyChanges || 'Standard operations confirmed.'}</div> }
      ]
    },
    // 6B. Collaborations & MoUs
    {
      key: 'mous',
      title: '6B. COLLABORATIONS & MOUS',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.mous || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Partner Entity / Industry', width: '32%', align: 'left', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.name}</div> },
        { header: 'Validity Period', width: '16%', align: 'center', render: (it) => <span style={{ color: '#334155' }}>{it.datePeriod}</span> },
        { header: 'Faculty SPOC', width: '16%', align: 'center', render: (it) => <span style={{ color: '#1a365d', fontWeight: 600 }}>{it.facultySpoc || '-'}</span> },
        { header: 'Scope & Focus Area', width: '22%', align: 'left', render: (it) => <span style={{ color: '#475569' }}>{it.purpose}</span> }
      ]
    },
    // 7. Technical Association Activities
    {
      key: 'techAssociation',
      title: '7. TECHNICAL ASSOCIATION ACTIVITIES',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.techAssociation || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        {
          header: 'Association Event & Type',
          width: '32%',
          align: 'left',
          render: (it) => (
            <div style={{ fontWeight: 700, color: '#0f172a' }}>
              <div>{it.event}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Type: {it.type}</div>
            </div>
          )
        },
        {
          header: 'Date & Coordinator',
          width: '20%',
          align: 'center',
          render: (it) => (
            <div style={{ color: '#334155' }}>
              <div>{it.date}</div>
              <div style={{ color: '#1a365d', fontSize: '8px' }}>{it.resourcePersonCoordinator}</div>
            </div>
          )
        },
        {
          header: 'Participants & Outcomes',
          width: '34%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#475569' }}>
              <div><strong>{it.participants}</strong> participants</div>
              <div style={{ fontSize: '8px' }}>{it.outcomes}</div>
            </div>
          )
        }
      ]
    },
    // 8. Syllabus coverage Report
    {
      key: 'syllabus',
      title: '8. SYLLABUS COVERAGE REPORT',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.syllabus || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '4%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '7%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Course / Subject Title', width: '21%', align: 'left', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.subject}</div> },
        { header: 'Year / Sem', width: '10%', align: 'center', render: (it) => <span style={{ color: '#334155' }}>{it.yearSem || '-'}</span> },
        { header: 'Faculty In-Charge', width: '16%', align: 'left', render: (it) => <span style={{ color: '#1a365d', fontWeight: 600 }}>{it.faculty}</span> },
        { header: '% Done', width: '7%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#047857' }}>{it.completed}</span> },
        { header: '% Pend', width: '7%', align: 'center', render: (it) => <span style={{ fontWeight: 700, color: '#b45309' }}>{it.pending}</span> },
        { header: 'Remarks', width: '28%', align: 'left', render: (it) => <div style={{ color: '#475569', fontSize: '8.5px', fontStyle: 'italic', lineHeight: 1.35 }}>{it.remarks || '-'}</div> }
      ]
    },
    // 9. Clubs & Student Engagement Activity
    {
      key: 'studentEngagement',
      title: '9. CLUB & STUDENT ENGAGEMENT ACTIVITIES',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.studentEngagement || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '8%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Activity / Event Title', width: '26%', align: 'left', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.title}</div> },
        {
          header: 'Type & Duration',
          width: '18%',
          align: 'left',
          render: (it) => {
            const displayType = (it.type === 'Other' && it.otherType) ? `Other (${it.otherType})` : (it.otherType || it.type || '-');
            const displayDates = it.dates || (it.startDate && it.endDate ? `${it.startDate} to ${it.endDate}` : it.startDate || '-');
            return (
              <div style={{ color: '#334155', lineHeight: 1.3 }}>
                <div style={{ fontWeight: 600, color: '#1a365d' }}>{displayType}</div>
                <div style={{ color: '#64748b', fontSize: '8px' }}>{displayDates} ({it.noOfDays || '1 day'})</div>
              </div>
            );
          }
        },
        { header: 'Participants', width: '11%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#047857' }}>{it.participantsCount || '-'}</span> },
        { header: 'Coordinator', width: '15%', align: 'left', render: (it) => <span style={{ color: '#1a365d', fontWeight: 600 }}>{it.coordinator || '-'}</span> },
        { header: 'Remarks / Outcomes', width: '17%', align: 'left', render: (it) => <div style={{ color: '#475569', fontSize: '8px', fontStyle: 'italic' }}>{it.remarks || '-'}</div> }
      ]
    },
    // 10. NSS and Other Extension Activities
    {
      key: 'nss',
      title: '10. NSS & OTHER EXTENSION ACTIVITIES',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.nss || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '4%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '7%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        {
          header: 'Event / Activity Name',
          width: '24%',
          align: 'left',
          render: (it) => (
            <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
              <div>{it.event}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Type: {it.type}</div>
            </div>
          )
        },
        {
          header: 'Date & Venue',
          width: '18%',
          align: 'center',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div>{it.date}</div>
              <div style={{ color: '#475569' }}>Venue: {it.venue}</div>
            </div>
          )
        },
        {
          header: 'Participants & Target',
          width: '17%',
          align: 'center',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div><strong>{it.participantsCount}</strong> participants</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>{it.typeOfParticipants}</div>
            </div>
          )
        },
        {
          header: 'Outcomes & Coord.',
          width: '30%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#475569', lineHeight: 1.35 }}>
              <div>{it.outcomes}</div>
              <div style={{ color: '#1a365d', fontWeight: 600, fontSize: '8px' }}>Coord: {it.coordinator}</div>
            </div>
          )
        }
      ]
    },
    // 11. Additional/Other Relevant Initiatives
    {
      key: 'additionalInitiatives',
      title: '11. ADDITIONAL/OTHER RELEVANT INITIATIVES',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.additionalInitiatives || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Initiative / Activity', width: '32%', align: 'left', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.initiative}</div> },
        {
          header: 'Date & Coordinator',
          width: '18%',
          align: 'center',
          render: (it) => (
            <div style={{ color: '#334155' }}>
              <div>{it.date}</div>
              <div style={{ color: '#1a365d', fontSize: '8px' }}>Coord: {it.coordinator}</div>
            </div>
          )
        },
        {
          header: 'Description & Key Outcomes',
          width: '36%',
          align: 'left',
          render: (it) => (
            <div style={{ color: '#475569', lineHeight: 1.35 }}>
              <div>{it.description}</div>
              <div style={{ color: '#047857', fontWeight: 600, fontSize: '8px' }}>Outcome: {it.outcomes}</div>
            </div>
          )
        }
      ]
    },
  ];

  // Helper to render empty nil state
  const renderNilRow = (colSpan: number) => (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          padding: '16px',
          textAlign: 'center',
          color: '#64748b',
          fontStyle: 'italic',
          fontWeight: 600,
          backgroundColor: '#f8fafc'
        }}
      >
        Nil activities recorded across all departments for this reporting cycle.
      </td>
    </tr>
  );

  // Helper to render reusable generic section data tables
  const MAX_ROW_H = 140; // px; roughly 11 lines of 9px text

  const renderDataTable = <T,>(columns: ColumnConfig<T>[], items: T[], startIndex: number) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1' }}>
      <thead>
        <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
          {columns.map((col, cIdx) => (
            <th
              key={cIdx}
              style={{
                width: col.width,
                padding: '8px 6px',
                textAlign: col.align || 'left',
                verticalAlign: 'middle',
                fontWeight: 800,
                borderRight: cIdx < columns.length - 1 ? '1px solid #3b82f6' : 'none'
              }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? renderNilRow(columns.length) : items.map((item, rIdx) => (
          <tr key={rIdx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
            {columns.map((col, cIdx) => (
              <td
                key={cIdx}
                style={{
                  padding: col.align === 'center' ? '8px 4px' : '8px 10px',
                  textAlign: col.align || 'left',
                  verticalAlign: 'middle',
                  borderRight: cIdx < columns.length - 1 ? '1px solid #cbd5e1' : 'none',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere'
                }}
              >
                <div style={{ maxHeight: `${MAX_ROW_H}px`, overflow: 'hidden' }}>
                  {col.render(item, startIndex + rIdx)}
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Estimate row height for accurate page budget packing
  const estimateItemHeight = (secKey: string): number => {
    switch (secKey) {
      case 'journal':
      case 'conference':
        return 78;
      case 'patents':
        return 52;
      case 'startups':
        return 68;
      case 'fdpAttended':
        return 62;
      case 'fdpOrganized':
        return 66;
      case 'sdp':
        return 70;
      case 'facultyAchievements':
      case 'studentAchievements':
        return 54;
      case 'certifications':
        return 54;
      case 'meetings':
        return 58;
      case 'collaborations':
        return 66;
      case 'techAssociation':
        return 66;
      case 'syllabus':
        return 46;
      case 'studentEngagement':
        return 64;
      case 'nss':
        return 70;
      case 'additionalInitiatives':
        return 66;
      default:
        return 58;
    }
  };

  // Generate dynamic multi-section continuous page units
  interface PageSegment {
    section: SectionConfig;
    items: any[];
    startIndex: number;
    isContinued: boolean;
    totalCount: number;
  }

  interface GeneratedPage {
    type: 'cover' | 'content' | 'final';
    segments?: PageSegment[];
  }

  const USABLE_PAGE_HEIGHT = 800 - safety; // px
  const HEADER_COST = 76;
  const SPACING_COST = 20;
  const NIL_COST = 48;

  const generatedPages: GeneratedPage[] = [];

  // Page 1: Cover & Executive Performance Matrix
  generatedPages.push({ type: 'cover' });

  // Intermediate Pages: Continuous dynamic packing of Sections 1A through 11
  let currentPageSegments: PageSegment[] = [];
  let currentHeight = 0;

  sectionsConfig.forEach(sec => {
    const allItems = sec.getItems(deptDataMap, departmentList);
    const totalCount = allItems.length;

    if (totalCount === 0) {
      const spaceBefore = currentPageSegments.length > 0 ? SPACING_COST : 0;
      const needed = HEADER_COST + NIL_COST + spaceBefore;
      if (currentHeight + needed > USABLE_PAGE_HEIGHT && currentPageSegments.length > 0) {
        generatedPages.push({ type: 'content', segments: currentPageSegments });
        currentPageSegments = [];
        currentHeight = 0;
      }
      currentPageSegments.push({
        section: sec,
        items: [],
        startIndex: 0,
        isContinued: false,
        totalCount: 0
      });
      currentHeight += HEADER_COST + NIL_COST + (currentPageSegments.length > 1 ? SPACING_COST : 0);
      return;
    }

    let itemIdx = 0;
    let isContinued = false;

    while (itemIdx < totalCount) {
      const spaceBefore = currentPageSegments.length > 0 ? SPACING_COST : 0;
      const firstItemH = estimateItemHeight(sec.key);
      const minNeeded = HEADER_COST + spaceBefore + firstItemH;

      // If cannot fit header and at least 1 item on current page, flush to new page
      if (currentHeight + minNeeded > USABLE_PAGE_HEIGHT && currentPageSegments.length > 0) {
        generatedPages.push({ type: 'content', segments: currentPageSegments });
        currentPageSegments = [];
        currentHeight = 0;
      }

      const chunkStartIndex = itemIdx;
      const pageItems: any[] = [];
      let segmentHeight = HEADER_COST + (currentPageSegments.length > 0 ? SPACING_COST : 0);

      while (itemIdx < totalCount) {
        const it = allItems[itemIdx];
        const itH = estimateItemHeight(sec.key);
        if (currentHeight + segmentHeight + itH > USABLE_PAGE_HEIGHT && pageItems.length > 0) {
          break;
        }
        pageItems.push(it);
        segmentHeight += itH;
        itemIdx++;
      }

      currentPageSegments.push({
        section: sec,
        items: pageItems,
        startIndex: chunkStartIndex,
        isContinued: isContinued,
        totalCount: totalCount
      });

      currentHeight += segmentHeight;
      isContinued = true;

      // If more items remain for this section, flush page immediately so continuation starts fresh on next page
      if (itemIdx < totalCount) {
        generatedPages.push({ type: 'content', segments: currentPageSegments });
        currentPageSegments = [];
        currentHeight = 0;
      }
    }
  });

  // Flush remaining segments
  if (currentPageSegments.length > 0) {
    generatedPages.push({ type: 'content', segments: currentPageSegments });
  }

  // Final Page: Section 10 (Syllabus), Section 11 (Attendance) & Governance Endorsement
  generatedPages.push({ type: 'final' });

  const totalCalculatedPages = generatedPages.length;

  const renderRunningHeader = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1.5px solid #cbd5e1',
        paddingBottom: '8px',
        marginBottom: '14px',
        fontSize: '9px',
        fontWeight: 700,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}
    >
      <span>Sanskrithi School of Engineering (Autonomous)</span>
      <span>Institutional HOD Progress Report &bull; {period}</span>
    </div>
  );

  const renderRunningFooter = (pageNo: number) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTop: '1px solid #cbd5e1',
        paddingTop: '8px',
        marginTop: '16px',
        fontSize: '8.5px',
        color: '#64748b'
      }}
    >
      <span style={{ fontWeight: 700, color: '#334155' }}>Page {pageNo} of {totalCalculatedPages}</span>
    </div>
  );

  const renderSectionHeader = (title: string, count?: number, isContinued?: boolean) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #1a365d',
        paddingBottom: '4px',
        marginBottom: '12px'
      }}
    >
      <div
        style={{
          fontWeight: 900,
          color: '#1a365d',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}
      >
        {title} {isContinued && <span style={{ color: '#c2410c' }}>(CONTINUED)</span>}
      </div>
      {count !== undefined && (
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 700,
            color: '#475569'
          }}
        >
          Total: {count} Entries
        </span>
      )}
    </div>
  );

  const fixedA4PageStyle: React.CSSProperties = {
    width: '750px',
    height: '1060px',
    maxHeight: '1060px',
    boxSizing: 'border-box',
    padding: '24px 32px 18px 32px',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  return (
    <div
      id={id}
      className="bg-white text-slate-900 font-sans mx-auto"
      style={{
        width: '750px',
        maxWidth: '750px',
        minWidth: '750px',
        boxSizing: 'border-box',
        fontFamily: "'Calibri', 'Arial', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        lineHeight: 1.45,
        color: '#0f172a',
        backgroundColor: '#ffffff',
        border: 'none',
        boxShadow: 'none'
      }}
    >
      {generatedPages.map((pageDef, pIdx) => {
        const pageNumber = pIdx + 1;

        if (pageDef.type === 'cover') {
          return (
            <div key={pIdx} className="pdf-page" style={fixedA4PageStyle}>
              <div>
                {/* Official Header */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', tableLayout: 'fixed', marginBottom: '8px' }}>
                  <tbody>
                    <tr style={{ border: 'none' }}>
                      <td style={{ width: '50%', border: 'none', verticalAlign: 'middle', textAlign: 'left', padding: '0 0 4px 0' }}>
                        <img
                          src={logoBase64}
                          alt="Sanskrithi School of Engineering Logo"
                          style={{ height: '38px', width: 'auto', display: 'block', objectFit: 'contain' }}
                        />
                      </td>
                      <td style={{ width: '50%', border: 'none', verticalAlign: 'middle', textAlign: 'right', padding: '0 0 4px 0' }}>
                        <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1e293b' }}>
                          SANSKRITHI SCHOOL OF ENGINEERING
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#c2410c', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '2px' }}>
                          AUTONOMOUS
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ height: '2px', backgroundColor: '#1a365d', width: '100%', marginBottom: '18px' }}></div>

                {/* Document Title Block */}
                <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                  <h1
                    style={{
                      fontSize: '18px',
                      fontWeight: 900,
                      color: '#1a365d',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      margin: '0 0 5px 0'
                    }}
                  >
                    INSTITUTIONAL HOD PROGRESS REPORT
                  </h1>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', margin: '0 0 5px 0' }}>
                    Comprehensive Performance Dossier across All Academic Departments
                  </div>
                  <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569' }}>
                    Reporting Period: <strong style={{ color: '#0f172a' }}>{period}</strong>
                  </div>
                </div>

                {/* Executive Cross-Department & Committee Performance Matrix */}
                <div>
                  {renderSectionHeader(`EXECUTIVE INSTITUTIONAL PERFORMANCE MATRIX (${period})`)}
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                        <th style={{ width: '33%', padding: '8px 8px', textAlign: 'left', verticalAlign: 'middle', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>
                          Activity Category / Domain
                        </th>
                        {academicDepartments.map(d => (
                          <th key={d.code} style={{ width: '7.5%', padding: '8px 2px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>
                            {d.code}
                          </th>
                        ))}
                        <th style={{ width: '11%', padding: '8px 2px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 800, borderRight: '1px solid #3b82f6', backgroundColor: '#4338ca' }}>
                          Committees
                        </th>
                        <th style={{ width: '11%', padding: '8px 2px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 800, backgroundColor: '#c2410c' }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrixRows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                          <td style={{ padding: '6.5px 8px', verticalAlign: 'middle', fontWeight: 600, color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>
                            {row.label}
                          </td>
                          {academicDepartments.map(d => {
                            const val = row.counts[d.code] || 0;
                            return (
                              <td key={d.code} style={{ padding: '6.5px 2px', textAlign: 'center', verticalAlign: 'middle', fontWeight: val > 0 ? 700 : 400, color: val > 0 ? '#0f172a' : '#94a3b8', borderRight: '1px solid #cbd5e1' }}>
                                {val > 0 ? val : '-'}
                              </td>
                            );
                          })}
                          <td style={{ padding: '6.5px 2px', textAlign: 'center', verticalAlign: 'middle', fontWeight: row.committeeTotal > 0 ? 800 : 400, color: row.committeeTotal > 0 ? '#4338ca' : '#94a3b8', backgroundColor: '#f5f3ff', borderRight: '1px solid #cbd5e1' }}>
                            {row.committeeTotal > 0 ? row.committeeTotal : '-'}
                          </td>
                          <td style={{ padding: '6.5px 2px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 800, color: '#c2410c', backgroundColor: '#fff7ed' }}>
                            {row.total}
                          </td>
                        </tr>
                      ))}
                      {/* Grand Total Row */}
                      <tr style={{ backgroundColor: '#e2e8f0', borderTop: '2px solid #94a3b8' }}>
                        <td style={{ padding: '8px 8px', verticalAlign: 'middle', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #cbd5e1', textTransform: 'uppercase' }}>
                          Total Activities Reported
                        </td>
                        {academicDepartments.map(d => (
                          <td key={d.code} style={{ padding: '8px 2px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>
                            {deptTotals[d.code]}
                          </td>
                        ))}
                        <td style={{ padding: '8px 2px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 900, color: '#4338ca', backgroundColor: '#ede9fe', borderRight: '1px solid #cbd5e1' }}>
                          {committeeTotalGrand}
                        </td>
                        <td style={{ padding: '8px 2px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 900, color: '#c2410c', backgroundColor: '#fed7aa', fontSize: '10px' }}>
                          {grandTotal}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {renderRunningFooter(pageNumber)}
            </div>
          );
        }

        if (pageDef.type === 'content' && pageDef.segments) {
          return (
            <div key={pIdx} className="pdf-page" style={fixedA4PageStyle}>
              {renderRunningHeader()}
              <div data-body style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {pageDef.segments.map((seg, sIdx) => (
                  <div key={sIdx} style={{ marginBottom: sIdx < (pageDef.segments?.length || 1) - 1 ? '18px' : '0px' }}>
                    {renderSectionHeader(seg.section.title, seg.totalCount, seg.isContinued)}
                    {renderDataTable(seg.section.columns, seg.items, seg.startIndex)}
                  </div>
                ))}
              </div>
              {renderRunningFooter(pageNumber)}
            </div>
          );
        }

        if (pageDef.type === 'final') {
          return (
            <div key={pIdx} className="pdf-page" style={fixedA4PageStyle}>
              <div>
                {renderRunningHeader()}

                {/* Institutional Academic & Attendance Compliance Audit */}
                <div style={{ marginBottom: '20px' }}>
                  {renderSectionHeader('INSTITUTIONAL ACADEMIC & ATTENDANCE AUDIT SUMMARY')}
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9.5px', border: '1px solid #cbd5e1', marginBottom: '16px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <td style={{ width: '28%', padding: '9px 12px', verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                          Curriculum Delivery Compliance
                        </td>
                        <td style={{ width: '72%', padding: '9px 12px', verticalAlign: 'middle', fontWeight: 700, color: '#047857' }}>
                          100% Target Met &bull; All Academic Branches Maintained Prescribed Syllabus Progression
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <td style={{ padding: '9px 12px', verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                          Biometric &amp; ERP Attendance Audit
                        </td>
                        <td style={{ padding: '9px 12px', verticalAlign: 'middle', fontWeight: 700, color: '#047857' }}>
                          100% Verified Compliant &bull; No Statutory Condonation Shortages Identified
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <td style={{ padding: '9px 12px', verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                          Dean / Academic Director Remarks
                        </td>
                        <td style={{ padding: '9px 12px', verticalAlign: 'middle', color: '#475569', fontStyle: 'italic', fontSize: '9px', lineHeight: 1.4 }}>
                          All departments maintained prescribed academic engagement. Remedial classes, technical association activities, and academic bridge initiatives organized as mandated.
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '9px 12px', verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                          IQAC Review &amp; Quality Audit
                        </td>
                        <td style={{ padding: '9px 12px', verticalAlign: 'middle', color: '#1e3a8a', fontWeight: 600, fontSize: '9px', lineHeight: 1.4 }}>
                          All departmental reports verified and consolidated according to autonomous institutional governance framework.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official Institutional Governance & Sign-Off Block */}
              <div>
                <div style={{ paddingTop: '18px', borderTop: '1.5px solid #cbd5e1' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', tableLayout: 'fixed' }}>
                    <tbody>
                      <tr style={{ border: 'none' }}>
                        <td style={{ width: '33.33%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                          <div style={{ height: '38px' }}></div>
                          <div style={{ width: '75%', margin: '0 auto 6px auto', borderTop: '1.5px solid #0f172a' }}></div>
                          <div style={{ fontWeight: 'bold', fontSize: '10.5px', color: '#0f172a' }}>Dr. Sreenivas Prasad</div>
                          <div style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>IQAC Coordinator</div>
                          <div style={{ fontSize: '8px', color: '#64748b' }}>Sanskrithi School of Engineering</div>
                        </td>

                        <td style={{ width: '33.33%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                          <div style={{ height: '38px' }}></div>
                          <div style={{ width: '75%', margin: '0 auto 6px auto', borderTop: '1.5px solid #0f172a' }}></div>
                          <div style={{ fontWeight: 'bold', fontSize: '10.5px', color: '#0f172a' }}>Dean of Academics</div>
                          <div style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>Academic Governance</div>
                          <div style={{ fontSize: '8px', color: '#64748b' }}>Sanskrithi School of Engineering</div>
                        </td>

                        <td style={{ width: '33.33%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                          <div style={{ height: '38px' }}></div>
                          <div style={{ width: '75%', margin: '0 auto 6px auto', borderTop: '1.5px solid #0f172a' }}></div>
                          <div style={{ fontWeight: 'bold', fontSize: '10.5px', color: '#0f172a' }}>Principal</div>
                          <div style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>Institutional Endorsement</div>
                          <div style={{ fontSize: '8px', color: '#64748b' }}>Sanskrithi School of Engineering</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {renderRunningFooter(pageNumber)}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default ConsolidatedInstitutionalPDFView;
