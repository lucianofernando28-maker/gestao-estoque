// src/index.ts

import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { signInRoute, signUpRoute } from "./routes/auth.route";
import { logoutRoute } from "./routes/logout.route";
import { refreshRoute } from "./routes/refresh.route";
import { userRoute } from "./routes/user.route";
import { produtoRoutes } from "./routes/product.route";

const app = new Elysia()
	.use(
		openapi({
			documentation: {
				info: {
					title: "Task Auth API",
					version: "1.0.0",
					description:
						"API de autenticação com JWT + Refresh Token + cookies HttpOnly",
				},
				tags: [
					{
						name: "Auth",
						description: "Registo, login, logout e renovação de tokens",
					},
					{
						name: "Users",
						description: "Perfil e dados do utilizador autenticado",
					},
				],
				components: {
					securitySchemes: {
						// JWT transportado em cookie HttpOnly — não é enviado pelo Swagger UI,
						// mas documenta o esquema para consumidores externos da API.
						cookieAuth: {
							type: "apiKey",
							in: "cookie",
							name: "access_token",
						},
					},
				},
			},
		}),
	)
	.use(signUpRoute)
	.use(signInRoute)
	.use(refreshRoute)
	.use(userRoute)
	.use(produtoRoutes)
	//.group("/api", app => app.use(produtoRoutes))
	.use(logoutRoute)
	
	.onError(({ code, error }) => {
		if (code === "VALIDATION") return { status: 400, message: error.message };
		return {
			status: (code as number) || 500,
			message: (error as Error).message,
		};
	})
	
	.listen(3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
