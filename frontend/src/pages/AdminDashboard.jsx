
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

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

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
