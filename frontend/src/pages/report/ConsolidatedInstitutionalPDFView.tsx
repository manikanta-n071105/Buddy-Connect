import React, { useState, useEffect } from 'react';
import { ReportSectionsData } from './HODManualReportBuilder';
import { getDepartmentSampleData } from './departmentSampleData';

interface ConsolidatedInstitutionalPDFViewProps {
  id?: string;
  period: string;
  submissionDate?: string;
  customData?: Record<string, ReportSectionsData>;
}

export const ConsolidatedInstitutionalPDFView: React.FC<ConsolidatedInstitutionalPDFViewProps> = ({
  id = 'consolidated-pdf-document',
  period,
  submissionDate = '25/04/2026',
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

  // Gather data for all 5 departments
  const deptDataMap: Record<string, ReportSectionsData> = {};
  departmentList.forEach(dept => {
    deptDataMap[dept.code] = customData?.[dept.name] || customData?.[dept.code] || getDepartmentSampleData(dept.name);
  });

  // Aggregate matrix metrics
  const matrixCategories = [
    { key: 'journals', label: 'Journal Publications' },
    { key: 'conferences', label: 'Conference Presentations' },
    { key: 'patents', label: 'Patents Filed / Awarded' },
    { key: 'entrepreneurship', label: 'Entrepreneurship & Start-up' },
    { key: 'nss', label: 'NSS & Extension Activities' },
    { key: 'fdp', label: 'Faculty Development (FDP)' },
    { key: 'sdp', label: 'Student Development (SDP)' },
    { key: 'facultyAchievements', label: 'Faculty Achievements & Honors' },
    { key: 'studentAchievements', label: 'Student Achievements & Honors' },
    { key: 'certifications', label: 'Certifications (NPTEL / Coursera)' },
    { key: 'deptMeetings', label: 'Department Meetings & Governance' },
    { key: 'mous', label: 'Collaborations & MoUs' },
    { key: 'additionalInitiatives', label: 'Additional Department Initiatives' },
    { key: 'techAssociation', label: 'Technical Association Events' },
    { key: 'iicCell', label: 'IIC & Innovation Council' },
    { key: 'syllabus', label: 'Syllabus Course Tracking' }
  ];

  const deptTotals: Record<string, number> = { CIVIL: 0, CSE: 0, ECE: 0, EEE: 0, 'H&S': 0 };
  let grandTotal = 0;

  const matrixRows = matrixCategories.map(cat => {
    const counts: Record<string, number> = {};
    let catTotal = 0;
    departmentList.forEach(dept => {
      const arr = (deptDataMap[dept.code] as any)?.[cat.key] || [];
      const count = arr.length;
      counts[dept.code] = count;
      deptTotals[dept.code] += count;
      catTotal += count;
    });
    grandTotal += catTotal;
    return { label: cat.label, counts, total: catTotal };
  });

  const renderRunningHeader = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1.5px solid #cbd5e1',
        paddingBottom: '5px',
        marginBottom: '12px',
        fontSize: '8.5px',
        fontWeight: 700,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}
    >
      <span>Sanskrithi School of Engineering (Autonomous) &bull; IQAC</span>
      <span>Consolidated Institutional Progress Report &bull; {period}</span>
    </div>
  );

  const renderRunningFooter = (pageNo: number) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #cbd5e1',
        paddingTop: '6px',
        marginTop: '10px',
        fontSize: '8.5px',
        color: '#64748b'
      }}
    >
      <span>Confidential &bull; SSE Autonomous Academic Governance Dossier</span>
      <span style={{ fontWeight: 700, color: '#334155' }}>Page {pageNo} of 6</span>
    </div>
  );

  const renderSectionHeader = (title: string, count?: number) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #1a365d',
        paddingBottom: '4px',
        marginBottom: '10px'
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
        {title}
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

  const pageContainerStyle = (isFirstPage: boolean = false): React.CSSProperties => ({
    minHeight: '1015px',
    boxSizing: 'border-box',
    paddingTop: isFirstPage ? '22px' : '18px',
    paddingBottom: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    ...(!isFirstPage ? { breakBefore: 'page', pageBreakBefore: 'always' } : {})
  });

  return (
    <div 
      id={id} 
      className="bg-white text-slate-900 font-sans mx-auto"
      style={{ 
        width: '750px',
        maxWidth: '750px',
        minWidth: '750px',
        boxSizing: 'border-box',
        padding: '0 28px',
        fontFamily: "'Calibri', 'Arial', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        lineHeight: 1.45,
        color: '#0f172a',
        backgroundColor: '#ffffff',
        border: 'none',
        boxShadow: 'none'
      }}
    >
      {/* ========================================================================= */}
      {/* PAGE 1: EXECUTIVE DOSSIER, COVERAGE PROFILE & PERFORMANCE MATRIX          */}
      {/* ========================================================================= */}
      <div style={pageContainerStyle(true)}>
        <div style={{ flex: 1 }}>
          {/* 1. Official Header Matching Institutional Theme */}
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
                  <div style={{ fontSize: '11.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1e293b' }}>
                    SANSKRITHI SCHOOL OF ENGINEERING
                  </div>
                  <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#c2410c', letterSpacing: '0.03em', textTransform: 'uppercase', marginTop: '2px' }}>
                    AUTONOMOUS &bull; INTERNAL QUALITY ASSURANCE CELL (IQAC)
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ height: '2px', backgroundColor: '#1a365d', width: '100%', marginBottom: '14px' }}></div>

          {/* 2. Document Title Block */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h1 
              style={{ 
                fontSize: '17px', 
                fontWeight: 900, 
                color: '#1a365d', 
                textTransform: 'uppercase', 
                letterSpacing: '0.03em',
                margin: '0 0 4px 0'
              }}
            >
              CONSOLIDATED INSTITUTIONAL HOD PROGRESS REPORT
            </h1>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', margin: '0 0 4px 0' }}>
              Comprehensive Performance Dossier across All Academic Departments
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>
              Reporting Period: <strong style={{ color: '#0f172a' }}>{period}</strong> &bull; Date of Compilation: <strong style={{ color: '#0f172a' }}>{submissionDate}</strong>
            </div>
          </div>

          {/* 3. Section: Reporting Overview & Institutional Coverage Table */}
          <div style={{ marginBottom: '16px' }}>
            {renderSectionHeader('REPORTING OVERVIEW & INSTITUTIONAL COVERAGE')}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '10px', border: '1px solid #cbd5e1' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ width: '30%', padding: '8px 12px', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                    Institution Name
                  </td>
                  <td style={{ width: '70%', padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>
                    Sanskrithi School of Engineering (Autonomous), Andhra Pradesh
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                    Reporting Cycle Period
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#334155' }}>
                    {period}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                    Submission Coverage
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#334155' }}>
                    5 of 5 Academic Departments (Civil, CSE, ECE, EEE, H&amp;S) &bull; 100% Submission
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                    Activities Aggregated
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1a365d' }}>
                    {grandTotal} recorded activities compiled across 16 statutory institutional categories
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Executive Cross-Department Performance Matrix */}
          <div>
            {renderSectionHeader(`EXECUTIVE CROSS-DEPARTMENT PERFORMANCE MATRIX (${period})`)}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                  <th style={{ width: '38%', padding: '7px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>
                    Activity Category / Section
                  </th>
                  {departmentList.map(d => (
                    <th key={d.code} style={{ width: '10%', padding: '7px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>
                      {d.code}
                    </th>
                  ))}
                  <th style={{ width: '12%', padding: '7px 4px', textAlign: 'center', fontWeight: 800, backgroundColor: '#c2410c' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                    <td style={{ padding: '5.5px 8px', fontWeight: 600, color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>
                      {row.label}
                    </td>
                    {departmentList.map(d => {
                      const val = row.counts[d.code] || 0;
                      return (
                        <td key={d.code} style={{ padding: '5.5px 4px', textAlign: 'center', fontWeight: val > 0 ? 700 : 400, color: val > 0 ? '#0f172a' : '#94a3b8', borderRight: '1px solid #cbd5e1' }}>
                          {val > 0 ? val : '-'}
                        </td>
                      );
                    })}
                    <td style={{ padding: '5.5px 4px', textAlign: 'center', fontWeight: 800, color: '#c2410c', backgroundColor: '#fff7ed' }}>
                      {row.total}
                    </td>
                  </tr>
                ))}
                {/* Grand Total Row */}
                <tr style={{ backgroundColor: '#e2e8f0', borderTop: '2px solid #94a3b8' }}>
                  <td style={{ padding: '6.5px 8px', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #cbd5e1', textTransform: 'uppercase' }}>
                    Total Activities Reported
                  </td>
                  {departmentList.map(d => (
                    <td key={d.code} style={{ padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>
                      {deptTotals[d.code]}
                    </td>
                  ))}
                  <td style={{ padding: '6.5px 4px', textAlign: 'center', fontWeight: 900, color: '#c2410c', backgroundColor: '#fed7aa', fontSize: '10px' }}>
                    {grandTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {renderRunningFooter(1)}
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: CONSOLIDATED SECTION 1A — JOURNAL PUBLICATIONS                    */}
      {/* ========================================================================= */}
      <div style={pageContainerStyle()}>
        <div style={{ flex: 1 }}>
          {renderRunningHeader()}
          {renderSectionHeader('1A. CONSOLIDATED JOURNAL PUBLICATIONS', 10)}
          
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                <th style={{ width: '5%', padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>#</th>
                <th style={{ width: '9%', padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Branch</th>
                <th style={{ width: '38%', padding: '6.5px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Paper Title</th>
                <th style={{ width: '30%', padding: '6.5px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Authors &amp; Publication Details</th>
                <th style={{ width: '18%', padding: '6.5px 6px', textAlign: 'left', fontWeight: 800 }}>Indexing &amp; Verification</th>
              </tr>
            </thead>
            <tbody>
              {departmentList.flatMap(dept => 
                (deptDataMap[dept.code]?.journals || []).map(item => ({ ...item, deptCode: dept.code, deptName: dept.name }))
              ).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '6.5px 4px', textAlign: 'center', fontWeight: 700, color: '#1a365d', borderRight: '1px solid #cbd5e1' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, color: '#1a365d', borderRight: '1px solid #cbd5e1' }}>
                    {item.deptCode}
                  </td>
                  <td style={{ padding: '6.5px 8px', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #cbd5e1', lineHeight: 1.35 }}>
                    {item.title}
                  </td>
                  <td style={{ padding: '6.5px 8px', color: '#334155', borderRight: '1px solid #cbd5e1', lineHeight: 1.35 }}>
                    <div><strong>Authors:</strong> {item.authors}</div>
                    <div style={{ color: '#475569' }}><strong>Journal:</strong> {item.journalName} ({item.volIssueYear})</div>
                    <div style={{ color: '#64748b', fontSize: '8.5px' }}>Pages: {item.pageNos}</div>
                  </td>
                  <td style={{ padding: '6.5px 6px', color: '#334155', lineHeight: 1.35 }}>
                    <div>ISSN: <strong>{item.issnIsbn}</strong></div>
                    <div style={{ color: '#1a365d', fontWeight: 700 }}>Indexed: {item.indexedIn}</div>
                    <div style={{ color: '#1d4ed8', wordBreak: 'break-all', fontSize: '8px' }}>{item.link}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {renderRunningFooter(2)}
      </div>

      {/* ========================================================================= */}
      {/* PAGE 3: CONSOLIDATED SECTION 1B — CONFERENCE PRESENTATIONS                */}
      {/* ========================================================================= */}
      <div style={pageContainerStyle()}>
        <div style={{ flex: 1 }}>
          {renderRunningHeader()}
          {renderSectionHeader('1B. CONSOLIDATED CONFERENCE PRESENTATIONS', 10)}
          
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                <th style={{ width: '5%', padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>#</th>
                <th style={{ width: '9%', padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Branch</th>
                <th style={{ width: '38%', padding: '6.5px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Presentation Title</th>
                <th style={{ width: '30%', padding: '6.5px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Authors &amp; Conference Name</th>
                <th style={{ width: '18%', padding: '6.5px 6px', textAlign: 'left', fontWeight: 800 }}>Date, Venue &amp; Indexing</th>
              </tr>
            </thead>
            <tbody>
              {departmentList.flatMap(dept => 
                (deptDataMap[dept.code]?.conferences || []).map(item => ({ ...item, deptCode: dept.code }))
              ).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '6.5px 4px', textAlign: 'center', fontWeight: 700, color: '#1a365d', borderRight: '1px solid #cbd5e1' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, color: '#1a365d', borderRight: '1px solid #cbd5e1' }}>
                    {item.deptCode}
                  </td>
                  <td style={{ padding: '6.5px 8px', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #cbd5e1', lineHeight: 1.35 }}>
                    {item.title}
                  </td>
                  <td style={{ padding: '6.5px 8px', color: '#334155', borderRight: '1px solid #cbd5e1', lineHeight: 1.35 }}>
                    <div><strong>Authors:</strong> {item.authors}</div>
                    <div style={{ color: '#475569' }}><strong>Conference:</strong> {item.conferenceName}</div>
                  </td>
                  <td style={{ padding: '6.5px 6px', color: '#334155', lineHeight: 1.35 }}>
                    <div>Date: <strong>{item.date}</strong></div>
                    <div style={{ color: '#475569' }}>Venue: {item.locationMode}</div>
                    <div style={{ color: '#1a365d', fontWeight: 700 }}>Indexed: {item.indexedIn}</div>
                    <div style={{ color: '#1d4ed8', wordBreak: 'break-all', fontSize: '8px' }}>{item.link}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {renderRunningFooter(3)}
      </div>

      {/* ========================================================================= */}
      {/* PAGE 4: SECTION 1C (PATENTS) & SECTION 6B (MOUS & PARTNERSHIPS)           */}
      {/* ========================================================================= */}
      <div style={pageContainerStyle()}>
        <div style={{ flex: 1 }}>
          {renderRunningHeader()}

          {/* 1C. Patents & IPR Filings */}
          <div style={{ marginBottom: '14px' }}>
            {renderSectionHeader('1C. CONSOLIDATED PATENTS & IPR FILINGS', 10)}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                  <th style={{ width: '5%', padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>#</th>
                  <th style={{ width: '9%', padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Branch</th>
                  <th style={{ width: '42%', padding: '6.5px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Patent / Innovation Title</th>
                  <th style={{ width: '28%', padding: '6.5px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Inventors &amp; Registration</th>
                  <th style={{ width: '16%', padding: '6.5px 4px', textAlign: 'center', fontWeight: 800 }}>Status &amp; Date</th>
                </tr>
              </thead>
              <tbody>
                {departmentList.flatMap(dept => 
                  (deptDataMap[dept.code]?.patents || []).map(item => ({ ...item, deptCode: dept.code }))
                ).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '5.5px 4px', textAlign: 'center', fontWeight: 700, color: '#1a365d', borderRight: '1px solid #cbd5e1' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '5.5px 4px', textAlign: 'center', fontWeight: 800, color: '#1a365d', borderRight: '1px solid #cbd5e1' }}>
                      {item.deptCode}
                    </td>
                    <td style={{ padding: '5.5px 8px', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #cbd5e1', lineHeight: 1.3 }}>
                      {item.title}
                    </td>
                    <td style={{ padding: '5.5px 8px', color: '#334155', borderRight: '1px solid #cbd5e1', lineHeight: 1.3 }}>
                      <div><strong>Inv:</strong> {item.inventors}</div>
                      <div style={{ color: '#64748b', fontSize: '8px' }}>Pat: {item.patentNumber}</div>
                    </td>
                    <td style={{ padding: '5.5px 4px', textAlign: 'center', lineHeight: 1.3 }}>
                      <div style={{ fontWeight: 800, color: '#1a365d' }}>{item.status || 'Published'}</div>
                      <div style={{ fontSize: '8px', color: '#64748b', marginTop: '1px' }}>{item.awardedDate}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 6B. Industry MoUs & Partnerships */}
          <div>
            {renderSectionHeader('6B. CONSOLIDATED MOUS & INDUSTRY COLLABORATIONS', 10)}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                  <th style={{ width: '5%', padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>#</th>
                  <th style={{ width: '9%', padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Branch</th>
                  <th style={{ width: '35%', padding: '6.5px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Partner Entity / Industry</th>
                  <th style={{ width: '17%', padding: '6.5px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Validity Period</th>
                  <th style={{ width: '34%', padding: '6.5px 8px', textAlign: 'left', fontWeight: 800 }}>Institutional Scope &amp; Focus</th>
                </tr>
              </thead>
              <tbody>
                {departmentList.flatMap(dept => 
                  (deptDataMap[dept.code]?.mous || []).map(item => ({ ...item, deptCode: dept.code }))
                ).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '5.5px 4px', textAlign: 'center', fontWeight: 700, color: '#1a365d', borderRight: '1px solid #cbd5e1' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '5.5px 4px', textAlign: 'center', fontWeight: 800, color: '#1a365d', borderRight: '1px solid #cbd5e1' }}>
                      {item.deptCode}
                    </td>
                    <td style={{ padding: '5.5px 8px', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #cbd5e1', lineHeight: 1.3 }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '5.5px 8px', color: '#334155', borderRight: '1px solid #cbd5e1', lineHeight: 1.3 }}>
                      {item.datePeriod}
                    </td>
                    <td style={{ padding: '5.5px 8px', color: '#475569', lineHeight: 1.3 }}>
                      {item.purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {renderRunningFooter(4)}
      </div>

      {/* ========================================================================= */}
      {/* PAGE 5: SECTION 5 — INSTITUTIONAL HONORS, AWARDS & ACHIEVEMENTS           */}
      {/* ========================================================================= */}
      <div style={pageContainerStyle()}>
        <div style={{ flex: 1 }}>
          {renderRunningHeader()}
          {renderSectionHeader('5. KEY INSTITUTIONAL HONORS, AWARDS & ACHIEVEMENTS', 20)}
          
          {/* Faculty Achievements */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#1a365d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Faculty Achievements &amp; National Recognitions
              </div>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#475569' }}>Total: 10 Entries</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                  <th style={{ width: '5%', padding: '6px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>#</th>
                  <th style={{ width: '9%', padding: '6px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Branch</th>
                  <th style={{ width: '28%', padding: '6px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Faculty Member</th>
                  <th style={{ width: '34%', padding: '6px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Award / Recognition</th>
                  <th style={{ width: '24%', padding: '6px 8px', textAlign: 'left', fontWeight: 800 }}>Conferring Body &amp; Date</th>
                </tr>
              </thead>
              <tbody>
                {departmentList.flatMap(dept => 
                  (deptDataMap[dept.code]?.facultyAchievements || []).map(item => ({ ...item, deptCode: dept.code }))
                ).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700, color: '#1a365d', borderRight: '1px solid #cbd5e1' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 800, color: '#1a365d', borderRight: '1px solid #cbd5e1' }}>
                      {item.deptCode}
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: 700, color: '#1a365d', borderRight: '1px solid #cbd5e1', lineHeight: 1.3 }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0f172a', borderRight: '1px solid #cbd5e1', lineHeight: 1.3 }}>
                      {item.award}
                    </td>
                    <td style={{ padding: '5px 8px', color: '#475569', lineHeight: 1.3 }}>
                      {item.organization}{item.date ? ` (${item.date})` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Student Achievements */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#1a365d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Student Achievements &amp; Competitive Recognitions
              </div>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#475569' }}>Total: 10 Entries</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px', border: '1px solid #cbd5e1' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                  <th style={{ width: '5%', padding: '6px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>#</th>
                  <th style={{ width: '9%', padding: '6px 4px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Branch</th>
                  <th style={{ width: '30%', padding: '6px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Student Name &amp; ID</th>
                  <th style={{ width: '32%', padding: '6px 8px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid #3b82f6' }}>Prize / Accomplishment</th>
                  <th style={{ width: '24%', padding: '6px 8px', textAlign: 'left', fontWeight: 800 }}>Event &amp; Host Institution</th>
                </tr>
              </thead>
              <tbody>
                {departmentList.flatMap(dept => 
                  (deptDataMap[dept.code]?.studentAchievements || []).map(item => ({ ...item, deptCode: dept.code }))
                ).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700, color: '#1a365d', borderRight: '1px solid #cbd5e1' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 800, color: '#1a365d', borderRight: '1px solid #cbd5e1' }}>
                      {item.deptCode}
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #cbd5e1', lineHeight: 1.3 }}>
                      {item.nameRoll}
                    </td>
                    <td style={{ padding: '5px 8px', fontWeight: 600, color: '#0f172a', borderRight: '1px solid #cbd5e1', lineHeight: 1.3 }}>
                      {item.award}
                    </td>
                    <td style={{ padding: '5px 8px', color: '#475569', lineHeight: 1.3 }}>
                      {item.event} {item.organization ? `(${item.organization})` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {renderRunningFooter(5)}
      </div>

      {/* ========================================================================= */}
      {/* PAGE 6: SECTION 10 — SYLLABUS COVERAGE & INSTITUTIONAL SIGN-OFF BLOCK     */}
      {/* ========================================================================= */}
      <div style={pageContainerStyle()}>
        <div>
          {renderRunningHeader()}
          {renderSectionHeader('10. CONSOLIDATED SYLLABUS COVERAGE & ACADEMIC AUDIT')}
          
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9.5px', border: '1px solid #cbd5e1', marginBottom: '16px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                <th style={{ width: '10%', padding: '7px 4px', borderRight: '1px solid #3b82f6', textAlign: 'center', fontWeight: 'bold' }}>Branch</th>
                <th style={{ width: '30%', padding: '7px 8px', borderRight: '1px solid #3b82f6', textAlign: 'left', fontWeight: 'bold' }}>Course / Subject Title</th>
                <th style={{ width: '20%', padding: '7px 8px', borderRight: '1px solid #3b82f6', textAlign: 'left', fontWeight: 'bold' }}>Faculty In-Charge</th>
                <th style={{ width: '10%', padding: '7px 4px', borderRight: '1px solid #3b82f6', textAlign: 'center', fontWeight: 'bold' }}>% Done</th>
                <th style={{ width: '10%', padding: '7px 4px', borderRight: '1px solid #3b82f6', textAlign: 'center', fontWeight: 'bold' }}>% Pend</th>
                <th style={{ width: '20%', padding: '7px 8px', textAlign: 'left', fontWeight: 'bold' }}>DAC Academic Remarks</th>
              </tr>
            </thead>
            <tbody>
              {departmentList.flatMap(dept => 
                (deptDataMap[dept.code]?.syllabus || []).slice(0, 1).map(item => ({ ...item, deptCode: dept.code }))
              ).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '7px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800, color: '#1a365d' }}>
                    {item.deptCode}
                  </td>
                  <td style={{ padding: '7px 8px', borderRight: '1px solid #cbd5e1', fontWeight: 600, color: '#0f172a' }}>{item.subject}</td>
                  <td style={{ padding: '7px 8px', borderRight: '1px solid #cbd5e1', color: '#334155' }}>{item.faculty}</td>
                  <td style={{ padding: '7px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#047857' }}>{item.completed}</td>
                  <td style={{ padding: '7px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#475569' }}>{item.pending}</td>
                  <td style={{ padding: '7px 8px', color: '#475569', fontStyle: 'italic', fontSize: '9px', lineHeight: 1.35 }}>{item.remarks}</td>
                </tr>
              ))}
              {/* Summary Compliance Row */}
              <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1.5px solid #94a3b8' }}>
                <td style={{ padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, color: '#1a365d' }}>ALL</td>
                <td colSpan={2} style={{ padding: '6.5px 8px', fontWeight: 800, color: '#1a365d' }}>
                  Institutional Curriculum Delivery Compliance Benchmark
                </td>
                <td style={{ padding: '6.5px 4px', textAlign: 'center', fontWeight: 900, color: '#047857' }}>100%</td>
                <td style={{ padding: '6.5px 4px', textAlign: 'center', fontWeight: 800, color: '#64748b' }}>Nil</td>
                <td style={{ padding: '6.5px 8px', fontWeight: 700, color: '#047857', fontSize: '9px' }}>Curriculum targets met across all 5 branches</td>
              </tr>
            </tbody>
          </table>


        </div>

        {/* Official Institutional Governance & Sign-Off Block */}
        <div>
          <div style={{ paddingTop: '20px', borderTop: '1.5px solid #cbd5e1' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', tableLayout: 'fixed' }}>
              <tbody>
                <tr style={{ border: 'none' }}>
                  <td style={{ width: '33.33%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                    <div style={{ height: '45px' }}></div>
                    <div style={{ width: '75%', margin: '0 auto 6px auto', borderTop: '2px solid #0f172a' }}></div>
                    <div style={{ fontWeight: 'bold', fontSize: '10.5px', color: '#0f172a' }}>Dr. Sreenivas Prasad</div>
                    <div style={{ fontSize: '9.5px', color: '#475569', fontWeight: 600 }}>IQAC Coordinator</div>
                    <div style={{ fontSize: '8.5px', color: '#64748b' }}>Sanskrithi School of Engineering</div>
                  </td>

                  <td style={{ width: '33.33%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                    <div style={{ height: '45px' }}></div>
                    <div style={{ width: '75%', margin: '0 auto 6px auto', borderTop: '2px solid #0f172a' }}></div>
                    <div style={{ fontWeight: 'bold', fontSize: '10.5px', color: '#0f172a' }}>Dean of Academics</div>
                    <div style={{ fontSize: '9.5px', color: '#475569', fontWeight: 600 }}>Academic Governance</div>
                    <div style={{ fontSize: '8.5px', color: '#64748b' }}>Sanskrithi School of Engineering</div>
                  </td>

                  <td style={{ width: '33.33%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                    <div style={{ height: '45px' }}></div>
                    <div style={{ width: '75%', margin: '0 auto 6px auto', borderTop: '2px solid #0f172a' }}></div>
                    <div style={{ fontWeight: 'bold', fontSize: '10.5px', color: '#0f172a' }}>Principal</div>
                    <div style={{ fontSize: '9.5px', color: '#475569', fontWeight: 600 }}>Institutional Endorsement</div>
                    <div style={{ fontSize: '8.5px', color: '#64748b' }}>Sanskrithi School of Engineering</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {renderRunningFooter(6)}
        </div>
      </div>

    </div>
  );
};

export default ConsolidatedInstitutionalPDFView;
