import { createId } from "@paralleldrive/cuid2";
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox';
import { pgTable, varchar, timestamp, decimal, integer } from "drizzle-orm/pg-core";
//Tabela produtos
export const products = pgTable("products",{
    id: varchar("id").primaryKey().$defaultFn(()=>createId()),
    name: varchar("name").notNull().unique(),
    price: decimal("price",{precision: 10, scale: 2}).notNull(),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    totalPrice: decimal("total_price",{precision: 10, scale: 2}).notNull(), 
    createdAt: timestamp("created_At").notNull().defaultNow(),
    updateAt: timestamp("update_At").notNull().defaultNow(),
});

// Gerando schemas de validação automaticamente do banco
export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;