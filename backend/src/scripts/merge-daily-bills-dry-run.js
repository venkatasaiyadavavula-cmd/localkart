#!/usr/bin/env node
/**
 * DRY-RUN ONLY — plain Node (no ts-node). Reads commission_bills, prints merge preview.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const FINE_PER_DAY = 25;

function toIstDateString(date = new Date()) {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function parseDateOnly(dateStr) {
  return new Date(`${dateStr}T00:00:00+05:30`);
}

function istDayOfWeek(date = new Date()) {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.getUTCDay();
}

function getWeekEndingFriday(date = new Date()) {
  const istDate = toIstDateString(date);
  const d = parseDateOnly(istDate);
  const dow = istDayOfWeek(date);
  const daysUntilFriday = (5 - dow + 7) % 7;
  d.setDate(d.getDate() + daysUntilFriday);
  return toIstDateString(d);
}

function getWeekStartSaturday(fridayDate) {
  const d = parseDateOnly(fridayDate);
  d.setDate(d.getDate() - 6);
  return toIstDateString(d);
}

function fridayForBillDate(billDate) {
  return getWeekEndingFriday(parseDateOnly(billDate));
}

function daysOverdueFromFridayDue(fridayDate, today = new Date()) {
  const todayIst = toIstDateString(today);
  if (todayIst <= fridayDate) return 0;
  const start = parseDateOnly(fridayDate).getTime();
  const end = parseDateOnly(todayIst).getTime();
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

function previewMergeDailyBillsIntoWeekly(bills, shopNames = new Map(), today = new Date()) {
  const groups = new Map();
  for (const bill of bills) {
    const friday = fridayForBillDate(String(bill.billDate).slice(0, 10));
    const key = `${bill.shopId}|${friday}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(bill);
  }

  const previews = [];
  for (const [key, group] of groups) {
    const [shopId, weekEndingFriday] = key.split('|');
    const weekStartDate = getWeekStartSaturday(weekEndingFriday);
    const paid = group.filter((b) => b.status === 'paid');
    const unpaid = group.filter((b) => b.status !== 'paid');
    const totalCommission = group.reduce((s, b) => s + Number(b.commissionAmount), 0);
    const amountAlreadyPaid = paid.reduce((s, b) => s + Number(b.commissionAmount), 0);
    const remainingCommission = unpaid.reduce((s, b) => s + Number(b.commissionAmount), 0);

    let mergedStatus, mergedCommissionAmount, notes;
    if (paid.length === group.length) {
      mergedStatus = 'paid';
      mergedCommissionAmount = totalCommission;
      notes = 'All daily bills paid — weekly bill marked PAID';
    } else if (paid.length === 0) {
      mergedStatus = 'pending';
      mergedCommissionAmount = totalCommission;
      notes = 'No daily bills paid — full weekly commission due';
    } else {
      mergedCommissionAmount = remainingCommission;
      notes = `Partial: ${paid.length} daily bill(s) paid (₹${amountAlreadyPaid.toFixed(2)}); weekly bill covers remaining ₹${remainingCommission.toFixed(2)}`;
      mergedStatus = daysOverdueFromFridayDue(weekEndingFriday, today) > 0 ? 'overdue' : 'pending';
    }

    const daysLate = daysOverdueFromFridayDue(weekEndingFriday, today);
    const mergedFineAmount = mergedStatus === 'paid' ? 0 : daysLate * FINE_PER_DAY;

    previews.push({
      shopId,
      shopName: shopNames.get(shopId),
      weekEndingFriday,
      weekStartDate,
      oldDailyBillCount: group.length,
      mergedOrderCount: group.reduce((s, b) => s + Number(b.orderCount), 0),
      mergedTotalOrderValue: parseFloat(group.reduce((s, b) => s + Number(b.totalOrderValue), 0).toFixed(2)),
      mergedCommissionAmount: parseFloat(mergedCommissionAmount.toFixed(2)),
      mergedFineAmount,
      mergedStatus,
      amountAlreadyPaid: parseFloat(amountAlreadyPaid.toFixed(2)),
      remainingCommission: parseFloat(remainingCommission.toFixed(2)),
      paidDailyCount: paid.length,
      unpaidDailyCount: unpaid.length,
      oldBillIds: group.map((b) => b.id),
      notes,
    });
  }

  return previews.sort(
    (a, b) => a.weekEndingFriday.localeCompare(b.weekEndingFriday) || a.shopId.localeCompare(b.shopId),
  );
}

function formatDryRunReport(previews) {
  const lines = [
    '=== Weekly Commission Bill Merge — DRY RUN ===',
    `Generated: ${new Date().toISOString()}`,
    `Groups: ${previews.length}`,
    '',
    'shopId | shop | week (Sat–Fri) | old daily # | orders | commission | fine | status | paid daily | notes',
    '---',
  ];
  for (const p of previews) {
    lines.push(
      [
        p.shopId.slice(0, 8),
        p.shopName ?? '—',
        `${p.weekStartDate} → ${p.weekEndingFriday}`,
        p.oldDailyBillCount,
        p.mergedOrderCount,
        `₹${p.mergedCommissionAmount}`,
        `₹${p.mergedFineAmount}`,
        p.mergedStatus,
        `${p.paidDailyCount}/${p.oldDailyBillCount}`,
        p.notes,
      ].join(' | '),
    );
  }
  const partial = previews.filter((p) => p.paidDailyCount > 0 && p.unpaidDailyCount > 0);
  if (partial.length) {
    lines.push('', '=== PARTIAL PAYMENT WEEKS (review carefully) ===');
    for (const p of partial) {
      lines.push(
        `  ${p.shopName ?? p.shopId}: week ${p.weekEndingFriday} — already paid ₹${p.amountAlreadyPaid}, remaining ₹${p.remainingCommission}`,
      );
    }
  }
  return lines.join('\n');
}

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'localkart',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  const { rows: bills } = await client.query(`
    SELECT id, "shopId", "billDate", "orderCount", "totalOrderValue",
           "commissionAmount", status
    FROM commission_bills
    ORDER BY "billDate" ASC
  `);

  const shopIds = [...new Set(bills.map((b) => b.shopId))];
  const shopNames = new Map();
  if (shopIds.length) {
    const { rows: shops } = await client.query(`SELECT id, name FROM shops WHERE id = ANY($1)`, [shopIds]);
    for (const s of shops) shopNames.set(s.id, s.name);
  }

  console.log(`Loaded ${bills.length} commission bill(s) from database`);

  const previews = previewMergeDailyBillsIntoWeekly(bills, shopNames);
  const report = formatDryRunReport(previews);
  console.log('\n' + report);

  const outPath = process.env.DRY_RUN_OUTPUT || '/tmp/commission-merge-dry-run.txt';
  fs.writeFileSync(outPath, report);
  console.log(`\nReport written to ${outPath}`);
  console.log('NO DATA WAS MODIFIED — this is a dry run.');

  await client.end();
}

main().catch((err) => {
  console.error('Dry-run failed:', err.message);
  process.exit(1);
});
