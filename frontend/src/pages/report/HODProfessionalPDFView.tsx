import React, { useState, useEffect } from 'react';
import { ReportSectionsData, normalizeSections } from './HODManualReportBuilder';
import { formatOutcomesIntoPoints } from './ConsolidatedInstitutionalPDFView';

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
      className="bg-white text-slate-900 font-sans text-xs print:p-0 print:m-0 border-none shadow-xl print:shadow-none mx-auto"
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
      <div style={{ height: '2px', backgroundColor: '#1e293b', width: '100%', marginBottom: '17px' }}></div>

      {/* 2. Document Title Block Matching Theme */}
      <div style={{ textAlign: 'center', marginBottom: '17px' }}>
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 900,
            color: '#1a365d',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            margin: '0 0 7px 0'
          }}
        >
          MONTHLY DEPARTMENTAL PROGRESS REPORT
        </h1>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 5px 0' }}>
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
              <td style={{ padding: '6px 10px', fontWeight: 600, color: '#334155', textAlign: 'justify', textJustify: 'inter-word' }}>
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
          <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1e3a8a', paddingBottom: '4px', marginBottom: '8px' }}>
            1. RESEARCH &mdash; a) JOURNAL PUBLICATIONS ({sections.journals.length})
          </div>
          <div>
            {sections.journals.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top', textAlign: 'justify', textJustify: 'inter-word' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px', textAlign: 'justify' }}>
                    {item.title || 'Untitled Article'}
                  </div>
                  <div style={{ color: '#334155', fontSize: '11px', marginBottom: '2px', textAlign: 'justify' }}>
                    <strong>Author(s):</strong> {item.authors || '-'} &bull; <strong>Journal:</strong> {item.journalName || '-'}
                  </div>
                  <div style={{ color: '#475569', fontSize: '10.5px', marginBottom: '2px', textAlign: 'justify' }}>
                    {item.issnIsbn && <span style={{ marginRight: '12px' }}><strong>ISSN/ISBN:</strong> {item.issnIsbn}</span>}
                    {item.volIssueYear && <span style={{ marginRight: '12px' }}><strong>Issue:</strong> {item.volIssueYear}</span>}
                    {item.pageNos && <span style={{ marginRight: '12px' }}><strong>Pages:</strong> {item.pageNos}</span>}
                    {item.indexedIn && <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Indexed in: {item.indexedIn}</span>}
                  </div>
                  {item.link && (
                    <div style={{ fontSize: '10.5px', color: '#1d4ed8', wordBreak: 'break-all', textAlign: 'justify' }}>
                      <strong>Paper Link / DOI:</strong>{' '}
                      <a
                        href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1d4ed8', textDecoration: 'none' }}
                      >
                        {item.link}
                      </a>
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
          <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1e3a8a', paddingBottom: '4px', marginBottom: '8px' }}>
            1. RESEARCH &mdash; b) CONFERENCE PRESENTATIONS ({sections.conferences.length})
          </div>
          <div>
            {sections.conferences.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top', textAlign: 'justify', textJustify: 'inter-word' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px', textAlign: 'justify' }}>
                    {item.title || 'Untitled Presentation'}
                  </div>
                  <div style={{ color: '#334155', fontSize: '11px', marginBottom: '2px', textAlign: 'justify' }}>
                    <strong>Author(s):</strong> {item.authors || '-'} &bull; <strong>Conference:</strong> {item.conferenceName || '-'}
                  </div>
                  <div style={{ color: '#475569', fontSize: '10.5px', marginBottom: '2px', textAlign: 'justify' }}>
                    {item.date && <span style={{ marginRight: '12px' }}><strong>Date:</strong> {item.date}</span>}
                    {item.locationMode && <span style={{ marginRight: '12px' }}><strong>Location/Mode:</strong> {item.locationMode}</span>}
                    {item.volIssueYear && <span style={{ marginRight: '12px' }}><strong>Issue:</strong> {item.volIssueYear}</span>}
                    {item.pageNos && <span style={{ marginRight: '12px' }}><strong>Pages:</strong> {item.pageNos}</span>}
                    {item.issnIsbn && <span style={{ marginRight: '12px' }}><strong>ISBN:</strong> {item.issnIsbn}</span>}
                    {item.indexedIn && <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Indexing: {item.indexedIn}</span>}
                  </div>
                  {item.link && (
                    <div style={{ fontSize: '10.5px', color: '#1d4ed8', wordBreak: 'break-all', textAlign: 'justify' }}>
                      <strong>Proceedings Link:</strong>{' '}
                      <a
                        href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1d4ed8', textDecoration: 'none' }}
                      >
                        {item.link}
                      </a>
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
          <div style={{ fontWeight: 800, color: '#6b21a8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #6b21a8', paddingBottom: '4px', marginBottom: '8px' }}>
            2A. PATENTS ({sections.patents.length})
          </div>
          <div>
            {sections.patents.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top', textAlign: 'justify', textJustify: 'inter-word' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px', textAlign: 'justify' }}>{item.title}</div>
                  <div style={{ color: '#334155', fontSize: '11px', textAlign: 'justify' }}><strong>Inventors:</strong> {item.inventors} &bull; <strong>Applicants:</strong> {item.applicants}</div>
                  <div style={{ color: '#64748b', fontSize: '10.5px', textAlign: 'justify' }}>Patent No: {item.patentNumber} | Status: {item.status} | Date: {item.awardedDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2b. Activities and Initiatives */}
      {sections.entrepreneurship.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#0f766e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #0f766e', paddingBottom: '4px', marginBottom: '8px' }}>
            2B. ACTIVITIES AND INITIATIVES ({sections.entrepreneurship.length})
          </div>
          <div>
            {sections.entrepreneurship.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top', textAlign: 'justify', textJustify: 'inter-word' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px', textAlign: 'justify' }}>{item.title}</div>
                  <div style={{ color: '#334155', fontSize: '11px', textAlign: 'justify' }}>
                    <strong>Date:</strong> {item.date} &bull; <strong>Type:</strong> {item.type} &bull; <strong>Mode:</strong> {item.mode} ({item.participantsCount} participants)
                  </div>
                  <div style={{ color: '#475569', fontSize: '10.5px', marginTop: '1px', textAlign: 'justify' }}>
                    <strong>Organized By:</strong> {item.organizedBy} &bull; <strong>Target:</strong> {item.participants} &bull; <strong style={{ color: '#1a365d' }}>Coordinator:</strong> {item.mentorCoordinator}
                  </div>
                  <div style={{ color: '#334155', fontSize: '11px', marginTop: '1px', textAlign: 'justify' }}>
                    <strong>Status:</strong> <span style={{ color: (item.status || '').toLowerCase() === 'completed' ? '#047857' : '#1a365d', fontWeight: 'bold' }}>{item.status || 'Completed'}</span>
                  </div>
                  {item.link && (
                    <div style={{ fontSize: '10.5px', color: '#1d4ed8', wordBreak: 'break-all', marginTop: '2px', textAlign: 'justify' }}>
                      <strong>Proof / Report Link:</strong>{' '}
                      <a
                        href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1d4ed8', textDecoration: 'none' }}
                      >
                        {item.link}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3a. FDPs Attended */}
      {sections.fdpAttended.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #0369a1', paddingBottom: '4px', marginBottom: '8px' }}>
            3A. FACULTY DEVELOPMENT PROGRAMS (FDPS) — ATTENDED ({sections.fdpAttended.length})
          </div>
          <div>
            {sections.fdpAttended.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top', textAlign: 'justify', textJustify: 'inter-word' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px', textAlign: 'justify' }}>{item.title}</div>
                  <div style={{ color: '#334155', fontSize: '11px', marginBottom: '2px', textAlign: 'justify' }}>
                    <strong>Type:</strong> {item.type} &bull; <strong>Dates:</strong> {item.dates} &bull; <strong>Mode:</strong> {item.mode}
                  </div>
                  <div style={{ color: '#475569', fontSize: '10.5px', marginBottom: '2px', textAlign: 'justify' }}>
                    <strong>Organizing Body:</strong> {item.organizingBody} &bull; <strong style={{ color: '#1a365d' }}>Faculty Attended:</strong> {item.facultyAttended}
                  </div>
                  {item.link && (
                    <div style={{ fontSize: '10.5px', color: '#1d4ed8', wordBreak: 'break-all', textAlign: 'justify' }}>
                      <strong>Certificate/Proof Link:</strong>{' '}
                      <a
                        href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1d4ed8', textDecoration: 'none' }}
                      >
                        {item.link}
                      </a>
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
          <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #0369a1', paddingBottom: '4px', marginBottom: '8px' }}>
            3B. FACULTY DEVELOPMENT PROGRAMS (FDPS) — ORGANIZED ({sections.fdpOrganized.length})
          </div>
          <div>
            {sections.fdpOrganized.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top', textAlign: 'justify', textJustify: 'inter-word' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px', textAlign: 'justify' }}>{item.title}</div>
                  <div style={{ color: '#334155', fontSize: '11px', marginBottom: '2px', textAlign: 'justify' }}>
                    <strong>Type:</strong> {item.type} &bull; <strong>Dates:</strong> {item.dates} &bull; <strong>Dept. Organized:</strong> {item.deptOrganized} ({item.mode})
                  </div>
                  <div style={{ color: '#475569', fontSize: '10.5px', marginBottom: '2px', textAlign: 'justify' }}>
                    <strong>Resource Person:</strong> {item.resourcePersonDetails}
                  </div>
                  <div style={{ color: '#1a365d', fontSize: '10.5px', marginBottom: '2px', textAlign: 'justify' }}>
                    <strong>Coordinator/s:</strong> {item.facultyCoordinators}
                  </div>
                  {item.link && (
                    <div style={{ fontSize: '10.5px', color: '#1d4ed8', wordBreak: 'break-all', textAlign: 'justify' }}>
                      <strong>Certificate/Proof Link:</strong>{' '}
                      <a
                        href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1d4ed8', textDecoration: 'none' }}
                      >
                        {item.link}
                      </a>
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
          <div style={{ fontWeight: 800, color: '#047857', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #047857', paddingBottom: '4px', marginBottom: '8px' }}>
            4. STUDENT DEVELOPMENT PROGRAMS (SDPS) ({sections.sdp.length})
          </div>
          <div>
            {sections.sdp.map((item, idx) => {
              const points = formatOutcomesIntoPoints(item.keyOutcomes);
              return (
                <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                  <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div style={{ display: 'table-cell', verticalAlign: 'top', textAlign: 'justify', textJustify: 'inter-word' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px', textAlign: 'justify' }}>{item.title}</div>
                    <div style={{ color: '#334155', fontSize: '11px', textAlign: 'justify' }}>
                      <strong>Date:</strong> {item.date} &bull; <strong>Type:</strong> {item.type || 'SDP'} &bull; <strong>Resource Person:</strong> {item.resourcePerson} &bull; <strong>Participants:</strong> {item.participantsCount} ({item.mode || 'Offline'})
                    </div>
                    {item.coordinator && (
                      <div style={{ color: '#1a365d', fontSize: '10.5px', fontWeight: 600, marginTop: '1px' }}>
                        Coordinator: {item.coordinator}
                      </div>
                    )}
                    {points.length > 0 && (
                      <div style={{ color: '#475569', fontSize: '10.5px', marginTop: '2px', textAlign: 'justify' }}>
                        <div style={{ fontWeight: 600, color: '#334155', marginBottom: '1px' }}>Key Outcomes:</div>
                        {points.map((pt, pIdx) => (
                          <div key={pIdx} style={{ display: 'flex', gap: '4px', marginTop: '1px', alignItems: 'flex-start' }}>
                            <span style={{ color: '#047857', fontWeight: 'bold', lineHeight: 1.2 }}>•</span>
                            <span style={{ flex: 1 }}>{pt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {item.link && (
                      <div style={{ fontSize: '10px', color: '#1d4ed8', wordBreak: 'break-all', marginTop: '2px', textAlign: 'justify' }}>
                        <strong>Proof / Report Link:</strong>{' '}
                        <a
                          href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1d4ed8', textDecoration: 'none' }}
                        >
                          {item.link}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Honors & Achievements */}
      {(sections.facultyAchievements.length > 0 || sections.studentAchievements.length > 0 || sections.certifications.length > 0) && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#b45309', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #b45309', paddingBottom: '4px', marginBottom: '8px' }}>
            5. HONORS, AWARDS &amp; CERTIFICATIONS
          </div>
          <div>
            {sections.facultyAchievements.map((item, idx) => (
              <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9', textAlign: 'justify', textJustify: 'inter-word' }}>
                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Faculty Honor:</span> {item.name} &mdash; {item.award} ({item.organization}, {item.date})
                {item.link && (
                  <span style={{ marginLeft: '6px' }}>
                    <a
                      href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '10px' }}
                    >
                      [🔗 Proof Link]
                    </a>
                  </span>
                )}
              </div>
            ))}
            {sections.studentAchievements.map((item, idx) => (
              <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9', textAlign: 'justify', textJustify: 'inter-word' }}>
                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Student Honor:</span> {item.nameRoll} &mdash; {item.award} at {item.event} ({item.organization}, {item.durationDate})
              </div>
            ))}
            {sections.certifications.map((item, idx) => (
              <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9', textAlign: 'justify', textJustify: 'inter-word' }}>
                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Certification:</span> {item.title} ({item.type}) on {item.platform} &mdash; Certified: {item.certified}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meetings (Minutes of the Meeting committee only) */}
      {sections.deptMeetings.length > 0 && department === 'Minutes of the Meeting' && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #1e293b', paddingBottom: '4px', marginBottom: '12px' }}>
            MINUTES OF THE MEETING ({sections.deptMeetings.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {sections.deptMeetings.map((item, idx) => {
              const hasStructuredData = (item.attendees && item.attendees.length > 0) || item.agenda || (item.discussions && item.discussions.length > 0) || item.title;

              if (!hasStructuredData) {
                // Legacy simple format
                return (
                  <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '8px 0' }} className="break-inside-avoid">
                    <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div style={{ display: 'table-cell', verticalAlign: 'top', textAlign: 'justify', textJustify: 'inter-word' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px' }}>Meeting #{idx + 1}</span>
                        <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569' }}>Date: {item.date || '-'}</span>
                      </div>
                      <div style={{ color: '#334155', fontSize: '11px', lineHeight: 1.4, textAlign: 'justify' }}>
                        <strong>Decisions &amp; Key Discussions:</strong> {item.decisions || 'Routine operations and agenda reviewed.'}
                      </div>
                      {item.policyChanges && (
                        <div style={{ color: '#475569', fontSize: '10.5px', marginTop: '2px', textAlign: 'justify' }}>
                          <strong>Policy Updates:</strong> {item.policyChanges}
                        </div>
                      )}
                      {item.link && (
                        <div style={{ fontSize: '10.5px', color: '#1d4ed8', wordBreak: 'break-all', marginTop: '2px', textAlign: 'justify' }}>
                          <strong>Minutes Link:</strong>{' '}
                          <a
                            href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1d4ed8', textDecoration: 'none' }}
                          >
                            {item.link}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Full Structured Institutional MOM Layout
              return (
                <div key={idx} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#ffffff' }} className="break-inside-avoid">
                  
                  {/* Meeting Header Banner */}
                  <div style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #cbd5e1', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                          {item.title || "HoD's Meeting with Principal"}
                        </div>
                        <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569', marginTop: '2px' }}>
                          {item.date && <span>{item.date}</span>}
                          {item.time && <span> | TIME: {item.time}</span>}
                          {item.venue && <span> | Venue: {item.venue}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* 1. Attendees Table */}
                    {item.attendees && item.attendees.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                          Attendees:
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                              <th style={{ border: '1px solid #cbd5e1', padding: '4px 8px', width: '38px', textAlign: 'center', color: '#1e293b', fontWeight: 700 }}>S.No</th>
                              <th style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: 'left', color: '#1e293b', fontWeight: 700 }}>Faculty / Name</th>
                              <th style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: 'left', color: '#1e293b', fontWeight: 700 }}>Designation / Role</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.attendees.map((att, aIdx) => (
                              <tr key={aIdx} style={{ backgroundColor: aIdx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{aIdx + 1}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', color: '#0f172a', fontWeight: 600 }}>{att.name}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', color: '#334155' }}>{att.designation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 2. Agenda Box */}
                    {item.agenda && (
                      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                          Agenda
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#334155', lineHeight: 1.5, textAlign: 'justify' }}>
                          {item.agenda.split('\n').map((line, lIdx) => (
                            <div key={lIdx} style={{ padding: '1px 0' }}>
                              {line.trim().startsWith('•') || /^\d+\./.test(line.trim()) ? line : `• ${line}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Detailed Minutes & Discussions */}
                    {item.discussions && item.discussions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {item.discussions.map((disc, dIdx) => (
                          <div key={dIdx} style={{ fontSize: '10.5px', lineHeight: 1.45, color: '#334155' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '11px', marginBottom: '3px' }}>
                              {disc.heading.trim().startsWith(String(dIdx + 1)) ? disc.heading : `${dIdx + 1}. ${disc.heading}`}
                            </div>

                            {disc.details && (
                              <div style={{ color: '#334155', textAlign: 'justify', textJustify: 'inter-word', marginBottom: '6px' }}>
                                {disc.details.split('\n').map((para, pIdx) => {
                                  const trimmed = para.trim();
                                  if (!trimmed) return null;
                                  return (
                                    <div key={pIdx} style={{ marginBottom: '2px' }}>
                                      {trimmed.startsWith('•') ? trimmed : `• ${trimmed}`}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Embedded Review Schedule Table */}
                            {disc.tableType === 'project_reviews' && disc.reviewSchedule && disc.reviewSchedule.length > 0 && (
                              <div style={{ margin: '6px 0' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                                      <th style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: 'left', color: '#0f172a', fontWeight: 700 }}>Review</th>
                                      <th style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: 'center', color: '#0f172a', fontWeight: 700 }}>Target Date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {disc.reviewSchedule.map((rRow, rIdx) => (
                                      <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', fontWeight: 600, color: '#1e293b' }}>{rRow.review}</td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: 'center', color: '#334155' }}>{rRow.date}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Embedded Publication Targets Table */}
                            {disc.tableType === 'publication_targets' && disc.publicationTargets && disc.publicationTargets.length > 0 && (
                              <div style={{ margin: '6px 0' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                                      <th style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: 'left', color: '#0f172a', fontWeight: 700 }}>Department</th>
                                      <th style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: 'center', color: '#0f172a', fontWeight: 700 }}>Research Papers</th>
                                      <th style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: 'center', color: '#0f172a', fontWeight: 700 }}>Patents</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {disc.publicationTargets.map((tRow, tIdx) => (
                                      <tr key={tIdx} style={{ backgroundColor: tIdx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', fontWeight: 600, color: '#1e293b' }}>{tRow.department}</td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: 'center', color: '#0f172a', fontWeight: 700 }}>{tRow.researchPapers}</td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: 'center', color: '#0f172a', fontWeight: 700 }}>{tRow.patents}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {disc.postTableDetails && (
                              <div style={{ color: '#475569', fontStyle: 'italic', marginTop: '3px', textAlign: 'justify' }}>
                                {disc.postTableDetails}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Policy / Decisions / Proof Link */}
                    {(item.policyChanges || item.link) && (
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10.5px' }}>
                        {item.policyChanges && (
                          <div style={{ color: '#475569', textAlign: 'justify' }}>
                            <strong>Policy Directives:</strong> {item.policyChanges}
                          </div>
                        )}
                        {item.link && (
                          <div style={{ color: '#1d4ed8', wordBreak: 'break-all' }}>
                            <strong>Signed Minutes / Proof:</strong>{' '}
                            <a
                              href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#1d4ed8', textDecoration: 'none' }}
                            >
                              {item.link}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. MoUs */}
      {sections.mous.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#4338ca', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #4338ca', paddingBottom: '4px', marginBottom: '8px' }}>
            6. COLLABORATIONS &amp; MOUS ({sections.mous.length})
          </div>
          <div>
            {sections.mous.map((item, idx) => (
              <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9', textAlign: 'justify', textJustify: 'inter-word' }}>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{idx + 1}. {item.name}</span> &bull; Period: {item.datePeriod} &bull; Scope: {item.purpose}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7, 8, 9. Other Initiatives */}
      {(sections.additionalInitiatives.length > 0 || sections.techAssociation.length > 0) && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#0e7490', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #0e7490', paddingBottom: '4px', marginBottom: '8px' }}>
            7. TECHNICAL ASSOCIATIONS &amp; INNOVATION INITIATIVES
          </div>
          <div>
            {sections.additionalInitiatives.map((item, idx) => (
              <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9', textAlign: 'justify', textJustify: 'inter-word' }}>
                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Additional Initiative:</span> {item.initiative} ({item.date}) &mdash; {item.description}
              </div>
            ))}
            {sections.techAssociation.map((item, idx) => (
              <div key={idx} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9', textAlign: 'justify', textJustify: 'inter-word' }}>
                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>Technical Association:</span> {item.event} ({item.date}) &bull; Type: {item.type || 'Activity'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. Syllabus Coverage Report Table Matching Theme */}
      {sections.syllabus.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #1d4ed8', paddingBottom: '4px', marginBottom: '8px' }}>
            8. SYLLABUS COVERAGE &amp; CURRICULUM PROGRESS ({sections.syllabus.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '10.5px', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ width: '38px', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>S.No</th>
                <th style={{ width: '20%', padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Subject / Course</th>
                <th style={{ width: '13%', padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>Year/Sem</th>
                <th style={{ width: '17%', padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Faculty</th>
                <th style={{ width: '10%', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>Done (5 Units)</th>
                <th style={{ width: '10%', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>Pending</th>
                <th style={{ width: '26%', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {sections.syllabus.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>{idx + 1}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', fontWeight: 'bold', color: '#0f172a', textAlign: 'justify', textJustify: 'inter-word' }}>{item.subject || '-'}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', color: '#334155', textAlign: 'center' }}>{item.yearSem || '-'}</td>
                  <td style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', color: '#334155', textAlign: 'justify', textJustify: 'inter-word' }}>{item.faculty || '-'}</td>
                  <td style={{ padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#047857' }}>{item.completed || '-'}</td>
                  <td style={{ padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#b45309' }}>{item.pending || '-'}</td>
                  <td style={{ padding: '6px 8px', color: '#475569', fontStyle: 'italic', fontSize: '10px', textAlign: 'justify', textJustify: 'inter-word' }}>{item.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Engagement Activity Table Matching Theme */}
      {sections.studentEngagement && sections.studentEngagement.length > 0 && (
        <div style={{ marginBottom: '15px' }} className="break-inside-avoid">
          <div style={{ fontWeight: 800, color: '#be123c', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #be123c', paddingBottom: '4px', marginBottom: '8px' }}>
            9. CLUB &amp; STUDENT ENGAGEMENT ACTIVITIES ({sections.studentEngagement.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '10.5px', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ width: '36px', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>S.No</th>
                <th style={{ width: '24%', padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Title of Activity</th>
                <th style={{ width: '16%', padding: '6px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Type of Activity</th>
                <th style={{ width: '18%', padding: '6px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>Dates</th>
                <th style={{ width: '8%', padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1a365d' }}>Part.</th>
                <th style={{ width: '16%', padding: '6px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Co-Ordinator</th>
                <th style={{ width: '18%', padding: '6px 6px', textAlign: 'left', fontWeight: 'bold', color: '#1a365d' }}>Remarks</th>
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
                    <td style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', fontWeight: 'bold', color: '#0f172a', textAlign: 'justify', textJustify: 'inter-word' }}>{item.title || '-'}</td>
                    <td style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1', color: '#334155', textAlign: 'justify', textJustify: 'inter-word' }}>{displayType}</td>
                    <td style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1', color: '#334155', textAlign: 'center' }}>{displayDates}</td>
                    <td style={{ padding: '6px 4px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#047857' }}>{item.participantsCount || '-'}</td>
                    <td style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1', color: '#334155', textAlign: 'justify', textJustify: 'inter-word' }}>{item.coordinator || '-'}</td>
                    <td style={{ padding: '6px 6px', color: '#475569', fontStyle: 'italic', fontSize: '10px', textAlign: 'justify', textJustify: 'inter-word' }}>{item.remarks || '-'}</td>
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
          <div style={{ fontWeight: 800, color: '#15803d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #15803d', paddingBottom: '4px', marginBottom: '8px' }}>
            10. NSS &amp; OTHER EXTENSION ACTIVITIES ({sections.nss.length})
          </div>
          <div>
            {sections.nss.map((item, idx) => (
              <div key={idx} style={{ display: 'table', width: '100%', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
                <div style={{ display: 'table-cell', width: '28px', verticalAlign: 'top', fontWeight: 800, color: '#1a365d', fontSize: '11px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'top', textAlign: 'justify', textJustify: 'inter-word' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '11.5px', marginBottom: '2px', textAlign: 'justify' }}>{item.event}</div>
                  <div style={{ color: '#64748b', fontSize: '10.5px', textAlign: 'justify' }}>Date: {item.date} | Venue: {item.venue} | Participants: {item.participantsCount}</div>
                  <div style={{ color: '#334155', fontSize: '11px', textAlign: 'justify' }}><strong>Outcomes:</strong> {item.outcomes}</div>
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
