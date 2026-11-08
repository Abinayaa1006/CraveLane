import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API_URL from "../config";

const CATEGORIES = ["All", "Indian", "Chinese", "Italian", "Healthy"];

function getCuisine(restaurant) {
    const stored = restaurant.Cuisine ?? restaurant.cuisine;
    if (stored) return stored;

    const name = String(restaurant.Restaurant_Name ?? restaurant.restaurant_name ?? "").toLowerCase();
    if (name.includes("spice")) return "Indian";
    if (name.includes("pizza")) return "Italian";
    if (name.includes("dragon")) return "Chinese";
    if (name.includes("green")) return "Healthy";
    return "Restaurant";
}

function normalizeText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function getFieldsText(record, excluded = /image|photo|logo|url|password|secret|token/i) {
    if (!record || typeof record !== "object") return "";
    return Object.entries(record)
        .filter(([key, value]) => value != null && typeof value !== "object" && !excluded.test(key))
        .map(([, value]) => String(value))
        .join(" ");
}

function getRestaurantId(restaurant) {
    return restaurant.Restaurant_ID ?? restaurant.restaurant_id ?? restaurant.id;
}

function getRestaurantName(restaurant) {
    return restaurant.Restaurant_Name ?? restaurant.restaurant_name ?? restaurant.name ?? "Restaurant";
}

function getMenuArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.menu_items)) return data.menu_items;
    if (Array.isArray(data?.menu)) return data.menu;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function getMenuValue(item, ...keys) {
    for (const key of keys) {
        if (item?.[key] !== undefined && item?.[key] !== null) return item[key];
    }
    return "";
}

