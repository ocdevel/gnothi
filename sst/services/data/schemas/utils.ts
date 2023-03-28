import {timestamp, uuid} from 'drizzle-orm/pg-core';

export const idCol = (col='id') => uuid(col).defaultRandom().notNull().primaryKey()
export const tsCol = (col: string) => timestamp(col, {withTimezone: true}).defaultNow()
