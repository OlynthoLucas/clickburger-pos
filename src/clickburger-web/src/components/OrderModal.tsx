import { useOrderStore } from "../store/orderStore";
import styles from "./OrderModal.module.scss";

import { useEffect, useState } from "react";
import api from "../services/api";

interface MenuItemDto {
    id: string;
    name: string;
    price: number;
    category: string;
    available: boolean;
}

interface OrderMenuItem {
    id: string;
    name: string;
    price: number;
    isDrink: boolean;
}

interface OrderModalProps {
    orderId: string;
    mesaId: number;
    onClose: () => void;
}

export function OrderModal({ orderId, mesaId, onClose }: OrderModalProps) {
    const {
        orders,
        addItem,
        removeItem,
        updateQuantity,
        sendOrder,
    } = useOrderStore();

    const order = orders.find(o => o.id === orderId);

    const [menuItems, setMenuItems] = useState<OrderMenuItem[]>([]);
    const [loadingMenu, setLoadingMenu] = useState(true);

    useEffect(() => {
        api.get<MenuItemDto[]>("/api/menu")
            .then((res) => {
                const available = res.data.filter(m => m.available !== false);
                setMenuItems(available.map(m => ({
                    id: m.id,
                    name: m.name,
                    price: m.price,
                    isDrink: m.category === "Bebidas" || m.category?.toLowerCase().includes("bebida"),
                })));
            })
            .catch((err) => {
                console.error("Erro ao carregar cardápio:", err);
            })
            .finally(() => {
                setLoadingMenu(false);
            });
    }, []);

    if (!order) return null;

    // Garante que só pedidos "aberto" podem ser editados
    const isEditable = order.status === "aberto";

    const total = order.items.reduce(
        (acc, i) => acc + i.price * i.quantity,
        0
    );

    function handleEnviar() {
        if (order!.items.length === 0) {
            alert("Adicione pelo menos um item antes de enviar.");
            return;
        }

        sendOrder(orderId); // sendOrder decide internamente se vai para cozinha ou retirada
        onClose();
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>

                <h2>
                    Mesa {mesaId} — Pedido #{order.id.slice(0, 6).toUpperCase()}
                </h2>

                {!isEditable && (
                    <p className={styles.lockedNotice}>
                        ⚠️ Este pedido já foi enviado e não pode ser editado.
                    </p>
                )}

                {/* MENU — só visível se o pedido ainda está aberto */}
                {isEditable && (
                    <div className={styles.menuList}>
                        {loadingMenu && <p>Carregando cardápio...</p>}
                        {!loadingMenu && menuItems.length === 0 && <p>Nenhum item disponível.</p>}
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addItem(orderId, item)}
                            >
                                <span>{item.name}</span>
                                <span>R$ {item.price.toFixed(2)}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* ITENS DO PEDIDO */}
                <div className={styles.orderItems}>
                    {order.items.length === 0 && (
                        <p className={styles.empty}>
                            Nenhum item adicionado
                        </p>
                    )}

                    {order.items.map(item => (
                        <div key={item.id} className={styles.item}>

                            <span>{item.name}</span>

                            {isEditable ? (
                                <div className={styles.controls}>
                                    <button onClick={() => updateQuantity(orderId, item.id, item.quantity - 1)}>
                                        -
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(orderId, item.id, item.quantity + 1)}>
                                        +
                                    </button>
                                    <button onClick={() => removeItem(orderId, item.id)}>
                                        ❌
                                    </button>
                                </div>
                            ) : (
                                <span className={styles.quantity}>
                                    x{item.quantity}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* TOTAL */}
                <div className={styles.total}>
                    Total: R$ {total.toFixed(2)}
                </div>

                {/* AVISO BEBIDAS */}
                {isEditable && order.isOnlyDrinks && (
                    <p className={styles.drinkNotice}>
                        🥤 Apenas bebidas — vai direto para retirada!
                    </p>
                )}

                {/* AÇÕES */}
                <div className={styles.actions}>
                    <button className={styles.btnCancel} onClick={onClose}>
                        {isEditable ? "Cancelar" : "Fechar"}
                    </button>

                    {isEditable && (
                        <button onClick={handleEnviar} className={styles.btnSubmit}>
                            {order.isOnlyDrinks ? "Confirmar retirada" : "Enviar para cozinha"}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
