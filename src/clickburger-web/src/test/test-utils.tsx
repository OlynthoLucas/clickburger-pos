import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip";

interface ProvidersProps {
    children: ReactNode;
    initialRoute?: string;
}

/**
 * Espelha os providers de `App.tsx` (Tooltip + Router) para que componentes
 * que usam `useNavigate`, `useParams` ou tooltips do Radix não estourem
 * dentro do teste. Cada teste pode passar `initialRoute` para simular a
 * URL desejada.
 */
function AllProviders({ children, initialRoute = "/" }: ProvidersProps) {
    return (
        <TooltipProvider>
            <MemoryRouter initialEntries={[initialRoute]}>
                {children}
            </MemoryRouter>
        </TooltipProvider>
    );
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
    initialRoute?: string;
}

export function renderWithProviders(
    ui: ReactElement,
    { initialRoute, ...options }: CustomRenderOptions = {}
) {
    return render(ui, {
        wrapper: ({ children }) => (
            <AllProviders initialRoute={initialRoute}>{children}</AllProviders>
        ),
        ...options,
    });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
