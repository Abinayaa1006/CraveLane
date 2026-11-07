import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API_URL from "../config";
const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = RAZORPAY_SCRIPT;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

function PaymentPage() {
    const navigate = useNavigate();
    const [checkout, setCheckout] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("Cards");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const savedCheckout = sessionStorage.getItem("checkoutData");

        if (!savedCheckout) {
            navigate("/cart", { replace: true });
            return;
        }

        try {
            const data = JSON.parse(savedCheckout);
            if (!data.customerId || !Array.isArray(data.items) || data.items.length === 0) {
                navigate("/cart", { replace: true });
                return;
            }
            setCheckout(data);
        } catch {
            sessionStorage.removeItem("checkoutData");
            navigate("/cart", { replace: true });
        }
    }, [navigate]);

    const money = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

    const finishOrder = (data, method) => {
        localStorage.removeItem("cart");
        sessionStorage.removeItem("checkoutData");
        window.dispatchEvent(new Event("cartUpdated"));

        navigate("/order-confirmation", {
            replace: true,
            state: {
                orderId: data.order_id,
                total: data.total_amount,
                paymentMethod: data.payment_method || method,
                paymentStatus: data.payment_status,
                orderStatus: data.order_status
            }
        });
    };

    const placeCashOrder = async () => {
        const response = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: Number(checkout.customerId),
                delivery_address: checkout.address,
                city: checkout.city,
                pincode: checkout.pincode,
                payment_method: "Cash on Delivery",
                items: checkout.items.map((item) => ({
                    menu_id: Number(item.Menu_ID),
                    quantity: Number(item.quantity)
                }))
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not place your order.");
        finishOrder(data, "Cash on Delivery");
    };

    const payWithRazorpay = async () => {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
            throw new Error("Razorpay Checkout could not be loaded. Check your internet connection and try again.");
        }

        // The backend calculates the amount from current MySQL menu prices.
        const createResponse = await fetch(`${API_URL}/payments/razorpay/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: Number(checkout.customerId),
                delivery_address: checkout.address,
                city: checkout.city,
                pincode: checkout.pincode,
                payment_method: paymentMethod,
                items: checkout.items.map((item) => ({
                    menu_id: Number(item.Menu_ID),
                    quantity: Number(item.quantity)
                }))
            })
        });

        const orderData = await createResponse.json();
        if (!createResponse.ok) {
            throw new Error(orderData.message || "Could not start Razorpay payment.");
        }

        return new Promise((resolve, reject) => {
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "CraveLane",
                description: `Payment for order #${orderData.order_id}`,
                order_id: orderData.razorpay_order_id,
                prefill: orderData.prefill || {},
                notes: { cravelane_order_id: String(orderData.order_id) },
                theme: { color: "#c92a24" },
                method: {
                    card: paymentMethod === "Cards",
                    netbanking: paymentMethod === "Net Banking",
                    wallet: paymentMethod === "Wallets"
                },
                handler: async (razorpayResponse) => {
                    try {
                        const verifyResponse = await fetch(`${API_URL}/payments/razorpay/verify`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                order_id: orderData.order_id,
                                customer_id: Number(checkout.customerId),
                                razorpay_order_id: razorpayResponse.razorpay_order_id,
                                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                                razorpay_signature: razorpayResponse.razorpay_signature
                            })
                        });

                        const verified = await verifyResponse.json();
                        if (!verifyResponse.ok) {
                            throw new Error(verified.message || "Payment verification failed.");
                        }
                        finishOrder({ ...verified, payment_method: `${paymentMethod} (Razorpay)` }, `${paymentMethod} (Razorpay)`);
                        resolve();
                    } catch (verificationError) {
                        reject(verificationError);
                    }
                },
                modal: {
                    ondismiss: () => reject(new Error("Payment window was closed. Your cart has been kept; you can try again."))
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on("payment.failed", (event) => {
                const description = event?.error?.description || "Payment failed. Please try again.";
                reject(new Error(description));
            });
            razorpay.open();
        });
    };

    const placeOrder = async () => {
        if (!checkout || loading) return;
        setLoading(true);
        setError("");

        try {
            if (paymentMethod === "Cash on Delivery") {
                await placeCashOrder();
            } else {
                await payWithRazorpay();
            }
        } catch (err) {
            setError(err.message || "Unable to complete payment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!checkout) {
        return <div className="payment-loading">Loading payment details...</div>;
    }

    return (
        <main className="payment-page">
            <div className="payment-container">
                <button className="payment-back" onClick={() => navigate("/checkout")}>
                    ← Back to checkout
                </button>

                <header className="payment-header">
                    <span className="payment-brand">CraveLane</span>
                    <h1>Complete your order</h1>
                    <p>One last step before your food arrives!</p>
                </header>

                <div className="payment-layout">
                    <section className="payment-card">
                        <h2>Choose payment method</h2>
                        <p className="payment-muted">Select how you would like to pay.</p>

                        {[
                            {
                                value: "Cards",
                                icon: "💳",
                                title: "Credit / Debit Cards",
                                subtitle: "Visa, Mastercard and supported cards"
                            },
                            {
                                value: "Net Banking",
                                icon: "🏦",
                                title: "Net Banking",
                                subtitle: "Pay directly through your bank"
                            },
                            {
                                value: "Wallets",
                                icon: "👛",
                                title: "Wallets",
                                subtitle: "Choose from supported digital wallets"
                            },
                            {
                                value: "Cash on Delivery",
                                icon: "💵",
                                title: "Cash on Delivery",
                                subtitle: "Pay when your order arrives"
                            }
                        ].map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`payment-option ${paymentMethod === option.value ? "selected" : ""}`}
                                onClick={() => setPaymentMethod(option.value)}
                            >
                                <span className="payment-option-icon">{option.icon}</span>
                                <span className="payment-option-text">
                                    <strong>{option.title}</strong>
                                    <small>{option.subtitle}</small>
                                </span>
                                <span className="payment-radio">
                                    {paymentMethod === option.value ? "●" : "○"}
                                </span>
                            </button>
                        ))}

                        {paymentMethod !== "Cash on Delivery" && (
                            <div className="payment-demo-note">
                                Razorpay secure checkout will open for {paymentMethod}. Availability depends on the payment methods enabled for your Razorpay account.
                            </div>
                        )}

                        {error && <div className="payment-error" role="alert">{error}</div>}

                        <button className="place-order-button" onClick={placeOrder} disabled={loading}>
                            {loading
                                ? (paymentMethod === "Cash on Delivery" ? "Placing order..." : "Opening secure payment...")
                                : `${paymentMethod === "Cash on Delivery" ? "Place Order" : `Continue with ${paymentMethod}`} · ${money(checkout.total)}`}
                        </button>

                        <p className="payment-secure-note">
                            Online payments are verified by the server before your order is marked paid.
                        </p>
                    </section>

                    <aside className="payment-card order-summary">
                        <h2>Order summary</h2>
                        <div className="payment-items">
                            {checkout.items.map((item) => {
                                // Cart items may use either the database field name
                                // or the API's lowercase alias for the menu image.
                                const imageUrl =
                                    item.Image_URL ||
                                    item.image_url ||
                                    item.ImageUrl ||
                                    item.imageUrl ||
                                    item.image ||
                                    "";

                                return (
                                    <div className="payment-item" key={`${item.Restaurant_ID}-${item.Menu_ID}`}>
                                        <div className="payment-item-details">
                                            {imageUrl ? (
                                                <img
                                                    className="payment-item-image"
                                                    src={imageUrl}
                                                    alt={item.Item_Name || "Food item"}
                                                    onError={(event) => {
                                                        event.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="payment-item-image payment-item-image-placeholder" aria-label="Food image unavailable">
                                                    🍽️
                                                </div>
                                            )}
                                            <div className="payment-item-info">
                                                <strong>{item.Item_Name}</strong>
                                                <small>Quantity: {item.quantity}</small>
                                            </div>
                                        </div>
                                        <span>{money(Number(item.Price) * Number(item.quantity))}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="payment-total-row">
                            <span>Subtotal</span><span>{money(checkout.subtotal)}</span>
                        </div>
                        <div className="payment-total-row">
                            <span>Delivery fee</span>
                            <span>{Number(checkout.deliveryFee) === 0 ? "FREE" : money(checkout.deliveryFee)}</span>
                        </div>
                        <div className="payment-grand-total">
                            <strong>Total</strong><strong>{money(checkout.total)}</strong>
                        </div>
                        <div className="delivery-preview">
                            <strong>Delivering to</strong>
                            <p>{checkout.name}</p>
                            <p>{checkout.address}</p>
                            <p>{checkout.city} - {checkout.pincode}</p>
                            <p>{checkout.phone}</p>
                        </div>
                    </aside>
                </div>
            </div>

            <style>{`
                .payment-page{min-height:100vh;background:#fffaf2;padding:30px 20px 50px;color:#292522;font-family:Arial,sans-serif}
                .payment-container{max-width:1000px;margin:0 auto}
                .payment-back{border:none;background:transparent;color:#c92a24;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:22px}
                .payment-header{text-align:center;margin-bottom:28px}
                .payment-brand{display:inline-block;color:#c92a24;font-size:15px;font-weight:800;letter-spacing:1px;text-transform:uppercase}
                .payment-header h1{margin:10px 0 8px;font-size:clamp(27px,4vw,36px)}
                .payment-header p,.payment-muted{color:#77706a;font-size:14px}
                .payment-layout{display:grid;grid-template-columns:1.15fr .85fr;gap:22px;align-items:start}
                .payment-card{background:white;border:1px solid #eee5dc;border-radius:16px;padding:24px;box-shadow:0 5px 20px rgba(60,35,15,.04);min-width:0}
                .payment-card h2{margin:0 0 9px;font-size:20px}
                .payment-muted{margin:0 0 22px}
                .payment-option{width:100%;display:flex;align-items:center;gap:13px;text-align:left;background:white;border:1.5px solid #e8e1da;border-radius:12px;padding:16px 13px;margin-bottom:12px;cursor:pointer;color:#292522}
                .payment-option.selected{border-color:#c92a24;background:#fff8f5}
                .payment-option-icon{font-size:25px}
                .payment-option-text{flex:1;display:flex;flex-direction:column;gap:6px}
                .payment-option-text strong{font-size:14px}
                .payment-option-text small{color:#77706a;font-size:12px}
                .payment-radio{color:#c92a24;font-size:20px}
                .payment-demo-note{background:#fff6dc;color:#755719;padding:12px;border-radius:9px;font-size:12px;line-height:1.5;margin:4px 0 16px}
                .payment-error{background:#fff0ef;border:1px solid #ffd1ce;color:#b42318;padding:12px;border-radius:9px;font-size:13px;margin:14px 0;overflow-wrap:anywhere}
                .place-order-button{width:100%;background:#c92a24;color:white;border:none;border-radius:10px;padding:15px;font-size:15px;font-weight:700;cursor:pointer;margin-top:14px}
                .place-order-button:hover{background:#ad201b}
                .place-order-button:disabled{opacity:.65;cursor:wait}
                .payment-secure-note{color:#77706a;font-size:11px;text-align:center;line-height:1.5;margin:12px 0 0}
                .payment-items{margin-top:20px}
                .payment-item{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid #f0ebe5;font-size:13px}
                .payment-item-details{display:flex;align-items:center;gap:11px;min-width:0}
                .payment-item-image{width:54px;height:54px;flex:0 0 54px;object-fit:cover;border-radius:10px;background:#fff3d6}
                .payment-item-image-placeholder{display:flex;align-items:center;justify-content:center;font-size:25px}
                .payment-item-info{min-width:0}
                .payment-item strong,.payment-item small{display:block}
                .payment-item strong{overflow-wrap:anywhere}
                .payment-item small{color:#77706a;margin-top:5px}
                .payment-item>span{white-space:nowrap;font-weight:600}
                .payment-total-row,.payment-grand-total{display:flex;justify-content:space-between;gap:12px;padding-top:15px;font-size:14px}
                .payment-grand-total{margin-top:15px;padding-top:17px;border-top:1px dashed #ded5ca;font-size:18px}
                .payment-grand-total strong:last-child{color:#c92a24}
                .delivery-preview{margin-top:24px;padding:15px;background:#fff8e7;border-radius:11px;font-size:13px;overflow-wrap:anywhere}
                .delivery-preview strong{display:block;margin-bottom:10px}
                .delivery-preview p{margin:5px 0;color:#665d54}
                .payment-loading{padding:60px 20px;text-align:center}
                @media(max-width:700px){.payment-page{padding:22px 14px 35px}.payment-layout{grid-template-columns:1fr}.payment-card{padding:19px}}
            `}</style>
        </main>
    );
}

export default PaymentPage;
