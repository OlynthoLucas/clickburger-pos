import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "./test-utils";

/**
 * Smoke tests da infraestrutura de testes. Se algum destes quebrar, o
 * problema NÃO é do código de produto: é configuração (Vitest, jsdom,
 * RTL, jest-dom, MSW lifecycle ou tsconfig). Mantenha-os simples e
 * resista à tentação de testar lógica de domínio aqui.
 */
describe("infra de testes", () => {
    it("Vitest está conectado e roda asserções básicas", () => {
        expect(2 + 2).toBe(4);
    });

    it("RTL + jsdom renderizam JSX e jest-dom expõe matchers de DOM", () => {
        renderWithProviders(<h1>Olá ClickBurger</h1>);

        expect(
            screen.getByRole("heading", { name: /olá clickburger/i })
        ).toBeInTheDocument();
    });
});
