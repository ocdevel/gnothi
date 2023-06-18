import {userId} from './users'

import {InferModel} from 'drizzle-orm'
import {pgTable, index, varchar} from 'drizzle-orm/pg-core';
import {idCol, tsCol} from './utils'

export const payments = pgTable('payments', {
  // Note we'll never remove these rows, even if payments stop - in case we need to investigate issues 
  id: idCol(),
  user_id: userId(),
  // just stripe's subscription_id for now, but may end up using other payment providers and wanna keep it general
  payment_id: varchar("payment_id"),
  // This should be updated each month when the subscription renews
  created_at: tsCol("created_at"),
}, (table) => {
  return {
    ix_payments_user_id: index("ix_payments_user_id").on(table.user_id),
    ix_payments_payment_id: index("ix_payments_payment_id").on(table.payment_id),
    ix_payments_created_at: index("ix_payments_created_at").on(table.created_at),
  }
})

export type Payment = InferModel<typeof payments>
