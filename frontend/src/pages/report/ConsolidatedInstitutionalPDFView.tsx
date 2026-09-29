import React, { useState, useEffect } from 'react';
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

  // Standard 5 academic departments
  const departmentList = [
    { code: 'CIVIL', name: 'Civil Engineering', hod: 'K Siva Prasad' },
    { code: 'CSE', name: 'Computer Science & Engineering', hod: 'Dr. Kethineni Vinod Kumar' },
    { code: 'ECE', name: 'Electronics & Communication Engineering', hod: 'Dr. V. Annapurna' },
    { code: 'EEE', name: 'Electrical & Electronics Engineering', hod: 'Mr. K. Gangadhar' },
    { code: 'H&S', name: 'Humanities & Sciences', hod: 'Dr. Samba Sivaiah B' }
  ];

  // Gather data for all 5 departments with robust normalization
  const deptDataMap: Record<string, ReportSectionsData> = {};
  departmentList.forEach(dept => {
    const raw = customData?.[dept.name] || customData?.[dept.code] || getDepartmentSampleData(dept.name);
    deptDataMap[dept.code] = normalizeSections(raw);
  });

  // Aggregate matrix metrics
  const matrixCategories = [
    { key: 'journals', label: '1A. Journal Publications' },
    { key: 'conferences', label: '1B. Conference Presentations' },
    { key: 'patents', label: '1C. Patents Filed / Awarded' },
    { key: 'entrepreneurship', label: '1D. Entrepreneurship & Start-up' },
    { key: 'nss', label: '2. NSS & Extension Activities' },
    { key: 'fdp', label: '3. Faculty Development (FDP)' },
    { key: 'sdp', label: '4. Student Development (SDP)' },
    { key: 'facultyAchievements', label: '5A. Faculty Achievements & Honors' },
    { key: 'studentAchievements', label: '5B. Student Achievements & Awards' },
    { key: 'certifications', label: '5C. Certifications (NPTEL / Coursera)' },
    { key: 'deptMeetings', label: '6A. Department Meetings & Governance' },
    { key: 'mous', label: '6B. Collaborations & MoUs' },
    { key: 'additionalInitiatives', label: '7. Additional Department Initiatives' },
    { key: 'techAssociation', label: '8. Technical Association Events' },
    { key: 'iicCell', label: '9. IIC & Innovation Council' },
    { key: 'syllabus', label: '10. Syllabus Course Tracking' }
  ];

  const deptTotals: Record<string, number> = { CIVIL: 0, CSE: 0, ECE: 0, EEE: 0, 'H&S': 0 };
  let grandTotal = 0;

  const matrixRows = matrixCategories.map(cat => {
    const counts: Record<string, number> = {};
    let catTotal = 0;
    departmentList.forEach(dept => {
      const arr = (deptDataMap[dept.code] as any)?.[cat.key];
      const count = Array.isArray(arr) ? arr.length : 0;
      counts[dept.code] = count;
      deptTotals[dept.code] += count;
      catTotal += count;
    });
    grandTotal += catTotal;
    return { label: cat.label, counts, total: catTotal };
  });

  // Standard Section Configurations: 8 rows for tall tables, 10 otherwise
  const sectionsConfig: SectionConfig[] = [
    {
      key: 'journals',
      title: '1A. CONSOLIDATED JOURNAL PUBLICATIONS',
      tall: true,
      rowsPerPage: 8,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.journals || []).map(it => ({ ...it, deptCode: d.code }))),
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
    {
      key: 'conferences',
      title: '1B. CONSOLIDATED CONFERENCE PRESENTATIONS',
      tall: true,
      rowsPerPage: 8,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.conferences || []).map(it => ({ ...it, deptCode: d.code }))),
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
    {
      key: 'patents',
      title: '1C. CONSOLIDATED PATENTS & IPR FILINGS',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.patents || []).map(it => ({ ...it, deptCode: d.code }))),
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
    {
      key: 'entrepreneurship',
      title: '1D. CONSOLIDATED ENTREPRENEURSHIP & START-UP INITIATIVES',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.entrepreneurship || []).map(it => ({ ...it, deptCode: d.code }))),
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
    {
      key: 'nss',
      title: '2. CONSOLIDATED NSS & COMMUNITY EXTENSION ACTIVITIES',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.nss || []).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { 
          header: 'Event / Activity Name', 
          width: '32%', 
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
          width: '20%', 
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
          width: '18%', 
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
          width: '16%', 
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
    {
      key: 'fdp',
      title: '3. CONSOLIDATED FACULTY DEVELOPMENT PROGRAMS (FDPS)',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.fdp || []).map(it => ({ ...it, deptCode: d.code }))),
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
              <div style={{ color: '#475569', fontSize: '8px' }}>Dates: {it.dates}</div>
            </div>
          )
        },
        { 
          header: 'Mode & Role', 
          width: '12%', 
          align: 'center', 
          render: (it) => (
            <div style={{ color: '#334155', lineHeight: 1.35 }}>
              <div style={{ fontWeight: 700, color: '#1a365d' }}>{it.role}</div>
              <div style={{ color: '#64748b', fontSize: '8px' }}>{it.mode}</div>
            </div>
          )
        },
        { 
          header: 'Key Outcomes', 
          width: '14%', 
          align: 'left', 
          render: (it) => <div style={{ color: '#475569', fontSize: '8.5px', lineHeight: 1.35 }}>{it.keyOutcomes}</div>
        }
      ]
    },
    {
      key: 'sdp',
      title: '4. CONSOLIDATED STUDENT DEVELOPMENT PROGRAMS (SDPS)',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.sdp || []).map(it => ({ ...it, deptCode: d.code }))),
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
    {
      key: 'facultyAchievements',
      title: '5A. CONSOLIDATED FACULTY ACHIEVEMENTS & NATIONAL RECOGNITIONS',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.facultyAchievements || []).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Faculty Member', width: '28%', align: 'left', render: (it) => <span style={{ fontWeight: 700, color: '#1a365d' }}>{it.name}</span> },
        { header: 'Award / Recognition', width: '34%', align: 'left', render: (it) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{it.award}</span> },
        { header: 'Conferring Body & Date', width: '24%', align: 'left', render: (it) => <span style={{ color: '#475569' }}>{it.organization}{it.date ? ` (${it.date})` : ''}</span> }
      ]
    },
    {
      key: 'studentAchievements',
      title: '5B. CONSOLIDATED STUDENT ACHIEVEMENTS & COMPETITIVE AWARDS',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.studentAchievements || []).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Student Name & ID', width: '30%', align: 'left', render: (it) => <span style={{ fontWeight: 700, color: '#0f172a' }}>{it.nameRoll}</span> },
        { header: 'Prize / Accomplishment', width: '32%', align: 'left', render: (it) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{it.award}</span> },
        { header: 'Event & Host Institution', width: '24%', align: 'left', render: (it) => <span style={{ color: '#475569' }}>{it.event} {it.organization ? `(${it.organization})` : ''}</span> }
      ]
    },
    {
      key: 'certifications',
      title: '5C. CONSOLIDATED PROFESSIONAL CERTIFICATIONS (NPTEL / COURSERA)',
      tall: false,
      rowsPerPage: 10, // 15 total items: automatically divides into Page 1 (10 rows) and Page 2 (5 rows with CONTINUED)
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.certifications || []).map(it => ({ ...it, deptCode: d.code }))),
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
    {
      key: 'deptMeetings',
      title: '6A. CONSOLIDATED DEPARTMENT MEETINGS & ACADEMIC GOVERNANCE',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.deptMeetings || []).map(it => ({ ...it, deptCode: d.code }))),
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
    {
      key: 'mous',
      title: '6B. CONSOLIDATED MOUS & INDUSTRY COLLABORATIONS',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.mous || []).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Partner Entity / Industry', width: '32%', align: 'left', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.name}</div> },
        { header: 'Validity Period', width: '16%', align: 'center', render: (it) => <span style={{ color: '#334155' }}>{it.datePeriod}</span> },
        { header: 'Faculty SPOC', width: '16%', align: 'center', render: (it) => <span style={{ color: '#1a365d', fontWeight: 600 }}>{it.facultySpoc || '-'}</span> },
        { header: 'Scope & Focus Area', width: '22%', align: 'left', render: (it) => <span style={{ color: '#475569' }}>{it.purpose}</span> }
      ]
    },
    {
      key: 'additionalInitiatives',
      title: '7. CONSOLIDATED ADDITIONAL DEPARTMENT INITIATIVES',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.additionalInitiatives || []).map(it => ({ ...it, deptCode: d.code }))),
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
    {
      key: 'techAssociation',
      title: '8. CONSOLIDATED TECHNICAL ASSOCIATION ACTIVITIES',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.techAssociation || []).map(it => ({ ...it, deptCode: d.code }))),
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
    {
      key: 'iicCell',
      title: '9. CONSOLIDATED IIC CELL & INNOVATION ACTIVITIES',
      tall: false,
      rowsPerPage: 10,
      getItems: (data, depts) => depts.flatMap(d => (data[d.code]?.iicCell || []).map(it => ({ ...it, deptCode: d.code }))),
      columns: [
        { header: '#', width: '5%', align: 'center', render: (_it, idx) => idx + 1 },
        { header: 'Branch', width: '9%', align: 'center', render: (it) => <span style={{ fontWeight: 800, color: '#1a365d' }}>{it.deptCode}</span> },
        { header: 'Activity / Initiative', width: '30%', align: 'left', render: (it) => <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.activity}</div> },
        { 
          header: 'Date & Resource Partner', 
          width: '20%', 
          align: 'center', 
          render: (it) => (
            <div style={{ color: '#334155' }}>
              <div>{it.date}</div>
              <div style={{ color: '#1a365d', fontSize: '8px' }}>Partner: {it.partner}</div>
            </div>
          )
        },
        { 
          header: 'Beneficiaries & Impact Outcomes', 
          width: '36%', 
          align: 'left', 
          render: (it) => (
            <div style={{ color: '#475569' }}>
              <div><strong>Beneficiaries:</strong> {it.beneficiaries}</div>
              <div style={{ fontSize: '8px' }}>{it.outcomes}</div>
            </div>
          )
        }
      ]
    }
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
                  borderRight: cIdx < columns.length - 1 ? '1px solid #cbd5e1' : 'none'
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

  // Generate dynamic page units according to row limits
  interface GeneratedPage {
    type: 'cover' | 'section' | 'final';
    section?: SectionConfig;
    items?: any[];
    startIndex?: number;
    isContinued?: boolean;
    totalCount?: number;
  }

  const generatedPages: GeneratedPage[] = [];

  // Page 1: Cover & Executive Performance Matrix
  generatedPages.push({ type: 'cover' });

  // Intermediate Pages: Sections 1A through 9
  sectionsConfig.forEach(sec => {
    const allItems = sec.getItems(deptDataMap, departmentList);
    if (allItems.length === 0) {
      generatedPages.push({
        type: 'section',
        section: sec,
        items: [],
        startIndex: 0,
        isContinued: false,
        totalCount: 0
      });
    } else {
      const chunks: any[][] = [];
      for (let i = 0; i < allItems.length; i += sec.rowsPerPage) {
        chunks.push(allItems.slice(i, i + sec.rowsPerPage));
      }
      chunks.forEach((chunk, chunkIdx) => {
        generatedPages.push({
          type: 'section',
          section: sec,
          items: chunk,
          startIndex: chunkIdx * sec.rowsPerPage,
          isContinued: chunkIdx > 0,
          totalCount: allItems.length
        });
      });
    }
  });

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

                {/* Executive Cross-Department Performance Matrix */}
                <div>
                  {renderSectionHeader(`EXECUTIVE CROSS-DEPARTMENT PERFORMANCE MATRIX (${period})`)}
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                        <th style={{ width: '40%', padding: '8px 10px', textAlign: 'left', verticalAlign: 'middle', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>
                          Activity Category / Section
                        </th>
                        {departmentList.map(d => (
                          <th key={d.code} style={{ width: '9.5%', padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>
                            {d.code}
                          </th>
                        ))}
                        <th style={{ width: '12.5%', padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 800, backgroundColor: '#c2410c' }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrixRows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                          <td style={{ padding: '6.5px 10px', verticalAlign: 'middle', fontWeight: 600, color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>
                            {row.label}
                          </td>
                          {departmentList.map(d => {
                            const val = row.counts[d.code] || 0;
                            return (
                              <td key={d.code} style={{ padding: '6.5px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: val > 0 ? 700 : 400, color: val > 0 ? '#0f172a' : '#94a3b8', borderRight: '1px solid #cbd5e1' }}>
                                {val > 0 ? val : '-'}
                              </td>
                            );
                          })}
                          <td style={{ padding: '6.5px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 800, color: '#c2410c', backgroundColor: '#fff7ed' }}>
                            {row.total}
                          </td>
                        </tr>
                      ))}
                      {/* Grand Total Row */}
                      <tr style={{ backgroundColor: '#e2e8f0', borderTop: '2px solid #94a3b8' }}>
                        <td style={{ padding: '8px 10px', verticalAlign: 'middle', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #cbd5e1', textTransform: 'uppercase' }}>
                          Total Activities Reported
                        </td>
                        {departmentList.map(d => (
                          <td key={d.code} style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>
                            {deptTotals[d.code]}
                          </td>
                        ))}
                        <td style={{ padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 900, color: '#c2410c', backgroundColor: '#fed7aa', fontSize: '10px' }}>
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

        if (pageDef.type === 'section' && pageDef.section) {
          const sec = pageDef.section;
          return (
            <div key={pIdx} className="pdf-page" style={fixedA4PageStyle}>
              <div>
                {renderRunningHeader()}
                {renderSectionHeader(sec.title, pageDef.totalCount, pageDef.isContinued)}
                {renderDataTable(sec.columns, pageDef.items || [], pageDef.startIndex || 0)}
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

                {/* Section 10: Syllabus Coverage Report */}
                <div style={{ marginBottom: '16px' }}>
                  {renderSectionHeader('10. CONSOLIDATED SYLLABUS COVERAGE & ACADEMIC AUDIT')}
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                        <th style={{ width: '9%', padding: '8px 4px', borderRight: '1px solid #3b82f6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>Branch</th>
                        <th style={{ width: '31%', padding: '8px 10px', borderRight: '1px solid #3b82f6', textAlign: 'left', verticalAlign: 'middle', fontWeight: 'bold' }}>Course / Subject Title</th>
                        <th style={{ width: '20%', padding: '8px 8px', borderRight: '1px solid #3b82f6', textAlign: 'left', verticalAlign: 'middle', fontWeight: 'bold' }}>Faculty In-Charge</th>
                        <th style={{ width: '10%', padding: '8px 4px', borderRight: '1px solid #3b82f6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>% Done</th>
                        <th style={{ width: '10%', padding: '8px 4px', borderRight: '1px solid #3b82f6', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold' }}>% Pend</th>
                        <th style={{ width: '20%', padding: '8px 8px', textAlign: 'left', verticalAlign: 'middle', fontWeight: 'bold' }}>DAC Academic Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departmentList.flatMap(dept => 
                        (deptDataMap[dept.code]?.syllabus || []).slice(0, 1).map(item => ({ ...item, deptCode: dept.code }))
                      ).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '7px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', verticalAlign: 'middle', fontWeight: 800, color: '#1a365d' }}>
                            {item.deptCode}
                          </td>
                          <td style={{ padding: '7px 10px', borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', fontWeight: 600, color: '#0f172a' }}>{item.subject}</td>
                          <td style={{ padding: '7px 8px', borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', color: '#334155' }}>{item.faculty}</td>
                          <td style={{ padding: '7px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#047857' }}>{item.completed}</td>
                          <td style={{ padding: '7px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#475569' }}>{item.pending}</td>
                          <td style={{ padding: '7px 8px', verticalAlign: 'middle', color: '#475569', fontStyle: 'italic', fontSize: '8.5px', lineHeight: 1.3 }}>{item.remarks}</td>
                        </tr>
                      ))}
                      {/* Summary Compliance Row */}
                      <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1.5px solid #94a3b8' }}>
                        <td style={{ padding: '7px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 800, color: '#1a365d' }}>ALL</td>
                        <td colSpan={2} style={{ padding: '7px 10px', verticalAlign: 'middle', fontWeight: 800, color: '#1a365d' }}>
                          Institutional Curriculum Delivery Compliance Benchmark
                        </td>
                        <td style={{ padding: '7px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 900, color: '#047857' }}>100%</td>
                        <td style={{ padding: '7px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 800, color: '#64748b' }}>Nil</td>
                        <td style={{ padding: '7px 8px', verticalAlign: 'middle', fontWeight: 700, color: '#047857', fontSize: '8.5px' }}>Curriculum targets met across all 5 branches</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 11: Attendance Shortage */}
                <div style={{ marginBottom: '18px' }}>
                  {renderSectionHeader('11. ATTENDANCE SHORTAGE ANALYSIS (SUMMER VACATION HOLIDAYS)')}
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <td style={{ width: '25%', padding: '7px 10px', verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                          Audit Focus Area
                        </td>
                        <td style={{ width: '75%', padding: '7px 10px', verticalAlign: 'middle', color: '#334155' }}>
                          Biometric &amp; ERP Student Attendance Audit for Summer Session / Vacation Schedule
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <td style={{ padding: '7px 10px', verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                          Compliance Status
                        </td>
                        <td style={{ padding: '7px 10px', verticalAlign: 'middle', fontWeight: 700, color: '#047857' }}>
                          100% Verified Compliant &bull; No Statutory Condonation Shortages Identified
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '7px 10px', verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                          Dean / Academic Director Remarks
                        </td>
                        <td style={{ padding: '7px 10px', verticalAlign: 'middle', color: '#475569', fontStyle: 'italic', fontSize: '8.5px' }}>
                          All departments maintained prescribed biometric engagement. Remedial classes and academic bridge initiatives organized as mandated.
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
