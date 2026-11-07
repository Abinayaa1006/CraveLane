
import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./PasswordPages.css";

import API_URL from "../config";

export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setMessage("");
        setError("");

        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/reset-password/${encodeURIComponent(token)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ password })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Password reset failed.");
            }

            setMessage(
                data.message ||
                "Your password has been reset successfully."
            );

            setPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                navigate("/");
            }, 2500);

        } catch (err) {
            setError(err.message || "Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>

                <div style={styles.icon}>🔑</div>

                <h1 style={styles.heading}>
                    Create New Password
                </h1>

                <p style={styles.description}>
                    Choose a strong new password for your CraveLane account.
                </p>

                <form onSubmit={handleSubmit}>

                    {/* NEW PASSWORD */}
                    <label style={styles.label}>
                        New Password
                    </label>

                    <div style={styles.passwordWrapper}>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            minLength={8}
                            required
                            style={styles.passwordInput}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword(!showPassword)
                            }
                            style={styles.showPassword}
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <label style={styles.label}>
                        Confirm Password
                    </label>

                    <div style={styles.passwordWrapper}>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            placeholder="Re-enter new password"
                            minLength={8}
                            required
                            style={styles.passwordInput}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            style={styles.showPassword}
                        >
                            {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                    </div>

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
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? "Updating..." : "Reset Password"}
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
        boxSizing: "border-box",
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
        fontSize: "25px",
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
        marginTop: "15px",
        color: "#382820"
    },

    passwordWrapper: {
        display: "flex",
        alignItems: "center",
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #e8d5cb",
        borderRadius: "9px",
        background: "#fff",
        marginBottom: "17px",
        overflow: "hidden"
    },

    passwordInput: {
        flex: 1,
        minWidth: 0,
        boxSizing: "border-box",
        padding: "13px",
        border: "none",
        outline: "none",
        fontSize: "14px",
        background: "transparent"
    },

    showPassword: {
        border: "none",
        background: "transparent",
        color: "#c62828",
        fontSize: "13px",
        fontWeight: "700",
        padding: "12px",
        cursor: "pointer"
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
        cursor: "pointer",
        marginTop: "10px"
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
