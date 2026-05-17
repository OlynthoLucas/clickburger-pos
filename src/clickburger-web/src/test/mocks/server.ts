import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * Servidor MSW para Node (usado pelo Vitest). Em testes que precisam de um
 * comportamento diferente de um endpoint, faça `server.use(http.get(...))`
 * dentro do próprio teste — o `resetHandlers()` no `setup.ts` garante que
 * o override não vaza para outros testes.
 */
export const server = setupServer(...handlers);
