// src/routes/auth.route.ts

import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { dbPlugin } from "../db/client";
import { accessJwt, refreshJwt } from "../plugins/jwt.plugin";
import { hashPassword, verifyPassword } from "../utils/password";

export const signUpRoute = new Elysia()
	.use(dbPlugin)
	.use(accessJwt)
	.use(refreshJwt)
	.post(
		"/auth/sign-up",
		async ({ body, db, models, accessJwt, refreshJwt, cookie, status }) => {
			// 1. Verificar se o email já existe
			const [existing] = await db
				.select()
				.from(models.user)
				.where(eq(models.user.email, body.email));

			if (existing) {
				throw status(409, "Este email já está cadastrado.");
			}

			// 2. Fazer hash da senha com Argon2id
			const passwordHash = await hashPassword(body.password);

			// 3. Inserir o usuário no banco
			const [newUser] = await db
				.insert(models.user)
				.values({ email: body.email, passwordHash, role: "USER" })
				.returning();

			// 4. Gerar os dois tokens
			const accessToken = await accessJwt.sign({
				sub: newUser.id,
				role: newUser.role,
			});
			const refreshToken = await refreshJwt.sign({ sub: newUser.id });

			// 5. Salvar o refresh token no banco (para poder revogar depois)
			// 2 minutos
			const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
			//const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
			await db.insert(models.refreshToken).values({
				userId: newUser.id,
				token: refreshToken,
				expiresAt,
			});

			// 6. Entregar os tokens em cookies HttpOnly — JS no browser NÃO consegue lê-los
			cookie.access_token.set({
				value: accessToken,
				httpOnly: true,
				secure: Bun.env.NODE_ENV === "production",
				sameSite: "strict",
				//maxAge: 15 * 60, // 15 minutos (mesmo TTL do token)
				maxAge: 60, // 1 minutos (mesmo TTL do token)
				path: "/",
			});
			cookie.refresh_token.set({
				value: refreshToken,
				httpOnly: true,
				secure: Bun.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 2 * 60, // 2 minutos
				//maxAge: 7 * 24 * 60 * 60, // 7 dias
				path: "/auth/refresh", // disponível apenas na rota de refresh!
			});

			return { message: "Cadastro realizado com sucesso." };
		},
		{
			body: t.Object({
				email: t.String({
					format: "email",
					description: "Correo electrónico institucional",
				}),
				password: t.String({
					minLength: 8,
					description: "Mínimo 8 caracteres",
				}),
			}),
			detail: {
				tags: ["Auth"],
				summary: "Registrar un nuevo usuario",
				description:
					"Crea un usuario en la DB, genera tokens y los establece en cookies HttpOnly.",
			},
			// ✅ Tipar as cookies que esta rota vai ESCREVER
			cookie: t.Cookie({
				access_token: t.Optional(t.String()),
				refresh_token: t.Optional(t.String()),
			}),
		},
	);

export const signInRoute = new Elysia()
	.use(dbPlugin)
	.use(accessJwt)
	.use(refreshJwt)
	.post(
		"/auth/sign-in",
		async ({ body, db, models, accessJwt, refreshJwt, cookie, status }) => {
			// 1. Buscar o usuário pelo email
			const [user] = await db
				.select()
				.from(models.user)
				.where(eq(models.user.email, body.email));

			// 2. Verificar senha (mesma mensagem para não revelar se email existe)
			const DUMMY = "$argon2id$v=19$m=65536,t=3,p=4$...";
			const hashToCheck = user?.passwordHash ?? DUMMY;
			const valid = await verifyPassword(body.password, hashToCheck);

			if (!user || !valid) {
				throw status(401, "Email ou senha inválidos.");
			}

			// 3. Gerar os dois tokens
			const accessToken = await accessJwt.sign({
				sub: user.id,
				role: user.role,
			});
			const refreshToken = await refreshJwt.sign({ sub: user.id });

			// 4. Persistir o refresh token
			const expiresAt = new Date(Date.now() + 2 * 60 * 1000); //minutos
			//const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
			await db.insert(models.refreshToken).values({
				userId: user.id,
				token: refreshToken,
				expiresAt,
			});

			// 5. Definir cookies HttpOnly — inacessíveis ao JavaScript do browser
			cookie.access_token.set({
				value: accessToken,
				httpOnly: true,
				secure: Bun.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 60,
				//maxAge: 15 * 60,
				path: "/",
			});
			cookie.refresh_token.set({
				value: refreshToken,
				httpOnly: true,
				secure: Bun.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 2 * 60,
				//maxAge: 7 * 24 * 60 * 60,
				path: "/auth/refresh",
			});

			return { message: "Login realizado com sucesso." };
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				password: t.String(),
			}),
			detail: {
				tags: ["Auth"],
				summary: "Iniciar sesión",
				description: "Verifica credenciales y otorga cookies de sesión.",
			},
			// ✅ Tipar as cookies que esta rota vai ESCREVER
			cookie: t.Cookie({
				access_token: t.Optional(t.String()),
				refresh_token: t.Optional(t.String()),
			}),
		},
	);
