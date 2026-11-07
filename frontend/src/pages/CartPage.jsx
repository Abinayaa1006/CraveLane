
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

import API_URL from "../config";

export default function CartPage() {
    const navigate = useNavigate();

    const [cart, setCart] = useState([]);
    const [restaurantNames, setRestaurantNames] = useState({});
    const [message, setMessage] = useState("");

    useEffect(() => {
        try {
            const saved = JSON.parse(
                localStorage.getItem("cart") || "[]"
            );
            setCart(Array.isArray(saved) ? saved : []);
        } catch {
            setCart([]);
        }
    }, []);

    // Load actual restaurant names from the backend.
    useEffect(() => {
        async function loadRestaurantNames() {
            try {
                const response = await fetch(`${API_URL}/restaurants`);

                if (!response.ok) {
                    throw new Error("Failed to load restaurants");
                }

                const restaurants = await response.json();
                const names = {};

                restaurants.forEach((restaurant) => {
                    names[Number(restaurant.Restaurant_ID)] =
                        restaurant.Restaurant_Name;
                });

                setRestaurantNames(names);
            } catch (error) {
                console.error("Could not load restaurant names:", error);
            }
        }

        loadRestaurantNames();
    }, []);

    function saveCart(updatedCart) {
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("cartUpdated"));
    }

    function isSameItem(a, b) {
        return (
            Number(a.Menu_ID) === Number(b.Menu_ID) &&
            Number(a.Restaurant_ID) === Number(b.Restaurant_ID)
        );
    }

    function changeQuantity(item, amount) {
        const currentQuantity = Number(item.quantity || 1);
        const nextQuantity = currentQuantity + amount;

        const updated = cart
            .map((cartItem) => {
                if (!isSameItem(cartItem, item)) return cartItem;

                return {
                    ...cartItem,
                    quantity: nextQuantity
                };
            })
            .filter((cartItem) => Number(cartItem.quantity) > 0);

        saveCart(updated);

        if (amount > 0) {
            showMessage(`${item.Item_Name} added to your cart. Quantity: ${nextQuantity}.`);
        } else if (nextQuantity <= 0) {
            showMessage(`${item.Item_Name} removed from your cart.`);
        } else {
            showMessage(`${item.Item_Name} quantity decreased to ${nextQuantity}.`);
        }
    }

    function removeItem(item) {
        saveCart(cart.filter((cartItem) => !isSameItem(cartItem, item)));
        showMessage(`${item.Item_Name} removed from your cart.`);
    }

    function clearCart() {
        saveCart([]);
        showMessage("Your cart has been cleared.");
    }

    function showMessage(text) {
        setMessage(text);

        if (window.cartToastTimer) {
            window.clearTimeout(window.cartToastTimer);
        }

        window.cartToastTimer = window.setTimeout(() => {
            setMessage("");
            window.cartToastTimer = null;
        }, 2800);
    }

    const totalItems = cart.reduce(
        (sum, item) => sum + Number(item.quantity || 1),
        0
    );

    const subtotal = useMemo(
        () =>
            cart.reduce(
                (sum, item) =>
                    sum +
                    Number(item.Price || 0) *
                        Number(item.quantity || 1),
                0
            ),
        [cart]
    );

    const restaurantGroups = useMemo(() => {
        const groups = new Map();

        cart.forEach((item) => {
            const id = Number(item.Restaurant_ID);

            if (!groups.has(id)) {
                groups.set(id, {
                    id,
                    name:
                        restaurantNames[id] ||
                        item.Restaurant_Name ||
                        `Restaurant ID ${id}`,
                    items: []
                });
            }

            groups.get(id).items.push(item);
        });

        return Array.from(groups.values());
    }, [cart, restaurantNames]);

    return (
        <div style={styles.page}>
            <style>{`
                @keyframes cartToastIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <Navbar />

            <main style={styles.container}>
                <button
                    type="button"
                    style={styles.backButton}
                    onClick={() => navigate("/restaurants")}
                >
                    ← Continue Shopping
                </button>

                <header style={styles.header}>
                    <p style={styles.eyebrow}>YOUR SELECTION</p>
                    <h1 style={styles.heading}>My Cart</h1>
                    <p style={styles.subtitle}>
                        Everything you love, ready to order.
                    </p>
                </header>

                {message && (
                    <div
                        key={message}
                        role="status"
                        aria-live="polite"
                        style={styles.toast}
                    >
                        <span style={styles.toastIcon}>✓</span>
                        <span>{message}</span>
                    </div>
                )}

                {cart.length === 0 ? (
                    <section style={styles.empty}>
                        <div style={styles.emptyIcon}>🛒</div>
                        <h2>Your cart is empty</h2>
                        <p>
                            Find your favourite restaurant and add some
                            delicious dishes.
                        </p>

                        <button
                            type="button"
                            style={styles.primaryButton}
                            onClick={() => navigate("/restaurants")}
                        >
                            Explore Restaurants →
                        </button>
                    </section>
                ) : (
                    <div style={styles.layout}>
                        <section style={styles.itemsColumn}>
                            <div style={styles.listHeader}>
                                <h2>Your Items ({totalItems})</h2>

                                <button
                                    type="button"
                                    style={styles.clearButton}
                                    onClick={clearCart}
                                >
                                    Clear Cart
                                </button>
                            </div>

                            {restaurantGroups.map((group) => (
                                <section
                                    key={group.id}
                                    style={styles.restaurantGroup}
                                >
                                    <h3 style={styles.restaurantName}>
                                        🍽️ {group.name}
                                    </h3>

                                    {group.items.map((item) => (
                                        <article
                                            key={`${item.Restaurant_ID}-${item.Menu_ID}`}
                                            style={styles.item}
                                        >
                                            <div style={styles.foodIcon}>
                                                {(item.Image_URL || item.image_url || item.ImageUrl || item.imageUrl || item.image) ? (
                                                    <>
                                                        <img
                                                            src={item.Image_URL || item.image_url || item.ImageUrl || item.imageUrl || item.image}
                                                            alt={item.Item_Name || "Food item"}
                                                            style={styles.foodImage}
                                                            onError={(event) => {
                                                                event.currentTarget.style.display = "none";
                                                                const fallback = event.currentTarget.nextElementSibling;
                                                                if (fallback) fallback.style.display = "flex";
                                                            }}
                                                        />
                                                        <span style={{ ...styles.foodImageFallback, display: "none" }}>
                                                            {getFoodEmoji(item.Category)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span>{getFoodEmoji(item.Category)}</span>
                                                )}
                                            </div>

                                            <div style={styles.itemDetails}>
                                                <h4 style={styles.itemName}>
                                                    {item.Item_Name}
                                                </h4>

                                                <p style={styles.category}>
                                                    {item.Category || "Dish"}
                                                </p>

                                                <strong style={styles.price}>
                                                    ₹{Number(item.Price).toFixed(2)}
                                                </strong>

                                                <button
                                                    type="button"
                                                    style={styles.removeButton}
                                                    onClick={() =>
                                                        removeItem(item)
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            </div>

                                            <div style={styles.quantityBox}>
                                                <button
                                                    type="button"
                                                    aria-label={`Decrease ${item.Item_Name}`}
                                                    style={styles.quantityButton}
                                                    onClick={() =>
                                                        changeQuantity(item, -1)
                                                    }
                                                >
                                                    −
                                                </button>

                                                <span style={styles.quantity}>
                                                    {Number(item.quantity || 1)}
                                                </span>

                                                <button
                                                    type="button"
                                                    aria-label={`Increase ${item.Item_Name}`}
                                                    style={styles.quantityButton}
                                                    onClick={() =>
                                                        changeQuantity(item, 1)
                                                    }
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <strong style={styles.lineTotal}>
                                                ₹{(
                                                    Number(item.Price) *
                                                    Number(item.quantity || 1)
                                                ).toFixed(2)}
                                            </strong>
                                        </article>
                                    ))}
                                </section>
                            ))}
                        </section>

                        <aside style={styles.summary}>
                            <h2 style={styles.summaryTitle}>
                                Order Summary
                            </h2>

                            <div style={styles.summaryRow}>
                                <span>Total quantity</span>
                                <span>{totalItems}</span>
                            </div>

                            <div style={styles.summaryRow}>
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>

                            <div style={styles.summaryRow}>
                                <span>Delivery fee</span>
                                <span>At checkout</span>
                            </div>

                            <div style={styles.divider} />

                            <div style={styles.totalRow}>
                                <strong>Subtotal</strong>
                                <strong>₹{subtotal.toFixed(2)}</strong>
                            </div>

                            <p style={styles.note}>
                                Any delivery charges will be shown before
                                you place your order.
                            </p>

                            <button
                                type="button"
                                style={styles.primaryButton}
                                onClick={() => navigate("/checkout")}
                            >
                                Proceed to Checkout →
                            </button>

                            <button
                                type="button"
                                style={styles.secondaryButton}
                                onClick={() => navigate("/restaurants")}
                            >
                                Add More Items
                            </button>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}

function getFoodEmoji(category = "") {
    const value = category.toLowerCase();

    if (value.includes("bread")) return "🫓";
    if (value.includes("pizza")) return "🍕";
    if (value.includes("rice")) return "🍚";
    if (value.includes("noodle")) return "🍜";
    if (value.includes("salad")) return "🥗";
    if (value.includes("healthy")) return "🥑";

    return "🍽️";
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#ffffff",
        color: "#252525",
        fontFamily: "Arial, sans-serif"
    },
    container: {
        width: "90%",
        maxWidth: "1250px",
        margin: "0 auto",
        padding: "30px 0 65px",
        boxSizing: "border-box"
    },
    backButton: {
        border: "none",
        background: "transparent",
        color: "#d71928",
        fontWeight: "bold",
        cursor: "pointer",
        padding: "10px 0"
    },
    header: {
        margin: "20px 0 30px"
    },
    eyebrow: {
        color: "#d71928",
        fontSize: "12px",
        fontWeight: "bold",
        letterSpacing: "2px"
    },
    heading: {
        fontSize: "clamp(32px, 4vw, 46px)",
        margin: "10px 0"
    },
    subtitle: {
        color: "#707070",
        lineHeight: "1.6"
    },
    toast: {
        position: "fixed",
        top: "88px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        maxWidth: "min(420px, calc(100vw - 32px))",
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#ffffff",
        color: "#252525",
        border: "1px solid #f2dfb5",
        borderLeft: "5px solid #d71928",
        boxShadow: "0 10px 30px rgba(0,0,0,0.16)",
        fontSize: "14px",
        fontWeight: 600,
        animation: "cartToastIn 180ms ease-out"
    },
    toastIcon: {
        width: "24px",
        height: "24px",
        flex: "0 0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: "#e8f7ec",
        color: "#218838",
        fontWeight: 800
    },
    layout: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 350px), 1fr))",
        alignItems: "start",
        gap: "28px"
    },
    itemsColumn: {
        minWidth: 0
    },
    listHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "18px"
    },
    restaurantGroup: {
        padding: "20px",
        marginBottom: "20px",
        border: "1px solid #eeeeee",
        borderRadius: "16px",
        background: "#ffffff"
    },
    restaurantName: {
        margin: "0 0 18px",
        paddingBottom: "14px",
        borderBottom: "1px solid #eeeeee",
        fontSize: "18px"
    },
    item: {
        display: "grid",
        gridTemplateColumns: "55px minmax(0, 1fr) auto",
        alignItems: "center",
        gap: "14px",
        padding: "18px 0",
        borderBottom: "1px solid #f1f1f1"
    },
    foodIcon: {
        width: "55px",
        height: "55px",
        flex: "0 0 55px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#fff4d9",
        borderRadius: "12px",
        fontSize: "29px"
    },
    foodImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block"
    },
    foodImageFallback: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "29px"
    },
    itemDetails: {
        minWidth: 0
    },
    itemName: {
        margin: "0 0 5px",
        fontSize: "16px"
    },
    category: {
        margin: "0 0 7px",
        fontSize: "12px",
        color: "#777777"
    },
    price: {
        color: "#d71928"
    },
    removeButton: {
        display: "block",
        padding: "6px 0",
        border: "none",
        background: "transparent",
        color: "#d71928",
        cursor: "pointer",
        fontSize: "12px"
    },
    quantityBox: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        border: "1px solid #eeeeee",
        borderRadius: "9px",
        padding: "5px"
    },
    quantityButton: {
        width: "27px",
        height: "27px",
        border: "none",
        borderRadius: "6px",
        background: "#fff0bd",
        cursor: "pointer",
        fontWeight: "bold"
    },
    quantity: {
        minWidth: "15px",
        textAlign: "center",
        fontWeight: "bold"
    },
    lineTotal: {
        gridColumn: "2 / 4",
        justifySelf: "end",
        fontSize: "14px"
    },
    summary: {
        padding: "25px",
        background: "#fffaf0",
        border: "1px solid #f0e5cf",
        borderRadius: "16px"
    },
    summaryTitle: {
        marginTop: 0,
        marginBottom: "25px",
        fontSize: "23px"
    },
    summaryRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
        margin: "17px 0",
        color: "#666666",
        fontSize: "14px"
    },
    divider: {
        height: "1px",
        background: "#e8ddc7",
        margin: "22px 0"
    },
    totalRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        fontSize: "18px"
    },
    note: {
        color: "#777777",
        fontSize: "12px",
        lineHeight: "1.6",
        margin: "20px 0"
    },
    primaryButton: {
        width: "100%",
        padding: "14px",
        border: "none",
        borderRadius: "10px",
        background: "#d71928",
        color: "#ffffff",
        fontWeight: "bold",
        cursor: "pointer",
        marginTop: "10px"
    },
    secondaryButton: {
        width: "100%",
        padding: "13px",
        marginTop: "12px",
        border: "1px solid #d71928",
        borderRadius: "10px",
        background: "#ffffff",
        color: "#d71928",
        fontWeight: "bold",
        cursor: "pointer"
    },
    clearButton: {
        border: "none",
        background: "transparent",
        color: "#d71928",
        cursor: "pointer",
        fontWeight: "bold"
    },
    empty: {
        textAlign: "center",
        padding: "65px 20px",
        border: "1px solid #eeeeee",
        borderRadius: "18px",
        background: "#fffaf0"
    },
    emptyIcon: {
        fontSize: "60px"
    }
};
