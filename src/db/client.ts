// src/database/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import Elysia from "elysia";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(Bun.env.DATABASE_URL!);
 export const db = drizzle({ client, schema });

export const dbPlugin = new Elysia()
	.decorate("db", db)
	.decorate("models", schema);
	

