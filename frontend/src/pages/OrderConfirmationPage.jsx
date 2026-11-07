
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function OrderConfirmationPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const order = location.state;

    const money = (amount) =>
        `₹${Number(amount || 0).toFixed(2)}`;

    // Do not display fake order details if this page
    // is opened directly without a successful order.
    if (!order || !order.orderId) {
        return (
            <main className="confirmation-page">
                <section className="confirmation-card">
                    <h1>No order details found</h1>
                    <p>
                        Please place an order to view your
                        confirmation details.
                    </p>
                    <button
                        onClick={() => navigate("/restaurants")}
                    >
                        Browse Restaurants
                    </button>
                </section>

                <ConfirmationStyles />
            </main>
        );
    }

    return (
        <main className="confirmation-page">
            <section className="confirmation-card">
                <div className="confirmation-check">✓</div>

                <p className="confirmation-brand">CraveLane</p>

                <h1>Order placed successfully!</h1>

                <p className="confirmation-subtitle">
                    Thank you for ordering with us.
                    Your order has been received.
                </p>

                <div className="confirmation-order-id">
                    <span>Order ID</span>
                    <strong>#{order.orderId}</strong>
                </div>

                <div className="confirmation-details">
                    <div className="confirmation-row">
                        <span>Total amount</span>
                        <strong>{money(order.total)}</strong>
                    </div>

                    <div className="confirmation-row">
                        <span>Payment method</span>
                        <strong>{order.paymentMethod || "Not specified"}</strong>
                    </div>

                    <div className="confirmation-row">
                        <span>Payment status</span>
                        <strong className="confirmation-status">
                            {order.paymentStatus || "Pending"}
                        </strong>
                    </div>

                    <div className="confirmation-row">
                        <span>Order status</span>
                        <strong className="confirmation-status">
                            {order.orderStatus || "Pending"}
                        </strong>
                    </div>
                </div>

                {order.paymentMethod === "UPI (Demo)" && (
                    <p className="confirmation-note">
                        This was a demo payment. No real money
                        was transferred.
                    </p>
                )}

                <button
                    className="confirmation-primary"
                    onClick={() => navigate("/restaurants")}
                >
                    Continue Shopping
                </button>

                <button
                    className="confirmation-secondary"
                    onClick={() => navigate("/home")}
                >
                    Back to Home
                </button>
            </section>

            <ConfirmationStyles />
        </main>
    );
}

function ConfirmationStyles() {
    return (
        <style>{`
            .confirmation-page {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 28px 16px;
                background: #fffaf2;
                color: #292522;
                font-family: Arial, sans-serif;
            }

            .confirmation-card {
                width: 100%;
                max-width: 490px;
                padding: 36px 30px;
                background: #ffffff;
                border: 1px solid #eee5dc;
                border-radius: 20px;
                text-align: center;
                box-shadow: 0 10px 35px rgba(60, 35, 15, 0.07);
            }

            .confirmation-check {
                width: 68px;
                height: 68px;
                margin: 0 auto 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: #e7f7e9;
                color: #218838;
                font-size: 38px;
                font-weight: bold;
            }

            .confirmation-brand {
                margin: 0 0 10px;
                color: #c92a24;
                font-size: 13px;
                font-weight: 800;
                letter-spacing: 2px;
                text-transform: uppercase;
            }

            .confirmation-card h1 {
                margin: 0 0 12px;
                font-size: clamp(24px, 4vw, 30px);
                line-height: 1.25;
            }

            .confirmation-subtitle {
                margin: 0 0 24px;
                color: #77706a;
                font-size: 14px;
                line-height: 1.6;
            }

            .confirmation-order-id {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                margin-bottom: 16px;
                border-radius: 11px;
                background: #fff8e7;
            }

            .confirmation-order-id span,
            .confirmation-row span {
                color: #77706a;
                font-size: 13px;
            }

            .confirmation-order-id strong {
                color: #c92a24;
                font-size: 19px;
            }

            .confirmation-details {
                padding: 4px 0;
                border-top: 1px solid #eee5dc;
                border-bottom: 1px solid #eee5dc;
            }

            .confirmation-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 14px;
                padding: 13px 0;
                text-align: left;
            }

            .confirmation-row strong {
                max-width: 60%;
                font-size: 13px;
                text-align: right;
                overflow-wrap: anywhere;
            }

            .confirmation-status {
                color: #9a6700;
            }

            .confirmation-note {
                margin: 18px 0 0;
                padding: 12px;
                border-radius: 9px;
                background: #fff6dc;
                color: #755719;
                font-size: 12px;
                line-height: 1.5;
            }

            .confirmation-primary,
            .confirmation-secondary,
            .confirmation-card button:not(.confirmation-primary):not(.confirmation-secondary) {
                width: 100%;
                padding: 14px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
            }

            .confirmation-primary {
                margin-top: 24px;
                border: none;
                background: #c92a24;
                color: white;
            }

            .confirmation-primary:hover {
                background: #ad201b;
            }

            .confirmation-secondary {
                margin-top: 10px;
                border: 1px solid #e8e1da;
                background: white;
                color: #292522;
            }

            .confirmation-card button:not(.confirmation-primary):not(.confirmation-secondary) {
                margin-top: 12px;
                border: none;
                background: #c92a24;
                color: white;
            }

            @media (max-width: 480px) {
                .confirmation-card {
                    padding: 28px 19px;
                }
            }
        `}</style>
    );
}

export default OrderConfirmationPage;
