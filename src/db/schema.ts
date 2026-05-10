// src/database/schema.ts

import { createId } from "@paralleldrive/cuid2";
import {
	boolean,
	decimal,
	integer,
	pgEnum,
	pgTable,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const pgRole = pgEnum("role", ["ADMIN", "USER"]);

export const user = pgTable("user", {
	id: varchar("id")
		.$defaultFn(() => createId())
		.primaryKey(),
	email: varchar("email").notNull().unique(),
	passwordHash: varchar("password_hash").notNull(),
	role: pgRole("role").notNull().default("USER"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela para armazenar refresh tokens emitidos (permite revogar)
export const refreshToken = pgTable("refresh_token", {
	id: varchar("id")
		.$defaultFn(() => createId())
		.primaryKey(),
	userId: varchar("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	token: varchar("token").notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	revoked: boolean("revoked").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});


//Tabela produtos
export const products = pgTable("products",{
    id: varchar("id").primaryKey().$defaultFn(()=>createId()),
    name: varchar("name").notNull().unique(),
    price: decimal("price",{precision: 10, scale: 2}).notNull(),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    totalPrice: decimal("total_price",{precision: 10, scale: 2}).notNull(), 
    createdAt: timestamp("created_At").notNull().defaultNow(),
    updateAt: timestamp("update_At").notNull().defaultNow(),
		userId: varchar("user_id")
		.notNull()
		.references(() => user.id)
}); 



export const table = { user, refreshToken, products } as const;
