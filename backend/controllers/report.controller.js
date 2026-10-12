/**
 * Business reports (daily, weekly, monthly, annual) with PDF and Excel export.
 */
const { asyncHandler } = require('../utils/helpers');
const reportService = require('../services/report.service');
const pdfService = require('../services/pdf.service');

const toResponse = ({ settings, ...report }) => report;

exports.getReport = asyncHandler(async (req, res) => {
  const report = await reportService.buildReport(req.query.period, req.query.date);
  res.json({ success: true, data: toResponse(report) });
});

exports.exportPdf = asyncHandler(async (req, res) => {
  const report = await reportService.buildReport(req.query.period, req.query.date);
  const pdf = await pdfService.generateReportPdf(report, report.settings);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${report.range.period}-report-${report.range.fromDate}.pdf"`,
    'Content-Length': pdf.length,
  });
  res.send(pdf);
});

exports.exportExcel = asyncHandler(async (req, res) => {
  const report = await reportService.buildReport(req.query.period, req.query.date);
  const workbook = await reportService.generateReportExcel(report);
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${report.range.period}-report-${report.range.fromDate}.xlsx"`,
    'Content-Length': workbook.length,
  });
  res.send(workbook);
});
