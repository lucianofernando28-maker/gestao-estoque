// src/routes/user.route.ts

import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { dbPlugin } from "../db/client";
import { authGuard } from "../plugins/auth.guard";

export const userRoute = new Elysia()
	.use(dbPlugin)
	.use(authGuard)
	.get(
		"/users/me",
		async ({ store, db, models, status }) => {
			const [user] = await db
				.select()
				.from(models.user)
				.where(eq(models.user.id, (store as { userId: string }).userId));

			if (!user) throw status(404, "Usuário não encontrado.");

			// Nunca expor o hash da senha!
			const { passwordHash, ...safeUser } = user;
			return safeUser;
		},
		{ requireAuth: true },
	);
