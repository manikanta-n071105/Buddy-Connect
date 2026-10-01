import React, { useState, useEffect, useLayoutEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ReportSectionsData, normalizeSections } from './HODManualReportBuilder';

interface ConsolidatedInstitutionalPDFViewProps {
  id?: string;
  period: string;
  submissionDate?: string;
  customData?: Record<string, ReportSectionsData>;
}

interface ColumnConfig<T = any> {
  header: string;
  width: string;
  align?: 'left' | 'center' | 'right' | 'justify';
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
    { code: 'IIC/EDC', name: 'Innovation & Entrepreneurship', hod: 'Dean / Convener - IIC & EDC', type: 'COMMITTEE' as const },
    { code: 'CLUBS', name: 'Student Engagement & Clubs', hod: 'Faculty Advisor - Student Affairs', type: 'COMMITTEE' as const },
    { code: 'NSS', name: 'NSS & Community Engagement', hod: 'Dr. Samba Sivaiah B (NSS Officer)', type: 'COMMITTEE' as const },
    { code: 'DISCIP', name: 'Disciplinary Committee', hod: 'Disciplinary Committee Convener', type: 'COMMITTEE' as const },
    { code: 'MOM', name: 'Minutes of the Meeting', hod: 'Member Secretary - Academic Committee', type: 'COMMITTEE' as const },
    { code: 'T&P', name: 'Training & Placement Cell', hod: 'Head - Training & Placements', type: 'COMMITTEE' as const },
    { code: 'R&D', name: 'Research & Development (R&D)', hod: 'Dean - Research & Development', type: 'COMMITTEE' as const }
  ];

  const allEntities = [...academicDepartments, ...institutionalCommittees];
  const departmentList = allEntities;

  // Gather data for all departments and committees from database
  const deptDataMap: Record<string, ReportSectionsData> = {};
  allEntities.forEach(ent => {
    const custom = customData?.[ent.name] || customData?.[ent.code];
    const raw = custom || {};
    deptDataMap[ent.code] = normalizeSections(raw);
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
        { header: 'Paper Title', width: '38%', align: 'justify', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>{it.title}</div> },
        {
          header: 'Authors & Publication Details',
          width: '30%',
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
              <div><strong>Authors:</strong> {it.authors}</div>
              <div style={{ color: '#475569' }}><strong>Journal:</strong> {it.journalName} ({it.volIssueYear})</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Pages: {it.pageNos}</div>
            </div>
          )
        },
        {
          header: 'Indexing & Verification',
          width: '18%',
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
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
        { header: '#', width: '4%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '7%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Presentation Title', width: '34%', align: 'justify', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>{it.title}</div> },
        {
          header: 'Authors & Conference Details',
          width: '32%',
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
              <div><strong>Authors:</strong> {it.authors}</div>
              <div style={{ color: '#475569' }}><strong>Conference:</strong> {it.conferenceName}</div>
              {(it.volIssueYear || it.pageNos || it.issnIsbn) && (
                <div style={{ color: '#64748b', fontSize: '8px', marginTop: '2px' }}>
                  {it.volIssueYear && <span style={{ marginRight: '6px' }}><strong>Issue:</strong> {it.volIssueYear}</span>}
                  {it.pageNos && <span style={{ marginRight: '6px' }}><strong>Pages:</strong> {it.pageNos}</span>}
                  {it.issnIsbn && <span><strong>ISBN:</strong> {it.issnIsbn}</span>}
                </div>
              )}
            </div>
          )
        },
        {
          header: 'Date, Venue & Indexing',
          width: '23%',
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
              <div>Date: <strong>{it.date}</strong></div>
              <div style={{ color: '#475569' }}>Venue: {it.locationMode}</div>
              <div style={{ color: '#1a365d', fontWeight: 700 }}>Indexed: {it.indexedIn || '-'}</div>
              {it.link && <div style={{ color: '#1d4ed8', wordBreak: 'break-all', fontSize: '7.5px' }}>{it.link}</div>}
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
        { header: 'Patent / Innovation Title', width: '42%', align: 'justify', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>{it.title}</div> },
        {
          header: 'Inventors & Registration',
          width: '28%',
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
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
    // 2B. Activities and Initiatives
    {
      key: 'entrepreneurship',
      title: '2B. Activities and Initiatives',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.entrepreneurship || []).filter(isMeaningfulItem).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        {
          header: 'Program / Activity Title',
          width: '36%',
          align: 'justify',
          render: (it) => (
            <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
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
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#475569', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
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
          align: 'justify',
          render: (it) => (
            <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
              <div>{it.title}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Type: {it.type}</div>
            </div>
          )
        },
        {
          header: 'Organizing Body & Dates',
          width: '24%',
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
              <div>{it.organizingBody}</div>
              <div style={{ color: '#475569', fontSize: '8px' }}>Dates: {it.dates} ({it.mode})</div>
            </div>
          )
        },
        {
          header: 'Faculty Attended & Proof',
          width: '26%',
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
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
          align: 'justify',
          render: (it) => (
            <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
              <div>{it.title}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Type: {it.type} &bull; {it.dates} ({it.mode})</div>
            </div>
          )
        },
        {
          header: 'Resource Person Details',
          width: '30%',
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#334155', fontSize: '8.5px', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
              {it.resourcePersonDetails}
            </div>
          )
        },
        {
          header: 'Coordinators & Proof',
          width: '24%',
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
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
          align: 'justify',
          render: (it) => (
            <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
              <div>{it.title}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>Type: {it.type}</div>
            </div>
          )
        },
        {
          header: 'Date & Resource Person',
          width: '22%',
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
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
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#475569', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
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
        { header: 'Faculty Member', width: '28%', align: 'justify', render: (it) => <span style={{ fontWeight: 700, color: '#1a365d' }}>{it.name}</span> },
        { header: 'Award / Recognition', width: '34%', align: 'justify', render: (it) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{it.award}</span> },
        { header: 'Conferring Body & Date', width: '24%', align: 'justify', render: (it) => <span style={{ color: '#475569' }}>{it.organization}{it.date ? ` (${it.date})` : ''}</span> }
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
        { header: 'Student Name & ID', width: '30%', align: 'justify', render: (it) => <span style={{ fontWeight: 700, color: '#0f172a' }}>{it.nameRoll}</span> },
        { header: 'Prize / Accomplishment', width: '32%', align: 'justify', render: (it) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{it.award}</span> },
        { header: 'Event & Host Institution', width: '24%', align: 'justify', render: (it) => <span style={{ color: '#475569' }}>{it.event} {it.organization ? `(${it.organization})` : ''}</span> }
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
        { header: 'Course / Certification Title', width: '36%', align: 'justify', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a', textAlign: 'justify', textJustify: 'inter-word' }}>{it.title}</div> },
        {
          header: 'Platform & Type',
          width: '20%',
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.3, textAlign: 'justify', textJustify: 'inter-word' }}>
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
        { header: 'Key Decisions & Topics Discussed', width: '42%', align: 'justify', render: (it) => <div style={{ color: '#334155', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>{it.decisions}</div> },
        { header: 'Policy Changes & Action Plan', width: '26%', align: 'justify', render: (it) => <div style={{ color: '#475569', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>{it.policyChanges || 'Standard operations confirmed.'}</div> }
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
        { header: 'Partner Entity / Industry', width: '32%', align: 'justify', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a', textAlign: 'justify', textJustify: 'inter-word' }}>{it.name}</div> },
        { header: 'Validity Period', width: '16%', align: 'center', render: (it) => <span style={{ color: '#334155' }}>{it.datePeriod}</span> },
        { header: 'Faculty SPOC', width: '16%', align: 'center', render: (it) => <span style={{ color: '#1a365d', fontWeight: 600 }}>{it.facultySpoc || '-'}</span> },
        { header: 'Scope & Focus Area', width: '22%', align: 'justify', render: (it) => <span style={{ color: '#475569', textAlign: 'justify', textJustify: 'inter-word' }}>{it.purpose}</span> }
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
          align: 'justify',
          render: (it) => (
            <div style={{ fontWeight: 700, color: '#0f172a', textAlign: 'justify', textJustify: 'inter-word' }}>
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
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#475569', textAlign: 'justify', textJustify: 'inter-word' }}>
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
        { header: 'Course / Subject Title', width: '21%', align: 'justify', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a', textAlign: 'justify', textJustify: 'inter-word' }}>{it.subject}</div> },
        { header: 'Year / Sem', width: '10%', align: 'center', render: (it) => <span style={{ color: '#334155' }}>{it.yearSem || '-'}</span> },
        { header: 'Faculty In-Charge', width: '15%', align: 'justify', render: (it) => <span style={{ color: '#1a365d', fontWeight: 600, textAlign: 'justify', textJustify: 'inter-word' }}>{it.faculty}</span> },
        { header: 'Done (5 Units)', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#047857', fontSize: '8.5px' }}>{it.completed}</span> },
        { header: 'Pending', width: '8%', align: 'center', render: (it) => <span style={{ fontWeight: 700, color: '#b45309', fontSize: '8.5px' }}>{it.pending}</span> },
        { header: 'Remarks', width: '26%', align: 'justify', render: (it) => <div style={{ color: '#475569', fontSize: '8.5px', fontStyle: 'italic', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>{it.remarks || '-'}</div> }
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
        { header: 'Activity / Event Title', width: '26%', align: 'justify', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a', textAlign: 'justify', textJustify: 'inter-word' }}>{it.title}</div> },
        {
          header: 'Type & Duration',
          width: '18%',
          align: 'justify',
          render: (it) => {
            const displayType = (it.type === 'Other' && it.otherType) ? `Other (${it.otherType})` : (it.otherType || it.type || '-');
            const displayDates = it.dates || (it.startDate && it.endDate ? `${it.startDate} to ${it.endDate}` : it.startDate || '-');
            return (
              <div style={{ color: '#334155', lineHeight: 1.3, textAlign: 'justify', textJustify: 'inter-word' }}>
                <div style={{ fontWeight: 600, color: '#1a365d' }}>{displayType}</div>
                <div style={{ color: '#64748b', fontSize: '8px' }}>{displayDates} ({it.noOfDays || '1 day'})</div>
              </div>
            );
          }
        },
        { header: 'Participants', width: '11%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#047857' }}>{it.participantsCount || '-'}</span> },
        { header: 'Coordinator', width: '15%', align: 'justify', render: (it) => <span style={{ color: '#1a365d', fontWeight: 600, textAlign: 'justify', textJustify: 'inter-word' }}>{it.coordinator || '-'}</span> },
        { header: 'Remarks / Outcomes', width: '17%', align: 'justify', render: (it) => <div style={{ color: '#475569', fontSize: '8px', fontStyle: 'italic', textAlign: 'justify', textJustify: 'inter-word' }}>{it.remarks || '-'}</div> }
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
          align: 'justify',
          render: (it) => (
            <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
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
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#475569', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
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
        { header: 'Initiative / Activity', width: '32%', align: 'justify', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a', textAlign: 'justify', textJustify: 'inter-word' }}>{it.initiative}</div> },
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
          align: 'justify',
          render: (it) => (
            <div style={{ color: '#475569', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
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
          padding: '12px',
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

  // Helper to render reusable generic section data tables with flawless vertical text rendering
  const renderDataTable = <T,>(columns: ColumnConfig<T>[], items: T[], startIndex: number) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '8.5px', border: '1px solid #cbd5e1', marginBottom: '8px' }}>
      <thead>
        <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
          {columns.map((col, cIdx) => (
            <th
              key={cIdx}
              style={{
                width: col.width,
                padding: '6px 5px',
                textAlign: col.align === 'center' ? 'center' : (col.align === 'right' ? 'right' : 'left'),
                verticalAlign: 'middle',
                fontWeight: 800,
                fontSize: '8.5px',
                borderRight: cIdx < columns.length - 1 ? '1px solid #3b82f6' : 'none',
                lineHeight: 1.3
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
                  padding: col.align === 'center' ? '5px 3px' : '5px 6px',
                  textAlign: col.align === 'center' ? 'center' : (col.align === 'right' ? 'right' : 'justify'),
                  textJustify: 'inter-word',
                  verticalAlign: 'middle',
                  borderRight: cIdx < columns.length - 1 ? '1px solid #cbd5e1' : 'none',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  lineHeight: 1.35
                }}
              >
                {col.render(item, startIndex + rIdx)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  interface PageSectionItem {
    section: SectionConfig;
    items: any[];
    startIndex: number;
    isContinued: boolean;
    totalCount: number;
  }

  interface GeneratedPage {
    type: 'content' | 'final';
    isFirstPage?: boolean;
    sections?: PageSectionItem[];
  }

  const generatedPages: GeneratedPage[] = [];

  // Generate dedicated page per category (every category starts on its own page)
  let isFirstPage = true;

  sectionsConfig.forEach(sec => {
    const allItems = sec.getItems(deptDataMap, departmentList);
    if (allItems.length === 0) return; // Skip empty categories

    const firstPageCapacity = sec.tall ? 7 : (sec.key === 'syllabus' ? 10 : 8);
    const standardCapacity = sec.tall ? 8 : (sec.key === 'syllabus' ? 12 : (sec.rowsPerPage || 10));

    let remainingItems = allItems;
    let chunkStartIndex = 0;
    let chunkIdx = 0;

    while (remainingItems.length > 0) {
      const isCurrentFirst = isFirstPage && chunkIdx === 0;
      const capacity = isCurrentFirst ? firstPageCapacity : standardCapacity;
      const chunk = remainingItems.slice(0, capacity);

      generatedPages.push({
        type: 'content',
        isFirstPage: isCurrentFirst,
        sections: [{
          section: sec,
          items: chunk,
          startIndex: chunkStartIndex,
          isContinued: chunkIdx > 0,
          totalCount: allItems.length
        }]
      });

      chunkStartIndex += chunk.length;
      remainingItems = remainingItems.slice(chunk.length);
      chunkIdx++;
    }

    isFirstPage = false;
  });

  // Final Dedicated Page: Audit Summary & Sign-off Block
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
        marginBottom: '12px',
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
        marginTop: '12px',
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
        paddingBottom: '3px',
        marginBottom: '8px'
      }}
    >
      <div
        style={{
          fontWeight: 900,
          color: '#1a365d',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}
      >
        {title} {isContinued && <span style={{ color: '#c2410c' }}>(CONTINUED)</span>}
      </div>
      {count !== undefined && (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: '#475569'
          }}
        >
          Total: {count} Entries
        </span>
      )}
    </div>
  );

  const renderAuditAndSignOff = () => (
    <div style={{ marginTop: '12px' }}>
      {/* Institutional Academic & Attendance Compliance Audit */}
      <div style={{ marginBottom: '16px' }}>
        {renderSectionHeader('INSTITUTIONAL ACADEMIC & ATTENDANCE AUDIT SUMMARY')}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1', marginBottom: '12px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ width: '28%', padding: '7px 10px', verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                Curriculum Delivery Compliance
              </td>
              <td style={{ width: '72%', padding: '7px 10px', verticalAlign: 'middle', fontWeight: 700, color: '#047857' }}>
                100% Target Met &bull; All Academic Branches Maintained Prescribed Syllabus Progression
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '7px 10px', verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                Biometric &amp; ERP Attendance Audit
              </td>
              <td style={{ padding: '7px 10px', verticalAlign: 'middle', fontWeight: 700, color: '#047857' }}>
                100% Verified Compliant &bull; No Statutory Condonation Shortages Identified
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '7px 10px', verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                Dean / Academic Director Remarks
              </td>
              <td style={{ padding: '7px 10px', verticalAlign: 'middle', color: '#475569', fontStyle: 'italic', fontSize: '8.5px', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
                All departments maintained prescribed academic engagement. Remedial classes, technical association activities, and academic bridge initiatives organized as mandated.
              </td>
            </tr>
            <tr>
              <td style={{ padding: '7px 10px', verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                IQAC Review &amp; Quality Audit
              </td>
              <td style={{ padding: '7px 10px', verticalAlign: 'middle', color: '#1e3a8a', fontWeight: 600, fontSize: '8.5px', lineHeight: 1.35, textAlign: 'justify', textJustify: 'inter-word' }}>
                All departmental reports verified and consolidated according to autonomous institutional governance framework.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Official Institutional Governance & Sign-Off Block */}
      <div style={{ paddingTop: '14px', borderTop: '1.5px solid #cbd5e1' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', tableLayout: 'fixed' }}>
          <tbody>
            <tr style={{ border: 'none' }}>
              <td style={{ width: '33.33%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                <div style={{ height: '32px' }}></div>
                <div style={{ width: '75%', margin: '0 auto 6px auto', borderTop: '1.5px solid #0f172a' }}></div>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#0f172a' }}>Dr. Sreenivas Prasad</div>
                <div style={{ fontSize: '8.5px', color: '#475569', fontWeight: 600 }}>IQAC Coordinator</div>
                <div style={{ fontSize: '7.5px', color: '#64748b' }}>Sanskrithi School of Engineering</div>
              </td>

              <td style={{ width: '33.33%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                <div style={{ height: '32px' }}></div>
                <div style={{ width: '75%', margin: '0 auto 6px auto', borderTop: '1.5px solid #0f172a' }}></div>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#0f172a' }}>Dean of Academics</div>
                <div style={{ fontSize: '8.5px', color: '#475569', fontWeight: 600 }}>Academic Governance</div>
                <div style={{ fontSize: '7.5px', color: '#64748b' }}>Sanskrithi School of Engineering</div>
              </td>

              <td style={{ width: '33.33%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                <div style={{ height: '32px' }}></div>
                <div style={{ width: '75%', margin: '0 auto 6px auto', borderTop: '1.5px solid #0f172a' }}></div>
                <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#0f172a' }}>Principal</div>
                <div style={{ fontSize: '8.5px', color: '#475569', fontWeight: 600 }}>Institutional Endorsement</div>
                <div style={{ fontSize: '7.5px', color: '#64748b' }}>Sanskrithi School of Engineering</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const fixedA4PageStyle: React.CSSProperties = {
    width: '750px',
    minHeight: '1060px',
    height: '1060px',
    maxHeight: '1060px',
    boxSizing: 'border-box',
    padding: '24px 30px 18px 30px',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
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
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        lineHeight: 1.4,
        color: '#0f172a',
        backgroundColor: '#ffffff',
        border: 'none',
        boxShadow: 'none'
      }}
    >
      {generatedPages.map((pageDef, pIdx) => {
        const pageNumber = pIdx + 1;

        if (pageDef.type === 'content') {
          return (
            <div key={pIdx} className="pdf-page" style={fixedA4PageStyle}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {pageDef.isFirstPage ? (
                  <div>
                    {/* Official Page 1 Header */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', tableLayout: 'fixed', marginBottom: '6px' }}>
                      <tbody>
                        <tr style={{ border: 'none' }}>
                          <td style={{ width: '50%', border: 'none', verticalAlign: 'middle', textAlign: 'left', padding: '0 0 4px 0' }}>
                            <img
                              src={logoBase64}
                              alt="Sanskrithi School of Engineering Logo"
                              style={{ height: '36px', width: 'auto', display: 'block', objectFit: 'contain' }}
                            />
                          </td>
                          <td style={{ width: '50%', border: 'none', verticalAlign: 'middle', textAlign: 'right', padding: '0 0 4px 0' }}>
                            <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1e293b' }}>
                              SANSKRITHI SCHOOL OF ENGINEERING
                            </div>
                            <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#c2410c', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '1px' }}>
                              AUTONOMOUS
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ height: '2px', backgroundColor: '#1a365d', width: '100%', marginBottom: '12px' }}></div>

                    {/* Document Title Block */}
                    <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                      <h1
                        style={{
                          fontSize: '16px',
                          fontWeight: 900,
                          color: '#1a365d',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          margin: '0 0 3px 0'
                        }}
                      >
                        INSTITUTIONAL HOD PROGRESS REPORT
                      </h1>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', margin: '0 0 3px 0' }}>
                        Comprehensive Performance Dossier across All Academic Departments
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>
                        Reporting Period: <strong style={{ color: '#0f172a' }}>{period}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  renderRunningHeader()
                )}

                <div data-body style={{ flex: 1, minHeight: 0 }}>
                  {pageDef.sections?.map((sItem, sIdx) => (
                    <div key={sIdx} style={{ marginBottom: '8px' }}>
                      {renderSectionHeader(sItem.section.title, sItem.totalCount, sItem.isContinued)}
                      {renderDataTable(sItem.section.columns, sItem.items || [], sItem.startIndex || 0)}
                    </div>
                  ))}
                </div>
              </div>
              {renderRunningFooter(pageNumber)}
            </div>
          );
        }

        if (pageDef.type === 'final') {
          return (
            <div key={pIdx} className="pdf-page" style={fixedA4PageStyle}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {renderRunningHeader()}
                <div data-body style={{ flex: 1, minHeight: 0 }}>
                  {renderAuditAndSignOff()}
                </div>
              </div>
              {renderRunningFooter(pageNumber)}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default ConsolidatedInstitutionalPDFView;