function readWishlist() {
    try {
        const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function wordsMatch(text, words) {
    return words.every((word) => text.includes(word));
}

function formatPrice(price) {
    const number = Number(price);
    return Number.isFinite(number) ? `₹${number.toFixed(2).replace(/\.00$/, "")}` : "Price unavailable";
}

function getFoodEmoji(cuisine) {
    const emojis = {
        Indian: "🍛",
        Chinese: "🥡",
        Italian: "🍕",
        Healthy: "🥗"
    };
    return emojis[cuisine] || "🍽️";
}

export default function RestaurantsPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [restaurants, setRestaurants] = useState([]);
    const [menusByRestaurant, setMenusByRestaurant] = useState({});
    const [wishlist, setWishlist] = useState(readWishlist);
    const [selectedCategory, setSelectedCategory] = useState(() => {
        const category = location.state?.category;
        return CATEGORIES.includes(category) ? category : "All";
    });
    const [search, setSearch] = useState(() => location.state?.search || "");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");

    useEffect(() => {
        const category = location.state?.category;
        const query = location.state?.search;

        // Category navigation from the home page sends an empty search string.
        // Check the category first, otherwise the empty string resets it to "All".
        if (CATEGORIES.includes(category) && (!query || !String(query).trim())) {
            setSelectedCategory(category);
            setSearch("");
        } else if (typeof query === "string") {
            setSearch(query);
            setSelectedCategory("All");
        } else if (CATEGORIES.includes(category)) {
            setSelectedCategory(category);
            setSearch("");
        }
    }, [location.key]);

    useEffect(() => {
        const syncWishlist = () => setWishlist(readWishlist());
        window.addEventListener("wishlistUpdated", syncWishlist);
        window.addEventListener("storage", syncWishlist);
        return () => {
            window.removeEventListener("wishlistUpdated", syncWishlist);
            window.removeEventListener("storage", syncWishlist);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            setLoading(true);
            setError("");
            try {
                const response = await fetch(`${API_URL}/restaurants`);
                if (!response.ok) throw new Error(`Unable to load restaurants (${response.status}).`);
                const restaurantData = await response.json();
                if (!Array.isArray(restaurantData)) throw new Error("The server returned an invalid restaurant list.");
                if (cancelled) return;
                setRestaurants(restaurantData);

                // Public endpoint returns an array of available menu rows for each restaurant.
                const menuResults = await Promise.all(
                    restaurantData.map(async (restaurant) => {
                        const id = getRestaurantId(restaurant);
                        if (id == null) return ["", []];
                        try {
                            const menuResponse = await fetch(`${API_URL}/restaurants/${id}/menu`);
                            if (!menuResponse.ok) return [String(id), []];
                            const menuData = await menuResponse.json();
                            return [String(id), getMenuArray(menuData)];
                        } catch {
                            return [String(id), []];
                        }
                    })
                );
                if (!cancelled) setMenusByRestaurant(Object.fromEntries(menuResults));
            } catch (err) {
                if (!cancelled) setError(err.message || "Could not connect to the restaurant server.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadData();
        return () => { cancelled = true; };
    }, []);

    const results = useMemo(() => {
        const queryWords = normalizeText(search).split(/\s+/).filter(Boolean);
        const restaurantMatches = [];
        const dishMatches = [];

        restaurants.forEach((restaurant) => {
            const id = getRestaurantId(restaurant);
            const cuisine = getCuisine(restaurant);
            const restaurantText = normalizeText(`${getFieldsText(restaurant)} ${cuisine}`);
            const normalizedCuisine = normalizeText(cuisine);
            const normalizedCategory = normalizeText(selectedCategory);
            const categoryMatches =
                selectedCategory === "All" ||
                normalizedCuisine === normalizedCategory ||
                normalizedCuisine.includes(normalizedCategory) ||
                (normalizedCategory === "indian" && normalizedCuisine.includes("indian"));

            if (!categoryMatches) return;

            if (queryWords.length === 0 || wordsMatch(restaurantText, queryWords)) {
                restaurantMatches.push(restaurant);
            }

            const menuItems = menusByRestaurant[String(id)] || [];
            menuItems.forEach((item) => {
                const itemText = normalizeText(getFieldsText(item));
                if (queryWords.length > 0 && wordsMatch(itemText, queryWords)) {
                    dishMatches.push({ item, restaurant, cuisine });
                }
            });
        });

        return { restaurantMatches, dishMatches, queryWords };
    }, [restaurants, menusByRestaurant, search, selectedCategory]);

    function openRestaurant(restaurant) {
        navigate(`/restaurants/${getRestaurantId(restaurant)}`);
    }

    function showToast(message) {
        setToast(message);
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => setToast(""), 2500);
    }

    function toggleWishlist(event, restaurant) {
        event.stopPropagation();
        const id = Number(getRestaurantId(restaurant));
        const current = readWishlist();
        const alreadySaved = current.some((item) =>
            item.type !== "item" && item.Menu_ID == null && Number(item.Restaurant_ID ?? item.restaurant_id) === id
        );
        const updated = alreadySaved
            ? current.filter((item) => item.type === "item" || item.Menu_ID != null || Number(item.Restaurant_ID ?? item.restaurant_id) !== id)
            : [...current, { ...restaurant, type: "restaurant" }];
        setWishlist(updated);
        localStorage.setItem("wishlist", JSON.stringify(updated));
        window.dispatchEvent(new Event("wishlistUpdated"));
        showToast(`${getRestaurantName(restaurant)} ${alreadySaved ? "removed from" : "added to"} wishlist.`);
    }

    function clearFilters() {
        setSearch("");
        setSelectedCategory("All");
    }

    const hasSearch = search.trim().length > 0;
    const totalResults = results.dishMatches.length + results.restaurantMatches.length;

    return (
        <div style={styles.page}>
            <Navbar />
            <main style={styles.content}>
                {toast && <div role="status" aria-live="polite" style={styles.toast}>✓ {toast}</div>}

                <header style={styles.header}>
                    <p style={styles.eyebrow}>DISCOVER SOMETHING DELICIOUS</p>
                    <h1 style={styles.heading}>Explore Restaurants</h1>
                    <p style={styles.subtitle}>Find restaurants, dishes, cuisines and locations across CraveLane.</p>
                    <input
                        type="search"
                        aria-label="Search restaurants, dishes, cuisines and locations"
                        placeholder="Try a restaurant, dish, cuisine, area or city..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        style={styles.search}
                    />
                    <div style={styles.filters}>
                        {CATEGORIES.map((category) => (
                            <button
                                type="button"
                                key={category}
                                aria-pressed={selectedCategory === category}
                                onClick={() => { setSelectedCategory(category); setSearch(""); }}
                                style={{ ...styles.filter, ...(selectedCategory === category ? styles.activeFilter : {}) }}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </header>

                {loading && <div style={styles.message}><h2>Finding delicious options...</h2><p>Loading restaurant and menu information.</p></div>}
                {!loading && error && (
                    <div style={styles.message}>
                        <h2>Unable to load restaurants</h2>
                        <p>{error}</p>
                        <button type="button" style={styles.primaryButton} onClick={() => window.location.reload()}>Try Again</button>
                    </div>
                )}

                {!loading && !error && (
                    <section>
                        <div style={styles.resultsHeader}>
                            <h2 style={styles.resultsTitle}>
                                {hasSearch ? `Search results for “${search.trim()}”` : selectedCategory === "All" ? "All Restaurants" : `${selectedCategory} Restaurants`}
                            </h2>
                            <span style={styles.count}>{totalResults} result{totalResults === 1 ? "" : "s"}</span>
                        </div>

                        {totalResults === 0 ? (
                            <div style={styles.message}>
                                <div style={{ fontSize: 45 }}>🔎</div>
                                <h2>No exact matches found</h2>
                                <p>We couldn't find a restaurant or menu item matching every word in “{search}”. Try a different spelling, dish name, area or cuisine.</p>
                                <button type="button" style={styles.primaryButton} onClick={clearFilters}>Clear Search</button>
                            </div>
                        ) : (
                            <>
                                {results.dishMatches.length > 0 && (
                                    <div style={styles.resultSection}>
                                        <div style={styles.subheadingRow}>
                                            <h3 style={styles.subheading}>Matching dishes</h3>
                                            <span style={styles.count}>{results.dishMatches.length} dish{results.dishMatches.length === 1 ? "" : "es"}</span>
                                        </div>
                                        <div style={styles.dishGrid}>
                                            {results.dishMatches.map(({ item, restaurant, cuisine }, index) => {
                                                const menuId = getMenuValue(item, "Menu_ID", "menu_id") || `${getRestaurantId(restaurant)}-${index}`;
                                                const image = getMenuValue(item, "Image_URL", "image_url");
                                                const name = getMenuValue(item, "Item_Name", "item_name", "name") || "Menu item";
                                                const description = getMenuValue(item, "Description", "description");
                                                const price = getMenuValue(item, "Price", "price");
                                                return (
                                                    <article key={menuId} style={styles.dishCard}>
                                                        <div style={styles.dishImageWrap}>
                                                            {image ? (
                                                                <img src={image} alt={name} style={styles.dishImage} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                                                            ) : <span style={styles.dishEmoji}>{getFoodEmoji(cuisine)}</span>}
                                                        </div>
                                                        <div style={styles.dishBody}>
                                                            <div style={styles.dishTitleRow}>
                                                                <h4 style={styles.dishTitle}>{name}</h4>
                                                                <strong style={styles.price}>{formatPrice(price)}</strong>
                                                            </div>
                                                            {description && <p style={styles.dishDescription}>{description}</p>}
                                                            <p style={styles.dishRestaurant}>🍽️ {getRestaurantName(restaurant)}</p>
                                                            <p style={styles.dishLocation}>📍 {restaurant.Address ?? restaurant.address ?? restaurant.City ?? restaurant.city ?? "Location unavailable"}</p>
                                                            <button type="button" style={styles.primaryButton} onClick={() => openRestaurant(restaurant)}>View Restaurant Menu →</button>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {results.restaurantMatches.length > 0 && (
                                    <div style={styles.resultSection}>
                                        {hasSearch && <h3 style={styles.subheading}>Matching restaurants</h3>}
                                        <div style={styles.restaurantGrid}>
                                            {results.restaurantMatches.map((restaurant) => {
                                                const id = getRestaurantId(restaurant);
                                                const cuisine = getCuisine(restaurant);
                                                const name = getRestaurantName(restaurant);
                                                const image = restaurant.Image_URL ?? restaurant.image_url;
                                                const isFavourite = wishlist.some((item) => item.type !== "item" && item.Menu_ID == null && Number(item.Restaurant_ID ?? item.restaurant_id) === Number(id));
                                                return (
                                                    <article key={id} style={styles.card}>
                                                        <div style={styles.foodImage}>
                                                            {image ? <img src={image} alt={`${name}`} style={styles.foodImagePhoto} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span style={styles.foodEmoji}>{getFoodEmoji(cuisine)}</span>}
                                                            <span style={styles.cuisineBadge}>{cuisine}</span>
                                                            <button type="button" aria-label={isFavourite ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={isFavourite} style={styles.heart} onClick={(event) => toggleWishlist(event, restaurant)}>{isFavourite ? "♥" : "♡"}</button>
                                                        </div>
                                                        <div style={styles.cardBody}>
                                                            <div style={styles.titleRow}>
                                                                <h3 style={styles.cardTitle}>{name}</h3>
                                                                <span style={styles.rating}>★ {restaurant.Rating ?? restaurant.rating ?? "New"}</span>
                                                            </div>
                                                            <p style={styles.description}>{restaurant.Description ?? restaurant.description ?? "Discover delicious food and explore the menu."}</p>
                                                            <p style={styles.meta}>📍 {restaurant.Address ?? restaurant.address ?? restaurant.City ?? restaurant.city ?? "Location unavailable"}</p>
                                                            <p style={styles.meta}>{String(restaurant.Status ?? restaurant.status ?? "").toLowerCase() === "open" ? "🟢 Open" : String(restaurant.Status ?? restaurant.status ?? "").toLowerCase() === "closed" ? "🔴 Closed" : "Status unavailable"}</p>
                                                            <button type="button" style={styles.primaryButton} onClick={() => openRestaurant(restaurant)}>View Menu →</button>
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#ffffff", color: "#252525", fontFamily: "Arial, sans-serif" },
    content: { width: "88%", maxWidth: "1440px", margin: "0 auto", padding: "36px 0 60px", boxSizing: "border-box" },
    header: { marginBottom: 34 },
    eyebrow: { color: "#d71928", fontWeight: "bold", fontSize: 13, letterSpacing: 2 },
    heading: { fontSize: "clamp(32px, 4vw, 48px)", color: "#252525", margin: "10px 0" },
    subtitle: { color: "#707070", fontSize: 17, marginBottom: 24 },
    search: { width: "100%", maxWidth: 760, boxSizing: "border-box", display: "block", padding: "15px 18px", border: "1px solid #e5e5e5", borderRadius: 12, background: "#fff", color: "#252525", fontSize: 16, outlineColor: "#d71928", marginBottom: 20 },
    filters: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 },
    filter: { flex: "0 0 auto", padding: "10px 18px", border: "1px solid #e5e5e5", borderRadius: 25, background: "#fff", color: "#333", fontSize: 15, cursor: "pointer" },
    activeFilter: { background: "#d71928", color: "#fff", borderColor: "#d71928" },
    resultsHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 22 },
    resultsTitle: { fontSize: 23, color: "#252525", margin: 0 },
    count: { color: "#707070", fontSize: 14 },
    resultSection: { marginBottom: 34 },
    subheadingRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 },
    subheading: { fontSize: 21, color: "#252525", margin: "0 0 16px" },
    dishGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 20 },
    dishCard: { display: "grid", gridTemplateColumns: "125px minmax(0, 1fr)", gap: 16, padding: 14, border: "1px solid #eee", borderRadius: 16, boxShadow: "0 5px 22px rgba(0,0,0,0.05)", background: "#fff", minWidth: 0 },
    dishImageWrap: { width: 125, minHeight: 130, borderRadius: 12, overflow: "hidden", background: "#fff4e5", display: "flex", alignItems: "center", justifyContent: "center" },
    dishImage: { width: "100%", height: "100%", minHeight: 130, objectFit: "cover" },
    dishEmoji: { fontSize: 48 },
    dishBody: { minWidth: 0 },
    dishTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
    dishTitle: { margin: "2px 0 8px", fontSize: 17, color: "#252525" },
    price: { color: "#b17a00", whiteSpace: "nowrap", fontSize: 15 },
    dishDescription: { color: "#707070", fontSize: 13, lineHeight: 1.4, margin: "0 0 8px" },
    dishRestaurant: { color: "#444", fontSize: 13, fontWeight: "bold", margin: "7px 0" },
    dishLocation: { color: "#707070", fontSize: 12, margin: "5px 0" },
    restaurantGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 270px), 320px))", gap: 24, justifyContent: "start", alignItems: "stretch" },
    card: { minWidth: 0, width: "100%", boxSizing: "border-box", background: "#fff", border: "1px solid #eee", borderRadius: 18, overflow: "hidden", boxShadow: "0 5px 22px rgba(0,0,0,0.06)" },
    foodImage: { height: 170, width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", background: "#fff0bd" },
    foodEmoji: { fontSize: 70 },
    foodImagePhoto: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" },
    cuisineBadge: { position: "absolute", left: 14, top: 14, padding: "6px 10px", background: "#fff", borderRadius: 20, color: "#333", fontSize: 12, fontWeight: "bold" },
    heart: { position: "absolute", top: 12, right: 12, width: 40, height: 40, border: "none", borderRadius: "50%", background: "#fff", color: "#d71928", fontSize: 25, cursor: "pointer" },
    cardBody: { padding: 20 },
    titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
    cardTitle: { fontSize: 20, color: "#252525", margin: "0 0 12px" },
    rating: { color: "#a77900", whiteSpace: "nowrap", fontWeight: "bold", fontSize: 14 },
    description: { minHeight: 44, color: "#707070", lineHeight: 1.5, fontSize: 14 },
    meta: { color: "#666", fontSize: 14, lineHeight: 1.4 },
    primaryButton: { width: "100%", padding: "12px 14px", marginTop: 10, border: "none", borderRadius: 10, background: "#d71928", color: "#fff", fontWeight: "bold", fontSize: 14, cursor: "pointer" },
    message: { padding: "45px 15px", textAlign: "center", color: "#707070", background: "#fffaf0", borderRadius: 16 },
    toast: { position: "fixed", top: 88, right: 22, zIndex: 1200, padding: "13px 18px", borderRadius: 10, background: "#242424", color: "#fff", boxShadow: "0 8px 25px #0002" }
};
