import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

import API_URL from "../config";

export default function CheckoutPage() {
    const navigate = useNavigate();
    const customerId = localStorage.getItem("customerId");

    const [cart, setCart] = useState([]);
    const [form, setForm] = useState({
        name: localStorage.getItem("customerName") || "",
        phone: "",
        address: "",
        city: "",
        pincode: ""
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    useEffect(() => {
        async function loadProfile() {
            if (!customerId) {
                setError("Please log out and log in again to continue.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `${API_URL}/profile/${encodeURIComponent(customerId)}`
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Could not load your address.");
                }

                setForm({
                    name: data.Name || "",
                    phone: data.Phone || "",
                    address: data.Address || "",
                    city: data.City || "",
                    pincode: data.Pincode || ""
                });
            } catch (err) {
                setError(
                    err instanceof TypeError
                        ? "Cannot connect to the backend. Check that Flask is running."
                        : err.message
                );
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [customerId]);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
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

    // Delivery fee is displayed as zero for now.
    // We can add a delivery charge rule later.
    const deliveryFee = 0;
    const total = subtotal + deliveryFee;

    function continueToPayment(event) {
        event.preventDefault();
        setError("");

        if (!cart.length) {
            setError("Your cart is empty. Add food before checkout.");
            return;
        }

        if (
            !form.name.trim() ||
            !form.phone.trim() ||
            !form.address.trim() ||
            !form.city.trim() ||
            !form.pincode.trim()
        ) {
            setError("Please complete all delivery details.");
            return;
        }

        const checkoutData = {
            customerId,
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            pincode: form.pincode.trim(),
            items: cart,
            subtotal,
            deliveryFee,
            total
        };

        sessionStorage.setItem(
            "checkoutData",
            JSON.stringify(checkoutData)
        );

        navigate("/payment");
    }

    return (
        <div style={styles.page}>
            <Navbar />

            <main style={styles.container}>
                <button
                    type="button"
                    style={styles.backButton}
                    onClick={() => navigate("/cart")}
                >
                    ← Back to Cart
                </button>

                <header style={styles.header}>
                    <p style={styles.eyebrow}>ALMOST THERE</p>
                    <h1 style={styles.heading}>Checkout</h1>
                    <p style={styles.subtitle}>
                        Confirm your delivery details and review your order.
                    </p>
                </header>

                {loading ? (
                    <div style={styles.notice}>Loading your details...</div>
                ) : (
                    <>
                        {error && (
                            <div role="alert" style={styles.error}>
                                {error}
                            </div>
                        )}

                        {cart.length === 0 && (
                            <div style={styles.empty}>
                                <h2>Your cart is empty</h2>
                                <p>Add dishes before proceeding to checkout.</p>
                                <button
                                    type="button"
                                    style={styles.primaryButton}
                                    onClick={() => navigate("/restaurants")}
                                >
                                    Explore Restaurants
                                </button>
                            </div>
                        )}

                        {cart.length > 0 && (
                            <div style={styles.layout}>
                                <form
                                    id="checkout-form"
                                    onSubmit={continueToPayment}
                                    style={styles.form}
                                >
                                    <h2 style={styles.sectionTitle}>
                                        Delivery Details
                                    </h2>

                                    <div style={styles.field}>
                                        <label htmlFor="name">Full Name *</label>
                                        <input
                                            id="name"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                            maxLength={100}
                                            style={styles.input}
                                        />
                                    </div>

                                    <div style={styles.field}>
                                        <label htmlFor="phone">Phone Number *</label>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={form.phone}
                                            onChange={handleChange}
                                            required
                                            maxLength={15}
                                            style={styles.input}
                                        />
                                    </div>

                                    <div style={styles.field}>
                                        <label htmlFor="address">
                                            Delivery Address *
                                        </label>
                                        <textarea
                                            id="address"
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            rows={2}
                                            required
                                            style={styles.input}
                                        />
                                    </div>

                                    <div style={styles.twoColumns}>
                                        <div style={styles.field}>
                                            <label htmlFor="city">City *</label>
                                            <input
                                                id="city"
                                                name="city"
                                                value={form.city}
                                                onChange={handleChange}
                                                required
                                                style={styles.input}
                                            />
                                        </div>

                                        <div style={styles.field}>
                                            <label htmlFor="pincode">
                                                Pincode *
                                            </label>
                                            <input
                                                id="pincode"
                                                name="pincode"
                                                value={form.pincode}
                                                onChange={handleChange}
                                                required
                                                maxLength={10}
                                                style={styles.input}
                                            />
                                        </div>
                                    </div>

                                    <p style={styles.addressNote}>
                                        These details are used for this order.
                                        Your saved profile will not be changed
                                        when you edit this checkout form.
                                    </p>

                                    <button
                                        type="submit"
                                        style={styles.primaryButton}
                                    >
                                        Continue to Payment →
                                    </button>
                                </form>

                                <aside style={styles.summary}>
                                    <h2 style={styles.sectionTitle}>
                                        Order Summary
                                    </h2>

                                    <p style={styles.itemCount}>
                                        {totalItems} item
                                        {totalItems === 1 ? "" : "s"}
                                    </p>

                                    <div style={styles.itemsList}>
                                        {cart.map((item) => (
                                            <div
                                                key={`${item.Restaurant_ID}-${item.Menu_ID}`}
                                                style={styles.summaryItem}
                                            >
                                                <div style={styles.itemText}>
                                                    <strong>
                                                        {item.Item_Name}
                                                    </strong>
                                                    <span>
                                                        Qty: {Number(item.quantity || 1)}
                                                    </span>
                                                </div>

                                                <strong>
                                                    ₹{(
                                                        Number(item.Price || 0) *
                                                        Number(item.quantity || 1)
                                                    ).toFixed(2)}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={styles.divider} />

                                    <div style={styles.summaryRow}>
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toFixed(2)}</span>
                                    </div>

                                    <div style={styles.summaryRow}>
                                        <span>Delivery fee</span>
                                        <span>
                                            {deliveryFee === 0
                                                ? "Free"
                                                : `₹${deliveryFee.toFixed(2)}`}
                                        </span>
                                    </div>

                                    <div style={styles.totalRow}>
                                        <strong>Total</strong>
                                        <strong>₹{total.toFixed(2)}</strong>
                                    </div>

                                    <p style={styles.summaryNote}>
                                        Payment has not been collected yet.
                                    </p>
                                </aside>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#ffffff",
        color: "#252525",
        fontFamily: "Arial, sans-serif"
    },
    container: {
        width: "92%",
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "22px 0 45px",
        boxSizing: "border-box"
    },
    backButton: {
        border: "none",
        background: "transparent",
        color: "#d71928",
        fontWeight: "bold",
        cursor: "pointer",
        padding: "7px 0"
    },
    header: {
        margin: "15px 0 23px"
    },
    eyebrow: {
        color: "#d71928",
        fontSize: "11px",
        fontWeight: "bold",
        letterSpacing: "1.5px",
        marginBottom: "6px"
    },
    heading: {
        fontSize: "32px",
        margin: "0 0 7px"
    },
    subtitle: {
        color: "#707070",
        fontSize: "13px",
        margin: 0
    },
    layout: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
        alignItems: "start",
        gap: "22px"
    },
    form: {
        padding: "22px",
        border: "1px solid #eeeeee",
        borderRadius: "14px",
        background: "#ffffff"
    },
    summary: {
        padding: "22px",
        border: "1px solid #f0e5cf",
        borderRadius: "14px",
        background: "#fffaf0"
    },
    sectionTitle: {
        fontSize: "19px",
        margin: "0 0 18px"
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        marginBottom: "15px",
        fontSize: "13px",
        fontWeight: 600
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 11px",
        border: "1px solid #dddddd",
        borderRadius: "7px",
        background: "#ffffff",
        color: "#252525",
        font: "inherit",
        fontWeight: 400,
        fontSize: "13px"
    },
    twoColumns: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "12px"
    },
    addressNote: {
        color: "#777777",
        fontSize: "12px",
        lineHeight: 1.5,
        margin: "0 0 15px"
    },
    itemCount: {
        color: "#777777",
        fontSize: "13px",
        margin: "0 0 15px"
    },
    itemsList: {
        display: "flex",
        flexDirection: "column",
        gap: "13px"
    },
    summaryItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
        fontSize: "13px"
    },
    itemText: {
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },
    divider: {
        height: "1px",
        background: "#e8ddc7",
        margin: "20px 0"
    },
    summaryRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        margin: "12px 0",
        color: "#666666",
        fontSize: "13px"
    },
    totalRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        marginTop: "18px",
        fontSize: "18px"
    },
    summaryNote: {
        marginTop: "20px",
        color: "#777777",
        fontSize: "12px",
        lineHeight: 1.5
    },
    primaryButton: {
        width: "100%",
        padding: "12px",
        border: "none",
        borderRadius: "8px",
        background: "#d71928",
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: "14px",
        cursor: "pointer"
    },
    error: {
        marginBottom: "18px",
        padding: "11px 13px",
        borderRadius: "8px",
        background: "#fff0f0",
        color: "#b00020",
        fontSize: "13px"
    },
    notice: {
        padding: "35px",
        textAlign: "center",
        color: "#777777"
    },
    empty: {
        padding: "35px 20px",
        textAlign: "center",
        background: "#fffaf0",
        borderRadius: "14px"
    }
};
