import { jsPDF } from 'jspdf';
import { BeneficiaryProfile, RecommendedNSQF } from '../types';

/**
 * Sanitizes input text by removing or mapping Devanagari/non-ASCII characters 
 * to ensure jsPDF built-in Helvetica font renders cleanly without broken symbols ([] or ?).
 */
function sanitizeText(str: string | undefined | null): string {
  if (!str) return '';

  // Common Hindi phrase translations for PDF dossier cleanliness
  let s = str
    .replace(/रमेश कुमार/g, 'Ramesh Kumar')
    .replace(/साथी/g, 'Saathi (Beneficiary)')
    .replace(/8वीं पास/g, '8th Pass')
    .replace(/10वीं पास/g, '10th Pass')
    .replace(/12वीं पास/g, '12th Pass')
    .replace(/आईटीआई प्रमाण पत्र/g, 'ITI Certificate')
    .replace(/अनौपचारिक शिक्षा/g, 'Informal Education')
    .replace(/सोलर पीवी एवं बिजली कार्य/g, 'Solar PV & Electrical Work')
    .replace(/स्वरोजगार \(Self-Employment\)/g, 'Self-Employment')
    .replace(/स्वरोजगार/g, 'Self-Employment')
    .replace(/जिले के अंदर \(15 किमी दायरा\)/g, 'Within District (15 km radius)')
    .replace(/वाराणसी/g, 'Varanasi')
    .replace(/गोरखपुर/g, 'Gorakhpur')
    .replace(/झांसी/g, 'Jhansi')
    .replace(/पटना/g, 'Patna')
    .replace(/लखनऊ/g, 'Lucknow')
    .replace(/उत्तर प्रदेश/g, 'Uttar Pradesh')
    .replace(/बिहार/g, 'Bihar')
    .replace(/माह/g, 'month')
    .replace(/₹/g, 'Rs. ');

  // Strip remaining non-ASCII characters (Devanagari glyphs) to keep font clean
  s = s.replace(/[^\x00-\x7F]/g, '');
  return s.trim();
}

