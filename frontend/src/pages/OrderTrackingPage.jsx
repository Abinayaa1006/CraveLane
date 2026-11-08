
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

import API_URL from "../config";

const STEPS = [
    { label: "Order Placed", status: "Pending", icon: "📋" },
    { label: "Preparing", status: "Preparing", icon: "👨‍🍳" },
    { label: "Out for Delivery", status: "Out for Delivery", icon: "🛵" },
    { label: "Delivered", status: "Delivered", icon: "📦" }
];

export default function OrderTrackingPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_URL}/orders/${orderId}/status`
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to fetch order status.");
            }

            setOrder(data);
            setError("");
        } catch (err) {
            setError(err.message || "Could not connect to the backend.");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchStatus();

        const timer = setInterval(fetchStatus, 10000);
        return () => clearInterval(timer);
    }, [fetchStatus]);

    const currentStatus = order?.order_status;
    const currentIndex = STEPS.findIndex(
        (step) => step.status === currentStatus
    );

    const isCancelled = currentStatus === "Cancelled";
    const isDelivered = currentStatus === "Delivered";

    return (
        <div style={styles.page}>
            <Navbar />

            <main style={styles.container}>
                <button
                    onClick={() => navigate("/orders")}
                    style={styles.backButton}
                >
                    ← Back to My Orders
                </button>

                <section style={styles.card}>
                    <div style={styles.eyebrow}>CRAVELANE ORDER TRACKING</div>
                    <h1 style={styles.heading}>Track your order</h1>
                    <p style={styles.subtitle}>
                        Follow your order's progress from placement to delivery.
                    </p>

                    <div style={styles.orderNumber}>
                        Order #{orderId}
                    </div>

                    {loading ? (
                        <p style={styles.info}>Loading order status...</p>
                    ) : error ? (
                        <div style={styles.error}>
                            {error}
                            <button onClick={fetchStatus} style={styles.retry}>
                                Try again
                            </button>
                        </div>
                    ) : isCancelled ? (
                        <div style={styles.cancelled}>
                            <span style={{ fontSize: "35px" }}>✕</span>
                            <h2>Order cancelled</h2>
                            <p>This order is marked as cancelled.</p>
                        </div>
                    ) : (
                        <>
                            <div style={styles.statusBanner}>
                                <span style={{ fontSize: "28px" }}>
                                    {isDelivered ? "🎉" : "🍽️"}
                                </span>
                                <div>
                                    <div style={styles.statusCaption}>
                                        CURRENT STATUS
                                    </div>
                                    <strong style={styles.statusText}>
                                        {currentStatus || "Unknown"}
                                    </strong>
                                </div>
                            </div>

                            <div style={styles.timeline}>
                                {STEPS.map((step, index) => {
                                    const completed =
                                        currentIndex >= 0 &&
                                        index <= currentIndex;
                                    const active = index === currentIndex;

                                    return (
                                        <div
                                            key={step.status}
                                            style={styles.step}
                                        >
                                            <div style={styles.stepTrack}>
                                                <div
                                                    style={{
                                                        ...styles.stepCircle,
                                                        ...(completed
                                                            ? styles.completedCircle
                                                            : {})
                                                    }}
                                                >
                                                    {completed ? "✓" : step.icon}
                                                </div>

                                                {index < STEPS.length - 1 && (
                                                    <div
                                                        style={{
                                                            ...styles.connector,
                                                            ...(currentIndex > index
                                                                ? styles.completedConnector
                                                                : {})
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            <div style={styles.stepContent}>
                                                <strong
                                                    style={{
                                                        color: active
                                                            ? "#c62828"
                                                            : completed
                                                                ? "#3c332e"
                                                                : "#948781"
                                                    }}
                                                >
                                                    {step.label}
                                                </strong>

                                                <p style={styles.stepDescription}>
                                                    {index === 0
                                                        ? "Your order has been received."
                                                        : index === 1
                                                            ? "The restaurant is preparing your food."
                                                            : index === 2
                                                                ? "Your food is on its way."
                                                                : "Your order has been delivered."}
                                                </p>
                                            </div>

                                            {active && (
                                                <span style={styles.activeBadge}>
                                                    NOW
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {isDelivered && (
                                <div style={styles.deliveredNote}>
                                    Thank you for ordering with CraveLane!
                                </div>
                            )}
                        </>
                    )}

                    <p style={styles.refreshNote}>
                        Status refreshes automatically every 10 seconds.
                    </p>
                </section>
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
        maxWidth: "760px",
        width: "92%",
        margin: "0 auto",
        padding: "25px 0 45px"
    },
    backButton: {
        border: "none",
        background: "transparent",
        color: "#a32626",
        fontWeight: "700",
        padding: "10px 0",
        cursor: "pointer",
        marginBottom: "12px"
    },
    card: {
        background: "#ffffff",
        border: "1px solid #f0dfd5",
        borderRadius: "18px",
        padding: "30px",
        boxShadow: "0 8px 25px rgba(70, 30, 15, 0.05)"
    },
    eyebrow: {
        color: "#c62828",
        letterSpacing: "1.5px",
        fontSize: "11px",
        fontWeight: "800"
    },
    heading: {
        fontSize: "29px",
        margin: "10px 0"
    },
    subtitle: {
        color: "#796d66",
        fontSize: "14px",
        lineHeight: 1.6
    },
    orderNumber: {
        display: "inline-block",
        background: "#fff0e9",
        color: "#9f2525",
        borderRadius: "8px",
        padding: "9px 12px",
        fontWeight: "700",
        fontSize: "13px",
        margin: "12px 0 20px"
    },
    statusBanner: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        background: "#fff7ed",
        border: "1px solid #f4dfce",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "28px"
    },
    statusCaption: {
        color: "#8d7669",
        fontSize: "10px",
        letterSpacing: "1px",
        marginBottom: "5px"
    },
    statusText: {
        fontSize: "18px",
        color: "#9f2525"
    },
    timeline: {
        display: "flex",
        flexDirection: "column",
        gap: "0"
    },
    step: {
        display: "flex",
        alignItems: "flex-start",
        gap: "15px",
        minHeight: "92px"
    },
    stepTrack: {
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        width: "43px",
        flexShrink: 0
    },
    stepCircle: {
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        border: "2px solid #e9ded8",
        background: "#ffffff",
        color: "#8b7b73",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        flexShrink: 0
    },
    completedCircle: {
        background: "#c62828",
        color: "#ffffff",
        borderColor: "#c62828"
    },
    connector: {
        width: "3px",
        minHeight: "50px",
        background: "#eadfd8"
    },
    completedConnector: {
        background: "#c62828"
    },
    stepContent: {
        flex: 1,
        paddingTop: "7px"
    },
    stepDescription: {
        color: "#8b7b73",
        fontSize: "12px",
        margin: "6px 0 0",
        lineHeight: 1.5
    },
    activeBadge: {
        background: "#ffebe5",
        color: "#b32626",
        padding: "5px 8px",
        borderRadius: "20px",
        fontSize: "10px",
        fontWeight: "800"
    },
    cancelled: {
        padding: "25px 10px",
        textAlign: "center",
        color: "#b32626",
        background: "#fff0f0",
        borderRadius: "12px"
    },
    deliveredNote: {
        marginTop: "15px",
        padding: "13px",
        textAlign: "center",
        background: "#edf8ef",
        color: "#216e39",
        borderRadius: "10px",
        fontWeight: "600",
        fontSize: "14px"
    },
    info: {
        color: "#796d66",
        padding: "20px 0"
    },
    error: {
        background: "#fff0f0",
        color: "#a61f1f",
        padding: "15px",
        borderRadius: "10px"
    },
    retry: {
        display: "block",
        marginTop: "12px",
        border: "none",
        borderRadius: "8px",
        background: "#c62828",
        color: "#ffffff",
        padding: "9px 14px",
        cursor: "pointer"
    },
    refreshNote: {
        borderTop: "1px solid #f0e7e1",
        marginTop: "20px",
        paddingTop: "15px",
        fontSize: "11px",
        color: "#948781",
        textAlign: "center"
    }
};
