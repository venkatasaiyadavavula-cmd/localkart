import { SelectQueryBuilder } from 'typeorm';
import { Order } from '../../core/entities/order.entity';
import { TransactionType } from '../../core/entities/transaction.entity';

/**
 * Exclude orders already listed in a settlement transaction's metadata.orderIds.
 *
 * Production 500 root cause (PG error): `operator does not exist: uuid = text`
 * when using `order.id NOT IN (SELECT jsonb_array_elements_text(...))`.
 * jsonb_array_elements_text returns text; orders.id is uuid.
 */
export function applyUnsettledOrderFilter(
  qb: SelectQueryBuilder<Order>,
  orderAlias = 'order',
): SelectQueryBuilder<Order> {
  const idCol = `"${orderAlias}".id`;

  return qb.andWhere(
    `NOT EXISTS (
      SELECT 1
      FROM transactions st
      WHERE st.type = :settlementType
        AND st.metadata->'orderIds' IS NOT NULL
        AND st.metadata->'orderIds' @> jsonb_build_array(${idCol}::text)
    )`,
    { settlementType: TransactionType.SETTLEMENT },
  );
}
