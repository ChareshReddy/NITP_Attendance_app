import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import ExcelJS from 'exceljs';
import { decrypt } from '@/lib/encryption';

async function getAuthUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

export async function GET(request: Request) {
  try {
    const caller = await getAuthUser();
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing run id' }, { status: 400 });
    }

    const run = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            employeeProfile: true,
          },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
    }

    // Security check: Employee can only see their own payslips
    if (caller.role === 'EMPLOYEE' && run.userId !== caller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Next IT Point Payroll System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`Payslip_${run.user.name.replace(/\s+/g, '_')}`);

    // Set page styling & borders
    sheet.views = [{ showGridLines: true }];

    // Company Header
    sheet.mergeCells('A1:D1');
    const headerCell = sheet.getCell('A1');
    headerCell.value = 'NEXT IT POINT - PAYSLIP';
    headerCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Brand Blue
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 40;

    // Period info
    sheet.mergeCells('A2:D2');
    const periodCell = sheet.getCell('A2');
    const options: any = { year: 'numeric', month: 'long' };
    periodCell.value = `Salary Period: ${new Date(run.periodStart).toLocaleDateString('en-US', options)}`;
    periodCell.font = { name: 'Arial', size: 11, italic: true };
    periodCell.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // Employee Details Section
    sheet.getCell('A4').value = 'Employee ID:';
    sheet.getCell('A4').font = { bold: true };
    sheet.getCell('B4').value = run.userId;
    sheet.getCell('C4').value = 'Employee Name:';
    sheet.getCell('C4').font = { bold: true };
    sheet.getCell('D4').value = run.user.name;

    sheet.getCell('A5').value = 'Department:';
    sheet.getCell('A5').font = { bold: true };
    sheet.getCell('B5').value = run.user.employeeProfile?.department || 'N/A';
    sheet.getCell('C5').value = 'Designation:';
    sheet.getCell('C5').font = { bold: true };
    sheet.getCell('D5').value = run.user.employeeProfile?.designation || 'N/A';

    sheet.getCell('A6').value = 'Bank Name:';
    sheet.getCell('A6').font = { bold: true };
    sheet.getCell('B6').value = run.user.employeeProfile?.bankName || 'N/A';
    sheet.getCell('C6').value = 'Account Number:';
    sheet.getCell('C6').font = { bold: true };
    sheet.getCell('D6').value = run.user.employeeProfile?.accountNumber ? decrypt(run.user.employeeProfile.accountNumber) : 'N/A';

    sheet.getCell('A7').value = 'PAN Card:';
    sheet.getCell('A7').font = { bold: true };
    sheet.getCell('B7').value = run.user.employeeProfile?.pan ? decrypt(run.user.employeeProfile.pan) : 'N/A';
    sheet.getCell('C7').value = 'IFSC Code:';
    sheet.getCell('C7').font = { bold: true };
    sheet.getCell('D7').value = run.user.employeeProfile?.ifsc || 'N/A';

    // Set border for Employee Details
    for (let r = 4; r <= 7; r++) {
      for (let c = 1; c <= 4; c++) {
        sheet.getCell(r, c).border = {
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      }
    }

    // Table Headers
    sheet.getCell('A9').value = 'Earnings';
    sheet.getCell('A9').font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    sheet.getCell('B9').value = 'Amount (INR)';
    sheet.getCell('B9').font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('B9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    sheet.getCell('B9').alignment = { horizontal: 'right' };

    sheet.getCell('C9').value = 'Deductions';
    sheet.getCell('C9').font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('C9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
    sheet.getCell('D9').value = 'Amount (INR)';
    sheet.getCell('D9').font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('D9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
    sheet.getCell('D9').alignment = { horizontal: 'right' };

    // Earnings list
    const earnings = [
      { name: 'Basic Salary', val: run.basicSalary },
      { name: 'HRA', val: run.hra },
      { name: 'Conveyance', val: run.conveyance },
      { name: 'Special Allowance', val: run.specialAllowance },
      { name: 'Overtime Pay', val: run.overtime },
      { name: 'Bonus', val: run.bonus },
      { name: 'Incentives', val: run.incentives },
    ];

    // Deductions list
    const deductions = [
      { name: 'Provident Fund (PF)', val: run.pf },
      { name: 'Employee State Ins. (ESI)', val: run.esi },
      { name: 'Professional Tax (PT)', val: run.professionalTax },
      { name: 'TDS (Income Tax)', val: run.tds },
      { name: 'Loss of Pay (LOP) Deduction', val: run.lopDeduction },
      { name: 'Loan Deduction', val: run.loanDeduction },
    ];

    const maxRows = Math.max(earnings.length, deductions.length);

    for (let i = 0; i < maxRows; i++) {
      const rowIdx = 10 + i;
      const earn = earnings[i];
      const ded = deductions[i];

      if (earn) {
        sheet.getCell(`A${rowIdx}`).value = earn.name;
        sheet.getCell(`B${rowIdx}`).value = earn.val;
        sheet.getCell(`B${rowIdx}`).numFmt = '#,##0.00';
        sheet.getCell(`B${rowIdx}`).alignment = { horizontal: 'right' };
      }
      if (ded) {
        sheet.getCell(`C${rowIdx}`).value = ded.name;
        sheet.getCell(`D${rowIdx}`).value = ded.val;
        sheet.getCell(`D${rowIdx}`).numFmt = '#,##0.00';
        sheet.getCell(`D${rowIdx}`).alignment = { horizontal: 'right' };
      }

      // Border lines
      sheet.getCell(`A${rowIdx}`).border = { right: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
      sheet.getCell(`B${rowIdx}`).border = { right: { style: 'medium', color: { argb: 'FF9CA3AF' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
      sheet.getCell(`C${rowIdx}`).border = { right: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
      sheet.getCell(`D${rowIdx}`).border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
    }

    // Total Row
    const totalRowIdx = 10 + maxRows;
    sheet.getCell(`A${totalRowIdx}`).value = 'Gross Earnings';
    sheet.getCell(`A${totalRowIdx}`).font = { bold: true };
    sheet.getCell(`B${totalRowIdx}`).value = run.grossEarnings;
    sheet.getCell(`B${totalRowIdx}`).font = { bold: true };
    sheet.getCell(`B${totalRowIdx}`).numFmt = '#,##0.00';
    sheet.getCell(`B${totalRowIdx}`).alignment = { horizontal: 'right' };
    sheet.getCell(`B${totalRowIdx}`).border = { right: { style: 'medium', color: { argb: 'FF9CA3AF' } }, bottom: { style: 'double', color: { argb: 'FF000000' } }, top: { style: 'thin', color: { argb: 'FF000000' } } };

    sheet.getCell(`C${totalRowIdx}`).value = 'Total Deductions';
    sheet.getCell(`C${totalRowIdx}`).font = { bold: true };
    sheet.getCell(`D${totalRowIdx}`).value = run.totalDeductions;
    sheet.getCell(`D${totalRowIdx}`).font = { bold: true };
    sheet.getCell(`D${totalRowIdx}`).numFmt = '#,##0.00';
    sheet.getCell(`D${totalRowIdx}`).alignment = { horizontal: 'right' };
    sheet.getCell(`D${totalRowIdx}`).border = { bottom: { style: 'double', color: { argb: 'FF000000' } }, top: { style: 'thin', color: { argb: 'FF000000' } } };

    // Net Salary row
    const netRowIdx = totalRowIdx + 2;
    sheet.mergeCells(`A${netRowIdx}:C${netRowIdx}`);
    const netLabel = sheet.getCell(`A${netRowIdx}`);
    netLabel.value = 'NET PAYABLE SALARY (ROUNDED)';
    netLabel.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    netLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    netLabel.alignment = { horizontal: 'right', vertical: 'middle' };

    const netVal = sheet.getCell(`D${netRowIdx}`);
    netVal.value = run.netSalary;
    netVal.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    netVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    netVal.numFmt = '#,##0.00';
    netVal.alignment = { horizontal: 'right', vertical: 'middle' };

    sheet.getRow(netRowIdx).height = 25;

    // Set widths of columns
    sheet.getColumn('A').width = 25;
    sheet.getColumn('B').width = 18;
    sheet.getColumn('C').width = 25;
    sheet.getColumn('D').width = 18;

    const buffer = await workbook.xlsx.writeBuffer();
    const cleanFileName = `Payslip_${run.user.name.replace(/\s+/g, '_')}_${new Date(run.periodStart).toISOString().slice(0, 7)}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
      },
    });
  } catch (error) {
    console.error('Payslip export error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
