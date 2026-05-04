// src/utils/password.ts
export async function hashPassword(password: string) {
	return Bun.password.hash(password, {
		algorithm: "argon2id",
		memoryCost: 65536, // 64 MB — dificulta ataques com GPU
		timeCost: 3,
	});
}

export async function verifyPassword(password: string, hash: string) {
	return Bun.password.verify(password, hash);
}
