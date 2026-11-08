import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_URL = "http://127.0.0.1:5000";

const CATEGORIES = [
    "All",
    "Indian",
    "Chinese",
    "Italian",
    "Fast Food",
    "Healthy"
];

function getCuisine(restaurant) {
    if (restaurant.Cuisine) return restaurant.Cuisine;

    const name = (restaurant.Restaurant_Name || "").toLowerCase();

    if (name.includes("spice")) return "Indian";
    if (name.includes("pizza")) return "Italian";
    if (name.includes("dragon")) return "Chinese";
    if (name.includes("green")) return "Healthy";
    if (name.includes("burger")) return "Fast Food";

    return "Restaurant";
}

function getFoodEmoji(cuisine) {
    const emojis = {
        Indian: "🍛",
        Chinese: "🥡",
        Italian: "🍕",
        "Fast Food": "🍔",
        Healthy: "🥗"
    };

    return emojis[cuisine] || "🍽️";
}

function readWishlist() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("wishlist") || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

export default function RestaurantsPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [restaurants, setRestaurants] = useState([]);
    const [wishlist, setWishlist] = useState(readWishlist);
    const [selectedCategory, setSelectedCategory] = useState(() => {
        const requested = location.state?.category;
        return CATEGORIES.includes(requested) ? requested : "All";
    });
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const requested = location.state?.category;

        if (CATEGORIES.includes(requested)) {
            setSelectedCategory(requested);
        }
    }, [location.state]);

    useEffect(() => {
        let cancelled = false;

        async function loadRestaurants() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/restaurants`
                );

                if (!response.ok) {
                    throw new Error(
                        `Unable to load restaurants (${response.status}).`
                    );
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error(
                        "The server returned an invalid restaurant list."
                    );
                }

                if (!cancelled) setRestaurants(data);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                        "Could not connect to the restaurant server."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadRestaurants();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredRestaurants = useMemo(() => {
        const term = search.trim().toLowerCase();

        return restaurants.filter((restaurant) => {
            const cuisine = getCuisine(restaurant);

            const matchesCategory =
                selectedCategory === "All" ||
                cuisine.toLowerCase() ===
                    selectedCategory.toLowerCase();

            const searchableText = [
                restaurant.Restaurant_Name,
                restaurant.Description,
                restaurant.Address,
                restaurant.City,
                cuisine
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return (
                matchesCategory &&
                searchableText.includes(term)
            );
        });
    }, [restaurants, selectedCategory, search]);

    function openRestaurant(id) {
        navigate(`/restaurants/${id}`);
    }

    function toggleWishlist(event, restaurant) {
        event.stopPropagation();

        const id = Number(restaurant.Restaurant_ID);

        const alreadySaved = wishlist.some(
            (item) => Number(item.Restaurant_ID) === id
        );

        const updated = alreadySaved
            ? wishlist.filter(
                (item) => Number(item.Restaurant_ID) !== id
            )
            : [...wishlist, restaurant];

        setWishlist(updated);

        localStorage.setItem(
            "wishlist",
            JSON.stringify(updated)
        );
    }

    function clearFilters() {
        setSearch("");
        setSelectedCategory("All");
    }

    return (
        <div style={styles.page}>
            <Navbar />

            <main style={styles.content}>
                <header style={styles.header}>
                    <p style={styles.eyebrow}>
                        DISCOVER SOMETHING DELICIOUS
                    </p>

                    <h1 style={styles.heading}>
                        Explore Restaurants
                    </h1>

                    <p style={styles.subtitle}>
                        Find your next favourite meal.
                    </p>

                    <input
                        type="search"
                        aria-label="Search restaurants"
                        placeholder="Search restaurants, cuisines or locations..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        style={styles.search}
                    />

                    <div style={styles.filters}>
                        {CATEGORIES.map((category) => (
                            <button
                                type="button"
                                key={category}
                                aria-pressed={
                                    selectedCategory === category
                                }
                                onClick={() =>
                                    setSelectedCategory(category)
                                }
                                style={{
                                    ...styles.filter,
                                    ...(selectedCategory === category
                                        ? styles.activeFilter
                                        : {})
                                }}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </header>

                {loading && (
                    <div style={styles.message}>
                        <h2>Loading restaurants...</h2>
                    </div>
                )}

                {!loading && error && (
                    <div style={styles.message}>
                        <h2>Unable to load restaurants</h2>
                        <p>{error}</p>

                        <button
                            type="button"
                            style={styles.primaryButton}
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <section>
                        <div style={styles.resultsHeader}>
                            <h2 style={styles.resultsTitle}>
                                {selectedCategory === "All"
                                    ? "All Restaurants"
                                    : `${selectedCategory} Restaurants`}
                            </h2>

                            <span style={styles.count}>
                                {filteredRestaurants.length} found
                            </span>
                        </div>

                        {filteredRestaurants.length === 0 ? (
                            <div style={styles.message}>
                                <div style={{ fontSize: "45px" }}>
                                    🔎
                                </div>

                                <h2>No restaurants found</h2>
                                <p>
                                    Try another category or search term.
                                </p>

                                <button
                                    type="button"
                                    style={styles.primaryButton}
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div style={styles.grid}>
                                {filteredRestaurants.map((restaurant) => {
                                    const id = restaurant.Restaurant_ID;
                                    const cuisine = getCuisine(restaurant);

                                    const isFavourite = wishlist.some(
                                        (item) =>
                                            Number(item.Restaurant_ID) ===
                                            Number(id)
                                    );

                                    return (
                                        <article
                                            key={id}
                                            style={styles.card}
                                            role="link"
                                            tabIndex={0}
                                            aria-label={`View ${restaurant.Restaurant_Name} menu`}
                                            onClickCapture={(event) => {
                                                // Let the wishlist heart keep its own action.
                                                if (event.target.closest("button")) {
                                                    return;
                                                }
                                                openRestaurant(id);
                                            }}
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === "Enter" ||
                                                    event.key === " "
                                                ) {
                                                    event.preventDefault();
                                                    openRestaurant(id);
                                                }
                                            }}
                                        >
                                            <div
                                                style={{
                                                    ...styles.foodImage,
                                                    background:
                                                        cuisine === "Healthy"
                                                            ? "#fff6d9"
                                                            : cuisine === "Italian"
                                                            ? "#fff0e8"
                                                            : cuisine === "Chinese"
                                                            ? "#fff0bd"
                                                            : "#fff5df"
                                                }}
                                            >
                                                <span style={styles.foodEmoji}>
                                                    {getFoodEmoji(cuisine)}
                                                </span>

                                                {(restaurant.Image_URL || restaurant.image_url) && (
                                                    <img
                                                        src={restaurant.Image_URL || restaurant.image_url}
                                                        alt={`${restaurant.Restaurant_Name} restaurant`}
                                                        style={styles.foodImagePhoto}
                                                        loading="lazy"
                                                        onError={(event) => {
                                                            event.currentTarget.style.display = "none";
                                                        }}
                                                    />
                                                )}

                                                <span style={styles.cuisineBadge}>
                                                    {cuisine}
                                                </span>

                                                <button
                                                    type="button"
                                                    aria-label={
                                                        isFavourite
                                                            ? "Remove from wishlist"
                                                            : "Add to wishlist"
                                                    }
                                                    aria-pressed={isFavourite}
                                                    title={
                                                        isFavourite
                                                            ? "Remove favourite"
                                                            : "Add to wishlist"
                                                    }
                                                    style={styles.heart}
                                                    onClick={(event) =>
                                                        toggleWishlist(
                                                            event,
                                                            restaurant
                                                        )
                                                    }
                                                >
                                                    {isFavourite ? "♥" : "♡"}
                                                </button>
                                            </div>

                                            <div style={styles.cardBody}>
                                                <div style={styles.titleRow}>
                                                    <h3 style={styles.cardTitle}>
                                                        {restaurant.Restaurant_Name}
                                                    </h3>

                                                    <span style={styles.rating}>
                                                        ★ {restaurant.Rating || "New"}
                                                    </span>
                                                </div>

                                                <p style={styles.description}>
                                                    {restaurant.Description ||
                                                        "Discover delicious food and explore the menu."}
                                                </p>

                                                <p style={styles.meta}>
                                                    📍 {restaurant.Address ||
                                                        restaurant.City ||
                                                        "Location unavailable"}
                                                </p>

                                                <p style={styles.meta}>
                                                    {restaurant.Status === "Open"
                                                        ? "🟢 Open"
                                                        : restaurant.Status === "Closed"
                                                        ? "🔴 Closed"
                                                        : "Status unavailable"}
                                                </p>

                                                <button
                                                    type="button"
                                                    style={styles.primaryButton}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openRestaurant(id);
                                                    }}
                                                >
                                                    View Menu →
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#ffffff",
        color: "#252525",
        fontFamily: "Arial, sans-serif"
    },

    content: {
        width: "88%",
        maxWidth: "1440px",
        margin: "0 auto",
        padding: "36px 0 60px",
        boxSizing: "border-box"
    },

    header: {
        marginBottom: "34px"
    },

    eyebrow: {
        color: "#d71928",
        fontWeight: "bold",
        fontSize: "13px",
        letterSpacing: "2px"
    },

    heading: {
        fontSize: "clamp(32px, 4vw, 48px)",
        color: "#252525",
        margin: "10px 0"
    },

    subtitle: {
        color: "#707070",
        fontSize: "17px",
        marginBottom: "24px"
    },

    search: {
        width: "100%",
        maxWidth: "620px",
        boxSizing: "border-box",
        display: "block",
        padding: "15px 18px",
        border: "1px solid #e5e5e5",
        borderRadius: "12px",
        background: "#ffffff",
        color: "#252525",
        fontSize: "15px",
        outlineColor: "#d71928",
        marginBottom: "20px"
    },

    filters: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "10px"
    },

    filter: {
        flex: "0 0 auto",
        padding: "10px 18px",
        border: "1px solid #e5e5e5",
        borderRadius: "25px",
        background: "#ffffff",
        color: "#333333",
        fontSize: "15px",
        cursor: "pointer"
    },

    activeFilter: {
        background: "#d71928",
        color: "#ffffff",
        borderColor: "#d71928"
    },

    resultsHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
        marginBottom: "20px"
    },

    resultsTitle: {
        fontSize: "23px",
        color: "#252525",
        margin: 0
    },

    count: {
        color: "#707070",
        fontSize: "14px"
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 270px), 320px))",
        gap: "24px",
        justifyContent: "start",
        alignItems: "stretch"
    },

    card: {
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
        background: "#ffffff",
        border: "1px solid #eeeeee",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 5px 22px rgba(0,0,0,0.06)",
        cursor: "pointer"
    },

    foodImage: {
        height: "170px",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "#fff0bd"
    },

    foodEmoji: {
        fontSize: "70px"
    },

    foodImagePhoto: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block"
    },

    cuisineBadge: {
        position: "absolute",
        left: "14px",
        top: "14px",
        padding: "6px 10px",
        background: "#ffffff",
        borderRadius: "20px",
        color: "#333333",
        fontSize: "12px",
        fontWeight: "bold"
    },

    heart: {
        position: "absolute",
        top: "12px",
        right: "12px",
        width: "40px",
        height: "40px",
        border: "none",
        borderRadius: "50%",
        background: "#ffffff",
        color: "#d71928",
        fontSize: "25px",
        cursor: "pointer"
    },

    cardBody: {
        padding: "20px"
    },

    titleRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "10px"
    },

    cardTitle: {
        fontSize: "20px",
        color: "#252525",
        margin: "0 0 12px"
    },

    rating: {
        color: "#a77900",
        whiteSpace: "nowrap",
        fontWeight: "bold",
        fontSize: "14px"
    },

    description: {
        minHeight: "44px",
        color: "#707070",
        lineHeight: "1.5",
        fontSize: "14px"
    },

    meta: {
        color: "#666666",
        fontSize: "14px",
        lineHeight: "1.4"
    },

    primaryButton: {
        width: "100%",
        padding: "13px 15px",
        marginTop: "12px",
        border: "none",
        borderRadius: "10px",
        background: "#d71928",
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: "14px",
        cursor: "pointer"
    },

    message: {
        padding: "45px 15px",
        textAlign: "center",
        color: "#707070",
        background: "#fffaf0",
        borderRadius: "16px"
    }
};
