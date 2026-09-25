import { jsPDF } from 'jspdf';
import { BeneficiaryProfile, RecommendedNSQF } from '../types';

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

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Bar (Teal brand color #009378)
  doc.setFillColor(0, 147, 120);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text("PRADHAN MANTRI ANUSUCHIT JAATI ABHYUDAY YOJANA (PM-AJAY)", pageWidth / 2, 11, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Micro-Enterprise Grant-in-Aid (GIA) & MUDRA Linkage Application", pageWidth / 2, 17, { align: 'center' });
  doc.text("Ministry of Social Justice & Empowerment, Govt. of India", pageWidth / 2, 22, { align: 'center' });

  // Reset text color to ink
  doc.setTextColor(20, 35, 31);
  let y = 38;

  // Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text("1-PAGE MICRO-BUSINESS PROPOSAL & SUBSIDY DOSSIER", 15, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(84, 101, 95);
  doc.text(`Generated via AJAY-VANI Voice Assistant | Date: ${new Date().toLocaleDateString('en-IN')}`, 15, y + 5);

  y += 14;

  // Beneficiary Information Table
  doc.setFillColor(246, 246, 246);
  doc.rect(15, y, pageWidth - 30, 26, 'F');
  doc.setDrawColor(225, 224, 219);
  doc.rect(15, y, pageWidth - 30, 26, 'S');

  doc.setTextColor(20, 35, 31);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text("1. BENEFICIARY PROFILE & LOCATION", 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Beneficiary Name: ${profile.beneficiaryName}`, 18, y + 13);
  doc.text(`Target District: ${district}, Uttar Pradesh`, 110, y + 13);
  doc.text(`Education Level: ${profile.educationLevel}`, 18, y + 19);
  doc.text(`Target Livelihood Preference: ${profile.employmentPreference}`, 110, y + 19);
  doc.text(`Mobility Scope: ${profile.mobilityRadius}`, 18, y + 25);
  doc.text("Category Status: Scheduled Caste (SC Eligible for GIA)", 110, y + 25);

  y += 33;

  // Matched NSQF Qualification & Trade
  doc.setFillColor(246, 246, 246);
  doc.rect(15, y, pageWidth - 30, 24, 'F');
  doc.setDrawColor(225, 224, 219);
  doc.rect(15, y, pageWidth - 30, 24, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text("2. NSQF QUALIFICATION & SKILLING LINKAGE", 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Identified Trade / Role: ${nsqf.roleName}`, 18, y + 13);
  doc.text(`Official QP Code: ${nsqf.qpCode} (NSQF Level ${nsqf.nsqfLevel})`, 110, y + 13);
  doc.text(`District Feasibility Demand Score: ${nsqf.matchScore}% Match`, 18, y + 19);
  doc.text(`Projected Monthly Income: ${nsqf.estimatedIncome}`, 110, y + 19);

  y += 31;

  // Project Financial Outlay & PM-AJAY GIA Subsidy Breakup
  doc.setFillColor(246, 246, 246);
  doc.rect(15, y, pageWidth - 30, 48, 'F');
  doc.setDrawColor(225, 224, 219);
  doc.rect(15, y, pageWidth - 30, 48, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text("3. PROJECT COSTING & SUBSIDY STRUCTURE (INR)", 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text("Project Component", 18, y + 14);
  doc.text("Amount (INR)", 110, y + 14);
  doc.text("Funding / Subsidy Scheme", 145, y + 14);

  doc.line(18, y + 16, pageWidth - 18, y + 16);

  doc.text("1. Tools, Equipment & Worksite Setup", 18, y + 23);
  doc.text("Rs. 1,00,000", 110, y + 23);
  doc.text("Capital Asset Creation", 145, y + 23);

  doc.text("2. Working Capital & Initial Materials", 18, y + 29);
  doc.text("Rs. 50,000", 110, y + 29);
  doc.text("Operations / Inventory", 145, y + 29);

  doc.setFont('helvetica', 'bold');
  doc.text("Total Project Cost", 18, y + 36);
  doc.text("Rs. 1,50,000", 110, y + 36);

  doc.setTextColor(0, 147, 120);
  doc.text("PM-AJAY GIA Direct Subsidy Grant (Government of India): Rs. 50,000", 18, y + 42);
  doc.setTextColor(20, 35, 31);
  doc.setFont('helvetica', 'normal');
  doc.text("Bank Loan (PMMY MUDRA - Shishu): Rs. 92,500 | Beneficiary Margin (5%): Rs. 7,500", 18, y + 47);

  y += 55;

  // Submission Checklist & Verification
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text("4. BDO SUBMISSION CHECKLIST & VERIFICATION", 15, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 6;
  doc.text("[ X ] Aadhaar Card of Beneficiary (Demographically Verified)", 18, y);
  y += 5;
  doc.text("[ X ] Valid Scheduled Caste (SC) Certificate issued by Competent Authority", 18, y);
  y += 5;
  doc.text("[ X ] PM-AJAY Short-Term Skilling / Prior Learning Enrollment Confirmation", 18, y);
  y += 5;
  doc.text("[ X ] 1-Page Micro-Business Plan Attached (Duly Verified by Gram Sahayak)", 18, y);

  y += 14;

  // Signatures
  doc.setDrawColor(225, 224, 219);
  doc.line(18, y + 16, 75, y + 16);
  doc.line(125, y + 16, 185, y + 16);

  doc.setFontSize(8);
  doc.setTextColor(84, 101, 95);
  doc.text("Signature / Thumb Impression of Beneficiary", 18, y + 20);
  doc.text("Gram Sahayak / ASHA Facilitator Verification", 125, y + 20);

  // Footer Note
  doc.setFontSize(8);
  doc.text("Notice: This proposal is submitted under the PM-AJAY Special Central Assistance guidelines. Zero application fee.", 15, 285);

  doc.save(`PM-AJAY_Proposal_${profile.beneficiaryName || 'Beneficiary'}.pdf`);
}
