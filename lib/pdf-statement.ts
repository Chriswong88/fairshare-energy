import {formatAud, type BillCredit} from '@/lib/bill-credits';
import type {BuyerBillsSummary} from '@/lib/buyer-bills';
import type {ElectricityPlanInfo} from '@/lib/electricity-plans';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const ROWS_PER_PAGE = 20;

export function createStatementPdf(credits: BillCredit[], generatedAt = new Date()) {
  const pages = chunk(credits, ROWS_PER_PAGE);
  if (!pages.length) pages.push([]);

  const fontId = 3 + pages.length * 2;
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 3 + index * 2);
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`);

  pages.forEach((pageCredits, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const content = pageContent(pageCredits, credits, index, pages.length, generatedAt);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`);
  });
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let pdf = '%PDF-1.4\n%FairShare\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function createBuyerBillsStatementPdf({
  summary,
  planInfo,
  profile,
  generatedAt = new Date(),
}: {
  summary: BuyerBillsSummary;
  planInfo: ElectricityPlanInfo;
  profile?: {full_name?: string | null; suburb?: string | null; postcode?: string | null} | null;
  generatedAt?: Date;
}) {
  const commands: string[] = [];
  const objects: string[] = [];
  const fontId = 4;

  commands.push('0.035 0.42 0.24 rg');
  commands.push(rect(0, 770, PAGE_WIDTH, 72, true));
  commands.push(text('FairShare Energy', 42, 802, 22, [1, 1, 1]));
  commands.push(text('BUYER BILL AND SAVINGS STATEMENT', 42, 784, 9, [0.82, 0.94, 0.86]));
  commands.push(text(`Generated ${formatDate(generatedAt)}`, 420, 788, 9, [1, 1, 1]));

  commands.push(text('Bills & Savings', 42, 728, 25, [0.03, 0.12, 0.2]));
  commands.push(text(profile?.full_name ? `Account: ${profile.full_name}` : 'Account: FairShare buyer', 42, 706, 10, [0.32, 0.38, 0.48]));
  commands.push(text(`Location: ${[profile?.suburb, profile?.postcode].filter(Boolean).join(' ') || 'Wollongong NSW'}`, 42, 690, 10, [0.32, 0.38, 0.48]));

  commands.push('0.93 0.97 0.94 rg');
  commands.push(rect(42, 620, 511, 52, true));
  commands.push(text('ESTIMATED FINAL BILL', 58, 650, 9, [0.12, 0.38, 0.26]));
  commands.push(text(formatAud(summary.estimatedBillCents), 392, 641, 22, [0.035, 0.48, 0.26]));
  commands.push(text(`Saved this month: ${formatAud(summary.savedThisMonthCents)} | Local energy: ${summary.localEnergyKwh} kWh`, 58, 630, 9, [0.32, 0.38, 0.48]));

  const rows = [
    ['Statement month', summary.month],
    ['Without FairShare', formatAud(summary.billWithoutFairShareCents)],
    ['FairShare local energy saving', `-${formatAud(summary.savedThisMonthCents)}`],
    ['Community rate', `${summary.communityRateCents}c/kWh`],
    ['Standard rate', `${summary.standardRateCents}c/kWh`],
    ['Saving rate', `${summary.savingRateCents}c/kWh`],
    ['Total saved since joining', formatAud(summary.totalSavedSinceJoiningCents)],
  ];

  commands.push(text('Bill estimate', 42, 578, 16, [0.03, 0.12, 0.2]));
  rows.forEach(([label, value], index) => {
    const y = 548 - index * 25;
    if (index % 2 === 0) {
      commands.push('0.97 0.98 0.97 rg');
      commands.push(rect(42, y - 8, 511, 23, true));
    }
    commands.push(text(label, 54, y, 10, [0.12, 0.18, 0.25]));
    commands.push(text(value, 396, y, 10, [0.035, 0.42, 0.24]));
  });

  commands.push(text('Current electricity plan', 42, 342, 16, [0.03, 0.12, 0.2]));
  commands.push(text(`${planInfo.provider} - ${planInfo.plan}`, 42, 319, 13, [0.035, 0.42, 0.24]));
  commands.push(text(planInfo.headline, 42, 298, 9, [0.32, 0.38, 0.48]));
  commands.push(text(`Supply area: ${planInfo.supplyArea}`, 42, 276, 9, [0.12, 0.18, 0.25]));
  commands.push(text(`Estimated annual cost: ${planInfo.estimatedAnnualCost}`, 42, 258, 9, [0.12, 0.18, 0.25]));
  commands.push(text(`Usage rate: ${planInfo.usageRate}`, 42, 240, 9, [0.12, 0.18, 0.25]));
  commands.push(text(`Solar feed-in tariff: ${planInfo.solarFeedInTariff}`, 42, 222, 9, [0.12, 0.18, 0.25]));

  commands.push('0.93 0.96 1 rg');
  commands.push(rect(42, 152, 511, 44, true));
  commands.push(text('Your participating retailer applies confirmed FairShare credits to your normal electricity bill.', 58, 178, 9, [0.05, 0.24, 0.6]));
  commands.push(text('All savings are estimates until confirmed on your retailer bill.', 58, 162, 9, [0.05, 0.24, 0.6]));

  commands.push(text(planInfo.sourceNote, 42, 35, 8, [0.38, 0.43, 0.5]));

  const content = commands.join('\n');
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents 5 0 R >>`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push(`<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`);

  let pdf = '%PDF-1.4\n%FairShare\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

function pageContent(pageCredits: BillCredit[], allCredits: BillCredit[], pageIndex: number, pageCount: number, generatedAt: Date) {
  const commands: string[] = [];
  const totalCredit = allCredits.reduce((sum, credit) => sum + credit.retailerCreditCents, 0);
  const totalEnergy = allCredits.reduce((sum, credit) => sum + credit.energyKwh, 0);

  commands.push('0.035 0.42 0.24 rg');
  commands.push(rect(0, 770, PAGE_WIDTH, 72, true));
  commands.push(text('FairShare Energy', 42, 802, 22, [1, 1, 1]));
  commands.push(text('SELLER STATEMENT', 42, 784, 9, [0.82, 0.94, 0.86]));
  commands.push(text(`Page ${pageIndex + 1} of ${pageCount}`, 492, 788, 9, [1, 1, 1]));

  if (pageIndex === 0) {
    commands.push(text('Bill credit statement', 42, 728, 25, [0.03, 0.12, 0.2]));
    commands.push(text(`Generated ${formatDate(generatedAt)}`, 42, 707, 10, [0.32, 0.38, 0.48]));
    commands.push('0.93 0.97 0.94 rg');
    commands.push(rect(42, 638, 511, 48, true));
    commands.push(text('TOTAL RETAILER BILL CREDIT', 58, 666, 9, [0.12, 0.38, 0.26]));
    commands.push(text(formatAud(totalCredit), 393, 657, 21, [0.035, 0.48, 0.26]));
    commands.push(text(`Energy matched: ${totalEnergy.toFixed(2)} kWh`, 58, 647, 9, [0.32, 0.38, 0.48]));
  }

  const tableTop = pageIndex === 0 ? 606 : 734;
  commands.push('0.035 0.42 0.24 rg');
  commands.push(rect(42, tableTop - 25, 511, 25, true));
  const headers = [['Date', 50], ['Energy', 158], ['Earnings', 267], ['Bill credit', 380], ['Status', 478]] as const;
  headers.forEach(([label, x]) => commands.push(text(label, x, tableTop - 17, 9, [1, 1, 1])));

  if (!pageCredits.length) {
    commands.push(text('No seller transactions are available for this statement.', 52, tableTop - 58, 11, [0.32, 0.38, 0.48]));
  } else {
    pageCredits.forEach((credit, index) => {
      const y = tableTop - 52 - index * 24;
      if (index % 2 === 1) {
        commands.push('0.97 0.98 0.97 rg');
        commands.push(rect(42, y - 7, 511, 23, true));
      }
      commands.push(text(formatShortDate(new Date(credit.date)), 50, y, 9, [0.12, 0.18, 0.25]));
      commands.push(text(`${credit.energyKwh.toFixed(2)} kWh`, 158, y, 9, [0.12, 0.18, 0.25]));
      commands.push(text(formatAud(credit.communityEarningsCents), 267, y, 9, [0.12, 0.18, 0.25]));
      commands.push(text(formatAud(credit.retailerCreditCents), 380, y, 9, [0.035, 0.42, 0.24]));
      commands.push(text(credit.status, 478, y, 9, [0.12, 0.18, 0.25]));
    });
  }

  commands.push(text('Bill credits are calculated from FairShare seller transactions and are subject to retailer confirmation.', 42, 35, 8, [0.38, 0.43, 0.5]));
  return commands.join('\n');
}

function text(value: string, x: number, y: number, size: number, colour: [number, number, number]) {
  const safe = ascii(value).replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
  return `${colour.join(' ')} rg BT /F1 ${size} Tf ${x} ${y} Td (${safe}) Tj ET`;
}

function rect(x: number, y: number, width: number, height: number, fill: boolean) {
  return `${x} ${y} ${width} ${height} re ${fill ? 'f' : 'S'}`;
}

function ascii(value: string) {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g, '-');
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-AU', {dateStyle: 'long'}).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-AU').format(date);
}
