
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./PasswordPages.css";
import API_URL from "../config";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to send reset email.");
            }

            setMessage(
                data.message ||
                "If an account exists with this email, a password reset link has been sent."
            );
        } catch (err) {
            setError(err.message || "Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.icon}>🔐</div>

                <h1 style={styles.heading}>Forgot Password?</h1>

                <p style={styles.description}>
                    Don't worry! Enter your registered email address.
                    We'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit}>
                    <label style={styles.label}>Email Address</label>

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        required
                        style={styles.input}
                    />

                    {message && (
                        <div role="status" style={styles.success}>
                            ✓ {message}
                        </div>
                    )}

                    {error && (
                        <div role="alert" style={styles.error}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <Link to="/" style={styles.backLink}>
                    ← Back to Login
                </Link>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#fff8f3",
        padding: "20px",
        fontFamily: "Arial, sans-serif"
    },
    card: {
        width: "100%",
        maxWidth: "420px",
        padding: "35px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 8px 30px rgba(70, 35, 20, 0.10)",
        textAlign: "center"
    },
    icon: {
        fontSize: "42px",
        marginBottom: "12px"
    },
    heading: {
        color: "#382820",
        fontSize: "26px",
        marginBottom: "12px"
    },
    description: {
        color: "#8c7770",
        fontSize: "14px",
        lineHeight: "1.6",
        marginBottom: "25px"
    },
    label: {
        display: "block",
        textAlign: "left",
        fontSize: "14px",
        fontWeight: "600",
        marginBottom: "8px",
        color: "#382820"
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "13px",
        border: "1px solid #e8d5cb",
        borderRadius: "9px",
        outline: "none",
        fontSize: "14px",
        marginBottom: "16px"
    },
    button: {
        width: "100%",
        padding: "13px",
        background: "#c62828",
        color: "white",
        border: "none",
        borderRadius: "9px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer"
    },
    success: {
        background: "#edf8ed",
        color: "#26753b",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "15px",
        textAlign: "left"
    },
    error: {
        background: "#fff0f0",
        color: "#b42323",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "13px",
        marginBottom: "15px",
        textAlign: "left"
    },
    backLink: {
        display: "inline-block",
        marginTop: "22px",
        color: "#c62828",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: "600"
    }
};
