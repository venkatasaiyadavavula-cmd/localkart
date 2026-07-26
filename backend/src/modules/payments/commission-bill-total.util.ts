/** Amount the seller owes on a commission bill (excludes paid bills). */
export function commissionBillTotalDue(bill: {
  commissionAmount: number | string;
  fineAmount: number | string;
  videoUploadFees?: number | string | null;
}): number {
  return (
    Number(bill.commissionAmount) +
    Number(bill.fineAmount) +
    Number(bill.videoUploadFees ?? 0)
  );
}
