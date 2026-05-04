import { t } from 'elysia';
import { createInsertSchema } from 'drizzle-typebox';
import { products } from '../schema/products';

// Exportamos o schema pronto para ser usado como middleware de validação
export const ProductValidation = {
    create: createInsertSchema(products, {
        name: t.String({ minLength: 3, error: 'O nome deve ter pelo menos 3 caracteres' }),
        price: t.Number({ minimum: 0, error: 'O preço não pode ser negativo' }),
        stockQuantity: t.Integer({ minimum: 0 }),
        // Campos ignorados no input do usuário
        id: t.Optional(t.Number()),
        createdAt: t.Optional(t.Any()),
        
    }),
    
    paramsId: t.Object({
        id: t.Numeric({ error: 'ID inválido' })
    }),

    updateStock: t.Object({
        quantity: t.Integer({ error: 'A quantidade deve ser um número inteiro' })
    })
};