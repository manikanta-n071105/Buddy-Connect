import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Printer,
  FileDown,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Upload,
  ArrowLeft,
  Check,
  FileText,
  Building2,
  User,
  Calendar,
  Users,
  Award,
  BookOpen,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  Eye,
  Globe,
  ExternalLink,
  Linkedin
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { UN_SDGS, UN_SDG_Item, SdgWheelSvg } from '../approvals/ApprovalWorkflowPage';

export const PublicReportGeneratorPage: React.FC = () => {
  // Form States
  const [customTitle, setCustomTitle] = useState('Physics Principles in Engineering Applications');
  const [customHeading, setCustomHeading] = useState('POST-EVENT OUTCOME & COMPLETION REPORT');
  const [department, setDepartment] = useState('Humanities & Sciences');
  const [secretaryName, setSecretaryName] = useState('Dr. Sreenivas Prasad');
  const [eventDate, setEventDate] = useState('22 March 2024');
  const [resourcePerson, setResourcePerson] = useState('Dr. A. Sharma (IIT Madras)');
  const [participantsCount, setParticipantsCount] = useState('145 First-Year Students & 12 Faculty Members');
  const [linkedinUrl, setLinkedinUrl] = useState('https://www.linkedin.com/school/sanskrithi-school-of-engineering');
  const [executiveSummary, setExecutiveSummary] = useState(
    'The Department of Humanities & Sciences successfully organized a guest program designed to introduce first-year engineering students to fundamental physical principles and their real-world engineering applications. The session bridged classroom theoretical concepts with practical industrial considerations such as energy efficiency, material mechanics, and system performance optimization.\n\nWith active student interaction, live demonstrations, and an engaging Q&A session, the program enriched student learning outcomes, fostered analytical thinking, and reinforced academic-industry alignment.'
  );
  const [keyOutcomesText, setKeyOutcomesText] = useState(
    '1. Conceptual Understanding: Enhanced student grasp of physical mechanics and energy conservation principles.\n2. Analytical Exposure: Students solved practical case studies connecting classroom formulas to real systems.\n3. Academic Alignment: Strengthened curriculum application with contemporary engineering practices.\n4. Participant Engagement: High interaction during hands-on demonstrations and Q&A.'
  );

  // Selected SDGs & Auto-mapping state
  const [selectedSdgIds, setSelectedSdgIds] = useState<number[]>([4, 8, 9]);
  const [isAutoSdgMode, setIsAutoSdgMode] = useState(true);

  // Dynamically auto-map SDGs based on event title, department, executive summary & outcomes text
  useEffect(() => {
    if (!isAutoSdgMode) return;

    const textToScan = `${customTitle} ${department} ${executiveSummary} ${keyOutcomesText}`.toLowerCase();
    
    const matched = UN_SDGS.filter((sdg) =>
      sdg.keywords.some((kw) => textToScan.includes(kw.toLowerCase()))
    ).map((s) => s.id);

    if (matched.length > 0) {
      setSelectedSdgIds(matched);
    } else {
      setSelectedSdgIds([4, 8, 9]);
    }
  }, [customTitle, department, executiveSummary, keyOutcomesText, isAutoSdgMode]);

  // Photo Evidence State
  const [photos, setPhotos] = useState<{ url: string; caption: string }[]>([
    {
      url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
      caption: 'Chief Guest inaugurating the Guest Academic Program'
    },
    {
      url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
      caption: 'Interactive Q&A and Problem-Solving Session with Students'
    }
  ]);

  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoCaptionInput, setPhotoCaptionInput] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Toggle SDG selection (switches to manual customization)
  const toggleSdg = (id: number) => {
    setIsAutoSdgMode(false);
    if (selectedSdgIds.includes(id)) {
      if (selectedSdgIds.length === 1) {
        toast.error('Please keep at least one SDG aligned.');
        return;
      }
      setSelectedSdgIds((prev) => prev.filter((sId) => sId !== id));
    } else {
      setSelectedSdgIds((prev) => [...prev, id]);
    }
  };

  const selectedSdgs = UN_SDGS.filter((s) => selectedSdgIds.includes(s.id));

  // Parse Key Outcomes into structured items
  const parseOutcomePoints = (text: string): string[] => {
    if (!text || !text.trim()) return [];
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^(\d+[\.\)]|\*|-|\u2022)\s*/, ''));
  };

  // Add Photo Handlers (Max 4 photos)
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= 4) {
      toast.error('Maximum 4 photographs allowed per report.');
      return;
    }

    const availableSlots = 4 - photos.length;
    const filesToProcess = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      toast.warning(`Only ${availableSlots} more photo(s) could be added (maximum 4 photos allowed).`);
    }

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          setPhotos((prev) => {
            if (prev.length >= 4) return prev;
            return [
              ...prev,
              { url: base64Url, caption: photoCaptionInput.trim() || '' }
            ];
          });
          setPhotoCaptionInput('');
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleAddPhotoFromUrl = () => {
    if (!photoUrlInput.trim()) {
      toast.error('Please enter image URL or select a photo file');
      return;
    }
    if (photos.length >= 4) {
      toast.error('Maximum 4 photographs allowed per report.');
      return;
    }
    setPhotos((prev) => {
      if (prev.length >= 4) return prev;
      return [
        ...prev,
        { url: photoUrlInput.trim(), caption: photoCaptionInput.trim() || '' }
      ];
    });
    setPhotoUrlInput('');
    setPhotoCaptionInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Word count helper
  const getWordCount = (str: string) => {
    if (!str || !str.trim()) return 0;
    return str.trim().split(/\s+/).length;
  };

  // AI Summary Generation (~300 Words & Key Outcomes)
  const handleGenerateAISummary = async () => {
    setIsGeneratingAI(true);
    const briefNotes = executiveSummary.trim();

    try {
      const response = await api.post('/approvals/public-generate-report-ai', {
        title: customTitle,
        department,
        category: 'Guest Program / Seminar',
        userNotes: briefNotes,
        eventDate,
        participantsCount
      });

      if (response.data.success && response.data.data) {
        const { executiveSummary: summary, keyOutcomes } = response.data.data;
        setExecutiveSummary(summary);
        if (keyOutcomes) setKeyOutcomesText(keyOutcomes);
        toast.success('Generated ~300-Word Executive Summary & Key Outcomes via Gemini AI!');
        setIsGeneratingAI(false);
        return;
      }
    } catch (err: any) {
      console.warn('Backend AI endpoint note:', err);
    }

    // Rich fallback: Converts brief 2-3 lines into a full ~300-word professional executive summary & 4 outcomes
    const p1 = `The Department of ${department || 'Engineering'} at Sanskrithi School of Engineering successfully organized a specialized academic and technical program titled "${customTitle || 'Guest Technical Program'}". Designed to connect classroom foundational concepts with practical industrial applications, the session provided participating students with valuable insights into modern engineering methodologies and industry standards.`;

    const p2 = briefNotes && briefNotes.length > 5
      ? `Session Highlights & Technical Focus: ${briefNotes.endsWith('.') ? briefNotes : briefNotes + '.'} The guest speaker led an engaging session featuring interactive technical lectures, live case study demonstrations, and analytical problem-solving exercises. Participating students actively interacted with the speaker during the open Q&A session, discussing key challenges, practical tools, and contemporary developments in the field.`
      : `Session Highlights & Technical Focus: The program featured interactive technical lectures, live domain demonstrations, and practical problem-solving exercises. The resource person shared real-world case studies and guided participants through core analytical workflows. Students engaged enthusiastically throughout the event, raising insightful questions during the Q&A segment.`;

    const p3 = `Overall Impact & Engagement: The event witnessed active participation with ${participantsCount || '145 first-year students and 12 faculty members'} attending the session on ${eventDate || '22 March 2024'}. Feedback from both students and faculty members was overwhelmingly positive, noting that the program significantly strengthened academic understanding, broadened technical perspectives, and reinforced academic-industry integration.`;

    const expandedSummary = `${p1}\n\n${p2}\n\n${p3}`;

    const outcomes = `1. Conceptual Understanding: Enhanced student grasp of foundational principles and analytical methodologies in ${customTitle || 'the domain'}.\n2. Practical & Industry Exposure: Students solved real-world case studies connecting classroom formulas with industrial applications.\n3. Academic Alignment: Strengthened curriculum integration with contemporary engineering tools and professional standards.\n4. Participant Engagement: Fostered high student interaction during hands-on demonstrations and open Q&A discussions.`;

    setExecutiveSummary(expandedSummary);
    setKeyOutcomesText(outcomes);
    toast.success('Expanded to ~300-Word Executive Summary & Key Outcomes!');
    setIsGeneratingAI(false);
  };

  // Sample Data Loader
  const handleAutoFillSample = () => {
    setCustomTitle('Physics Principles in Engineering Applications');
    setCustomHeading('POST-EVENT OUTCOME & COMPLETION REPORT');
    setDepartment('Humanities & Sciences');
    setSecretaryName('Dr. Sreenivas Prasad');
    setEventDate('22 March 2024');
    setResourcePerson('Dr. A. Sharma (IIT Madras)');
    setParticipantsCount('145 First-Year Students & 12 Faculty Members');
    setExecutiveSummary(
      'The Department of Humanities & Sciences conducted a program designed to introduce participants to physical principles and engineering applications. The session connected classroom concepts with practical considerations such as energy efficiency and system performance. With active student and faculty participation, the event provided a valuable platform for technical enrichment and academic engagement.'
    );
    setKeyOutcomesText(
      '1. Conceptual Understanding: Deepened student knowledge of core physical principles.\n2. Practical Application: Demonstrated real-world engineering case studies.\n3. Industry Alignment: Exposed participants to industry standards and metrics.\n4. Positive Feedback: High student engagement during hands-on demonstrations.'
    );
    setSelectedSdgIds([4, 8, 9]);
    setPhotos([
      {
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
        caption: 'Chief Guest inaugurating the Guest Academic Program'
      },
      {
        url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
        caption: 'Interactive Q&A Session with Students'
      }
    ]);
    toast.success('Sample report data loaded!');
  };

  const handleResetForm = () => {
    setCustomTitle('');
    setCustomHeading('POST-EVENT OUTCOME & COMPLETION REPORT');
    setDepartment('Humanities & Sciences');
    setSecretaryName('');
    setEventDate('');
    setResourcePerson('');
    setParticipantsCount('');
    setExecutiveSummary('');
    setKeyOutcomesText('');
    setPhotos([]);
    setSelectedSdgIds([4]);
    toast.info('Form cleared.');
  };

  // Dedicated Robust Native Print Handler
  const handlePrint = () => {
    // If user is on mobile 'edit' tab, switch to preview
    if (activeTab === 'edit') {
      setActiveTab('preview');
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      window.print();
    }
  };

  // Export to Microsoft Word (.doc)
  const handleExportToWord = async () => {
    toast.info('Preparing Microsoft Word (.doc) export...');

    // Convert local/data photos to base64 if needed
    const processedPhotos = await Promise.all(
      photos.map(async (p) => {
        if (p.url.startsWith('data:')) return p;
        try {
          const resp = await fetch(p.url, { mode: 'cors' });
          const blob = await resp.blob();
          const reader = new FileReader();
          const b64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          return { ...p, url: b64 };
        } catch (e) {
          return p;
        }
      })
    );

    let photosHTML = '';
    if (processedPhotos && processedPhotos.length > 0) {
      const exportList = processedPhotos.slice(0, 4);
      photosHTML = `
        <h3 style="font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #0f172a; border-bottom: 2pt solid #0f172a; padding-bottom: 3pt; margin-top: 16pt; margin-bottom: 8pt; page-break-after: avoid;">
          EVENT PHOTOGRAPHS &amp; VISUAL EVIDENCE (${exportList.length})
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 6pt; page-break-inside: avoid;" class="no-border">
          <tr>
            ${exportList
              .map(
                (p, idx) => `
              <td style="width: 50%; padding: 6pt; vertical-align: top; border: none; page-break-inside: avoid;" align="center">
                <div style="border: 1.5pt solid #0f172a; background-color: #ffffff; padding: 6pt; text-align: center; border-radius: 4pt; width: 230px; margin: 0 auto;">
                  <table style="width: 100%; border: none;" class="no-border">
                    <tr style="border: none;">
                      <td style="border: none; text-align: center; vertical-align: middle; height: 135px; background-color: #f8fafc; padding: 2px;" align="center">
                        <img src="${p.url}" width="220" height="130" alt="${p.caption || 'Event Photo'}" style="width: 220px; height: 130px; border: 1pt solid #cbd5e1; display: block; margin: 0 auto; object-fit: cover;" />
                      </td>
                    </tr>
                  </table>
                  <p style="font-family: Arial, sans-serif; font-size: 8.5pt; font-weight: bold; font-style: italic; color: #1e293b; background-color: #f1f5f9; padding: 4pt; margin-top: 5pt; margin-bottom: 0; border: 1pt solid #cbd5e1; border-radius: 3pt; text-align: center;">
                    ${p.caption || `Photo ${idx + 1}`}
                  </p>
                </div>
              </td>
              ${(idx + 1) % 2 === 0 && idx < exportList.length - 1 ? '</tr><tr style="page-break-inside: avoid;">' : ''}
            `
              )
              .join('')}
          </tr>
        </table>
      `;
    }

    const outcomeList = parseOutcomePoints(keyOutcomesText);
    const wordTitle = customTitle.trim() || 'Event Completion Report';
    const wordHeading = customHeading.trim() || 'POST-EVENT OUTCOME & COMPLETION REPORT';
    const resPerson = resourcePerson.trim();

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${wordTitle}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 210mm 297mm;
            margin: 15mm 15mm 15mm 15mm;
          }
          div.Section1 { page: Section1; }
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #0f172a; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
          th, td { border: 1pt solid #64748b; padding: 6pt 8pt; font-size: 10pt; vertical-align: top; }
          tr { page-break-inside: avoid; }
          .no-border, .no-border td { border: none !important; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <!-- PAGE 1 -->
          <div style="padding: 20pt 16pt; min-height: 820pt; box-sizing: border-box; background-color: #ffffff;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt; border-bottom: 2pt solid #1a365d; padding-bottom: 4pt;" class="no-border">
              <tr style="border: none;">
                <td style="border: none; font-size: 11pt; font-weight: bold; color: #1a365d; text-transform: uppercase;">
                  SANSKRITHI SCHOOL OF ENGINEERING
                </td>
                <td style="border: none; font-size: 9.5pt; font-weight: bold; color: #64748b; text-align: right;" align="right">
                  Department of ${department || 'Humanities & Sciences'}
                </td>
              </tr>
            </table>

            <div style="text-align: center; margin-top: 12pt; margin-bottom: 14pt;">
              <h1 style="font-family: Arial, sans-serif; font-size: 18pt; font-weight: 900; color: #1a365d; margin: 0; text-transform: uppercase; letter-spacing: 0.5pt;">
                ${wordHeading}
              </h1>
              <div style="font-size: 12.5pt; font-weight: bold; color: #334155; margin-top: 4pt;">
                ${wordTitle}
              </div>
              <div style="font-size: 9.5pt; color: #64748b; margin-top: 2pt;">
                Event Date: ${eventDate || '22 March 2024'}
              </div>
            </div>

            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #1a365d; border-bottom: 1.5pt solid #1a365d; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 8pt;">
              PROGRAM OVERVIEW
            </div>
            <table style="width: 100%; border-collapse: collapse; border: 1pt solid #cbd5e1; margin-top: 6pt; margin-bottom: 14pt;">
              <tr>
                <td style="width: 32%; font-weight: bold; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 6pt 8pt; color: #1a365d;">Program / Event Title:</td>
                <td style="width: 68%; font-weight: bold; color: #0f172a; border: 1pt solid #cbd5e1; padding: 6pt 8pt;">${wordTitle}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 6pt 8pt; color: #1a365d;">Organizing Department &amp; Secretary:</td>
                <td style="border: 1pt solid #cbd5e1; padding: 6pt 8pt;">Department of ${department || 'Humanities & Sciences'} &middot; ${secretaryName || 'Faculty Coordinator'}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 6pt 8pt; color: #1a365d;">Event Execution Date:</td>
                <td style="border: 1pt solid #cbd5e1; padding: 6pt 8pt;">${eventDate || '22 March 2024'}</td>
              </tr>
              ${
                resPerson
                  ? `<tr>
                <td style="font-weight: bold; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 6pt 8pt; color: #1a365d;">Resource Person / Speaker:</td>
                <td style="border: 1pt solid #cbd5e1; padding: 6pt 8pt;">${resPerson}</td>
              </tr>`
                  : ''
              }
              <tr>
                <td style="font-weight: bold; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 6pt 8pt; color: #1a365d;">Participants / Beneficiaries:</td>
                <td style="border: 1pt solid #cbd5e1; padding: 6pt 8pt;">${participantsCount || '145 students and 12 faculty members'}</td>
              </tr>
            </table>

            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #1a365d; border-bottom: 1.5pt solid #1a365d; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 8pt;">
              EXECUTIVE SUMMARY
            </div>
            <div style="padding: 4pt 0; font-size: 10pt; line-height: 1.5; color: #334155; margin-bottom: 14pt; white-space: pre-wrap;">
              ${executiveSummary || 'The Department conducted a program designed to introduce participants to physical principles and engineering applications. The session connected classroom concepts with practical considerations such as energy efficiency and system performance.'}
            </div>
          </div>
          <br clear="all" style="page-break-before:always;" />

          <!-- PAGE 2 -->
          <div style="padding: 20pt 16pt; min-height: 820pt; box-sizing: border-box; background-color: #ffffff;">
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #1a365d; border-bottom: 1.5pt solid #1a365d; padding-bottom: 3pt; margin-top: 10pt; margin-bottom: 8pt;">
              KEY OUTCOMES &amp; LEARNING IMPACT
            </div>
            <div style="margin-bottom: 16pt;">
              <ol style="margin: 0; padding-left: 18pt; font-size: 10pt; line-height: 1.6; color: #0f172a;">
                ${outcomeList.map((pt) => `<li style="margin-bottom: 6pt; font-weight: 500;">${pt}</li>`).join('')}
              </ol>
            </div>

            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #1a365d; border-bottom: 1.5pt solid #1a365d; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 8pt;">
              SUSTAINABLE DEVELOPMENT GOALS
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 6pt; margin-bottom: 14pt;" class="no-border">
              <tr>
                ${selectedSdgs
                  .map(
                    (sdg) => `
                  <td style="width: 85px; padding: 4pt; border: none; vertical-align: top;" align="center">
                    <a href="${sdg.link}">
                      <img src="${sdg.iconUrl}" width="75" height="75" alt="SDG ${sdg.id} ${sdg.name}" style="width: 75px; height: 75px; border: none; margin: 0; display: block;" />
                    </a>
                  </td>
                `
                  )
                  .join('')}
              </tr>
            </table>

            ${
              photos.length === 0
                ? `
              <table style="width: 100%; border-collapse: collapse; margin-top: 50pt;" class="no-border">
                <tr style="border: none;">
                  <td style="border: none; text-align: center; width: 33%;">
                    <div style="border-top: 1pt solid #475569; width: 140px; margin: 0 auto; padding-top: 4pt; font-weight: bold; font-size: 9.5pt; color: #0f172a;">
                      ${secretaryName || 'Faculty Coordinator'}
                      <div style="font-size: 8.5pt; font-weight: normal; color: #64748b;">Event Convener</div>
                    </div>
                  </td>
                  <td style="border: none; text-align: center; width: 33%;">
                    <div style="border-top: 1pt solid #475569; width: 140px; margin: 0 auto; padding-top: 4pt; font-weight: bold; font-size: 9.5pt; color: #0f172a;">
                      Head of Department
                      <div style="font-size: 8.5pt; font-weight: normal; color: #64748b;">Department of ${department}</div>
                    </div>
                  </td>
                  <td style="border: none; text-align: center; width: 34%;">
                    <div style="border-top: 1pt solid #475569; width: 140px; margin: 0 auto; padding-top: 4pt; font-weight: bold; font-size: 9.5pt; color: #0f172a;">
                      Principal
                      <div style="font-size: 8.5pt; font-weight: normal; color: #64748b;">Sanskrithi School of Engineering</div>
                    </div>
                  </td>
                </tr>
              </table>
            `
                : ''
            }
          </div>

          ${
            photos.length > 0
              ? `
            <br clear="all" style="page-break-before:always;" />
            <div style="padding: 20pt 16pt; min-height: 820pt; box-sizing: border-box; background-color: #ffffff;">
              ${photosHTML}
              <table style="width: 100%; border-collapse: collapse; margin-top: 40pt;" class="no-border">
                <tr style="border: none;">
                  <td style="border: none; text-align: center; width: 33%;">
                    <div style="border-top: 1pt solid #475569; width: 140px; margin: 0 auto; padding-top: 4pt; font-weight: bold; font-size: 9.5pt; color: #0f172a;">
                      ${secretaryName || 'Faculty Coordinator'}
                      <div style="font-size: 8.5pt; font-weight: normal; color: #64748b;">Event Convener</div>
                    </div>
                  </td>
                  <td style="border: none; text-align: center; width: 33%;">
                    <div style="border-top: 1pt solid #475569; width: 140px; margin: 0 auto; padding-top: 4pt; font-weight: bold; font-size: 9.5pt; color: #0f172a;">
                      Head of Department
                      <div style="font-size: 8.5pt; font-weight: normal; color: #64748b;">Department of ${department}</div>
                    </div>
                  </td>
                  <td style="border: none; text-align: center; width: 34%;">
                    <div style="border-top: 1pt solid #475569; width: 140px; margin: 0 auto; padding-top: 4pt; font-weight: bold; font-size: 9.5pt; color: #0f172a;">
                      Principal
                      <div style="font-size: 8.5pt; font-weight: normal; color: #64748b;">Sanskrithi School of Engineering</div>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          `
              : ''
          }
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = (customTitle || 'Post_Event_Report').replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `SSE_Report_${safeTitle}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded Microsoft Word (.doc) report!');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans print:bg-white print:text-black print:p-0">
      {/* TOP PUBLIC HEADER (Hidden when printing) */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/login" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <SdgWheelSvg size={28} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-base text-white">SANSKRITHI</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PUBLIC TOOL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Standalone Post-Event Outcome Report Generator</p>
            </div>
          </Link>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleAutoFillSample}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Auto-Fill Sample Data
          </button>

          <button
            onClick={handleExportToWord}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
          >
            <FileDown className="w-4 h-4" /> Export to Word (.doc)
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>

          <Link
            to="/login"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Portal Login
          </Link>
        </div>
      </header>

      {/* MOBILE TAB CONTROLS (Hidden when printing) */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-950 p-2 print:hidden">
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'edit' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> 1. Enter Event Details
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'preview' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> 2. View A4 Document Preview
        </button>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 print:p-0 print:m-0 print:max-w-none">
        
        {/* LEFT COLUMN: INPUT CONTROLS (Hidden when printing or on mobile if preview tab active) */}
        <div className={`lg:col-span-5 space-y-6 print:hidden ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-slate-100 text-base">Event &amp; Report Details</h2>
              </div>
              <button
                onClick={handleResetForm}
                className="text-[11px] text-slate-400 hover:text-red-400 transition-colors"
              >
                Clear Form
              </button>
            </div>

            {/* Custom Heading & Title */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Custom Document Header</label>
                <input
                  type="text"
                  value={customHeading}
                  onChange={(e) => setCustomHeading(e.target.value)}
                  placeholder="POST-EVENT OUTCOME & COMPLETION REPORT"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Program / Event Title *</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Workshop on Embedded Systems & IoT"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Department & Secretary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Department Name *</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Humanities & Sciences"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Coordinator / Secretary *</label>
                <input
                  type="text"
                  value={secretaryName}
                  onChange={(e) => setSecretaryName(e.target.value)}
                  placeholder="Dr. Sreenivas Prasad"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Date & Resource Person */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Execution Date *</label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  placeholder="22 March 2024"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Resource Person (Optional)</label>
                <input
                  type="text"
                  value={resourcePerson}
                  onChange={(e) => setResourcePerson(e.target.value)}
                  placeholder="Leave blank to omit row"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Row is automatically hidden if left empty.</p>
              </div>
            </div>

            {/* Participants Count */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Total Beneficiaries / Attendance *</label>
              <input
                type="text"
                value={participantsCount}
                onChange={(e) => setParticipantsCount(e.target.value)}
                placeholder="145 Students & 12 Faculty"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Executive Summary & AI Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">Executive Summary (~300 Words)</label>
                <button
                  type="button"
                  disabled={isGeneratingAI}
                  onClick={handleGenerateAISummary}
                  className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                >
                  {isGeneratingAI ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" /> Gemini Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Auto-Generate with AI
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={5}
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                placeholder="Enter 2-3 lines of event notes or highlights..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-medium">
                <span>Current Word Count: <strong className="text-emerald-400 font-bold">{getWordCount(executiveSummary)} words</strong></span>
                <span className="text-[10px] text-slate-500">Target: ~300 Words</span>
              </div>
            </div>

            {/* Key Outcomes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Key Outcomes &amp; Learning Impact</label>
              <textarea
                rows={4}
                value={keyOutcomesText}
                onChange={(e) => setKeyOutcomesText(e.target.value)}
                placeholder="1. Conceptual understanding: ...&#10;2. Practical exposure: ..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Enter numbered or bulleted items. Each line becomes a point.</p>
            </div>
          </div>

          {/* SDG ALIGNMENT CARD */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-slate-100 text-sm">UN Sustainable Development Goals (SDGs)</h3>
              </div>
              <div className="flex items-center gap-2">
                {isAutoSdgMode ? (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-700/60 flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" /> Auto-Mapped
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoSdgMode(true);
                      toast.success('Re-enabled Automatic SDG Keyword Mapping!');
                    }}
                    className="text-[10px] font-bold text-teal-300 bg-teal-950 hover:bg-teal-900 border border-teal-700/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-teal-400" /> Enable Auto-Map
                  </button>
                )}
                <span className="text-xs font-bold text-teal-400 px-2 py-0.5 bg-teal-950 rounded-md border border-teal-800">
                  {selectedSdgIds.length} Selected
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              {isAutoSdgMode
                ? '⚡ SDGs are automatically detected based on event details & keywords. Click any badge to customize.'
                : 'Custom SDG mode active. Click badges to select/deselect goals:'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {UN_SDGS.map((sdg) => {
                const isSelected = selectedSdgIds.includes(sdg.id);
                return (
                  <button
                    key={sdg.id}
                    type="button"
                    onClick={() => toggleSdg(sdg.id)}
                    className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                      isSelected
                        ? 'bg-slate-950 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                        : 'bg-slate-900/60 border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
                    }`}
                  >
                    <img src={sdg.iconUrl} alt={sdg.name} className="w-9 h-9 rounded-md object-contain shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-black text-slate-200 truncate">{sdg.code}</div>
                      <div className="text-[9px] font-medium text-slate-400 truncate">{sdg.name}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PHOTOGRAPHS & EVIDENCE CARD */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-sm">Event Photographs ({photos.length}/4)</h3>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${photos.length >= 4 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-700/50 text-slate-400'}`}>
                {photos.length >= 4 ? 'Max 4 Uploaded' : `${4 - photos.length} slot(s) left`}
              </span>
            </div>

            {/* Existing Photos List with Caption Input */}
            {photos.length > 0 && (
              <div className="space-y-2">
                {photos.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-slate-900/80 border border-slate-700/60 rounded-xl">
                    <img src={p.url} alt={p.caption || `Photo ${idx + 1}`} className="w-12 h-10 object-cover rounded-md shrink-0 bg-slate-950 border border-slate-700" />
                    <div className="flex-1 flex flex-col gap-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-semibold">Photo {idx + 1} Caption</span>
                        {!p.caption?.trim() && (
                          <span className="text-amber-400 font-bold animate-pulse text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                            Caption required
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={p.caption}
                        placeholder={`Event Photo ${idx + 1} (Enter caption...)`}
                        onChange={(e) => {
                          const newCaptions = [...photos];
                          newCaptions[idx].caption = e.target.value;
                          setPhotos(newCaptions);
                        }}
                        className={`w-full px-2.5 py-1 rounded-lg text-xs outline-none transition-all ${
                          !p.caption?.trim()
                            ? 'bg-amber-950/30 border-2 border-amber-500/70 text-amber-100 placeholder-amber-400/60'
                            : 'bg-slate-950 border border-slate-800 text-white focus:border-emerald-500'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors shrink-0"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Photo Inputs (Only if under 4 photos) */}
            {photos.length < 4 ? (
              <div className="pt-2 border-t border-slate-700/50 space-y-2">
                <input
                  type="text"
                  value={photoCaptionInput}
                  onChange={(e) => setPhotoCaptionInput(e.target.value)}
                  placeholder="Photo Caption (e.g. Chief Guest Inaugurating Session)"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    placeholder="Paste Image URL or select file..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoFromUrl}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold shrink-0"
                  >
                    Add URL
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoFileUpload}
                    className="hidden"
                    id="public-photo-file-input"
                  />
                  <label
                    htmlFor="public-photo-file-input"
                    className="w-full py-2 border border-dashed border-slate-600 hover:border-emerald-500 rounded-xl bg-slate-900/60 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" /> Upload Image File (Max 4 Total)
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center text-amber-300 text-xs font-medium">
                Maximum 4 photographs added. Delete an existing photo to upload a different one.
              </div>
            )}

            {/* LINKEDIN POST URL INPUT */}
            <div className="pt-2 border-t border-slate-700/50 space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-blue-400" /> LinkedIn Event Post URL
              </label>
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/posts/..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME A4 DOCUMENT PREVIEW */}
        <div className={`lg:col-span-7 print:col-span-12 print:w-full ${activeTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 print:p-0 print:m-0 print:border-none print:shadow-none">
            
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-slate-100 text-sm sm:text-base">Live Document Preview</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Standard SSE Post-Event Format</span>
            </div>

            {/* A4 PRINTABLE DOCUMENT CONTAINER (BORDERLESS) */}
            <div id="printable-report-area" className="bg-white text-slate-900 p-6 sm:p-10 font-sans text-xs print:p-0 print:m-0 rounded-none border-0 shadow-none outline-none">
              
              {/* PAGE 1: OVERVIEW, EXECUTIVE SUMMARY & KEY OUTCOMES */}
              <div className="print-page-1 min-h-[750px] print:min-h-0 flex flex-col justify-between space-y-3 print:space-y-2">
                <div className="space-y-3">
                  {/* Page 1 Header */}
                  <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800">
                    <img src="/assets/sse-header-logo.png" alt="Sanskrithi School of Engineering Logo" className="h-8 sm:h-10 w-auto object-contain" />
                    <span className="text-slate-800 font-extrabold text-xs uppercase tracking-wide">
                      Department of {department || 'Humanities & Sciences'}
                    </span>
                  </div>

                  {/* Document Title Block */}
                  <div className="text-center space-y-1 py-0.5">
                    <h1 className="text-lg sm:text-xl font-black text-[#1a365d] uppercase tracking-wide" style={{ letterSpacing: '0.03em' }}>
                      {customHeading || 'POST-EVENT OUTCOME & COMPLETION REPORT'}
                    </h1>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      {customTitle || 'Program / Event Title'}
                    </div>
                    
                  </div>

                  {/* Section 1: Program Overview */}
                  <div className="mb-[10px]">
                    <h3 className="font-extrabold text-[#1a365d] text-xs uppercase tracking-wider border-b border-[#1a365d] pb-1 mb-[10px]">
                      PROGRAM OVERVIEW
                    </h3>
                    <table className="w-full border-collapse border border-slate-300 text-xs">
                      <tbody>
                        <tr className="border-b border-slate-300">
                          <td className="w-1/3 py-1.5 px-2.5 font-bold bg-slate-50 border-r border-slate-300 text-[#1a365d]">Program / Event Title</td>
                          <td className="w-2/3 py-1.5 px-2.5 font-semibold text-slate-900">{customTitle || 'Event Title'}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <td className="py-1.5 px-2.5 font-bold bg-slate-50 border-r border-slate-300 text-[#1a365d]">Organizing Department &amp; Secretary</td>
                          <td className="py-1.5 px-2.5 font-semibold text-slate-800">Department of {department || 'Humanities & Sciences'} &middot; {secretaryName || 'Coordinator'}</td>
                        </tr>
                        <tr className="border-b border-slate-300">
                          <td className="py-1.5 px-2.5 font-bold bg-slate-50 border-r border-slate-300 text-[#1a365d]">Event Execution Date</td>
                          <td className="py-1.5 px-2.5 font-semibold text-slate-800">{eventDate || '22 March 2024'}</td>
                        </tr>
                        {resourcePerson.trim() && (
                          <tr className="border-b border-slate-300">
                            <td className="py-1.5 px-2.5 font-bold bg-slate-50 border-r border-slate-300 text-[#1a365d]">Resource Person / Speaker</td>
                            <td className="py-1.5 px-2.5 font-semibold text-slate-800">{resourcePerson}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="py-1.5 px-2.5 font-bold bg-slate-50 border-r border-slate-300 text-[#1a365d]">Participants / Beneficiaries</td>
                          <td className="py-1.5 px-2.5 font-semibold text-slate-800">{participantsCount || '145 students and 12 faculty members'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Section 2: Executive Summary */}
                  <div className="mb-[10px]">
                    <h3 className="font-extrabold text-[#1a365d] text-xs uppercase tracking-wider border-b border-[#1a365d] pb-1 mb-[10px]">
                      EXECUTIVE SUMMARY
                    </h3>
                    <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-normal pt-0.5 space-y-1">
                      {executiveSummary || 'Executive summary text...'}
                    </div>
                  </div>

                  {/* Section 3: Key Outcomes & Learning Impact */}
                  <div className="mb-[10px]" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <h3 className="font-extrabold text-[#1a365d] text-xs uppercase tracking-wider border-b border-[#1a365d] pb-1 mb-[10px]">
                      KEY OUTCOMES &amp; LEARNING IMPACT
                    </h3>
                    <div className="space-y-1 pt-0.5">
                      {parseOutcomePoints(keyOutcomesText).map((pt, idx) => {
                        const parts = pt.split(':');
                        const title = parts.length > 1 ? parts[0].trim() : `Outcome Point ${idx + 1}`;
                        const desc = parts.length > 1 ? parts.slice(1).join(':').trim() : pt;
                        return (
                          <div key={idx} className="flex items-start gap-2 py-0.5 border-b border-slate-100 last:border-b-0">
                            <span className="text-[#1a365d] font-extrabold text-xs leading-none w-5 shrink-0 pt-0.5">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <div>
                              
                              <span className="text-slate-700 text-xs leading-snug">{desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Page 1 Footer */}
                <div className="pt-2 border-t border-slate-200 text-center font-extrabold text-[#1a365d] text-xs mt-auto">
                  1
                </div>
              </div>

              {/* PAGE BREAK FOR PRINTING */}
              <div className="py-2 flex items-center justify-center gap-2 border-y border-dashed border-slate-300 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg print:hidden">
                <span>Page 1 (Overview, Summary &amp; Outcomes) &bull; Page 2 (SDGs, Photographs &amp; Signatures) Below</span>
              </div>

              {/* PAGE 2: SDG ALIGNMENT, PHOTOGRAPHS & SIGNATURES */}
              <div className="print-page-2 min-h-[780px] print:min-h-[268mm] flex flex-col justify-between space-y-3 page-break-before-always" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
                <div className="space-y-3 flex-1 flex flex-col justify-start">
                  {/* Page 2 Header */}
                  <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800">
                    <img src="/assets/sse-header-logo.png" alt="Sanskrithi School of Engineering Logo" className="h-8 sm:h-10 w-auto object-contain" />
                    <span className="text-slate-800 font-extrabold text-xs uppercase tracking-wide">
                      Department of {department || 'Humanities & Sciences'}
                    </span>
                  </div>

                  {/* Section 1: Sustainable Development Goal Alignment */}
                  <div className="pt-0.5 mb-1">
                    <h3 className="font-extrabold text-[#1a365d] text-xs sm:text-sm uppercase tracking-wider border-b border-[#1a365d] pb-1 mb-2">
                      SUSTAINABLE DEVELOPMENT GOAL ALIGNMENT
                    </h3>
                    <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                      {selectedSdgs.map((sdg) => (
                        <a
                          key={sdg.id}
                          href={sdg.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 transition-transform hover:scale-105"
                        >
                          <img
                            src={sdg.iconUrl}
                            alt={`${sdg.code}: ${sdg.name}`}
                            className="report-sdg-img w-16 h-16 sm:w-[68px] sm:h-[68px] print:w-[64px] print:h-[64px] rounded-lg object-contain shadow-xs"
                            style={{ width: '64px', height: '64px' }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Event Photographs (Right below SDG Alignment) */}
                  {photos.length > 0 && (
                    <div className="pt-1 mb-1">
                      <h3 className="font-extrabold text-[#1a365d] text-xs sm:text-sm uppercase tracking-wider border-b border-[#1a365d] pb-1 mb-2">
                        EVENT PHOTOGRAPHS &amp; VISUAL EVIDENCE
                      </h3>
                      <div className="report-photo-grid grid grid-cols-2 gap-3 pt-0.5 w-full justify-center">
                        {photos.slice(0, 4).map((p, idx) => (
                          <div key={idx} className="report-photo-item text-center flex flex-col items-center">
                            <div className="w-full h-[150px] bg-slate-50 rounded-lg overflow-hidden shadow-xs flex items-center justify-center">
                              <img src={p.url} alt={p.caption || `Photo ${idx + 1}`} className="report-photo-img w-full h-[150px] object-cover rounded-lg" style={{ height: '150px', maxHeight: '150px' }} />
                            </div>
                            <p className="report-caption text-[10px] sm:text-[11px] font-semibold italic text-slate-700 pt-1" style={{ fontFamily: 'Arial, sans-serif' }}>
                              {p.caption?.trim() ? p.caption.trim() : `Event Photo ${idx + 1}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 3: Social Media & Digital Coverage */}
                  <div className="pt-1 mb-1">
                    <h3 className="font-extrabold text-[#1a365d] text-xs sm:text-sm uppercase tracking-wider border-b border-[#1a365d] pb-1 mb-1.5">
                      SOCIAL MEDIA &amp; DIGITAL COVERAGE
                    </h3>
                    <div className="pt-0.5 text-left">
                      <span className="font-bold text-[#1a365d] text-xs mr-1.5" style={{ fontFamily: 'Cambria, Georgia, serif' }}>LinkedIn Post URL:</span>
                      <a
                        href={linkedinUrl || 'https://www.linkedin.com/school/sanskrithi-school-of-engineering'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 no-underline font-medium text-xs inline-flex items-center gap-1"
                        style={{ fontFamily: 'Cambria, Georgia, serif', textDecoration: 'none' }}
                      >
                        <span>{linkedinUrl || 'https://www.linkedin.com/school/sanskrithi-school-of-engineering'}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 print:hidden" />
                      </a>
                    </div>
                  </div>

                  {/* Official Signatures - Pinned at bottom of page 2 */}
                  <div className="report-signatures-grid pt-6 pb-2 flex flex-row justify-between text-center mt-auto w-full">
                    <div className="report-signature-col flex-1 space-y-1">
                      <div className="border-t-2 border-slate-800 w-32 sm:w-36 mx-auto pt-1.5 font-extrabold text-slate-900 text-xs">
                        {secretaryName || 'Faculty Coordinator'}
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">Event Convener</div>
                    </div>

                    <div className="report-signature-col flex-1 space-y-1">
                      <div className="border-t-2 border-slate-800 w-32 sm:w-36 mx-auto pt-1.5 font-extrabold text-slate-900 text-xs">
                        Head of Department
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">Department of {department}</div>
                    </div>

                    <div className="report-signature-col flex-1 space-y-1">
                      <div className="border-t-2 border-slate-800 w-32 sm:w-36 mx-auto pt-1.5 font-extrabold text-slate-900 text-xs">
                        Principal
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">Sanskrithi School of Engineering</div>
                    </div>
                  </div>
                </div>

                {/* Page 2 Footer */}
                <div className="pt-2 border-t border-slate-200 text-center font-extrabold text-[#1a365d] text-xs mt-auto">
                  2
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
