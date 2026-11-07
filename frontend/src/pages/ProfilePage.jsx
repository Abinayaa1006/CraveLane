
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getCustomerProfile,
    updateCustomerProfile
} from "../services/api";
import "./ProfilePage.css";


const getSavedCustomerId = () => {
    const directId = localStorage.getItem("customer_id");

    if (directId) return directId;

    try {
        const user = JSON.parse(
            localStorage.getItem("user") || "{}"
        );

        return user.customer_id || user.Customer_ID || null;
    } catch {
        return null;
    }
};


const emptyProfile = {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: ""
};


function ProfilePage() {

    const navigate = useNavigate();

    const customerId = getSavedCustomerId();

    const [profile, setProfile] = useState(emptyProfile);
    const [formData, setFormData] = useState(emptyProfile);

    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");


    // Load profile from MySQL through Flask.
    const loadProfile = async () => {

        if (!customerId) {
            setError("Customer ID not found. Please log in again.");
            setLoading(false);
            return;
        }

        try {

            setLoading(true);
            setError("");

            const data = await getCustomerProfile(customerId);

            const customer = {
                name: data.Name ?? data.name ?? "",
                email: data.Email ?? data.email ?? "",
                phone: data.Phone ?? data.phone ?? "",
                address: data.Address ?? data.address ?? "",
                city: data.City ?? data.city ?? "",
                pincode: data.Pincode ?? data.pincode ?? ""
            };

            setProfile(customer);
            setFormData(customer);

        } catch (err) {

            setError(
                err.message === "Failed to fetch"
                    ? "Cannot connect to CraveLane backend. Make sure Flask is running on port 5000."
                    : err.message
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadProfile();
    }, [customerId]);


    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData(previous => ({
            ...previous,
            [name]: value
        }));
    };


    const handleEdit = () => {

        setFormData({ ...profile });
        setEditing(true);
        setMessage("");
        setError("");
    };


    const handleCancel = () => {

        setFormData({ ...profile });
        setEditing(false);
        setMessage("");
        setError("");
    };


    const handleSave = async (e) => {

        e.preventDefault();

        if (!formData.name.trim()) {
            setError("Please enter your full name.");
            return;
        }

        try {

            setSaving(true);
            setError("");
            setMessage("");

            await updateCustomerProfile(customerId, {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                pincode: formData.pincode.trim()
            });

            // Fetch the saved record again from MySQL.
            const updatedData = await getCustomerProfile(customerId);

            const updatedProfile = {
                name: updatedData.Name ?? updatedData.name ?? "",
                email: updatedData.Email ?? updatedData.email ?? "",
                phone: updatedData.Phone ?? updatedData.phone ?? "",
                address: updatedData.Address ?? updatedData.address ?? "",
                city: updatedData.City ?? updatedData.city ?? "",
                pincode: updatedData.Pincode ?? updatedData.pincode ?? ""
            };

            setProfile(updatedProfile);
            setFormData(updatedProfile);
            setEditing(false);
            setMessage("Your profile has been updated successfully!");

        } catch (err) {

            setError(
                err.message === "Failed to fetch"
                    ? "Cannot connect to CraveLane backend. Make sure Flask is running."
                    : err.message
            );

        } finally {
            setSaving(false);
        }
    };


    const handleLogout = () => {

        localStorage.removeItem("customer_id");
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");

        navigate("/login");
    };


    if (loading) {
        return (
            <div className="profile-loading">
                Loading your profile...
            </div>
        );
    }


    return (

        <div className="profile-page">

            <div className="profile-heading">
                <p className="profile-eyebrow">
                    YOUR CRAVELANE ACCOUNT
                </p>

                <h1>My Profile</h1>

                <p>
                    View and manage your personal information.
                </p>
            </div>


            {error && (
                <div className="profile-alert error">
                    {error}
                </div>
            )}

            {message && (
                <div className="profile-alert success">
                    {message}
                </div>
            )}


            <div className="profile-layout">

                {/* PROFILE DETAILS */}

                <section className="profile-card">

                    <div className="profile-card-heading">

                        <div>
                            <span className="profile-icon">👤</span>

                            <h2>
                                {editing ? "Edit Profile" : "Personal Information"}
                            </h2>

                            <p>
                                {editing
                                    ? "Update your account information."
                                    : "Here are the details saved in your account."
                                }
                            </p>
                        </div>

                        <span className="customer-id">
                            Customer ID: {customerId}
                        </span>

                    </div>


                    {!editing ? (

                        /* VIEW MODE */

                        <div className="profile-view">

                            <div className="profile-view-grid">

                                <div className="profile-info">
                                    <span>Full Name</span>
                                    <strong>{profile.name || "Not provided"}</strong>
                                </div>

                                <div className="profile-info">
                                    <span>Email Address</span>
                                    <strong>{profile.email || "Not provided"}</strong>
                                </div>

                                <div className="profile-info">
                                    <span>Phone Number</span>
                                    <strong>{profile.phone || "Not provided"}</strong>
                                </div>

                                <div className="profile-info">
                                    <span>City</span>
                                    <strong>{profile.city || "Not provided"}</strong>
                                </div>

                                <div className="profile-info full-width">
                                    <span>Delivery Address</span>
                                    <strong>{profile.address || "Not provided"}</strong>
                                </div>

                                <div className="profile-info">
                                    <span>Pincode</span>
                                    <strong>{profile.pincode || "Not provided"}</strong>
                                </div>

                            </div>

                            <button
                                className="profile-save-button"
                                onClick={handleEdit}
                            >
                                ✎ Edit Profile
                            </button>

                        </div>

                    ) : (

                        /* EDIT MODE */

                        <form onSubmit={handleSave}>

                            <div className="profile-form-grid">

                                <div className="profile-field">
                                    <label>Full Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="profile-field">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        readOnly
                                        className="readonly-input"
                                    />
                                    <small>Email cannot be changed here.</small>
                                </div>

                                <div className="profile-field">
                                    <label>Phone Number</label>
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="profile-field">
                                    <label>City</label>
                                    <input
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="profile-field full-width">
                                    <label>Delivery Address</label>
                                    <textarea
                                        name="address"
                                        rows="3"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="profile-field">
                                    <label>Pincode</label>
                                    <input
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                    />
                                </div>

                            </div>


                            <div className="profile-form-actions">

                                <button
                                    type="submit"
                                    className="profile-save-button"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>

                                <button
                                    type="button"
                                    className="profile-reset-button"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                            </div>

                        </form>

                    )}

                </section>


                {/* ACCOUNT SHORTCUTS */}

                <aside className="profile-card profile-shortcuts">

                    <h2>Your Account</h2>

                    <p className="shortcuts-description">
                        Quickly access your CraveLane activities.
                    </p>


                    <button onClick={() => navigate("/orders")}>
                        <span>📦</span>
                        <span>
                            <strong>My Orders</strong>
                            <small>View orders and track deliveries</small>
                        </span>
                        <span className="shortcut-arrow">→</span>
                    </button>


                    <button onClick={() => navigate("/wishlist")}>
                        <span>♡</span>
                        <span>
                            <strong>My Wishlist</strong>
                            <small>View your saved items</small>
                        </span>
                        <span className="shortcut-arrow">→</span>
                    </button>


                    <button onClick={() => navigate("/cart")}>
                        <span>🛒</span>
                        <span>
                            <strong>My Cart</strong>
                            <small>Continue your shopping</small>
                        </span>
                        <span className="shortcut-arrow">→</span>
                    </button>


                    <button onClick={() => navigate("/restaurants")}>
                        <span>🍽️</span>
                        <span>
                            <strong>Browse Restaurants</strong>
                            <small>Discover something delicious</small>
                        </span>
                        <span className="shortcut-arrow">→</span>
                    </button>


                    <button
                        className="profile-logout-button"
                        onClick={handleLogout}
                    >
                        Log Out
                    </button>

                </aside>

            </div>

        </div>

    );
}


export default ProfilePage;
