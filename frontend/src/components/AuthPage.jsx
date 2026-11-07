
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import API_URL from "../config";

export default function AuthPage() {
    const navigate = useNavigate();

    const [isRegister, setIsRegister] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        address: "",
        city: "",
        pincode: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // HANDLE INPUT CHANGES
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // LOGIN / REGISTER SUBMIT
    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const endpoint = isRegister ? "/register" : "/login";

            const payload = isRegister
                ? {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                    address: form.address,
                    city: form.city,
                    pincode: form.pincode
                }
                : {
                    email: form.email,
                    password: form.password
                };

            const response = await fetch(
                `${API_URL}${endpoint}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Request failed."
                );
            }

            // REGISTRATION SUCCESS
            if (isRegister) {
                setSuccess(
                    data.message ||
                    "Registration successful! Please log in."
                );

                setIsRegister(false);

                setForm((previous) => ({
                    ...previous,
                    password: ""
                }));

                setShowPassword(false);
                return;
            }

            // LOGIN SUCCESS
            const customerId =
                data.customer_id ??
                data.customerId ??
                data.Customer_ID;

            if (
                customerId === undefined ||
                customerId === null
            ) {
                throw new Error(
                    "Login succeeded, but customer ID was not returned."
                );
            }

            if (!data.token) {
                throw new Error(
                    "Authentication token was not received from the server."
                );
            }

            const role = data.role || "customer";

            // SAVE CUSTOMER DETAILS
            const loggedInUser = {
                customer_id: customerId,
                name: data.name || form.name,
                email: data.email || form.email,
                role: role,
                token: data.token
            };

            localStorage.setItem(
                "customerId",
                String(customerId)
            );

            localStorage.setItem(
                "customer_id",
                String(customerId)
            );

            localStorage.setItem(
                "customerName",
                loggedInUser.name
            );

            localStorage.setItem(
                "customerEmail",
                loggedInUser.email
            );

            localStorage.setItem("role", role);
            localStorage.setItem("token", data.token);

            localStorage.setItem(
                "user",
                JSON.stringify(loggedInUser)
            );

            localStorage.setItem(
                "customer",
                JSON.stringify(loggedInUser)
            );

            localStorage.setItem(
                "loggedInUser",
                JSON.stringify(loggedInUser)
            );

            localStorage.setItem("isLoggedIn", "true");

            // ROLE-BASED REDIRECTION
            if (role === "admin") {
                navigate("/admin", { replace: true });
            } else {
                navigate("/home", { replace: true });
            }

        } catch (err) {
            setError(
                err.message ||
                "Could not connect to the server."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={styles.page}>
            <section style={styles.card}>

                <div style={styles.brand}>
                    Crave<span>Lane</span>
                </div>

                <h1 style={styles.heading}>
                    {isRegister
                        ? "Create your account"
                        : "Welcome back!"
                    }
                </h1>

                <p style={styles.subtitle}>
                    {isRegister
                        ? "Join CraveLane and discover your next favourite meal."
                        : "Sign in to order your favourite food."
                    }
                </p>

                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={styles.success}>
                        {success}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    style={styles.form}
                >

                    {/* REGISTRATION NAME */}
                    {isRegister && (
                        <>
                            <label style={styles.label}>
                                Full name
                            </label>

                            <input
                                style={styles.input}
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Enter your name"
                                required
                            />

                            <label style={styles.label}>
                                Phone number
                            </label>

                            <input
                                style={styles.input}
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="Enter your phone number"
                            />
                        </>
                    )}

                    {/* EMAIL */}
                    <label style={styles.label}>
                        Email address
                    </label>

                    <input
                        style={styles.input}
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                    />

                    {/* PASSWORD */}
                    <div style={styles.passwordHeader}>
                        <label style={styles.label}>
                            Password
                        </label>

                        {!isRegister && (
                            <Link
                                to="/forgot-password"
                                style={styles.forgotLink}
                            >
                                Forgot Password?
                            </Link>
                        )}
                    </div>

                    <div style={styles.passwordWrapper}>
                        <input
                            style={styles.passwordInput}
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword((previous) => !previous)
                            }
                            style={styles.showPassword}
                            aria-label={
                                showPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>

                    {/* REGISTRATION ADDRESS */}
                    {isRegister && (
                        <>
                            <label style={styles.label}>
                                Address
                            </label>

                            <textarea
                                style={styles.input}
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                placeholder="Delivery address"
                                rows={2}
                            />

                            <div style={styles.row}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>
                                        City
                                    </label>

                                    <input
                                        style={styles.input}
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        placeholder="City"
                                    />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>
                                        Pincode
                                    </label>

                                    <input
                                        style={styles.input}
                                        name="pincode"
                                        value={form.pincode}
                                        onChange={handleChange}
                                        placeholder="Pincode"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        style={{
                            ...styles.submitButton,
                            opacity: loading ? 0.7 : 1
                        }}
                        disabled={loading}
                    >
                        {loading
                            ? "Please wait..."
                            : isRegister
                                ? "Create Account"
                                : "Login"
                        }
                    </button>

                </form>

                {/* SWITCH LOGIN / REGISTER */}
                <p style={styles.switchText}>
                    {isRegister
                        ? "Already have an account?"
                        : "New to CraveLane?"
                    }{" "}

                    <button
                        type="button"
                        style={styles.switchButton}
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError("");
                            setSuccess("");
                            setShowPassword(false);
                        }}
                    >
                        {isRegister ? "Login" : "Register"}
                    </button>
                </p>

            </section>
        </main>
    );
}

// STYLES
const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "linear-gradient(135deg, #fff9f1, #fff0e9)"
    },

    card: {
        width: "100%",
        maxWidth: "440px",
        background: "#ffffff",
        borderRadius: "18px",
        padding: "30px",
        boxShadow: "0 12px 35px rgba(80, 35, 20, 0.10)"
    },

    brand: {
        fontSize: "27px",
        fontWeight: "800",
        color: "#292421",
        textAlign: "center",
        marginBottom: "20px"
    },

    heading: {
        textAlign: "center",
        color: "#302521",
        marginBottom: "8px",
        fontSize: "25px"
    },

    subtitle: {
        textAlign: "center",
        color: "#786c66",
        fontSize: "14px",
        marginBottom: "22px"
    },

    form: {
        display: "flex",
        flexDirection: "column",
        gap: "9px"
    },

    label: {
        color: "#40332e",
        fontSize: "13px",
        fontWeight: "700"
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #e6d8d0",
        borderRadius: "9px",
        padding: "11px 12px",
        fontSize: "14px",
        outlineColor: "#c62828",
        background: "#fffdfb"
    },

    passwordHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px"
    },

    forgotLink: {
        color: "#c62828",
        textDecoration: "none",
        fontSize: "12px",
        fontWeight: "700"
    },

    passwordWrapper: {
        display: "flex",
        alignItems: "center",
        border: "1px solid #e6d8d0",
        borderRadius: "9px",
        background: "#fffdfb",
        overflow: "hidden"
    },

    passwordInput: {
        flex: 1,
        minWidth: 0,
        border: "none",
        outline: "none",
        padding: "11px 12px",
        fontSize: "14px",
        background: "transparent"
    },

    showPassword: {
        border: "none",
        background: "transparent",
        color: "#c62828",
        fontSize: "12px",
        fontWeight: "700",
        padding: "10px",
        cursor: "pointer"
    },

    row: {
        display: "flex",
        gap: "12px"
    },

    submitButton: {
        border: "none",
        borderRadius: "9px",
        background: "#c62828",
        color: "#ffffff",
        fontWeight: "700",
        padding: "12px",
        marginTop: "10px",
        cursor: "pointer"
    },

    switchText: {
        textAlign: "center",
        color: "#786c66",
        fontSize: "14px",
        marginTop: "22px"
    },

    switchButton: {
        background: "none",
        border: "none",
        color: "#c62828",
        fontWeight: "700",
        cursor: "pointer"
    },

    error: {
        padding: "10px",
        marginBottom: "12px",
        borderRadius: "8px",
        background: "#ffebee",
        color: "#b71c1c",
        fontSize: "13px"
    },

    success: {
        padding: "10px",
        marginBottom: "12px",
        borderRadius: "8px",
        background: "#e8f5e9",
        color: "#1b5e20",
        fontSize: "13px"
    }
};
