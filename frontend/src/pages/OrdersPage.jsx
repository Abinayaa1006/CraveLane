import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";


import API_URL from "../config";

function getCustomerId() {
    const directId =
        localStorage.getItem("customerId") ||
        localStorage.getItem("customer_id");

    if (directId) return directId;

    for (const key of ["user", "customer", "loggedInUser"]) {
        try {
            const stored = JSON.parse(localStorage.getItem(key) || "null");
            const id =
                stored?.customer_id ??
                stored?.customerId ??
                stored?.Customer_ID;

            if (id !== undefined && id !== null) return String(id);
        } catch {
            // Ignore invalid local-storage values.
        }
    }

    return null;
}

function FoodThumbnail({ item }) {
    const imageUrl =
        item.image_url ||
        item.Image_URL ||
        item.imageUrl ||
        item.ImageUrl ||
        item.image ||
        "";

    const [imageFailed, setImageFailed] = useState(false);

    if (!imageUrl || imageFailed) {
        return <div style={styles.foodFallback} aria-label="Food image unavailable">🍴</div>;
    }

    return (
        <img
            src={imageUrl}
            alt={item.item_name || "Ordered food"}
            style={styles.foodImage}
            loading="lazy"
            onError={() => setImageFailed(true)}
        />
    );
}

