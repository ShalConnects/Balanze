import type { User } from '@supabase/supabase-js';
import type { InvestmentContract } from '../types/businessInvestment';
import { BALANZE_BRAND } from './balanzeBrand';
import { getContractStats } from './businessInvestmentStats';
import { currencyCodeLabelForPdf, formatCurrencyForPdf } from './currency';
import { formatAppDate, formatAppDateTime } from './timezoneUtils';
import { getTodayLocalDateString } from './taskDateUtils';

export interface InvestmentAgreementPdfInput {
  contract: InvestmentContract;
  investorName: string;
  investorEmail?: string;
}

type PdfResult<T> = { success: true; data: T } | { success: false; error: string };

const MARGIN = 20;
const LINE_HEIGHT = 5.5;

export const investmentAgreementFilename = (title: string) => {
  const slug = title.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60) || 'contract';
  return `investment-agreement-${slug}-${getTodayLocalDateString()}.pdf`;
};

export const resolveInvestmentAgreementInput = (
  contract: InvestmentContract,
  profile: { fullName?: string } | null,
  user: User | null
): InvestmentAgreementPdfInput => ({
  contract,
  investorName: profile?.fullName?.trim() || user?.email || 'Investor',
  investorEmail: user?.email ?? undefined
});

async function loadPdfLibs() {
  const [jspdfMod, autoTableMod] = await Promise.race([
    Promise.all([import('jspdf'), import('jspdf-autotable')]),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('PDF library loading timed out')), 10000);
    })
  ]);
  return { jsPDF: jspdfMod.default, autoTable: autoTableMod.default };
}

function validateInput(input: InvestmentAgreementPdfInput): string | null {
  if (!input.contract.title?.trim()) return 'Contract title is required to generate an agreement.';
  return null;
}

const pdfTable = (
  headColor: readonly [number, number, number],
  margin = MARGIN
) => ({
  theme: 'grid' as const,
  margin: { left: margin, right: margin },
  headStyles: { fillColor: [...headColor] as [number, number, number], textColor: 255, fontStyle: 'bold' as const },
  alternateRowStyles: { fillColor: [...BALANZE_BRAND.tableStripe] as [number, number, number] },
  styles: { fontSize: 9, cellPadding: 3, lineColor: [...BALANZE_BRAND.border] as [number, number, number], lineWidth: 0.1 }
});

