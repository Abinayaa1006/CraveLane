import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function readWishlist() {
    try {
        const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function isFoodItem(entry) {
    return entry.type === "item" || entry.Menu_ID !== undefined;
}

export default function WishlistPage() {
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState(readWishlist);
    const [activeTab, setActiveTab] = useState("restaurants");
    const [toast, setToast] = useState("");

    useEffect(() => {
        const sync = () => setWishlist(readWishlist());
        window.addEventListener("wishlistUpdated", sync);
        window.addEventListener("storage", sync);
        return () => {
            window.removeEventListener("wishlistUpdated", sync);
            window.removeEventListener("storage", sync);
        };
    }, []);

    const restaurants = useMemo(() => wishlist.filter((entry) => !isFoodItem(entry)), [wishlist]);
    const foodItems = useMemo(() => wishlist.filter(isFoodItem), [wishlist]);
    const visibleItems = activeTab === "restaurants" ? restaurants : foodItems;

    function showToast(message) {
        setToast(message);
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => setToast(""), 2600);
    }

    function saveWishlist(updated, message) {
        setWishlist(updated);
        localStorage.setItem("wishlist", JSON.stringify(updated));
        window.dispatchEvent(new Event("wishlistUpdated"));
        showToast(message);
    }

    function removeEntry(entry) {
        const updated = wishlist.filter((saved) => {
            if (isFoodItem(entry)) {
                return !(isFoodItem(saved) &&
                    Number(saved.Menu_ID) === Number(entry.Menu_ID) &&
                    Number(saved.Restaurant_ID) === Number(entry.Restaurant_ID));
            }
            return isFoodItem(saved) || Number(saved.Restaurant_ID) !== Number(entry.Restaurant_ID);
        });
        saveWishlist(updated, isFoodItem(entry) ? `${entry.Item_Name || "Food item"} removed from wishlist.` : `${entry.Restaurant_Name || "Restaurant"} removed from wishlist.`);
    }

    return (
        <div style={styles.page}>
            <Navbar />
            <main style={styles.main}>
                <div style={styles.headingRow}>
                    <div>
                        <p style={styles.eyebrow}>YOUR PERSONAL COLLECTION</p>
                        <h1 style={styles.heading}><span style={{ color: "#d71928" }}>♥</span> My Wishlist</h1>
                        <p style={styles.subtitle}>Keep your favourite restaurants and dishes close.</p>
                    </div>
                    <span style={styles.total}>{wishlist.length} saved</span>
                </div>

                {toast && <div role="status" style={styles.toast}>✓ {toast}</div>}

                <div style={styles.tabs} role="tablist" aria-label="Wishlist categories">
                    <button role="tab" aria-selected={activeTab === "restaurants"} onClick={() => setActiveTab("restaurants")} style={{ ...styles.tab, ...(activeTab === "restaurants" ? styles.activeTab : {}) }}>
                        🍴 Restaurants <span style={styles.tabCount}>{restaurants.length}</span>
                    </button>
                    <button role="tab" aria-selected={activeTab === "items"} onClick={() => setActiveTab("items")} style={{ ...styles.tab, ...(activeTab === "items" ? styles.activeTab : {}) }}>
                        🍲 Food Items <span style={styles.tabCount}>{foodItems.length}</span>
                    </button>
                </div>

                {visibleItems.length === 0 ? (
                    <section style={styles.empty}>
                        <div style={styles.emptyIcon}>{activeTab === "restaurants" ? "♡" : "🍽️"}</div>
                        <h2 style={styles.emptyTitle}>{activeTab === "restaurants" ? "No favourite restaurants yet" : "No favourite dishes yet"}</h2>
                        <p style={styles.emptyText}>
                            {activeTab === "restaurants"
                                ? "Explore restaurants and tap the heart to save the places you love."
                                : "Open a restaurant menu and tap the heart on any dish you want to save."}
                        </p>
                        <button style={styles.primaryButton} onClick={() => navigate("/restaurants")}>
                            Explore Restaurants →
                        </button>
                    </section>
                ) : (
                    <section style={styles.grid}>
                        {visibleItems.map((entry) => {
                            const item = isFoodItem(entry);
                            const key = item ? `item-${entry.Restaurant_ID}-${entry.Menu_ID}` : `restaurant-${entry.Restaurant_ID}`;
                            const title = item ? entry.Item_Name : entry.Restaurant_Name;
                            const image = entry.Image_URL || entry.image_url;
                            return (
                                <article key={key} style={styles.card}>
                                    <div style={styles.imageArea}>
                                        {image ? <img src={image} alt={title || "Wishlist item"} style={styles.photo} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <span style={styles.emoji}>{item ? "🍲" : getEmoji(entry)}</span>}
                                        <span style={styles.typeBadge}>{item ? "FOOD ITEM" : "RESTAURANT"}</span>
                                        <button aria-label="Remove from wishlist" title="Remove from wishlist" style={styles.heart} onClick={() => removeEntry(entry)}>♥</button>
                                    </div>
                                    <div style={styles.cardBody}>
                                        <h2 style={styles.cardTitle}>{title || "Saved favourite"}</h2>
                                        {item ? (
                                            <>
                                                <p style={styles.description}>{entry.Description || "A delicious dish saved for later."}</p>
                                                <div style={styles.metaRow}>
                                                    <strong style={styles.price}>₹{Number(entry.Price || 0).toFixed(2)}</strong>
                                                    <span>{entry.Category || "Dish"}</span>
                                                </div>
                                                <button style={styles.primaryButton} onClick={() => navigate(`/restaurants/${entry.Restaurant_ID}`)}>View Restaurant Menu →</button>
                                            </>
                                        ) : (
                                            <>
                                                <p style={styles.description}>{entry.Description || "Discover delicious food and explore the menu."}</p>
                                                <p style={styles.location}>📍 {entry.Address || entry.City || "Location unavailable"}</p>
                                                <button style={styles.primaryButton} onClick={() => navigate(`/restaurants/${entry.Restaurant_ID}`)}>View Menu →</button>
                                            </>
                                        )}
                                        <button style={styles.removeButton} onClick={() => removeEntry(entry)}>Remove from Wishlist</button>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </main>
        </div>
    );
}

function getEmoji(restaurant) {
    const value = `${restaurant.Cuisine || ""} ${restaurant.Restaurant_Name || ""}`.toLowerCase();
    if (value.includes("indian") || value.includes("spice")) return "🍛";
    if (value.includes("italian") || value.includes("pizza")) return "🍕";
    if (value.includes("chinese") || value.includes("dragon")) return "🥡";
    if (value.includes("healthy") || value.includes("green")) return "🥗";
    if (value.includes("burger") || value.includes("fast food")) return "🍔";
    return "🍽️";
}

const styles = {
    page: { minHeight: "100vh", background: "#fffaf3", color: "#252525", fontFamily: "Arial, sans-serif" },
    main: { width: "88%", maxWidth: "1400px", margin: "0 auto", padding: "42px 0 70px", boxSizing: "border-box" },
    headingRow: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "18px", marginBottom: "28px" },
    eyebrow: { color: "#d71928", fontSize: "12px", fontWeight: 800, letterSpacing: "2px", margin: "0 0 8px" },
    heading: { fontSize: "clamp(32px, 4vw, 44px)", margin: "0 0 8px" },
    subtitle: { color: "#777", fontSize: "16px", margin: 0 },
    total: { padding: "9px 15px", borderRadius: "22px", background: "#fff0c8", color: "#755800", fontWeight: 800, fontSize: "14px" },
    tabs: { display: "flex", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid #eee2d8", marginBottom: "26px" },
    tab: { border: "1px solid #eaded4", borderBottom: "3px solid transparent", borderRadius: "10px 10px 0 0", padding: "12px 18px", background: "#fff", color: "#5c514b", fontWeight: 700, cursor: "pointer" },
    activeTab: { color: "#c62828", background: "#fff3ee", borderColor: "#f0c9bd", borderBottomColor: "#c62828" },
    tabCount: { marginLeft: "7px", padding: "2px 7px", borderRadius: "20px", background: "#fff0c8", color: "#755800", fontSize: "12px" },
    toast: { position: "fixed", top: "88px", right: "22px", zIndex: 1200, padding: "13px 18px", borderRadius: "10px", background: "#242424", color: "#fff", boxShadow: "0 8px 25px #0002" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 270px), 320px))", gap: "22px", alignItems: "stretch" },
    card: { minWidth: 0, background: "#fff", border: "1px solid #eee5dc", borderRadius: "16px", overflow: "hidden", boxShadow: "0 6px 22px rgba(75,45,20,0.07)" },
    imageArea: { height: "175px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff0dc", overflow: "hidden" },
    photo: { width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 },
    emoji: { fontSize: "68px" },
    typeBadge: { position: "absolute", left: "12px", top: "12px", background: "#fff", color: "#8d3028", padding: "6px 9px", borderRadius: "20px", fontSize: "10px", fontWeight: 800, letterSpacing: "0.7px" },
    heart: { position: "absolute", top: "11px", right: "11px", width: "38px", height: "38px", border: 0, borderRadius: "50%", background: "#fff", color: "#d71928", fontSize: "21px", cursor: "pointer" },
    cardBody: { padding: "18px" },
    cardTitle: { fontSize: "19px", margin: "0 0 9px" },
    description: { color: "#777", fontSize: "14px", lineHeight: 1.55, minHeight: "42px" },
    location: { color: "#666", fontSize: "14px", margin: "14px 0" },
    metaRow: { display: "flex", alignItems: "center", justifyContent: "space-between", color: "#777", fontSize: "13px", margin: "14px 0" },
    price: { color: "#b52525", fontSize: "17px" },
    primaryButton: { width: "100%", padding: "12px", border: 0, borderRadius: "9px", background: "#c62828", color: "#fff", fontWeight: 800, cursor: "pointer" },
    removeButton: { width: "100%", padding: "11px", marginTop: "9px", border: "1px solid #f0c6ca", borderRadius: "9px", background: "#fff5f5", color: "#c31525", fontWeight: 700, cursor: "pointer" },
    empty: { minHeight: "330px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "30px 15px", border: "1px dashed #e5dada", borderRadius: "18px", background: "#fff" },
    emptyIcon: { width: "82px", height: "82px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff0f1", color: "#d71928", fontSize: "48px" },
    emptyTitle: { margin: "20px 0 7px", fontSize: "23px" },
    emptyText: { maxWidth: "480px", color: "#777", lineHeight: 1.65, marginBottom: "20px" }
};
