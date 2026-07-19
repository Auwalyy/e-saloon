const PDFDocument = require('pdfkit');

exports.generateReceipt = (payment) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A5', margin: 40 });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#D4AF37');
    doc.fillColor('#fff').fontSize(22).font('Helvetica-Bold').text("Aisha's Salon", 40, 20);
    doc.fontSize(10).font('Helvetica').text('Payment Receipt', 40, 50);

    // Body
    doc.fillColor('#333').fontSize(12).font('Helvetica-Bold').text('RECEIPT', 40, 100);
    doc.moveTo(40, 118).lineTo(doc.page.width - 40, 118).stroke('#D4AF37');

    const rows = [
      ['Receipt #', payment.reference],
      ['Customer', payment.customer_name],
      ['Service', payment.service_name],
      ['Date', new Date(payment.created_at).toLocaleDateString()],
      ['Method', payment.method?.toUpperCase()],
      ['Status', 'PAID'],
    ];

    let y = 130;
    doc.font('Helvetica').fontSize(10);
    rows.forEach(([label, value]) => {
      doc.fillColor('#666').text(label, 40, y);
      doc.fillColor('#333').text(value || '-', 200, y);
      y += 22;
    });

    doc.moveTo(40, y + 5).lineTo(doc.page.width - 40, y + 5).stroke('#eee');
    doc.fillColor('#D4AF37').fontSize(16).font('Helvetica-Bold')
      .text(`Total: ₦${Number(payment.amount).toLocaleString()}`, 40, y + 15);

    doc.fillColor('#999').fontSize(9).font('Helvetica')
      .text('Thank you for choosing Aisha\'s Salon!', 40, y + 50, { align: 'center' });

    doc.end();
  });
};

exports.generateReport = (title, data, columns) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    doc.rect(0, 0, doc.page.width, 70).fill('#D4AF37');
    doc.fillColor('#fff').fontSize(18).font('Helvetica-Bold').text("Aisha's Salon", 40, 15);
    doc.fontSize(11).font('Helvetica').text(title, 40, 42);

    doc.fillColor('#333').fontSize(9).font('Helvetica')
      .text(`Generated: ${new Date().toLocaleString()}`, 40, 85);

    let y = 110;
    const colWidth = (doc.page.width - 80) / columns.length;

    // Table header
    doc.rect(40, y, doc.page.width - 80, 20).fill('#f5f5f5');
    doc.fillColor('#333').font('Helvetica-Bold').fontSize(9);
    columns.forEach((col, i) => doc.text(col.header, 45 + i * colWidth, y + 5, { width: colWidth - 5 }));
    y += 22;

    doc.font('Helvetica').fontSize(8);
    data.forEach((row, idx) => {
      if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
      if (idx % 2 === 0) doc.rect(40, y, doc.page.width - 80, 18).fill('#fafafa');
      doc.fillColor('#444');
      columns.forEach((col, i) => {
        const val = row[col.key] ?? '-';
        doc.text(String(val), 45 + i * colWidth, y + 4, { width: colWidth - 5 });
      });
      y += 20;
    });

    doc.end();
  });
};
