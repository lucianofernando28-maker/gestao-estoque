// src/routes/logout.route.ts

import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { dbPlugin } from "../db/client";
import { authGuard } from "../plugins/auth.guard";

export const logoutRoute = new Elysia()
	.use(dbPlugin)
	.use(authGuard)
	.post(
		"/auth/logout",
		async ({ cookie, db, models }) => {
			// 1. Ler o refresh token do cookie e revogá-lo no banco
			const rawToken = cookie.refresh_token.value;
			if (rawToken) {
				await db
					.update(models.refreshToken)
					.set({ revoked: true })
					.where(eq(models.refreshToken.token, rawToken));
			}

			// 2. Apagar os dois cookies do browser
			cookie.access_token.remove();
			cookie.refresh_token.remove();

			return { message: "Logout realizado com sucesso." };
		},
		{
			requireAuth: true,
			// ✅ Tipar as cookies que esta rota vai LER e REMOVER
			cookie: t.Cookie({
				refresh_token: t.Optional(t.String()),
				access_token: t.Optional(t.String()),
			}),
		},
	);
