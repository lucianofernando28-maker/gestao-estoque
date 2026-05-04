// src/routes/refresh.route.ts

import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { dbPlugin } from "../db/client";
import { accessJwt, refreshJwt } from "../plugins/jwt.plugin";

export const refreshRoute = new Elysia()
	.use(dbPlugin)
	.use(accessJwt)
	.use(refreshJwt)
	.post(
		"/auth/refresh",
		async ({ cookie, db, models, accessJwt, refreshJwt, status }) => {
			// 1. Ler o refresh token do cookie HttpOnly (não do body!)
			const rawToken = cookie.refresh_token.value;
			if (!rawToken) throw status(401, "Refresh token não encontrado.");

			// 2. Verificar assinatura criptográfica
			const payload = await refreshJwt.verify(rawToken);
			if (!payload) throw status(401, "Refresh token inválido ou expirado.");

			// 3. Verificar no banco se não foi revogado
			const [stored] = await db
				.select()
				.from(models.refreshToken)
				.where(
					and(
						eq(models.refreshToken.token, rawToken),
						eq(models.refreshToken.revoked, false),
					),
				);

			if (!stored || stored.expiresAt < new Date()) {
				throw status(401, "Refresh token revogado ou expirado.");
			}

			// 4. Buscar dados atuais do usuário
			const [user] = await db
				.select()
				.from(models.user)
				.where(eq(models.user.id, stored.userId));

			if (!user) throw status(404, "Usuário não encontrado.");

			// 5. ROTAÇÃO: revogar o token antigo e emitir um novo par
			await db
				.update(models.refreshToken)
				.set({ revoked: true })
				.where(eq(models.refreshToken.id, stored.id));

			const newAccessToken = await accessJwt.sign({
				sub: user.id,
				role: user.role,
			});
			const newRefreshToken = await refreshJwt.sign({ sub: user.id });

			const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
			await db.insert(models.refreshToken).values({
				userId: user.id,
				token: newRefreshToken,
				expiresAt,
			});

			// 6. Sobrescrever os cookies com os novos tokens
			cookie.access_token.set({
				value: newAccessToken,
				httpOnly: true,
				secure: Bun.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 15 * 60,
				path: "/",
			});
			cookie.refresh_token.set({
				value: newRefreshToken,
				httpOnly: true,
				secure: Bun.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60,
				path: "/auth/refresh",
			});

			return { message: "Tokens renovados com sucesso." };
		},
		{
			// ✅ Tipar as cookies que esta rota vai ESCREVER
			cookie: t.Cookie({
				access_token: t.Optional(t.String()),
				refresh_token: t.Optional(t.String()),
			}),
		},
	);
