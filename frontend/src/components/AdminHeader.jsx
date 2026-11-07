import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminHeader({ title, subtitle }) {
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

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

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setProfileOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setProfileOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const handleLogout = () => {
        [
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
        ].forEach((key) => localStorage.removeItem(key));

        navigate("/", { replace: true });
    };

    return (
        <header className="admin-header">

            <div>
                <h1>{title}</h1>
                <p>{subtitle}</p>
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
    );
}