export default function OrdersPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchOrders = useCallback(async () => {
        const customerId = getCustomerId();

        if (!customerId) {
            setError("Customer ID not found. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            setError("");
            const response = await fetch(`${API_URL}/orders/customer/${customerId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not load your orders.");
            }

            setOrders(Array.isArray(data.orders) ? data.orders : []);
        } catch (err) {
            setError(err.message || "Unable to connect to the backend.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const totalSpent = orders.reduce(
        (sum, order) => sum + Number(order.total_amount || 0),
        0
    );

    const statusStyle = (status) => {
        const colors = {
            Pending: ["#fff3cd", "#856404"],
            Preparing: ["#ffedcc", "#985600"],
            "Out for Delivery": ["#dbeafe", "#1d4ed8"],
            Delivered: ["#dcfce7", "#166534"],
            Cancelled: ["#fee2e2", "#991b1b"]
        };
        const [background, color] = colors[status] || ["#f3f4f6", "#4b5563"];
        return {
            display: "inline-block",
            padding: "6px 10px",
            borderRadius: "20px",
            background,
            color,
            fontSize: "12px",
            fontWeight: "700"
        };
    };

    return (
        <div style={styles.page}>
            <Navbar />

            <main style={styles.container}>
                <div style={styles.header}>
                    <div>
                        <p style={styles.eyebrow}>CRAVELANE</p>
                        <h1 style={styles.heading}>My Orders</h1>
                        <p style={styles.subtitle}>Your orders, all in one place.</p>
                    </div>
                    <button
                        style={styles.refreshButton}
                        type="button"
                        onClick={() => {
                            setLoading(true);
                            fetchOrders();
                        }}
                    >
                        ↻ Refresh
                    </button>
                </div>

                {!loading && !error && (
                    <div style={styles.summaryGrid}>
                        <div style={styles.summaryCard}>
                            <span style={styles.summaryLabel}>Total Orders</span>
                            <strong style={styles.summaryValue}>{orders.length}</strong>
                        </div>
                        <div style={styles.summaryCard}>
                            <span style={styles.summaryLabel}>Total Spent</span>
                            <strong style={styles.summaryValue}>₹{totalSpent.toFixed(2)}</strong>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div style={styles.messageCard}>Loading your orders...</div>
                ) : error ? (
                    <div style={styles.errorCard}>
                        <strong>Couldn't load orders</strong>
                        <p>{error}</p>
                        <button
                            style={styles.primaryButton}
                            type="button"
                            onClick={() => {
                                setLoading(true);
                                fetchOrders();
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div style={styles.emptyCard}>
                        <div style={styles.emptyIcon}>🍽️</div>
                        <h2>No orders yet</h2>
                        <p>Your delicious journey starts here.</p>
                        <button
                            style={styles.primaryButton}
                            type="button"
                            onClick={() => navigate("/restaurants")}
                        >
                            Explore Restaurants
                        </button>
                    </div>
                ) : (
                    <div style={styles.orderList}>
                        {orders.map((order) => (
                            <article key={order.order_id} style={styles.orderCard}>
                                <div style={styles.orderHeader}>
                                    <div>
                                        <span style={styles.orderNumber}>Order #{order.order_id}</span>
                                        <h2 style={styles.restaurantName}>
                                            {order.restaurant_name ||
                                                (order.restaurant_names || []).join(", ") ||
                                                "Restaurant"}
                                        </h2>
                                    </div>
                                    <span style={statusStyle(order.order_status)}>
                                        {order.order_status || "Pending"}
                                    </span>
                                </div>

                                <div style={styles.itemList}>
                                    {(order.items || []).map((item, index) => (
                                        <div
                                            key={`${order.order_id}-${item.menu_id || index}-${index}`}
                                            style={styles.itemRow}
                                        >
                                            <div style={styles.itemInfo}>
                                                <FoodThumbnail item={item} />
                                                <div style={styles.itemText}>
                                                    <strong style={styles.itemName}>
                                                        {item.item_name || "Food item"}
                                                    </strong>
                                                    <p style={styles.itemQuantity}>
                                                        Quantity: {item.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                            <span style={styles.itemPrice}>
                                                ₹{(
                                                    Number(item.unit_price || 0) *
                                                    Number(item.quantity || 0)
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div style={styles.details}>
                                    <p><strong>Payment:</strong> {order.payment_method || "Not specified"}</p>
                                    <p><strong>Payment status:</strong> {order.payment_status || "Unknown"}</p>
                                    <p>
                                        <strong>Delivery address:</strong>{" "}
                                        {[
                                            order.delivery_address,
                                            order.city,
                                            order.pincode
                                        ].filter(Boolean).join(", ") || "Not available"}
                                    </p>
                                </div>

                                <div style={styles.orderFooter}>
                                    <div>
                                        <span style={styles.totalLabel}>Order Total</span>
                                        <strong style={styles.totalValue}>
                                            ₹{Number(order.total_amount || 0).toFixed(2)}
                                        </strong>
                                    </div>
                                    <button
                                        style={styles.trackButton}
                                        type="button"
                                        onClick={() => navigate(`/track-order/${order.order_id}`)}
                                    >
                                        Track Order →
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#fffaf5",
        color: "#302521"
    },
    container: {
        maxWidth: "1000px",
        width: "92%",
        margin: "0 auto",
        padding: "30px 0 50px"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap",
        marginBottom: "24px"
    },
    eyebrow: {
        color: "#c62828",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "1.5px",
        margin: "0 0 5px"
    },
    heading: { fontSize: "30px", margin: "0 0 6px" },
    subtitle: { color: "#796d66", margin: 0, fontSize: "14px" },
    refreshButton: {
        padding: "10px 14px",
        border: "1px solid #e8d7cd",
        borderRadius: "9px",
        background: "#fff",
        color: "#9f2525",
        fontWeight: "700",
        cursor: "pointer"
    },
    summaryGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "14px",
        marginBottom: "24px"
    },
    summaryCard: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        background: "#fff",
        border: "1px solid #f0dfd5",
        borderRadius: "12px",
        padding: "18px"
    },
    summaryLabel: { color: "#796d66", fontSize: "13px" },
    summaryValue: { fontSize: "25px", color: "#c62828" },
    orderList: { display: "flex", flexDirection: "column", gap: "18px" },
    orderCard: {
        background: "#fff",
        border: "1px solid #f0dfd5",
        borderRadius: "15px",
        padding: "20px",
        boxShadow: "0 4px 15px rgba(70,30,15,0.035)"
    },
    orderHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "12px",
        paddingBottom: "16px",
        borderBottom: "1px solid #f3e9e3"
    },
    orderNumber: { color: "#9a8a80", fontSize: "12px", fontWeight: "700" },
    restaurantName: { fontSize: "18px", margin: "6px 0 0" },
    itemList: { padding: "10px 0" },
    itemRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        padding: "10px 0",
        borderBottom: "1px solid #f7f1ed"
    },
    itemInfo: { display: "flex", alignItems: "center", gap: "12px", minWidth: 0 },
    foodImage: {
        width: "58px",
        height: "58px",
        flex: "0 0 58px",
        borderRadius: "10px",
        objectFit: "cover",
        display: "block",
        background: "#f4eee9"
    },
    foodFallback: {
        width: "58px",
        height: "58px",
        flex: "0 0 58px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "10px",
        background: "#fff0e8",
        fontSize: "25px"
    },
    itemText: { minWidth: 0 },
    itemName: { fontSize: "14px", color: "#302521" },
    itemQuantity: { margin: "5px 0 0", color: "#8a7d75", fontSize: "12px" },
    itemPrice: { flexShrink: 0, color: "#42352e", fontSize: "13px", fontWeight: "700" },
    details: {
        display: "grid",
        gap: "7px",
        padding: "13px 0",
        borderTop: "1px solid #f3e9e3",
        color: "#776b64",
        fontSize: "12px"
    },
    totalLabel: { display: "block", color: "#8a7d75", fontSize: "11px", marginBottom: "5px" },
    orderFooter: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "15px",
        paddingTop: "14px",
        borderTop: "1px solid #f3e9e3"
    },
    totalValue: { fontSize: "20px", color: "#c62828" },
    trackButton: {
        padding: "11px 16px",
        border: "none",
        borderRadius: "9px",
        background: "#c62828",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer"
    },
    messageCard: {
        background: "#fff",
        borderRadius: "12px",
        padding: "30px",
        textAlign: "center"
    },
    errorCard: { background: "#fff0f0", color: "#922020", borderRadius: "12px", padding: "22px" },
    emptyCard: {
        background: "#fff",
        border: "1px solid #f0dfd5",
        borderRadius: "15px",
        padding: "40px 20px",
        textAlign: "center"
    },
    emptyIcon: { fontSize: "42px" },
    primaryButton: {
        padding: "11px 16px",
        border: "none",
        borderRadius: "9px",
        background: "#c62828",
        color: "#fff",
        fontWeight: "700",
        cursor: "pointer"
    }
};
