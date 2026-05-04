// src/plugins/jwt.plugin.ts

import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";

// ❶ Plugin do Access Token (curta duração: 15 minutos)
export const accessJwt = new Elysia({ name: "access-jwt" }).use(
	jwt({
		name: "accessJwt", // nome exposto no contexto
		secret: Bun.env.JWT_ACCESS_SECRET!,
		exp: "1m", // expira em 1 minutos
		//exp: "15m", // expira em 15 minutos
	}),
);

// ❷ Plugin do Refresh Token (longa duração: 7 dias)
export const refreshJwt = new Elysia({ name: "refresh-jwt" }).use(
	jwt({
		name: "refreshJwt",
		secret: Bun.env.JWT_REFRESH_SECRET!,
		exp: "2m", // expira em 2 minutos
		//exp: "7d", // expira em 7 dias
	}),
);
