import { SelectQueryBuilder } from 'typeorm';
import { Order } from '../../core/entities/order.entity';
import { TransactionType } from '../../core/entities/transaction.entity';

/**
 * Exclude orders already listed in a settlement transaction's metadata.orderIds.
 * Uses NOT EXISTS + id::text because jsonb_array_elements_text returns text,
 * and `uuid NOT IN (text[])` fails in PostgreSQL with:
 *   operator does not exist: uuid = text
 */
export function applyUnsettledOrderFilter(
  qb: SelectQueryBuilder<Order>,
  orderAlias = 'order',
): SelectQueryBuilder<Order> {
  return qb.andWhere(
    `NOT EXISTS (
      SELECT 1
      FROM transactions st
      CROSS JOIN LATERAL jsonb_array_elements_text(
        CASE
          WHEN jsonb_typeof(st.metadata->'orderIds') = 'array'
          THEN st.metadata->'orderIds'
          ELSE '[]'::jsonb
        END
      ) AS settled(order_id)
      WHERE st.type = :settlementType
        AND settled.order_id = ${orderAlias}.id::text
    )`,
    { settlementType: TransactionType.SETTLEMENT },
  );
}
