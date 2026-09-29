import React, { useState, useEffect } from 'react';
import { ReportSectionsData, normalizeSections } from './HODManualReportBuilder';

interface HODProfessionalPDFViewProps {
  department: string;
  hodName: string;
  period: string;
  submissionDate: string;
  sections: ReportSectionsData;
}

export const HODProfessionalPDFView: React.FC<HODProfessionalPDFViewProps> = ({
  department,
  hodName,
  period,
  submissionDate,
  sections: rawSections
}) => {
  const sections = normalizeSections(rawSections);
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

  const totalActivities = Object.values(sections).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);


  return (
    <div 
      id="hod-pdf-document" 
      className="bg-white text-slate-900 font-sans text-xs print:p-0 print:m-0 border border-slate-300 shadow-xl print:shadow-none print:border-none mx-auto"
      style={{ 
        width: '750px',
        maxWidth: '750px',
        minWidth: '750px',
        boxSizing: 'border-box',
        padding: '24px 28px 12px 28px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        lineHeight: 1.45,
        color: '#0f172a',
        backgroundColor: '#ffffff'
      }}
    >
      {/* 1. Official Header Matching Institutional Theme */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', tableLayout: 'fixed', marginBottom: '8px' }}>
        <tbody>
          <tr style={{ border: 'none' }}>
            <td style={{ width: '50%', border: 'none', verticalAlign: 'middle', textAlign: 'left', padding: '0 0 6px 0' }}>
              <img 
                src={logoBase64} 
                alt="Sanskrithi School of Engineering Logo" 
                style={{ height: '36px', width: 'auto', display: 'block', objectFit: 'contain' }}
              />
            </td>
            <td style={{ width: '50%', border: 'none', verticalAlign: 'middle', textAlign: 'right', padding: '0 0 6px 0' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1e293b' }}>
                DEPARTMENT OF {department.toUpperCase()}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ height: '2px', backgroundColor: '#1e293b', width: '100%', marginBottom: '14px' }}></div>

      {/* 2. Document Title Block Matching Theme */}
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        <h1 
          style={{ 
            fontSize: '18px', 
            fontWeight: 900, 
            color: '#1a365d', 
            textTransform: 'uppercase', 
            letterSpacing: '0.03em',
            margin: '0 0 4px 0'
          }}
        >
          MONTHLY DEPARTMENTAL PROGRESS REPORT
        </h1>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
          Department of {department}
        </div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
          Reporting Period: {period} &bull; Date of Submission: {submissionDate}
        </div>
      </div>

      {/* 3. Section: Program / Reporting Overview Table */}
      <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
        <div 
          style={{ 
            fontWeight: 800, 
            color: '#1a365d', 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em', 
            borderBottom: '1.5px solid #1a365d', 
            paddingBottom: '4px', 
            marginBottom: '8px' 
          }}
        >
          REPORTING OVERVIEW &amp; DEPARTMENT PROFILE
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '11px', border: '1px solid #cbd5e1' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ width: '32%', padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                Department Name
              </td>
              <td style={{ width: '68%', padding: '6px 10px', fontWeight: 600, color: '#0f172a' }}>
                Department of {department}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                Head of Department (HOD)
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 600, color: '#334155' }}>
                {hodName}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                Reporting Cycle Period
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 600, color: '#334155' }}>
                {period}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <td style={{ padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                Date of Submission
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 600, color: '#334155' }}>
                {submissionDate}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#1a365d' }}>
                Activities Summary
              </td>
              <td style={{ padding: '6px 10px', fontWeight: 600, color: '#334155' }}>
                {totalActivities} recorded activities &bull; {sections.journals.length + sections.conferences.length} Publications &bull; {sections.syllabus.length} Syllabus Course(s)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Active Sections — Minimalist Academic Theme */}
      
      {/* 1a. Journal Publications */}
      {sections.journals.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            1A. RESEARCH &mdash; JOURNAL PUBLICATIONS ({sections.journals.length})
          </div>
          <div>
            {sections.journals.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px' }}>
                    {item.title || 'Untitled Article'}
                  </div>
                  <div style={{ color: '#334155', fontSize: '11px', marginBottom: '2px' }}>
                    <strong>Author(s):</strong> {item.authors || '-'} &bull; <strong>Journal:</strong> {item.journalName || '-'}
                  </div>
                  <div style={{ color: '#475569', fontSize: '10.5px', marginBottom: '2px' }}>
                    {item.issnIsbn && <span style={{ marginRight: '12px' }}><strong>ISSN/ISBN:</strong> {item.issnIsbn}</span>}
                    {item.volIssueYear && <span style={{ marginRight: '12px' }}><strong>Issue:</strong> {item.volIssueYear}</span>}
                    {item.pageNos && <span style={{ marginRight: '12px' }}><strong>Pages:</strong> {item.pageNos}</span>}
                    {item.indexedIn && <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Indexed in: {item.indexedIn}</span>}
                  </div>
                  {item.link && (
                    <div style={{ fontSize: '10.5px', color: '#1d4ed8', wordBreak: 'break-all' }}>
                      <strong>Paper Link / DOI:</strong> <span style={{ textDecoration: 'underline' }}>{item.link}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1b. Conference Presentations */}
      {sections.conferences.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            1B. RESEARCH &mdash; CONFERENCE PRESENTATIONS ({sections.conferences.length})
          </div>
          <div>
            {sections.conferences.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px' }}>
                    {item.title || 'Untitled Presentation'}
                  </div>
                  <div style={{ color: '#334155', fontSize: '11px', marginBottom: '2px' }}>
                    <strong>Author(s):</strong> {item.authors || '-'} &bull; <strong>Conference:</strong> {item.conferenceName || '-'}
                  </div>
                  <div style={{ color: '#475569', fontSize: '10.5px', marginBottom: '2px' }}>
                    {item.date && <span style={{ marginRight: '12px' }}><strong>Date:</strong> {item.date}</span>}
                    {item.locationMode && <span style={{ marginRight: '12px' }}><strong>Location/Mode:</strong> {item.locationMode}</span>}
                    {item.indexedIn && <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Indexing: {item.indexedIn}</span>}
                  </div>
                  {item.link && (
                    <div style={{ fontSize: '10.5px', color: '#1d4ed8', wordBreak: 'break-all' }}>
                      <strong>Proceedings Link:</strong> <span style={{ textDecoration: 'underline' }}>{item.link}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2a. Patents */}
      {sections.patents.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            2A. PATENTS ({sections.patents.length})
          </div>
          <div>
            {sections.patents.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ color: '#334155', fontSize: '11px' }}><strong>Inventors:</strong> {item.inventors} &bull; <strong>Applicants:</strong> {item.applicants}</div>
                  <div style={{ color: '#64748b', fontSize: '10.5px' }}>Patent No: {item.patentNumber} | Status: {item.status} | Date: {item.awardedDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2b. Start-up Initiatives */}
      {sections.entrepreneurship.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            2B. START-UP INITIATIVES ({sections.entrepreneurship.length})
          </div>
          <div>
            {sections.entrepreneurship.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ color: '#64748b', fontSize: '10.5px' }}>Date: {item.date} | Participants: {item.participantsCount}</div>
                  <div style={{ color: '#334155', fontSize: '11px' }}><strong>Key Outcomes:</strong> {item.keyOutcomes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3a. FDPs Attended */}
      {sections.fdpAttended.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            3A. FACULTY DEVELOPMENT PROGRAMS (FDPS) — ATTENDED ({sections.fdpAttended.length})
          </div>
          <div>
            {sections.fdpAttended.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ color: '#334155', fontSize: '11px', marginBottom: '2px' }}>
                    <strong>Type:</strong> {item.type} &bull; <strong>Dates:</strong> {item.dates} &bull; <strong>Mode:</strong> {item.mode}
                  </div>
                  <div style={{ color: '#475569', fontSize: '10.5px', marginBottom: '2px' }}>
                    <strong>Organizing Body:</strong> {item.organizingBody} &bull; <strong style={{ color: '#1a365d' }}>Faculty Attended:</strong> {item.facultyAttended}
                  </div>
                  {item.link && (
                    <div style={{ fontSize: '10.5px', color: '#1d4ed8', wordBreak: 'break-all' }}>
                      <strong>Certificate/Proof Link:</strong> <span style={{ textDecoration: 'underline' }}>{item.link}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3b. FDPs Organized */}
      {sections.fdpOrganized.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            3B. FACULTY DEVELOPMENT PROGRAMS (FDPS) — ORGANIZED ({sections.fdpOrganized.length})
          </div>
          <div>
            {sections.fdpOrganized.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ color: '#334155', fontSize: '11px', marginBottom: '2px' }}>
                    <strong>Type:</strong> {item.type} &bull; <strong>Dates:</strong> {item.dates} &bull; <strong>Dept. Organized:</strong> {item.deptOrganized} ({item.mode})
                  </div>
                  <div style={{ color: '#475569', fontSize: '10.5px', marginBottom: '2px' }}>
                    <strong>Resource Person:</strong> {item.resourcePersonDetails}
                  </div>
                  <div style={{ color: '#1a365d', fontSize: '10.5px', marginBottom: '2px' }}>
                    <strong>Coordinator/s:</strong> {item.facultyCoordinators}
                  </div>
                  {item.link && (
                    <div style={{ fontSize: '10.5px', color: '#1d4ed8', wordBreak: 'break-all' }}>
                      <strong>Certificate/Proof Link:</strong> <span style={{ textDecoration: 'underline' }}>{item.link}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SDPs */}
      {sections.sdp.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            4. STUDENT DEVELOPMENT PROGRAMS (SDPS) ({sections.sdp.length})
          </div>
          <div>
            {sections.sdp.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ color: '#334155', fontSize: '11px' }}>Date: {item.date} &bull; Resource Person: {item.resourcePerson} &bull; Participants: {item.participantsCount}</div>
                  <div style={{ color: '#64748b', fontSize: '10.5px' }}>Outcomes: {item.keyOutcomes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Honors & Achievements */}
      {(sections.facultyAchievements.length > 0 || sections.studentAchievements.length > 0 || sections.certifications.length > 0) && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            5. HONORS, AWARDS &amp; CERTIFICATIONS
          </div>
          <div>
            {sections.facultyAchievements.map((item, idx) => (
              <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Faculty Honor:</span> {item.name} &mdash; {item.award} ({item.organization}, {item.date})
              </div>
            ))}
            {sections.studentAchievements.map((item, idx) => (
              <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Student Honor:</span> {item.nameRoll} &mdash; {item.award} at {item.event} ({item.organization}, {item.durationDate})
              </div>
            ))}
            {sections.certifications.map((item, idx) => (
              <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Certification:</span> {item.title} ({item.type}) on {item.platform} &mdash; Certified: {item.certified}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6a. Department Meetings */}
      {sections.deptMeetings.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            6A. MEETINGS ({sections.deptMeetings.length})
          </div>
          <div>
            {sections.deptMeetings.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px' }}>Department Meeting #{idx + 1}</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569' }}>Date: {item.date || '-'}</span>
                  </div>
                  <div style={{ color: '#334155', fontSize: '11px', lineHeight: 1.4 }}>
                    <strong>Decisions &amp; Key Discussions:</strong> {item.decisions || 'Routine departmental operations and academic agenda reviewed.'}
                  </div>
                  {item.policyChanges && (
                    <div style={{ color: '#475569', fontSize: '10.5px', marginTop: '2px' }}>
                      <strong>Policy Updates:</strong> {item.policyChanges}
                    </div>
                  )}
                  {item.link && (
                    <div style={{ fontSize: '10.5px', color: '#1d4ed8', wordBreak: 'break-all', marginTop: '2px' }}>
                      <strong>Minutes Link:</strong> <span style={{ textDecoration: 'underline' }}>{item.link}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6b. MoUs */}
      {sections.mous.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            6B. COLLABORATIONS &amp; MOUS ({sections.mous.length})
          </div>
          <div>
            {sections.mous.map((item, idx) => (
              <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{idx + 1}. {item.name}</span> &bull; Period: {item.datePeriod} &bull; Scope: {item.purpose}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7, 8, 9. Other Initiatives */}
      {(sections.additionalInitiatives.length > 0 || sections.techAssociation.length > 0) && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            7. TECHNICAL ASSOCIATIONS &amp; INNOVATION INITIATIVES
          </div>
          <div>
            {sections.additionalInitiatives.map((item, idx) => (
              <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Additional Initiative:</span> {item.initiative} ({item.date}) &mdash; {item.description}
              </div>
            ))}
            {sections.techAssociation.map((item, idx) => (
              <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Technical Association:</span> {item.event} ({item.date}) &bull; Type: {item.type || 'Activity'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. Syllabus Coverage Report Table Matching Theme */}
      {sections.syllabus.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            8. SYLLABUS COVERAGE &amp; CURRICULUM PROGRESS ({sections.syllabus.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '10.5px', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ width: '38px', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>S.No</th>
                <th style={{ width: '24%', padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Subject / Course</th>
                <th style={{ width: '15%', padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Year/Sem</th>
                <th style={{ width: '18%', padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Faculty</th>
                <th style={{ width: '11%', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>% Done</th>
                <th style={{ width: '11%', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>% Pend</th>
                <th style={{ width: '21%', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {sections.syllabus.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>{idx + 1}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', fontWeight: 'bold', color: '#0f172a' }}>{item.subject || '-'}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', color: '#334155' }}>{item.yearSem || '-'}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', color: '#334155' }}>{item.faculty || '-'}</td>
                  <td style={{ padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#047857' }}>{item.completed || '-'}</td>
                  <td style={{ padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#b45309' }}>{item.pending || '-'}</td>
                  <td style={{ padding: '6px 8px', color: '#475569', fontStyle: 'italic', fontSize: '10px' }}>{item.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Engagement Activity Table Matching Theme */}
      {sections.studentEngagement && sections.studentEngagement.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            9. CLUB &amp; STUDENT ENGAGEMENT ACTIVITIES ({sections.studentEngagement.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '10.5px', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ width: '36px', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>S.No</th>
                <th style={{ width: '22%', padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Title of Activity</th>
                <th style={{ width: '14%', padding: '6px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Type of Activity</th>
                <th style={{ width: '10%', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>Days</th>
                <th style={{ width: '16%', padding: '6px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Dates</th>
                <th style={{ width: '8%', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>Part.</th>
                <th style={{ width: '14%', padding: '6px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Co-Ordinator</th>
                <th style={{ width: '16%', padding: '6px 6px', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {sections.studentEngagement.map((item, idx) => {
                const displayType = (item.type === 'Other' && item.otherType) 
                  ? `Other (${item.otherType})` 
                  : (item.otherType || item.type || '-');
                const displayDates = item.dates || (item.startDate && item.endDate ? `${item.startDate} to ${item.endDate}` : item.startDate || '-');
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>{idx + 1}</td>
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', fontWeight: 'bold', color: '#0f172a' }}>{item.title || '-'}</td>
                    <td style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1', color: '#334155' }}>{displayType}</td>
                    <td style={{ padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', color: '#334155' }}>{item.noOfDays || '1 day'}</td>
                    <td style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1', color: '#334155' }}>{displayDates}</td>
                    <td style={{ padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#047857' }}>{item.participantsCount || '-'}</td>
                    <td style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1', color: '#334155' }}>{item.coordinator || '-'}</td>
                    <td style={{ padding: '6px 6px', color: '#475569', fontStyle: 'italic', fontSize: '10px' }}>{item.remarks || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}


      {/* NSS & Other Extension Activities — shown last */}
      {sections.nss.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1a365d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1a365d', paddingBottom: '4px', marginBottom: '8px' }}>
            10. NSS &amp; OTHER EXTENSION ACTIVITIES ({sections.nss.length})
          </div>
          <div>
            {sections.nss.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px' }}>{item.event}</div>
                  <div style={{ color: '#64748b', fontSize: '10.5px' }}>Date: {item.date} | Venue: {item.venue} | Participants: {item.participantsCount}</div>
                  <div style={{ color: '#334155', fontSize: '11px' }}><strong>Outcomes:</strong> {item.outcomes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      <div style={{ paddingTop: '16px', borderTop: '1px solid #cbd5e1', marginTop: '16px' }} className="break-inside-avoid">
        <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', tableLayout: 'fixed' }}>
          <tbody>
            <tr style={{ border: 'none' }}>
              <td style={{ width: '33.33%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                <div style={{ width: '75%', margin: '0 auto 8px auto', borderTop: '2px solid #0f172a' }}></div>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0f172a' }}>{hodName}</div>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>Head of Department</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>Department of {department}</div>
              </td>

              <td style={{ width: '33.33%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                <div style={{ width: '75%', margin: '0 auto 8px auto', borderTop: '2px solid #0f172a' }}></div>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0f172a' }}>Dr. Sreenivas Prasad</div>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>IQAC Coordinator</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>Sanskrithi School of Engineering</div>
              </td>

              <td style={{ width: '33.33%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                <div style={{ width: '75%', margin: '0 auto 8px auto', borderTop: '2px solid #0f172a' }}></div>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0f172a' }}>Principal</div>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>Institutional Endorsement</div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>Sanskrithi School of Engineering</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default HODProfessionalPDFView;
