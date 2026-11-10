
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import API_URL from "../config";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [stats, setStats] = useState({
        total_orders: 0,
        total_revenue: 0,
        total_customers: 0,
        total_restaurants: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [databaseStatus, setDatabaseStatus] = useState(null);
    const [databaseLoading, setDatabaseLoading] = useState(false);
    const [databaseError, setDatabaseError] = useState("");
    const [databaseMessage, setDatabaseMessage] = useState("");
    const [selectedDatabase, setSelectedDatabase] = useState("mysql");

    let admin = {};

    try {
        admin = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        admin = {};
    }

    const adminName =
        admin.name ||
        localStorage.getItem("customerName") ||
        "Administrator";

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/", { replace: true });
                return;
            }

            const response = await fetch(
                `${API_URL}/admin/dashboard/stats`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    data.message || "Admin authorization failed. Please log in again."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not load dashboard statistics."
                );
            }

            setStats({
                total_orders: Number(data.total_orders || 0),
                total_revenue: Number(data.total_revenue || 0),
                total_customers: Number(data.total_customers || 0),
                total_restaurants: Number(data.total_restaurants || 0)
            });

        } catch (err) {
            setError(err.message || "Could not connect to the backend.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const fetchDatabaseStatus = useCallback(async () => {
        setDatabaseLoading(true);
        setDatabaseError("");
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/admin/database/health`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Could not load database status.");
            }
            setDatabaseStatus(data);
        } catch (err) {
            setDatabaseError(err.message || "Could not connect to database monitoring.");
        } finally {
            setDatabaseLoading(false);
        }
    }, []);

    const triggerSync = async () => {
        setDatabaseMessage("");
        setDatabaseError("");
        try {
            const response = await fetch(`${API_URL}/admin/database/trigger-sync`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({})
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Could not trigger synchronization.");
            }
            setDatabaseMessage(data.message || "Sync workflow triggered.");
            window.setTimeout(fetchDatabaseStatus, 2500);
        } catch (err) {
            setDatabaseError(err.message || "Could not trigger synchronization.");
        }
    };

    useEffect(() => {
        fetchStats();
        fetchDatabaseStatus();
    }, [fetchStats, fetchDatabaseStatus]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") setProfileOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const handleLogout = () => {
        const keys = [
            "isLoggedIn",
            "customerId",
            "customer_id",
            "customerName",
            "customerEmail",
            "user",
            "customer",
            "loggedInUser",
            "role",
            "token"
        ];

        keys.forEach((key) => localStorage.removeItem(key));

        navigate("/", { replace: true });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(amount);
    };

    const statCards = [
        {
            icon: "📦",
            label: "Total Orders",
            value: stats.total_orders.toLocaleString("en-IN"),
            description: "Orders placed on CraveLane"
        },
        {
            icon: "💰",
            label: "Total Revenue",
            value: formatCurrency(stats.total_revenue),
            description: "Value of non-cancelled orders"
        },
        {
            icon: "👥",
            label: "Total Customers",
            value: stats.total_customers.toLocaleString("en-IN"),
            description: "Registered customer accounts"
        },
        {
            icon: "🍽️",
            label: "Restaurants",
            value: stats.total_restaurants.toLocaleString("en-IN"),
            description: "Restaurants on the platform"
        }
    ];

    return (
        <div className="admin-page">

            {/* SIDEBAR */}
            <aside className="admin-sidebar">

                <h2 className="admin-logo">
                    Crave<span>Lane</span>
                </h2>

                <p className="admin-label">ADMIN PANEL</p>

                <nav className="admin-navigation">
                    <Link className="admin-nav-link active" to="/admin">
                        <span>▦</span>
                        Dashboard
                    </Link>

                    <Link className="admin-nav-link" to="/admin/orders">
                        <span>📦</span>
                        Orders
                    </Link>

                    <Link className="admin-nav-link" to="/admin/customers">
                        <span>👥</span>
                        Customers
                    </Link>

                    <Link className="admin-nav-link" to="/admin/restaurants">
                        <span>🍽️</span>
                        Restaurants
                    </Link>
                </nav>

            </aside>

            {/* MAIN CONTENT */}
            <main className="admin-main">

                {/* HEADER */}
                <header className="admin-header">

                    <div>
                        <h1>Dashboard Overview</h1>
                        <p>Monitor and manage your CraveLane platform.</p>
                    </div>

                    <div className="admin-profile-container" ref={dropdownRef}>
                        <button
                            type="button"
                            className="admin-profile-button"
                            onClick={() => setProfileOpen((previous) => !previous)}
                            aria-expanded={profileOpen}
                        >
                            <span className="admin-profile-avatar">👩🏻‍💼</span>
                            <span className="admin-profile-info">
                                <strong>{adminName}</strong>
                                <small>Administrator</small>
                            </span>
                            <span className="admin-profile-arrow">
                                {profileOpen ? "▲" : "▼"}
                            </span>
                        </button>

                        {profileOpen && (
                            <div className="admin-profile-dropdown">
                                <div className="admin-dropdown-heading">
                                    <strong>{adminName}</strong>
                                    <small>Administrator Account</small>
                                </div>
                                <div className="admin-dropdown-divider" />
                                <button
                                    type="button"
                                    className="admin-dropdown-logout"
                                    onClick={handleLogout}
                                >
                                    <span>↪</span>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                </header>

                {/* WELCOME SECTION */}
                <section className="admin-welcome">

                    <p>CRAVELANE ADMINISTRATION</p>

                    <h2>
                        Welcome back, {adminName}! 👋
                    </h2>

                    <p>
                        Here's what's happening with your food ordering
                        platform. Keep track of orders, customers and revenue
                        from one place.
                    </p>

                </section>

                {/* STATISTICS */}
                <section>

                    <div className="admin-section-heading">

                        <div>
                            <h2>Platform Statistics</h2>
                            <p>Your platform's current performance</p>
                        </div>

                        <button
                            className="admin-refresh"
                            onClick={fetchStats}
                            disabled={loading}
                            type="button"
                        >
                            {loading ? "Refreshing..." : "↻ Refresh"}
                        </button>

                    </div>

                    {error && (
                        <div className="admin-error" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="admin-stat-grid">

                        {statCards.map((card) => (
                            <div
                                className="admin-stat-card"
                                key={card.label}
                            >
                                <span>{card.icon}</span>

                                <p>{card.label}</p>

                                <h2>
                                    {loading ? "..." : card.value}
                                </h2>

                                <small className="admin-stat-description">
                                    {card.description}
                                </small>
                            </div>
                        ))}

                    </div>

                </section>

                {/* DATABASE MONITORING */}
                <section className="admin-content-card" style={{ marginTop: "26px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <div>
                            <h2>Database & Sync Monitoring</h2>
                            <p style={{ marginTop: "5px", color: "#777" }}>
                                MySQL is the primary database. MongoDB stores its synchronized copy.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                            <button className="admin-refresh" type="button" onClick={fetchDatabaseStatus} disabled={databaseLoading}>
                                {databaseLoading ? "Checking..." : "↻ Refresh status"}
                            </button>
                            <button className="admin-refresh" type="button" onClick={triggerSync}>
                                Run MongoDB sync
                            </button>
                        </div>
                    </div>

                    {databaseError && <div className="admin-error" role="alert" style={{ marginTop: "14px" }}>{databaseError}</div>}
                    {databaseMessage && <p role="status" style={{ color: "#16803c", marginTop: "12px" }}>{databaseMessage}</p>}

                    <div style={{ display: "flex", gap: "10px", margin: "18px 0", flexWrap: "wrap" }}>
                        {[
                            { key: "mysql", label: "MySQL · Primary" },
                            { key: "mongodb", label: "MongoDB · Replica" }
                        ].map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setSelectedDatabase(item.key)}
                                style={{
                                    border: selectedDatabase === item.key ? "1px solid #e43b3b" : "1px solid #ddd",
                                    background: selectedDatabase === item.key ? "#fff1f1" : "#fff",
                                    color: selectedDatabase === item.key ? "#c62828" : "#444",
                                    borderRadius: "9px",
                                    padding: "9px 15px",
                                    cursor: "pointer",
                                    fontWeight: 600
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {databaseLoading && !databaseStatus ? (
                        <p>Checking database connections...</p>
                    ) : databaseStatus ? (
                        <>
                            {(() => {
                                const selected = databaseStatus[selectedDatabase] || {};
                                const counts = selected.counts || {};
                                const labels = [
                                    ["customers", "Customers"],
                                    ["restaurants", "Restaurants"],
                                    ["menu_items", "Menu items"],
                                    ["orders", "Orders"],
                                    ["reviews", "Reviews"]
                                ];
                                return (
                                    <>
                                        <div style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            gap: "10px", flexWrap: "wrap", padding: "13px 15px",
                                            background: "#fafafa", border: "1px solid #eee", borderRadius: "10px"
                                        }}>
                                            <div>
                                                <strong>{selectedDatabase === "mysql" ? "MySQL" : "MongoDB Atlas"}</strong>
                                                <p style={{ margin: "4px 0 0", color: "#777", fontSize: "13px" }}>
                                                    Database: {selected.database || (selectedDatabase === "mysql" ? "railway" : "cravelane")}
                                                </p>
                                            </div>
                                            <strong style={{ color: selected.connected ? "#16803c" : "#c62828" }}>
                                                {selected.connected ? "● Connected" : "● Disconnected"}
                                            </strong>
                                        </div>
                                        <div style={{
                                            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
                                            gap: "12px", marginTop: "14px"
                                        }}>
                                            {labels.map(([key, label]) => (
                                                <div key={key} style={{ border: "1px solid #eee", borderRadius: "10px", padding: "14px" }}>
                                                    <small style={{ color: "#777" }}>{label}</small>
                                                    <h2 style={{ margin: "7px 0 0", fontSize: "24px" }}>
                                                        {selected.connected ? Number(counts[key] || 0).toLocaleString("en-IN") : "—"}
                                                    </h2>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                            <div style={{ marginTop: "22px" }}>
                                <h3 style={{ marginBottom: "12px" }}>Synchronization queue</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))", gap: "10px" }}>
                                    {[
                                        ["pending", "Pending"],
                                        ["processing", "Processing"],
                                        ["processed", "Processed"],
                                        ["failed", "Failed"]
                                    ].map(([key, label]) => (
                                        <div key={key} style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: "9px", padding: "12px" }}>
                                            <small style={{ color: "#777" }}>{label}</small>
                                            <strong style={{ display: "block", fontSize: "21px", marginTop: "5px" }}>
                                                {databaseStatus.sync?.available ? Number(databaseStatus.sync[key] || 0) : "—"}
                                            </strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginTop: "20px", overflowX: "auto" }}>
                                <h3 style={{ marginBottom: "10px" }}>Recent sync events</h3>
                                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ textAlign: "left", background: "#fafafa" }}>
                                            {["Event", "Entity", "Record ID", "Operation", "Status", "Attempts"].map((heading) => (
                                                <th key={heading} style={{ padding: "10px 8px", borderBottom: "1px solid #eee" }}>{heading}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(databaseStatus.sync?.recent_events || []).map((event) => (
                                            <tr key={event.Event_ID}>
                                                <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}>#{event.Event_ID}</td>
                                                <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}>{event.Entity_Type}</td>
                                                <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}>{event.Entity_ID}</td>
                                                <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}>{event.Operation}</td>
                                                <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0", color: event.Status === "processed" ? "#16803c" : event.Status === "failed" ? "#c62828" : "#9a6700" }}>{event.Status}</td>
                                                <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}>{event.Attempts}</td>
                                            </tr>
                                        ))}
                                        {(!databaseStatus.sync?.recent_events || databaseStatus.sync.recent_events.length === 0) && (
                                            <tr><td colSpan="6" style={{ padding: "14px 8px", color: "#777" }}>No synchronization events found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <p style={{ color: "#777" }}>Database status has not been loaded yet.</p>
                    )}
                </section>

                {/* DASHBOARD INFORMATION */}
                <section className="admin-content-card">

                    <h2>Platform Overview</h2>

                    <p>
                        CraveLane brings customers and restaurants together
                        through a simple online food ordering experience.
                    </p>

                    <div className="admin-overview-grid">

                        <div className="admin-overview-item">
                            <span>📦</span>
                            <div>
                                <strong>Order Management</strong>
                                <p>
                                    View orders and manage their delivery
                                    status.
                                </p>
                            </div>
                        </div>

                        <div className="admin-overview-item">
                            <span>👥</span>
                            <div>
                                <strong>Customer Management</strong>
                                <p>
                                    Monitor registered customers and their
                                    accounts.
                                </p>
                            </div>
                        </div>

                        <div className="admin-overview-item">
                            <span>🍽️</span>
                            <div>
                                <strong>Restaurant Management</strong>
                                <p>
                                    View restaurants available on the
                                    platform.
                                </p>
                            </div>
                        </div>

                    </div>

                </section>

                <footer className="admin-footer">
                    © {new Date().getFullYear()} CraveLane Admin Panel
                </footer>

            </main>

        </div>
    );
}
