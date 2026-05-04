import { db } from "../client";
import { products } from "../schema";
import { eq } from "drizzle-orm";

export const productsServices = {
	// Listar todos os produtos
	async getAllProducts() {
		try {
			return await db.select().from(products);
		} catch (error) {
			console.error("Erro no getAllProducts:", error);
			throw new Error("Erro ao procurar produtos no banco de dados.");
		}
	},

	// Criar um novo produto
	async createProduct(data: {
		name: string;
		price: number;
		stockQuantity: number;
	}) {
		try {
			const totalPrice = data.price * data.stockQuantity;
			return await db
				.insert(products)
				.values({ ...data, totalPrice })
				.returning();
		} catch (error) {
			console.error("Erro no createProduct:", error);
			throw new Error("Erro ao criar produto.");
		}
	},

	// Procurar produto por ID
	async getProductById(id: string) {
		try {
			const result = await db
				.select()
				.from(products)
				.where(eq(products.id, id))
				.limit(1);
			return result[0] || null;
		} catch (error) {
			console.error("Erro no getProductById:", error);
			throw new Error("Erro ao procurar produto.");
		}
	},

	// Atualizar produto
	async updateProduct(id: string, data: Partial<typeof products.$inferInsert>) {
		try {
			return await db
				.update(products)
				.set(data)
				.where(eq(products.id, id))
				.returning();
		} catch (error) {
			console.error("Erro no updateProduct:", error);
			throw new Error("Erro ao atualizar produto.");
		}
	},

	// Eliminar produto
	async deleteProduct(id: string) {
		try {
			return await db.delete(products).where(eq(products.id, id)).returning();
		} catch (error) {
			console.error("Erro no deleteProduct:", error);
			throw new Error("Erro ao eliminar produto.");
		}
	},
};
