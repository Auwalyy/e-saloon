/**
 * PDF generation (receipts, invoices and business reports) using PDFKit.
 * Every generator resolves to a Buffer so the result can be streamed to the
 * browser or attached to an email.
 */
const PDFDocument = require('pdfkit');
const { formatCurrency } = require('../utils/helpers');

const GOLD = '#D4AF37';
const DARK = '#1a1a1a';
const MUTED = '#777777';
const LINE = '#e5e5e5';

const render = (build) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    build(doc);
    doc.end();
  });

const formatDateTime = (date, timeZone) =>
  date ? new Date(date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone }) : '-';

const titleCase = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const drawHeader = (doc, settings, title) => {
  doc.rect(0, 0, doc.page.width, 110).fill(GOLD);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text(settings.businessName, 50, 34);
  doc.font('Helvetica').fontSize(9)
    .text([settings.address, settings.phone, settings.email].filter(Boolean).join('  |  '), 50, 64, { width: 330 });
  doc.font('Helvetica-Bold').fontSize(20).text(title.toUpperCase(), 380, 40, { width: 165, align: 'right' });
  doc.fillColor(DARK);
  doc.y = 140;
};

const drawFooter = (doc, text) => {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text(`${text}   |   Page ${i + 1} of ${range.count}`, 50, doc.page.height - 40, {
        width: doc.page.width - 100, align: 'center', lineBreak: false,
      });
  }
};

