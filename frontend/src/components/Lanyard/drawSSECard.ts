import * as QRCodeModule from 'qrcode';

const QRCodeLib = (QRCodeModule as any).default || QRCodeModule;

export interface SSECardData {
  name: string;
  department: string;
  registerNo: string;
  userRole?: string;
  residenceStatus?: string;
  bloodGroup?: string;
  academicYear?: string;
  validUpto?: string;
  phone?: string;
  sLogoImage?: HTMLImageElement | null;
}

/**
 * Robust helper to draw rounded rectangles with explicit path isolation
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fillColor?: string | CanvasGradient | CanvasPattern,
  strokeColor?: string | CanvasGradient | CanvasPattern,
  lineWidth?: number
) {
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth || 1;
    ctx.stroke();
  }
}

/**
 * Draws a realistic Smart Card EMV Chip with golden contacts
 */
function drawSmartChip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.3, '#eab308');
  grad.addColorStop(0.7, '#ca8a04');
  grad.addColorStop(1, '#a16207');
  drawRoundedRect(ctx, x, y, w, h, 8, grad, '#78350f', 2);

  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.5);
  ctx.lineTo(x + w, y + h * 0.5);
  ctx.moveTo(x + w * 0.35, y);
  ctx.lineTo(x + w * 0.35, y + h);
  ctx.moveTo(x + w * 0.65, y);
  ctx.lineTo(x + w * 0.65, y + h);
  ctx.stroke();

  drawRoundedRect(ctx, x + w * 0.28, y + h * 0.25, w * 0.44, h * 0.5, 4, grad, '#78350f', 1.5);
}

/**
 * Draws a crystal-clear Sanskrithi School of Engineering ID Card:
 * - Executive Smart Pass Aesthetic (Gold EMV Chip, contactless wave, security guilloche)
 * - Side-by-Side layout: High-contrast QR Code on left, All Profile credentials on right
 * - Authentic Sanskrithi college colors (terracotta gradient #991b1b -> #c2410c -> #ea580c)
 * - Complete details: Name, Roll No, Branch, Role, Residence, Blood Group, Validity, Helpline
 */