export async function buildInvestmentAgreementDocument(
  input: InvestmentAgreementPdfInput
): Promise<PdfResult<{ doc: import('jspdf').jsPDF; filename: string }>> {
  const validationError = validateInput(input);
  if (validationError) return { success: false, error: validationError };

  const { contract, investorName, investorEmail } = input;
  const { currency } = contract;
  const fmt = (amount: number) => formatCurrencyForPdf(amount, currency);

  try {
    const { jsPDF, autoTable } = await loadPdfLibs();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - MARGIN * 2;
    let y = MARGIN;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - MARGIN) {
        doc.addPage();
        y = MARGIN;
      }
    };

    const writeParagraph = (text: string, fontSize = 10) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(text, contentWidth) as string[];
      ensureSpace(lines.length * LINE_HEIGHT + 2);
      doc.text(lines, MARGIN, y);
      y += lines.length * LINE_HEIGHT + 2;
      doc.setTextColor(0, 0, 0);
    };

    const writeSection = (title: string, body: string) => {
      ensureSpace(14);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BALANZE_BRAND.blue);
      doc.text(title, MARGIN, y);
      y += 7;
      doc.setDrawColor(...BALANZE_BRAND.purple);
      doc.setLineWidth(0.4);
      doc.line(MARGIN, y, pageWidth - MARGIN, y);
      y += 5;
      writeParagraph(body);
      y += 3;
    };

    const fundingAccount = contract.funding_account_name?.trim() || 'Selected funding account';
    const endDateText = contract.end_date?.trim()
      ? formatAppDate(contract.end_date)
      : 'Open-ended until closed';
    const stats = getContractStats(contract);
    const generatedOn = formatAppDateTime(new Date());

    doc.setFillColor(...BALANZE_BRAND.blue);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(...BALANZE_BRAND.purple);
    doc.rect(0, 28, pageWidth, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BUSINESS INVESTMENT AGREEMENT', MARGIN, 17);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(BALANZE_BRAND.name, MARGIN, 24);
    doc.text(`Generated ${generatedOn}`, pageWidth - MARGIN, 20, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y = 42;

    autoTable(doc, {
      startY: y,
      head: [['Detail', 'Value']],
      body: [
        ['Reference', contract.title.trim()],
        ['Investor', investorEmail ? `${investorName} (${investorEmail})` : investorName],
        ['Investment / Project', contract.title.trim()],
        ['Principal', fmt(contract.principal)],
        ['Deployed capital', fmt(stats.effectivePrincipal)],
        ['Currency', currencyCodeLabelForPdf(currency)],
        ['Funding account', fundingAccount],
        ['Effective date', formatAppDate(contract.start_date)],
        ['End date', endDateText],
        ['Status', contract.status === 'active' ? 'Active' : 'Closed']
      ],
      ...pdfTable(BALANZE_BRAND.blue)
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    if (contract.entries.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Performance (recorded)', 'Amount']],
        body: [
          ['Total profit', fmt(stats.totalProfit)],
          ['Total loss', fmt(stats.totalLoss)],
          ['Principal returned', fmt(stats.principalReturned)],
          ['Outstanding capital', fmt(stats.outstanding)],
          ['Net result', fmt(stats.netResult)]
        ],
        ...pdfTable(BALANZE_BRAND.purple)
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }

    writeSection(
      'Term',
      `This agreement is effective from ${formatAppDate(contract.start_date)} through ${endDateText}.`
    );

    writeSection(
      'Additional terms',
      contract.note?.trim() ||
        'No additional terms were recorded. Document profit-sharing, returns, or other conditions in the contract note or supplementary records.'
    );

    writeSection(
      'Record-keeping notice',
      'This document is generated from personal finance records for documentation only. It does not constitute legal, tax, or investment advice. Seek independent professional counsel before entering binding arrangements.'
    );

    ensureSpace(42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BALANZE_BRAND.blue);
    doc.text('Signatures', MARGIN, y);
    doc.setTextColor(0, 0, 0);
    y += 10;

    const signLine = (label: string) => {
      ensureSpace(22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(label, MARGIN, y);
      y += 12;
      doc.setDrawColor(...BALANZE_BRAND.purple);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, y, MARGIN + 75, y);
      doc.line(pageWidth - MARGIN - 40, y, pageWidth - MARGIN, y);
      doc.setFontSize(8);
      doc.setTextColor(...BALANZE_BRAND.muted);
      doc.text('Signature', MARGIN, y + 4);
      doc.text('Date', pageWidth - MARGIN - 40, y + 4);
      doc.setTextColor(0, 0, 0);
      y += 14;
    };

    signLine('Investor');
    signLine('Counterparty / Representative');

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i += 1) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...BALANZE_BRAND.muted);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`${BALANZE_BRAND.name} — template for personal records only`, MARGIN, pageHeight - 10);
      doc.setTextColor(0, 0, 0);
    }

    return { success: true, data: { doc, filename: investmentAgreementFilename(contract.title) } };
  } catch (error) {
    console.error('Error building investment agreement PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred while generating the PDF.'
    };
  }
}

export async function createInvestmentAgreementPdfBlob(
  input: InvestmentAgreementPdfInput
): Promise<PdfResult<{ blob: Blob; filename: string }>> {
  const built = await buildInvestmentAgreementDocument(input);
  if (!built.success) return built;
  const blob = built.data.doc.output('blob');
  if (!blob?.size) return { success: false, error: 'Generated PDF is empty.' };
  return { success: true, data: { blob, filename: built.data.filename } };
}

export async function downloadInvestmentAgreementPdf(
  input: InvestmentAgreementPdfInput
): Promise<{ success: boolean; error?: string }> {
  const built = await buildInvestmentAgreementDocument(input);
  if (!built.success) return { success: false, error: built.error };
  try {
    built.data.doc.save(built.data.filename);
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to save PDF file.' };
  }
}

/** @deprecated Use downloadInvestmentAgreementPdf */
export const generateInvestmentAgreementPDF = downloadInvestmentAgreementPdf;
