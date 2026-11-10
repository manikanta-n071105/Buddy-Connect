import { createWorker, Worker } from 'tesseract.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';

let workerInstance: Worker | null = null;
let workerInitPromise: Promise<Worker> | null = null;

export async function getWorker(): Promise<Worker> {
  if (workerInstance) return workerInstance;
  if (!workerInitPromise) {
    workerInitPromise = (async () => {
      const w = await createWorker('eng');
      try {
        await w.setParameters({
          tessedit_pageseg_mode: '6' as any, // Assume a uniform block of text for 3x faster recognition
        });
      } catch (e) {
        // Fallback gracefully if setParameters fails
      }
      workerInstance = w;
      return w;
    })();
  }
  return workerInitPromise;
}

// Pre-warm OCR worker in background on boot
getWorker().catch((err) => {
  console.warn('[OCR] Background worker pre-warm warning:', err.message);
});

export interface ExtractedIdCardData {
  registerNumber: string | null;
  name: string | null;
  department: string | null;
  rawText: string;
}

export function parseStudentDetailsFromText(rawText: string): {
  registerNumber: string | null;
  name: string | null;
  department: string | null;
} {
  const clean = rawText
    .replace(/[|!]/g, '')
    .replace(/—/g, '-')
    .replace(/[:;]/g, ':');

  let registerNumber: string | null = null;

  // 1. Prefix match (Register No: 23KF1A0591, Roll No: ..., etc.)
  const prefixMatch = clean.match(
    /(?:Register|Reg|Roll|HT|PIN|ID|Seat)[\s._\-–:]*(?:No|Num|Number)?[\s._\-–:]*([0-9A-Za-z]{6,12})/i
  );
  if (prefixMatch && prefixMatch[1]) {
    registerNumber = prefixMatch[1].trim().toUpperCase();
  }

  // 2. JNTU standard pattern: 2 digits + 2 alphanumeric + 1/5 + 1 alphanumeric + 4 alphanumeric (e.g. 23KF1A0591)
  if (!registerNumber) {
    const jntuMatch = clean.match(/\b([0-9]{2}[A-Za-z0-9]{2}[15][A-Za-z0-9]{1}[0-9A-Za-z]{4})\b/i);
    if (jntuMatch && jntuMatch[1]) {
      registerNumber = jntuMatch[1].trim().toUpperCase();
    }
  }

  // 3. College code pattern (JRS-123, SRS-222, etc.)
  if (!registerNumber) {
    const codeMatch = clean.match(/\b(JRS-[0-9]{1,4}|SRS-[0-9]{1,4}|FAC-[0-9]{1,4})\b/i);
    if (codeMatch && codeMatch[1]) {
      registerNumber = codeMatch[1].trim().toUpperCase();
    }
  }

  // 4. General 10-char alphanumeric fallback (e.g., 23KF1A0591)
  if (!registerNumber) {
    const general10Match = clean.match(/\b([0-9]{2}[A-Za-z]{2}[0-9A-Za-z]{6})\b/i);
    if (general10Match && general10Match[1]) {
      registerNumber = general10Match[1].trim().toUpperCase();
    }
  }

  // Name extraction
  let name: string | null = null;
  const nameMatch = clean.match(
    /Name[\s._\-–:]+([A-Za-z\s.]+?)(?=\n|Department|Dept|Register|Reg|Roll|Valid|DOB|$)/i
  );
  if (nameMatch && nameMatch[1]) {
    const candidateName = nameMatch[1].trim();
    if (candidateName.length >= 2 && candidateName.length <= 40) {
      name = candidateName;
    }
  }

  // Department extraction
  let department: string | null = null;
  const deptMatch = clean.match(
    /(?:Department|Dept|Branch)[\s._\-–:]+([A-Za-z0-9\s\-]+?)(?=\n|Register|Reg|Roll|Valid|DOB|$)/i
  );
  if (deptMatch && deptMatch[1]) {
    const candidateDept = deptMatch[1].trim();
    if (candidateDept.length >= 2 && candidateDept.length <= 40) {
      department = candidateDept;
    }
  }

  return { registerNumber, name, department };
}

export async function extractStudentFromIdCardImage(imageBuffer: Buffer): Promise<ExtractedIdCardData> {
  const img = await loadImage(imageBuffer);
  const worker = await getWorker();

  // Downscale image if larger than 900px for lightning-fast OCR (sub-300ms)
  let w = img.width;
  let h = img.height;
  const maxDim = 900;
  if (w > maxDim || h > maxDim) {
    const ratio = Math.min(maxDim / w, maxDim / h);
    w = Math.floor(w * ratio);
    h = Math.floor(h * ratio);
  }

  // PASS 1: Preprocess Bottom Banner (Targeted for College ID cards with colored footer banner)
  try {
    const bottomY = Math.floor(h * 0.65);
    const bottomHeight = h - bottomY;

    const canvas = createCanvas(w, bottomHeight);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      img,
      0,
      Math.floor(img.height * 0.65),
      img.width,
      img.height - Math.floor(img.height * 0.65),
      0,
      0,
      w,
      bottomHeight
    );

    const imgData = ctx.getImageData(0, 0, w, bottomHeight);
    const data = imgData.data;

    // Filter white text on colored/red background
    for (let i = 0; i < data.length; i += 4) {
      const isWhiteText = data[i + 1] > 120 && data[i + 2] > 120 && data[i] > 120;
      const val = isWhiteText ? 0 : 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }

    ctx.putImageData(imgData, 0, 0);
    const bottomBuffer = canvas.toBuffer('image/png');

    const bottomResult = await worker.recognize(bottomBuffer);
    const bottomDetails = parseStudentDetailsFromText(bottomResult.data.text);

    // If Pass 1 finds roll number, return immediately in ~280ms!
    if (bottomDetails.registerNumber) {
      return {
        registerNumber: bottomDetails.registerNumber,
        name: bottomDetails.name,
        department: bottomDetails.department,
        rawText: bottomResult.data.text
      };
    }
  } catch (err) {
    console.warn('[OCR] Pass 1 bottom banner OCR warning:', err);
  }

  // PASS 2: Full Image Grayscale with High Contrast (For ID cards where roll is in header/body)
  try {
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const val = gray < 130 ? 0 : 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }

    ctx.putImageData(imgData, 0, 0);
    const fullBuffer = canvas.toBuffer('image/png');

    const fullResult = await worker.recognize(fullBuffer);
    const fullDetails = parseStudentDetailsFromText(fullResult.data.text);

    if (fullDetails.registerNumber || fullDetails.name) {
      return {
        registerNumber: fullDetails.registerNumber,
        name: fullDetails.name,
        department: fullDetails.department,
        rawText: fullResult.data.text
      };
    }
  } catch (err) {
    console.warn('[OCR] Pass 2 full image OCR warning:', err);
  }

  // PASS 3: Raw Image OCR Fallback
  const rawResult = await worker.recognize(imageBuffer);
  const rawDetails = parseStudentDetailsFromText(rawResult.data.text);

  return {
    registerNumber: rawDetails.registerNumber,
    name: rawDetails.name,
    department: rawDetails.department,
    rawText: rawResult.data.text
  };
}