export function drawSSEIdCard(canvas: HTMLCanvasElement, data: SSECardData) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  const rawName = data.name || 'N MANIKANTA';
  const rawDept = data.department || 'CSE - B';
  const rawReg = data.registerNo || '23KF1A0591';
  const rawRole = data.userRole || 'SENIOR MENTOR';
  const rawResidence = data.residenceStatus || 'DAY SCHOLAR';
  const rawBlood = data.bloodGroup || 'O +VE';
  const academicYear = data.academicYear || '2025 - 2026';
  const validUpto = data.validUpto || 'MAY 2027';
  const phone = data.phone || '+91 91009 67666';

  const name = rawName.toUpperCase();
  const department = rawDept.toUpperCase();
  const registerNo = rawReg.toUpperCase();
  const role = rawRole.replace(/_/g, ' ').toUpperCase();
  const residence = rawResidence.replace(/_/g, ' ').toUpperCase();
  const bloodGroup = rawBlood.toUpperCase();

  // ─────────────────────────────────────────────────────────────
  // FRONT FACE: (0, 0) to (W * 0.5, H * 0.755)
  // Visible safe area: X from 25 to 999, Y from 170 to 1530
  // ─────────────────────────────────────────────────────────────
  const fw = W * 0.5;
  const fh = H * 0.755;

  // 1. Crisp White & Subtle Gradient Base
  const bgGrad = ctx.createLinearGradient(0, 0, fw, fh);
  bgGrad.addColorStop(0, '#ffffff');
  bgGrad.addColorStop(0.4, '#f8fafc');
  bgGrad.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, fw, fh);

  // Subtle guilloche security pattern
  ctx.save();
  ctx.strokeStyle = 'rgba(200, 71, 36, 0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < fw + fh; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(0, i);
    ctx.stroke();
  }
  ctx.restore();

  // Outer Card Bezel with layered metallic champagne edge
  drawRoundedRect(ctx, 12, 12, fw - 24, fh - 24, 28, undefined, '#cbd5e1', 3);
  drawRoundedRect(ctx, 16, 16, fw - 32, fh - 32, 24, undefined, 'rgba(200, 71, 36, 0.25)', 1.5);

  // 2. TOP HEADER: Sanskrithi Logo & College Name
  // Positioned at y = 175 to clear the top clamp
  const headerY = 175;
  const headerH = 145;
  const headGrad = ctx.createLinearGradient(35, headerY, fw - 35, headerY + headerH);
  headGrad.addColorStop(0, '#991b1b');
  headGrad.addColorStop(0.35, '#c2410c');
  headGrad.addColorStop(1, '#ea580c');

  drawRoundedRect(ctx, 35, headerY, fw - 70, headerH, 18, headGrad);

  // Gold hairline top accent
  drawRoundedRect(ctx, 45, headerY + 4, fw - 90, 3, 1.5, '#fef08a');

  // Official Sanskrithi S Emblem Badge
  const logoX = 52;
  const logoY = headerY + 18;
  const logoSize = 108;

  // White base for emblem
  drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, 20, '#ffffff', '#fed7aa', 3);

  if (data.sLogoImage && data.sLogoImage.complete && data.sLogoImage.naturalWidth > 0) {
    ctx.drawImage(data.sLogoImage, logoX + 6, logoY + 6, logoSize - 12, logoSize - 12);
  } else {
    // Vector Sanskrithi SSE Logo Emblem
    drawRoundedRect(ctx, logoX + 8, logoY + 8, logoSize - 16, logoSize - 16, 14, '#c84724');
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(logoX + 74, logoY + 34);
    ctx.bezierCurveTo(logoX + 32, logoY + 24, logoX + 22, logoY + 52, logoX + 54, logoY + 54);
    ctx.bezierCurveTo(logoX + 84, logoY + 56, logoX + 70, logoY + 86, logoX + 28, logoY + 76);
    ctx.stroke();
    ctx.restore();
  }

  // College Name Typography
  const titleX = logoX + logoSize + 22;
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px "Inter", "Arial Black", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SANSKRITHI SCHOOL OF', titleX, headerY + 50);

  ctx.font = '900 48px "Inter", "Arial Black", sans-serif';
  ctx.fillText('ENGINEERING', titleX, headerY + 98);

  // Accreditation pill badge inside header
  drawRoundedRect(ctx, titleX, headerY + 110, 480, 24, 12, 'rgba(0, 0, 0, 0.25)');
  ctx.fillStyle = '#ffedd5';
  ctx.font = '800 13px "Inter", sans-serif';
  ctx.fillText('AUTONOMOUS  •  AFFILIATED TO JNTUA  •  APPROVED BY AICTE', titleX + 14, headerY + 127);

  // Sub-Banner Ribbon: Student Identity Card & Academic Year
  const ribbonY = headerY + headerH + 10;
  drawRoundedRect(ctx, 35, ribbonY, fw - 70, 38, 8, '#0f172a');

  ctx.fillStyle = '#fde047';
  ctx.font = '900 16px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`★  STUDENT IDENTITY CARD  •  ACADEMIC YEAR ${academicYear}  ★`, fw / 2, ribbonY + 25);

  // ─────────────────────────────────────────────────────────────
  // 3. MAIN BODY: HARMONIOUS SIDE-BY-SIDE SMART PASS
  // ─────────────────────────────────────────────────────────────
  const bodyY = ribbonY + 48;
  const bodyH = 970;

  const leftColX = 35;
  const leftColW = 430;
  const rightColX = 485;
  const rightColW = fw - rightColX - 35; // 504

  // ── LEFT SIDE: HIGH-TECH DIGITAL CLEARANCE & QR ──
  drawRoundedRect(ctx, leftColX, bodyY, leftColW, bodyH, 20, '#ffffff', '#e2e8f0', 2);
  drawRoundedRect(ctx, leftColX, bodyY, leftColW, 46, 20, '#f8fafc', '#e2e8f0', 1);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 17px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DIGITAL CAMPUS PASS', leftColX + leftColW / 2, bodyY + 30);

  // Smart EMV Contact Chip & Contactless indicator
  const chipX = leftColX + 24;
  const chipY = bodyY + 60;
  drawSmartChip(ctx, chipX, chipY, 74, 54);

  // Contactless Wave Icon
  ctx.save();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(chipX + 115, chipY + 27, i * 9, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();
  }
  ctx.restore();

  // High Security Badge Label
  drawRoundedRect(ctx, leftColX + leftColW - 145, chipY + 12, 120, 28, 14, '#ecfdf5', '#a7f3d0', 1.5);
  ctx.fillStyle = '#059669';
  ctx.font = '900 13px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('● SECURE PASS', leftColX + leftColW - 85, chipY + 31);

  // Scannable QR Code (320x320)
  const qrSize = 320;
  const qrX = leftColX + (leftColW - qrSize) / 2;
  const qrY = chipY + 70;

  drawRoundedRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 16, '#ffffff', '#cbd5e1', 2);

  try {
    const qrData = `https://buddy-connect-xi.vercel.app/verify?reg=${registerNo}&name=${encodeURIComponent(name)}&dept=${encodeURIComponent(department)}&role=${encodeURIComponent(role)}`;
    const qr = QRCodeLib.create(qrData, { errorCorrectionLevel: 'H' });
    const moduleCount = qr.modules.size;
    const cellSize = qrSize / moduleCount;

    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          ctx.fillRect(qrX + c * cellSize, qrY + r * cellSize, cellSize + 0.35, cellSize + 0.35);
        }
      }
    }
  } catch (err) {
    console.error('QR render error:', err);
  }

  // QR Description
  const qrMetaY = qrY + qrSize + 32;
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 20px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AUTHENTICATION QR CODE', leftColX + leftColW / 2, qrMetaY);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 15px "Inter", sans-serif';
  ctx.fillText('Scan for real-time verification & entry', leftColX + leftColW / 2, qrMetaY + 24);

  // ID Registration Pill
  drawRoundedRect(ctx, leftColX + 24, qrMetaY + 44, leftColW - 48, 48, 12, '#f1f5f9', '#cbd5e1', 1.5);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 22px monospace';
  ctx.fillText(`REG ID: ${registerNo}`, leftColX + leftColW / 2, qrMetaY + 75);

  // Verified Status Pill
  drawRoundedRect(ctx, leftColX + 24, qrMetaY + 104, leftColW - 48, 50, 25, '#dcfce7', '#22c55e', 2);
  ctx.fillStyle = '#15803d';
  ctx.font = '900 18px "Inter", sans-serif';
  ctx.fillText('✓ SSE AUTHORIZED STUDENT', leftColX + leftColW / 2, qrMetaY + 136);

  // Barcode at base of left column
  const bcY = qrMetaY + 172;
  const bcW = leftColW - 60;
  const bcX = leftColX + 30;
  ctx.fillStyle = '#0f172a';
  for (let x = 0; x < bcW; x += 6) {
    if ((x * 19) % 7 > 2) {
      ctx.fillRect(bcX + x, bcY, 3.5, 42);
    }
  }
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`* ${registerNo} *`, leftColX + leftColW / 2, bcY + 62);


  // ── RIGHT SIDE: EXECUTIVE PROFILE CREDENTIALS ──
  drawRoundedRect(ctx, rightColX, bodyY, rightColW, bodyH, 20, '#ffffff', '#e2e8f0', 2);

  // Header Banner on Right Column
  drawRoundedRect(ctx, rightColX, bodyY, rightColW, 46, 20, '#c84724');
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 17px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OFFICIAL STUDENT CREDENTIALS', rightColX + rightColW / 2, bodyY + 30);

  const innerX = rightColX + 16;
  const innerW = rightColW - 32;

  // 1. Prominent Student Name Card Tile
  const nameTileY = bodyY + 60;
  drawRoundedRect(ctx, innerX, nameTileY, innerW, 108, 14, '#f8fafc', '#cbd5e1', 1.5);
  drawRoundedRect(ctx, innerX, nameTileY, 6, 108, 3, '#c84724');

  ctx.textAlign = 'left';
  ctx.fillStyle = '#c84724';
  ctx.font = '900 15px "Inter", sans-serif';
  ctx.fillText('FULL NAME', innerX + 22, nameTileY + 32);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 40px "Inter", sans-serif';
  ctx.fillText(name, innerX + 22, nameTileY + 78);

  // 2. Structured Credential Tiles
  const startCredY = nameTileY + 120;
  const cardH = 96;
  const cardGap = 12;

  // Tile 1: ROLL / REGISTER NUMBER
  let curY = startCredY;
  drawRoundedRect(ctx, innerX, curY, innerW, cardH, 12, '#f8fafc', '#e2e8f0', 1.5);
  drawRoundedRect(ctx, innerX, curY, 5, cardH, 2.5, '#c84724');
  ctx.fillStyle = '#c84724';
  ctx.font = '900 15px "Inter", sans-serif';
  ctx.fillText('ROLL / REGISTER NUMBER', innerX + 20, curY + 30);
  ctx.font = '900 36px "Inter", sans-serif';
  ctx.fillText(registerNo, innerX + 20, curY + 72);

  // Tile 2: BRANCH & SPECIALIZATION
  curY += cardH + cardGap;
  drawRoundedRect(ctx, innerX, curY, innerW, cardH, 12, '#f8fafc', '#e2e8f0', 1.5);
  drawRoundedRect(ctx, innerX, curY, 5, cardH, 2.5, '#94a3b8');
  ctx.fillStyle = '#64748b';
  ctx.font = '900 15px "Inter", sans-serif';
  ctx.fillText('BRANCH & SPECIALIZATION', innerX + 20, curY + 30);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 33px "Inter", sans-serif';
  ctx.fillText(department, innerX + 20, curY + 72);

  // Tile 3: CAMPUS DESIGNATION
  curY += cardH + cardGap;
  drawRoundedRect(ctx, innerX, curY, innerW, cardH, 12, '#f8fafc', '#e2e8f0', 1.5);
  drawRoundedRect(ctx, innerX, curY, 5, cardH, 2.5, '#ea580c');
  ctx.fillStyle = '#64748b';
  ctx.font = '900 15px "Inter", sans-serif';
  ctx.fillText('CAMPUS DESIGNATION', innerX + 20, curY + 30);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 33px "Inter", sans-serif';
  ctx.fillText(role, innerX + 20, curY + 72);

  // Gold/Orange badge on right of role card
  drawRoundedRect(ctx, innerX + innerW - 135, curY + 32, 120, 32, 16, '#ffedd5', '#ea580c', 1.5);
  ctx.fillStyle = '#c2410c';
  ctx.font = '900 13px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MENTOR', innerX + innerW - 75, curY + 53);
  ctx.textAlign = 'left';

  // Tile 4: CAMPUS RESIDENCE STATUS
  curY += cardH + cardGap;
  drawRoundedRect(ctx, innerX, curY, innerW, cardH, 12, '#f8fafc', '#e2e8f0', 1.5);
  drawRoundedRect(ctx, innerX, curY, 5, cardH, 2.5, '#94a3b8');
  ctx.fillStyle = '#64748b';
  ctx.font = '900 15px "Inter", sans-serif';
  ctx.fillText('RESIDENCE STATUS', innerX + 20, curY + 30);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 33px "Inter", sans-serif';
  ctx.fillText(residence, innerX + 20, curY + 72);

  // Tile 5: TWO COLUMNS SPLIT - BLOOD GROUP & VALIDITY PERIOD
  curY += cardH + cardGap;
  const halfW = (innerW - 10) / 2;

  // Left Half: Blood Group
  drawRoundedRect(ctx, innerX, curY, halfW, cardH, 12, '#f8fafc', '#e2e8f0', 1.5);
  drawRoundedRect(ctx, innerX, curY, 5, cardH, 2.5, '#ef4444');
  ctx.fillStyle = '#b91c1c';
  ctx.font = '900 15px "Inter", sans-serif';
  ctx.fillText('BLOOD GROUP', innerX + 16, curY + 30);
  ctx.font = '900 34px "Inter", sans-serif';
  ctx.fillText(bloodGroup, innerX + 16, curY + 72);

  // Right Half: Validity
  drawRoundedRect(ctx, innerX + halfW + 10, curY, halfW, cardH, 12, '#f8fafc', '#e2e8f0', 1.5);
  drawRoundedRect(ctx, innerX + halfW + 10, curY, 5, cardH, 2.5, '#059669');
  ctx.fillStyle = '#059669';
  ctx.font = '900 15px "Inter", sans-serif';
  ctx.fillText('VALID UPTO', innerX + halfW + 26, curY + 30);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 31px "Inter", sans-serif';
  ctx.fillText(validUpto, innerX + halfW + 26, curY + 72);

  // Tile 6: CAMPUS HELPLINE
  curY += cardH + cardGap;
  drawRoundedRect(ctx, innerX, curY, innerW, cardH, 12, '#f8fafc', '#e2e8f0', 1.5);
  drawRoundedRect(ctx, innerX, curY, 5, cardH, 2.5, '#94a3b8');
  ctx.fillStyle = '#64748b';
  ctx.font = '900 15px "Inter", sans-serif';
  ctx.fillText('24×7 CAMPUS HELPLINE', innerX + 20, curY + 30);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 33px "Inter", sans-serif';
  ctx.fillText(phone, innerX + 20, curY + 72);

  // Authority footer line
  curY += cardH + 16;
  drawRoundedRect(ctx, innerX, curY, innerW, 36, 8, '#f1f5f9');
  ctx.fillStyle = '#64748b';
  ctx.font = '800 13px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DIRECTORATE OF ACADEMIC AFFAIRS  •  ISSUED UNDER SSE ACT', innerX + innerW / 2, curY + 23);

  // ─────────────────────────────────────────────────────────────
  // 4. BOTTOM INSTITUTIONAL FOOTER
  // ─────────────────────────────────────────────────────────────
  const footY = bodyY + bodyH + 16;
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 20px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SANSKRITHI SCHOOL OF ENGINEERING  •  PUTTAPARTHI', fw / 2, footY + 26);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 15px "Inter", sans-serif';
  ctx.fillText('Beedupalli Knowledge Hub, Prashanthi Gram, AP - 515134  |  Toll-Free: +91 91009 67666', fw / 2, footY + 52);


  // ─────────────────────────────────────────────────────────────
  // BACK FACE: (W * 0.5, 0) to (W, H * 0.757)
  // ─────────────────────────────────────────────────────────────
  const bx = W * 0.5;
  const bw = W * 0.5;
  const bh = H * 0.757;

  // Back card clean white base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx, 0, bw, bh);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 6;
  ctx.strokeRect(bx + 8, 8, bw - 16, bh - 16);

  // Top Orange Header on back
  ctx.fillStyle = '#c84724';
  ctx.fillRect(bx + 12, 12, bw - 24, 130);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SANSKRITHI SCHOOL OF ENGINEERING', bx + bw / 2, 65);

  ctx.fillStyle = '#ffedd5';
  ctx.font = 'bold 20px "Inter", sans-serif';
  ctx.fillText('CAMPUS EMERGENCY DIRECTORY & REGULATIONS', bx + bw / 2, 105);

  // Back Center Scannable QR Code
  const backQrSize = 360;
  const backQrX = bx + (bw - backQrSize) / 2;
  const backQrY = 180;

  drawRoundedRect(ctx, backQrX - 25, backQrY - 25, backQrSize + 50, backQrSize + 50, 20, '#f8fafc', '#cbd5e1', 2);

  try {
    const fullQrPayload = `https://buddy-connect-xi.vercel.app/verify?reg=${registerNo}&name=${encodeURIComponent(name)}&dept=${encodeURIComponent(department)}&role=${encodeURIComponent(role)}`;
    const qrBack = QRCodeLib.create(fullQrPayload, { errorCorrectionLevel: 'H' });
    const mCount = qrBack.modules.size;
    const cSize = backQrSize / mCount;

    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < mCount; r++) {
      for (let c = 0; c < mCount; c++) {
        if (qrBack.modules.get(r, c)) {
          ctx.fillRect(backQrX + c * cSize, backQrY + r * cSize, cSize + 0.35, cSize + 0.35);
        }
      }
    }
  } catch (e) {
    console.error('Back QR error:', e);
  }

  // Emergency Directory Box
  const dirY = backQrY + backQrSize + 60;
  const dirW = bw - 100;
  const dirX = bx + 50;
  const dirH = 430;

  drawRoundedRect(ctx, dirX, dirY, dirW, dirH, 20, '#f8fafc', '#cbd5e1', 2);

  // Directory Title
  drawRoundedRect(ctx, dirX + 25, dirY + 20, dirW - 50, 48, 12, '#0f172a');
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('IMPORTANT CAMPUS HELPLINES', dirX + dirW / 2, dirY + 52);

  const helplines = [
    { label: 'Campus Security', num: '+91 91009 67666' },
    { label: 'Hostel Office', num: '08555-287222' },
    { label: 'Anti-Ragging Helpline', num: '1800-180-5522' },
    { label: 'Medical Emergency', num: '108 / 104' },
    { label: 'Academic Cell', num: '08555-287333' }
  ];

  ctx.textAlign = 'left';
  helplines.forEach((h, i) => {
    const hy = dirY + 115 + i * 58;
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px "Inter", sans-serif';
    ctx.fillText(h.label, dirX + 45, hy);

    ctx.fillStyle = '#c84724';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(h.num, dirX + dirW - 45, hy);
    ctx.textAlign = 'left';

    if (i < helplines.length - 1) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(dirX + 45, hy + 18, dirW - 90, 1.5);
    }
  });

  // Regulatory text
  ctx.fillStyle = '#64748b';
  ctx.font = '600 18px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('This card is the property of Sanskrithi School of Engineering.', bx + bw / 2, dirY + dirH + 50);
  ctx.fillText('If found, please return to the Principal / Security Desk.', bx + bw / 2, dirY + dirH + 80);
}