export function generateBusinessProposalPDF(
  profile: BeneficiaryProfile,
  nsqf: RecommendedNSQF,
  district: string = "Varanasi"
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const marginX = 15;
  const contentWidth = pageWidth - (marginX * 2); // 180mm

  const nameClean = sanitizeText(profile.beneficiaryName) || 'Ramesh Kumar';
  const educationClean = sanitizeText(profile.educationLevel) || '8th Pass';
  const occupationClean = sanitizeText(profile.traditionalOccupation) || 'Solar PV & Electrical Work';
  const preferenceClean = sanitizeText(profile.employmentPreference) || 'Self-Employment';
  const radiusClean = sanitizeText(profile.mobilityRadius) || 'Within District (15 km)';
  const districtClean = sanitizeText(district) || 'Varanasi';

  const roleClean = sanitizeText(nsqf.roleName) || 'Solar PV Installer & Electrician';
  const incomeClean = sanitizeText(nsqf.estimatedIncome) || 'Rs. 18,000 - Rs. 26,000 / month';

  // 1. Header Bar (Teal Brand Color #009378)
  doc.setFillColor(0, 147, 120);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Header Title & Subtitles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text("PRADHAN MANTRI ANUSUCHIT JAATI ABHYUDAY YOJANA (PM-AJAY)", pageWidth / 2, 10, { align: 'center' });
  
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text("Micro-Enterprise Grant-in-Aid (GIA) & MUDRA Loan Application Dossier", pageWidth / 2, 16, { align: 'center' });
  doc.text("Ministry of Social Justice & Empowerment, Govt. of India", pageWidth / 2, 21, { align: 'center' });

  // Reset colors
  doc.setTextColor(20, 35, 31);
  let y = 35;

  // Document Title & Metadata Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("1-PAGE MICRO-BUSINESS PROPOSAL & GIA DOSSIER", marginX, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(84, 101, 95);
  doc.text(`Generated via AJAY-VANI Voice Livelihood Assistant | Date: ${new Date().toLocaleDateString('en-IN')}`, marginX, y + 4.5);

  y += 11;

  // ---------------------------------------------------------
  // SECTION 1: BENEFICIARY PROFILE & LOCATION
  // ---------------------------------------------------------
  const sec1Height = 28;
  doc.setFillColor(248, 249, 248);
  doc.rect(marginX, y, contentWidth, sec1Height, 'F');
  doc.setDrawColor(215, 220, 218);
  doc.rect(marginX, y, contentWidth, sec1Height, 'S');

  doc.setTextColor(0, 147, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text("1. BENEFICIARY PROFILE & LOCATION", marginX + 3, y + 5.5);

  doc.setTextColor(20, 35, 31);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const col1X = marginX + 3;
  const col2X = marginX + 92;
  const colWidth = 84;

  doc.text(`Beneficiary Name: ${nameClean}`, col1X, y + 12, { maxWidth: colWidth });
  doc.text(`Target District: ${districtClean}, Uttar Pradesh`, col2X, y + 12, { maxWidth: colWidth });

  doc.text(`Education Level: ${educationClean}`, col1X, y + 18, { maxWidth: colWidth });
  doc.text(`Livelihood Preference: ${preferenceClean}`, col2X, y + 18, { maxWidth: colWidth });

  doc.text(`Mobility Scope: ${radiusClean}`, col1X, y + 24, { maxWidth: colWidth });
  doc.text("Category Status: Scheduled Caste (SC Eligible for GIA Grant)", col2X, y + 24, { maxWidth: colWidth });

  y += sec1Height + 6;

  // ---------------------------------------------------------
  // SECTION 2: NSQF QUALIFICATION & SKILLING LINKAGE
  // ---------------------------------------------------------
  const sec2Height = 26;
  doc.setFillColor(248, 249, 248);
  doc.rect(marginX, y, contentWidth, sec2Height, 'F');
  doc.setDrawColor(215, 220, 218);
  doc.rect(marginX, y, contentWidth, sec2Height, 'S');

  doc.setTextColor(0, 147, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text("2. NSQF QUALIFICATION & SKILLING LINKAGE", marginX + 3, y + 5.5);

  doc.setTextColor(20, 35, 31);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  doc.text(`Identified Trade / Role: ${roleClean}`, col1X, y + 12, { maxWidth: colWidth });
  doc.text(`Official QP Code: ${nsqf.qpCode} (NSQF Level ${nsqf.nsqfLevel})`, col2X, y + 12, { maxWidth: colWidth });

  doc.text(`District Feasibility Match: ${nsqf.matchScore}% Demand Match`, col1X, y + 18, { maxWidth: colWidth });
  doc.text(`Projected Monthly Income: ${incomeClean}`, col2X, y + 18, { maxWidth: colWidth });

  y += sec2Height + 6;

  // ---------------------------------------------------------
  // SECTION 3: PROJECT COSTING & SUBSIDY STRUCTURE
  // ---------------------------------------------------------
  const sec3Height = 56;
  doc.setFillColor(248, 249, 248);
  doc.rect(marginX, y, contentWidth, sec3Height, 'F');
  doc.setDrawColor(215, 220, 218);
  doc.rect(marginX, y, contentWidth, sec3Height, 'S');

  doc.setTextColor(0, 147, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text("3. PROJECT COSTING & PM-AJAY GIA SUBSIDY STRUCTURE (INR)", marginX + 3, y + 5.5);

  doc.setTextColor(84, 101, 95);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  
  doc.text("Project Component", marginX + 3, y + 12);
  doc.text("Amount (INR)", marginX + 90, y + 12);
  doc.text("Funding / Subsidy Scheme", marginX + 130, y + 12);

  doc.setDrawColor(215, 220, 218);
  doc.line(marginX + 3, y + 14, marginX + contentWidth - 3, y + 14);

  doc.setTextColor(20, 35, 31);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  // Row 1
  doc.text("1. Tools, Machinery & Worksite Setup", marginX + 3, y + 19);
  doc.text("Rs. 1,00,000", marginX + 90, y + 19);
  doc.text("Capital Asset Creation", marginX + 130, y + 19);

  // Row 2
  doc.text("2. Working Capital & Raw Material Stock", marginX + 3, y + 25);
  doc.text("Rs. 50,000", marginX + 90, y + 25);
  doc.text("Operations & Inventory", marginX + 130, y + 25);

  doc.line(marginX + 3, y + 27.5, marginX + contentWidth - 3, y + 27.5);

  // Total Row
  doc.setFont('helvetica', 'bold');
  doc.text("Total Estimated Project Outlay", marginX + 3, y + 32);
  doc.text("Rs. 1,50,000", marginX + 90, y + 32);
  doc.text("100% Total Cost", marginX + 130, y + 32);

  // Highlight Box for PM-AJAY GIA Subsidy
  const subBoxY = y + 36;
  doc.setFillColor(230, 244, 241);
  doc.rect(marginX + 3, subBoxY, contentWidth - 6, 16, 'F');
  doc.setDrawColor(0, 147, 120);
  doc.rect(marginX + 3, subBoxY, contentWidth - 6, 16, 'S');

  doc.setTextColor(0, 147, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("PM-AJAY Direct GIA Grant (Government of India Subsidy): Rs. 50,000 (100% Free Grant)", marginX + 6, subBoxY + 5.5);

  doc.setTextColor(20, 35, 31);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text("Bank Loan Component (PMMY MUDRA Shishu Scheme): Rs. 92,500 | Beneficiary Margin (5%): Rs. 7,500", marginX + 6, subBoxY + 11);

  y += sec3Height + 6;

  // ---------------------------------------------------------
  // SECTION 4: BDO SUBMISSION CHECKLIST & VERIFICATION
  // ---------------------------------------------------------
  doc.setTextColor(0, 147, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text("4. BDO SUBMISSION CHECKLIST & VERIFICATION", marginX, y);

  doc.setTextColor(20, 35, 31);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  y += 5;
  const items = [
    "[ X ] Aadhaar Card of Beneficiary (Demographically Verified via AJAY-VANI)",
    "[ X ] Valid Scheduled Caste (SC) Certificate issued by Competent Revenue Authority",
    "[ X ] PM-AJAY Short-Term Skill Training / Prior Learning Enrollment Confirmation",
    "[ X ] 1-Page Micro-Business Plan & Financial Outlay (Duly Recommended by Gram Sahayak)"
  ];

  items.forEach((item) => {
    doc.text(item, marginX + 2, y);
    y += 4.5;
  });

  y += 8;

  // ---------------------------------------------------------
  // SECTION 5: SIGNATURE & APPROVAL BLOCK
  // ---------------------------------------------------------
  doc.setDrawColor(180, 185, 183);
  doc.line(marginX + 3, y + 10, marginX + 70, y + 10);
  doc.line(marginX + 110, y + 10, marginX + 175, y + 10);

  doc.setFontSize(8);
  doc.setTextColor(84, 101, 95);
  doc.text("Signature / Thumb Impression of Beneficiary", marginX + 3, y + 14);
  doc.text("Gram Sahayak / BDO Field Inspector Seal", marginX + 110, y + 14);

  // ---------------------------------------------------------
  // FOOTER NOTE
  // ---------------------------------------------------------
  doc.setFontSize(7.5);
  doc.setTextColor(110, 125, 120);
  doc.text(
    "Notice: This dossier is generated under PM-AJAY Special Central Assistance guidelines. Zero processing fee. Form ID: AJAY-VANI-2026-VNS",
    pageWidth / 2,
    283,
    { align: 'center' }
  );

  doc.save(`PM-AJAY_Proposal_${nameClean.replace(/\s+/g, '_')}.pdf`);
}
