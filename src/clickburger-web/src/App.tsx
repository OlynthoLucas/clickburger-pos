import { Toaster } from "sonner";
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip";
import { useEffect } from "react";
import { AppRoutes } from "./routes/AppRoutes";
import { useCashStore } from "./store/cashStore";
import { useAuthStore } from "./store/authStore";

function App() {
    const syncCash = useCashStore((s) => s.syncCash);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    // Sincroniza o estado do caixa sempre que o usuário estiver autenticado
    // Isso garante que admin e garçom vejam o mesmo estado após login ou F5
    useEffect(() => {
        if (!isAuthenticated) return;
        async function init() {
            await syncCash();
        }
        init().catch(console.error);
    }, [isAuthenticated, syncCash]);

    return (
        <TooltipProvider>
            <Toaster />
            <AppRoutes />
        </TooltipProvider>
    );
}

export default App;
