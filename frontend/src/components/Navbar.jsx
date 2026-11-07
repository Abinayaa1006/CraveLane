import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const [cartCount, setCartCount] = useState(0);
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    useEffect(() => {
        const updateCartCount = () => {
            try {
                const cart = JSON.parse(localStorage.getItem("cart") || "[]");
                setCartCount(
                    Array.isArray(cart)
                        ? cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
                        : 0
                );
            } catch {
                setCartCount(0);
            }
        };

        updateCartCount();
        window.addEventListener("cartUpdated", updateCartCount);
        window.addEventListener("storage", updateCartCount);
        return () => {
            window.removeEventListener("cartUpdated", updateCartCount);
            window.removeEventListener("storage", updateCartCount);
        };
    }, [location.pathname]);

    const isActive = (path) => {
        if (path === "/home") return location.pathname === "/home" || location.pathname === "/";
        if (path === "/restaurants") return location.pathname === "/restaurants" || location.pathname.startsWith("/restaurants/");
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const linkStyle = (active) => ({
        color: active ? "#c62828" : "#38332f",
        background: active ? "#fff0e9" : "transparent",
        textDecoration: "none",
        fontWeight: active ? 800 : 600,
        padding: "10px 13px",
        borderRadius: "9px",
        borderBottom: active ? "2px solid #c62828" : "2px solid transparent",
        transition: "all 160ms ease"
    });

    const actionStyle = (active = false) => ({
        border: active ? "1px solid #c62828" : "1px solid #f0dfd5",
        background: active ? "#c62828" : "#fff0e9",
        color: active ? "#ffffff" : "#9f2525",
        padding: "9px 12px",
        borderRadius: "9px",
        cursor: "pointer",
        fontWeight: 700,
        position: "relative"
    });

    const logout = () => {
        ["isLoggedIn", "customerId", "customer_id", "user", "customer",
         "loggedInUser", "role", "token"].forEach((key) => localStorage.removeItem(key));
        navigate("/");
    };

    return (
        <header style={styles.navbar}>
            <Link to="/home" style={styles.logo}>
                Crave<span style={{ color: "#c62828" }}>Lane</span>
            </Link>

            <nav style={styles.links} aria-label="Main navigation">
                <Link to="/home" style={linkStyle(isActive("/home"))}>Home</Link>
                <Link to="/restaurants" style={linkStyle(isActive("/restaurants"))}>Restaurants</Link>
                <Link to="/about" style={linkStyle(isActive("/about"))}>About</Link>
            </nav>

            <div style={styles.actions}>
                {isLoggedIn ? (
                    <>
                        <button style={actionStyle(isActive("/orders"))} onClick={() => navigate("/orders")}>My Orders</button>
                        <button style={actionStyle(isActive("/wishlist"))} onClick={() => navigate("/wishlist")}>♡ Wishlist</button>
                        <button style={actionStyle(isActive("/cart"))} onClick={() => navigate("/cart")}>
                            🛒 Cart
                            {cartCount > 0 && <span style={styles.cartBadge}>{cartCount > 99 ? "99+" : cartCount}</span>}
                        </button>
                        <button style={actionStyle(isActive("/profile"))} onClick={() => navigate("/profile")} title="My Profile">👤 Profile</button>
                        <button style={styles.logoutButton} onClick={logout}>Logout</button>
                    </>
                ) : (
                    <button style={actionStyle(false)} onClick={() => navigate("/")}>Login</button>
                )}
            </div>
        </header>
    );
}

const styles = {
    navbar: {
        position: "sticky", top: 0, zIndex: 1000, width: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "12px", padding: "12px 4%",
        background: "rgba(255,253,248,0.97)", borderBottom: "1px solid #f0dfd5",
        boxShadow: "0 3px 12px rgba(0,0,0,0.05)", boxSizing: "border-box",
        backdropFilter: "blur(12px)"
    },
    logo: { color: "#292421", fontSize: "25px", fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" },
    links: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px" },
    actions: { display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "8px" },
    cartBadge: {
        marginLeft: "7px", minWidth: "19px", height: "19px", padding: "0 4px",
        borderRadius: "20px", background: "#ffffff", color: "#c62828",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: "11px", fontWeight: 800, boxSizing: "border-box"
    },
    logoutButton: {
        border: "1px solid #c62828", background: "#ffffff", color: "#c62828",
        padding: "8px 12px", borderRadius: "9px", cursor: "pointer", fontWeight: 700
    }
};
