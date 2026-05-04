import { Elysia, t } from "elysia";
import { dbPlugin } from "../db/client";
import { authGuard } from "../plugins/auth.guard";
import { productsServices } from "../db/services/productsServices";

// Definimos o schema de validação fora para limpar o código
const productBodySchema = t.Object({
    name: t.String(),
    description: t.Optional(t.String()),
    price: t.Number(),
    stockQuantity: t.Number()
});

export const produtoRoutes = new Elysia({ prefix: '/produtos' })
    .use(dbPlugin)
    .use(authGuard)
    .group("", (app) => 
        app
            // LISTAR TODOS
            .get("/", async (context) => {
                // Forçamos o reconhecimento do serviço através do contexto
                const { productService } = context as any;
                return await productService.getAll();
            }, { requireAuth: true })

            // OBTER POR ID
            .get("/:id", async (context) => {
                const { productService, params, set } = context as any;
                const produto = await productService.getById(Number(params.id));
                
                if (!produto) {
                    set.status = 404;
                    return { error: "Produto não encontrado" };
                }
                return produto;
            }, {
                requireAuth: true,
                params: t.Object({ id: t.String() })
            })

            // CRIAR
            .post("/", async (context) => {
    const {  body } = context;
    console.log("body",body)

    const novoProduto = await productsServices.createProduct(body);
    
    return novoProduto;
}, {
    requireAuth: true,
    body: t.Object({
        name: t.String(),
        price: t.Number(), // Preço unitário
        stockQuantity: t.Number()  // Quantidade em estoque
    })
})

            // ATUALIZAR
            .put("/:id", async (context) => {
                const { productService, params, body, set } = context as any;
                const atualizado = await productService.update(Number(params.id), body);

                if (!atualizado) {
                    set.status = 404;
                    return { error: "Produto não encontrado" };
                }
                return atualizado;
            }, {
                requireAuth: true,
                params: t.Object({ id: t.String() }),
                body: t.Partial(productBodySchema)
            })

            // DELETAR
            .delete("/:id", async (context) => {
                const { productService, params, set } = context as any;
                const apagado = await productService.delete(Number(params.id));

                if (!apagado) {
                    set.status = 404;
                    return { error: "Produto não encontrado" };
                }
                return { message: "Removido", produto: apagado };
            }, {
                requireAuth: true,
                params: t.Object({ id: t.String() })
            })
    );