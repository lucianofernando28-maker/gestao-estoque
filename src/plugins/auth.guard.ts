// src/plugins/auth.guard.ts
import { Elysia, t } from "elysia";
import { accessJwt } from "./jwt.plugin";

export const authGuard = new Elysia({ name: "auth-guard" })
	.use(accessJwt)
	// ✅ Declarar a forma do store ANTES do macro
	//    Elysia registra os tipos e os propaga para os consumidores (user.route, etc.)
	.state({ userId: "" as string, role: "" as string })
	.guard({
		cookie: t.Cookie({
			access_token: t.Optional(t.String()),
		}),
	})
	.macro({
		/**
		 * @param enabled - Si es true, activa la validación del token antes de la ruta.
		 */
		// Uso: { requireAuth: true } em qualquer rota
		requireAuth(enabled: boolean) {
			if (!enabled) return;
			return {
				// ✅ TypeScript infere 'cookie', 'accessJwt', 'status' e 'store' (com userId e role)
				//    corretamente graças ao .state() + .guard() + plugin accessJwt
				async beforeHandle({ cookie, accessJwt, status, store }) {
					// Ler o accessToken do cookie HttpOnly (não do Authorization header)
					const token = cookie.access_token?.value;
					if (!token) return status(401, "Token não fornecido.");

					const payload = await accessJwt.verify(token);
					if (!payload) return status(401, "Token inválido ou expirado.");

					// ✅ store.userId e store.role estão tipados como string
					store.userId = payload.sub as string;
					store.role = payload.role as string;
				},
			};
		},
	});
