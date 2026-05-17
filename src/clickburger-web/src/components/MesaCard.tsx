import { motion } from "framer-motion";

type StatusMesa = "livre" | "pedido" | "ocupada";

interface MesaCardProps {
    id: number;
    status: StatusMesa;
    valor?: number;
    onClick: () => void;
}

export const MesaCard = ({ id, status, valor, onClick }: MesaCardProps) => {
    const statusConfig = {
        livre: {
            border: "border-green-500",
            badge: "bg-green-100 text-green-600",
            label: "LIVRE",
            subtitle: "Disponível",
        },
        pedido: {
            border: "border-orange-400",
            badge: "bg-orange-100 text-orange-600",
            label: "PEDIDO",
            subtitle: "",
        },
        ocupada: {
            border: "border-red-500",
            badge: "bg-red-100 text-red-600",
            label: "OCUPADA",
            subtitle: "",
        },
    };

    const config = statusConfig[status];

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className={`rounded-xl border-2 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition ${config.border}`}
        >
            <h2 className="text-xl font-bold">
                MESA {id.toString().padStart(2, "0")}
            </h2>

            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.badge}`}>
                {config.label}
            </span>

            {status === "livre" && (
                <p className="text-gray-400">{config.subtitle}</p>
            )}

            {status !== "livre" && (
                <p className="font-semibold">
                    R$ {valor?.toFixed(2)}
                </p>
            )}
        </motion.div>
    );
};