/** Two-column block of "label: value" pairs. Returns the y position after it. */
const drawKeyValues = (doc, pairs, x, y, width) => {
  let cursor = y;
  pairs.forEach(([label, value]) => {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(label, x, cursor, { width: 90 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text(String(value ?? '-'), x + 95, cursor, { width: width - 95 });
    cursor = Math.max(doc.y, cursor + 14) + 4;
  });
  return cursor;
};

/** Simple table with automatic page breaks. `columns` = [{ label, width, align }]. */
const drawTable = (doc, columns, rows) => {
  const startX = 50;
  const drawRow = (cells, { header = false } = {}) => {
    const height = 22;
    if (doc.y + height > doc.page.height - 70) doc.addPage();
    const y = doc.y;
    if (header) doc.rect(startX, y, 495, height).fill('#f5f0dc');
    let x = startX;
    doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(DARK);
    cells.forEach((cell, index) => {
      const column = columns[index];
      doc.text(String(cell ?? ''), x + 6, y + 7, {
        width: column.width - 12, align: column.align || 'left', lineBreak: false, ellipsis: true,
      });
      x += column.width;
    });
    doc.moveTo(startX, y + height).lineTo(startX + 495, y + height).strokeColor(LINE).lineWidth(0.5).stroke();
    doc.y = y + height;
  };

  drawRow(columns.map((column) => column.label), { header: true });
  if (!rows.length) {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('No records for this period.', startX + 6, doc.y + 8);
    doc.moveDown(1);
  }
  rows.forEach((row) => drawRow(row));
  doc.x = startX;
  doc.moveDown(1.2);
};

const sectionTitle = (doc, text) => {
  if (doc.y > doc.page.height - 140) doc.addPage();
  doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK).text(text, 50, doc.y);
  doc.moveDown(0.5);
};

/**
 * Receipt (proof of payment) or invoice (amount due) for an appointment.
 * `payment` must have appointment (with service + employee) and customer populated.
 */
const generatePaymentDocument = (payment, settings, type = 'receipt') =>
  render((doc) => {
    const { appointment, customer } = payment;
    const isReceipt = type === 'receipt';
    drawHeader(doc, settings, isReceipt ? 'Receipt' : 'Invoice');

    const top = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(GOLD).text('BILLED TO', 50, top);
    const leftEnd = drawKeyValues(doc, [
      ['Customer', customer.name],
      ['Email', customer.email],
      ['Phone', customer.phone || '-'],
    ], 50, top + 18, 240);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(GOLD).text('DETAILS', 310, top);
    const rightEnd = drawKeyValues(doc, [
      [isReceipt ? 'Receipt No.' : 'Invoice No.', isReceipt ? payment.receiptNumber : payment.reference],
      ['Payment ID', payment.reference],
      ['Issued', formatDateTime(isReceipt ? payment.paidAt : payment.createdAt, settings.timezone)],
      ['Method', titleCase(payment.method)],
      ['Status', titleCase(payment.status)],
    ], 310, top + 18, 235);

    doc.y = Math.max(leftEnd, rightEnd) + 16;
    drawTable(doc, [
      { label: 'Description', width: 215 },
      { label: 'Stylist', width: 110 },
      { label: 'Date & time', width: 95 },
      { label: 'Amount', width: 75, align: 'right' },
    ], [[
      `${appointment.service ? appointment.service.name : 'Salon service'} (${appointment.duration} min)`,
      appointment.employee ? appointment.employee.name : '-',
      `${appointment.date} ${appointment.startTime}`,
      formatCurrency(payment.amount, payment.currency),
    ]]);

    const totalY = doc.y;
    doc.rect(345, totalY, 200, 36).fill('#f5f0dc');
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
      .text(isReceipt ? 'TOTAL PAID' : 'AMOUNT DUE', 355, totalY + 12, { width: 80 });
    doc.fontSize(12).text(formatCurrency(payment.amount, payment.currency), 435, totalY + 12, { width: 100, align: 'right' });

    doc.font('Helvetica').fontSize(9).fillColor(MUTED)
      .text(`Appointment reference: ${appointment.reference}`, 50, totalY + 12);
    doc.y = totalY + 70;
    doc.fontSize(10).fillColor(DARK).text(
      isReceipt
        ? 'Thank you for your patronage. We look forward to seeing you again.'
        : 'Payment is due on or before the day of your appointment.',
      50, doc.y, { width: 495, align: 'center' }
    );

    drawFooter(doc, `${settings.businessName} - computer generated ${isReceipt ? 'receipt' : 'invoice'}`);
  });

/** Business report produced by report.service#buildReport. */
const generateReportPdf = (report, settings) =>
  render((doc) => {
    const money = (value) => formatCurrency(value, settings.currency);
    drawHeader(doc, settings, `${report.range.period} Report`);

    doc.font('Helvetica').fontSize(10).fillColor(MUTED)
      .text(`Period: ${report.range.fromDate} to ${report.range.toDate}     Generated: ${formatDateTime(new Date(), settings.timezone)}`, 50, doc.y);
    doc.moveDown(1.2);

    sectionTitle(doc, 'Summary');
    const s = report.summary;
    drawTable(doc, [{ label: 'Metric', width: 330 }, { label: 'Value', width: 165, align: 'right' }], [
      ['Total revenue', money(s.revenue)],
      ['Payments received', s.paymentsCount],
      ['Average payment', money(s.averagePayment)],
      ['Total bookings', s.bookings],
      ['Completed appointments', s.completed],
      ['Pending / confirmed', s.pending + s.confirmed],
      ['Cancelled / rejected', s.cancelled + s.rejected],
      ['No-shows', s.noShow],
      ['New customers', s.newCustomers],
      ['Retail sales', money(s.productSales)],
      ['Stock purchases', money(s.stockPurchases)],
    ]);

    sectionTitle(doc, 'Revenue breakdown');
    drawTable(doc, [
      { label: 'Period', width: 200 }, { label: 'Payments', width: 130, align: 'right' }, { label: 'Revenue', width: 165, align: 'right' },
    ], report.revenueSeries.filter((row) => row.count > 0).map((row) => [row.label, row.count, money(row.revenue)]));

    sectionTitle(doc, 'Top services');
    drawTable(doc, [
      { label: 'Service', width: 250 }, { label: 'Bookings', width: 100, align: 'right' }, { label: 'Value', width: 145, align: 'right' },
    ], report.topServices.map((row) => [row.name, row.bookings, money(row.value)]));

    sectionTitle(doc, 'Stylist performance');
    drawTable(doc, [
      { label: 'Stylist', width: 250 }, { label: 'Bookings', width: 100, align: 'right' }, { label: 'Value', width: 145, align: 'right' },
    ], report.topStylists.map((row) => [row.name, row.bookings, money(row.value)]));

    sectionTitle(doc, 'Payments by method');
    drawTable(doc, [
      { label: 'Method', width: 250 }, { label: 'Count', width: 100, align: 'right' }, { label: 'Amount', width: 145, align: 'right' },
    ], report.paymentMethods.map((row) => [titleCase(row.method), row.count, money(row.amount)]));

    drawFooter(doc, `${settings.businessName} - confidential business report`);
  });

module.exports = { generatePaymentDocument, generateReportPdf };
