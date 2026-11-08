import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import RestaurantReviews from "../components/RestaurantReviews";

import API_URL from "../config";


function readWishlist() {
    try {
        const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

export default function MenuPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [category, setCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [wishlist, setWishlist] = useState(readWishlist);
    const [toast, setToast] = useState("");

    useEffect(() => {
        function syncWishlist() {
            setWishlist(readWishlist());
        }

        window.addEventListener("wishlistUpdated", syncWishlist);
        window.addEventListener("storage", syncWishlist);

        return () => {
            window.removeEventListener("wishlistUpdated", syncWishlist);
            window.removeEventListener("storage", syncWishlist);
        };
    }, []);

    function showToast(message) {
        setToast(message);
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => setToast(""), 2600);
    }

    function isItemWishlisted(item) {
        return wishlist.some(
            (saved) =>
                (saved.type === "item" || saved.Menu_ID != null) &&
                Number(saved.Menu_ID) === Number(item.Menu_ID) &&
                Number(saved.Restaurant_ID) === Number(id)
        );
    }

    function toggleItemWishlist(item) {
        const currentWishlist = readWishlist();
        const alreadySaved = currentWishlist.some(
            (saved) =>
                (saved.type === "item" || saved.Menu_ID != null) &&
                Number(saved.Menu_ID) === Number(item.Menu_ID) &&
                Number(saved.Restaurant_ID) === Number(id)
        );

        let updated;

        if (alreadySaved) {
            updated = currentWishlist.filter(
                (saved) =>
                    !(
                        (saved.type === "item" || saved.Menu_ID != null) &&
                        Number(saved.Menu_ID) === Number(item.Menu_ID) &&
                        Number(saved.Restaurant_ID) === Number(id)
                    )
            );
            showToast(`${item.Item_Name || "Food item"} removed from wishlist.`);
        } else {
            updated = [
                ...currentWishlist,
                {
                    ...item,
                    type: "item",
                    Restaurant_ID: Number(id),
                    Restaurant_Name: restaurant?.Restaurant_Name || "Restaurant",
                    Restaurant_Image_URL:
                        restaurant?.Image_URL || restaurant?.image_url || ""
                }
            ];
            showToast(`${item.Item_Name || "Food item"} added to wishlist.`);
        }

        setWishlist(updated);
        localStorage.setItem("wishlist", JSON.stringify(updated));
        window.dispatchEvent(new Event("wishlistUpdated"));
    }

    useEffect(() => {
        let cancelled = false;

        async function loadData() {
            try {
                setLoading(true);
                setError("");

                const [restaurantResponse, menuResponse] =
                    await Promise.all([
                        fetch(`${API_URL}/restaurants`),
                        fetch(`${API_URL}/restaurants/${id}/menu`)
                    ]);

                if (!restaurantResponse.ok || !menuResponse.ok) {
                    throw new Error(
                        "Unable to load restaurant or menu data."
                    );
                }

                const restaurants = await restaurantResponse.json();
                const items = await menuResponse.json();

                if (
                    !Array.isArray(restaurants) ||
                    !Array.isArray(items)
                ) {
                    throw new Error("Invalid data received from the server.");
                }

                if (!cancelled) {
                    const selected = restaurants.find(
                        (item) =>
                            Number(item.Restaurant_ID) === Number(id)
                    );

                    setRestaurant(selected || null);
                    setMenu(items);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                        "Could not connect to the backend."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadData();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const categories = useMemo(
        () => [
            "All",
            ...new Set(
                menu.map((item) => item.Category).filter(Boolean)
            )
        ],
        [menu]
    );

    const filteredMenu = useMemo(() => {
        const term = search.trim().toLowerCase();

        return menu.filter((item) => {
            const matchesCategory =
                category === "All" || item.Category === category;

            const searchableText = [
                item.Item_Name,
                item.Description,
                item.Category
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return (
                matchesCategory &&
                searchableText.includes(term)
            );
        });
    }, [menu, category, search]);

    function addToCart(item) {
        try {
            const cart = JSON.parse(
                localStorage.getItem("cart") || "[]"
            );

            if (!Array.isArray(cart)) {
                throw new Error("Invalid cart data.");
            }

            const existing = cart.find(
                (cartItem) =>
                    Number(cartItem.Menu_ID) === Number(item.Menu_ID) &&
                    Number(cartItem.Restaurant_ID) === Number(id)
            );

            let updated;

            if (existing) {
                updated = cart.map((cartItem) =>
                    Number(cartItem.Menu_ID) === Number(item.Menu_ID) &&
                    Number(cartItem.Restaurant_ID) === Number(id)
                        ? {
                            ...cartItem,
                            quantity: Number(cartItem.quantity || 1) + 1
                        }
                        : cartItem
                );
            } else {
                updated = [
                    ...cart,
                    {
                        ...item,
                        Restaurant_ID: Number(id),
                        quantity: 1
                    }
                ];
            }

            localStorage.setItem("cart", JSON.stringify(updated));

            // Update the cart badge in the Navbar immediately.
            window.dispatchEvent(new Event("cartUpdated"));

            showToast(`${item.Item_Name} added to cart.`);
        } catch {
            setError("Could not update your cart. Please try again.");
        }
    }

    return (
        <div style={styles.page}>
            <style>{`
                @keyframes wishlistToastIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <Navbar />

            <main style={styles.main}>
                {toast && (
                    <div role="status" aria-live="polite" style={styles.toast}>
                        <span aria-hidden="true" style={styles.toastIcon}>✓</span>
                        <span>{toast}</span>
                    </div>
                )}

                <button
                    type="button"
                    style={styles.backButton}
                    onClick={() => navigate("/restaurants")}
                >
                    ← Back to Restaurants
                </button>

                {loading && <p>Loading menu...</p>}

                {!loading && error && (
                    <section style={styles.notice}>
                        <h2>Something went wrong</h2>
                        <p>{error}</p>

                        <button
                            type="button"
                            style={styles.primaryButton}
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </section>
                )}

                {!loading && !error && (
                    <>
                        <header style={styles.hero}>
                            <div style={styles.heroEmoji}>
                                {restaurant?.Image_URL || restaurant?.image_url ? (
                                    <img
                                        src={restaurant.Image_URL || restaurant.image_url}
                                        alt={`${restaurant.Restaurant_Name || "Restaurant"}`}
                                        style={styles.heroPhoto}
                                        onError={(event) => {
                                            event.currentTarget.style.display = "none";
                                        }}
                                    />
                                ) : (
                                    "🍽️"
                                )}
                            </div>

                            <div style={styles.heroContent}>
                                <p style={styles.eyebrow}>
                                    EXPLORE THE MENU
                                </p>

                                <h1 style={styles.heading}>
                                    {restaurant?.Restaurant_Name ||
                                        "Restaurant Menu"}
                                </h1>

                                <p style={styles.description}>
                                    {restaurant?.Description ||
                                        "Discover delicious dishes made for you."}
                                </p>

                                <p style={styles.location}>
                                    📍 {restaurant?.Address ||
                                        restaurant?.City ||
                                        "Location unavailable"}
                                </p>
                            </div>
                        </header>

                        <div style={styles.searchArea}>
                            <input
                                type="search"
                                aria-label="Search dishes"
                                placeholder="Search dishes..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                style={styles.search}
                            />
                        </div>

                        <div style={styles.categories}>
                            {categories.map((itemCategory) => (
                                <button
                                    key={itemCategory}
                                    type="button"
                                    aria-pressed={category === itemCategory}
                                    onClick={() =>
                                        setCategory(itemCategory)
                                    }
                                    style={{
                                        ...styles.categoryButton,
                                        ...(category === itemCategory
                                            ? styles.activeCategory
                                            : {})
                                    }}
                                >
                                    {itemCategory}
                                </button>
                            ))}
                        </div>

                        <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>
                                Our Menu
                            </h2>

                            <span style={styles.count}>
                                {filteredMenu.length} dishes
                            </span>
                        </div>

                        {filteredMenu.length === 0 ? (
                            <section style={styles.notice}>
                                <div style={{ fontSize: "42px" }}>
                                    🍽️
                                </div>

                                <h2>No dishes found</h2>
                                <p>
                                    Try another category or search term.
                                </p>

                                <button
                                    type="button"
                                    style={styles.primaryButton}
                                    onClick={() => {
                                        setCategory("All");
                                        setSearch("");
                                    }}
                                >
                                    Show All Dishes
                                </button>
                            </section>
                        ) : (
                            <section style={styles.grid}>
                                {filteredMenu.map((item) => (
                                    <article
                                        key={item.Menu_ID}
                                        style={styles.card}
                                    >
                                        <div style={styles.foodImage}>
                                            <span style={styles.foodEmoji}>
                                                {getFoodEmoji(item.Category)}
                                            </span>

                                            {(item.Image_URL || item.image_url) && (
                                                <img
                                                    src={item.Image_URL || item.image_url}
                                                    alt={item.Item_Name}
                                                    style={styles.foodImagePhoto}
                                                    loading="lazy"
                                                    onError={(event) => {
                                                        event.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            )}

                                            <span style={styles.foodCategory}>
                                                {item.Category || "Dish"}
                                            </span>

                                            <button
                                                type="button"
                                                aria-label={
                                                    isItemWishlisted(item)
                                                        ? "Remove food item from wishlist"
                                                        : "Add food item to wishlist"
                                                }
                                                aria-pressed={isItemWishlisted(item)}
                                                title={
                                                    isItemWishlisted(item)
                                                        ? "Remove from wishlist"
                                                        : "Add to wishlist"
                                                }
                                                style={styles.heart}
                                                onClick={() => toggleItemWishlist(item)}
                                            >
                                                {isItemWishlisted(item) ? "♥" : "♡"}
                                            </button>
                                        </div>

                                        <div style={styles.cardBody}>
                                            <h3 style={styles.foodTitle}>
                                                {item.Item_Name}
                                            </h3>

                                            <p style={styles.foodDescription}>
                                                {item.Description ||
                                                    "A delicious choice for your meal."}
                                            </p>

                                            <div style={styles.priceRow}>
                                                <strong style={styles.price}>
                                                    ₹{Number(item.Price).toFixed(2)}
                                                </strong>

                                                <span style={styles.available}>
                                                    ● Available
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                style={styles.primaryButton}
                                                onClick={() => addToCart(item)}
                                            >
                                                + Add to Cart
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </section>
                        )}
                        {/* RATINGS AND REVIEWS */}
                     <RestaurantReviews restaurantId={id} />
                    </>
                )}
            </main>
        </div>
    );
}


function getFoodEmoji(category = "") {
    const value = category.toLowerCase();

    if (value.includes("bread")) return "🫓";
    if (value.includes("pizza")) return "🍕";
    if (value.includes("rice")) return "🍚";
    if (value.includes("noodle")) return "🍜";
    if (value.includes("salad")) return "🥗";
    if (value.includes("healthy")) return "🥑";
    if (value.includes("main course")) return "🍛";
    if (value.includes("side")) return "🥟";

    return "🍽️";
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#ffffff",
        color: "#252525",
        fontFamily: "Arial, sans-serif"
    },

    main: {
        width: "88%",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "28px 0 65px",
        boxSizing: "border-box"
    },

    backButton: {
        border: "none",
        background: "transparent",
        color: "#d71928",
        fontWeight: "bold",
        cursor: "pointer",
        padding: "10px 0",
        marginBottom: "20px"
    },

    hero: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "24px",
        padding: "28px",
        borderRadius: "20px",
        background: "#fff8e7",
        border: "1px solid #f5e8c9"
    },

    heroEmoji: {
        width: "100px",
        height: "100px",
        flexShrink: 0,
        borderRadius: "18px",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "55px",
        overflow: "hidden"
    },

    heroPhoto: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block"
    },

    heroContent: {
        flex: "1 1 250px"
    },

    eyebrow: {
        color: "#d71928",
        fontWeight: "bold",
        fontSize: "12px",
        letterSpacing: "2px"
    },

    heading: {
        fontSize: "clamp(28px, 4vw, 40px)",
        margin: "8px 0"
    },

    description: {
        color: "#707070",
        lineHeight: "1.6"
    },

    location: {
        color: "#777777",
        fontSize: "14px"
    },

    searchArea: {
        marginTop: "30px"
    },

    search: {
        width: "100%",
        maxWidth: "550px",
        padding: "14px 17px",
        border: "1px solid #dedede",
        borderRadius: "10px",
        boxSizing: "border-box",
        fontSize: "15px",
        background: "#ffffff",
        color: "#252525"
    },

    categories: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginTop: "20px"
    },

    categoryButton: {
        padding: "10px 17px",
        border: "1px solid #e5e5e5",
        borderRadius: "25px",
        background: "#ffffff",
        color: "#333333",
        cursor: "pointer"
    },

    activeCategory: {
        background: "#d71928",
        color: "#ffffff",
        borderColor: "#d71928"
    },

    sectionHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        margin: "35px 0 20px"
    },

    sectionTitle: {
        margin: 0,
        fontSize: "27px"
    },

    count: {
        color: "#777777",
        fontSize: "14px"
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 260px), 320px))",
        gap: "22px",
        justifyContent: "start"
    },

    card: {
        minWidth: 0,
        background: "#ffffff",
        border: "1px solid #eeeeee",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 6px 22px rgba(0,0,0,0.055)"
    },

    foodImage: {
        height: "180px",
        background: "#fff4d9",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
    },

    foodImagePhoto: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block"
    },

    foodEmoji: {
        fontSize: "65px"
    },

    foodCategory: {
        position: "absolute",
        top: "12px",
        left: "12px",
        padding: "6px 10px",
        background: "#ffffff",
        borderRadius: "20px",
        fontSize: "12px"
    },

    heart: {
        position: "absolute",
        top: "10px",
        right: "10px",
        width: "40px",
        height: "40px",
        border: "none",
        borderRadius: "50%",
        background: "#ffffff",
        color: "#d71928",
        fontSize: "25px",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
    },

    cardBody: {
        padding: "19px"
    },

    foodTitle: {
        fontSize: "19px",
        margin: "0 0 10px"
    },

    foodDescription: {
        color: "#777777",
        fontSize: "14px",
        lineHeight: "1.6",
        minHeight: "44px"
    },

    priceRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
        margin: "18px 0"
    },

    price: {
        color: "#d71928",
        fontSize: "20px"
    },

    available: {
        color: "#287d40",
        fontSize: "12px"
    },

    primaryButton: {
        width: "100%",
        padding: "13px",
        border: "none",
        borderRadius: "9px",
        background: "#d71928",
        color: "#ffffff",
        fontWeight: "bold",
        cursor: "pointer"
    },

    notice: {
        padding: "40px 15px",
        textAlign: "center",
        color: "#707070"
    },

    toastIcon: {
        flex: "0 0 30px",
        width: "30px",
        height: "30px",
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        background: "#d71928",
        color: "#ffffff",
        fontSize: "19px",
        fontWeight: "800"
    },

    toast: {
        position: "fixed",
        top: "105px",
        right: "28px",
        zIndex: 99999,
        minWidth: "280px",
        maxWidth: "min(420px, calc(100vw - 40px))",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: "13px",
        padding: "18px 22px",
        borderRadius: "14px",
        background: "#252525",
        color: "#ffffff",
        boxShadow: "0 12px 35px rgba(0,0,0,0.28)",
        fontSize: "16px",
        lineHeight: "1.4",
        fontWeight: "600",
        borderLeft: "5px solid #d71928",
        animation: "wishlistToastIn 0.22s ease-out"
    }
};