import React, { useCallback, useEffect, useState } from "react";
import API_URL from "../config";

// Get customer ID from localStorage
function getCustomerId() {
    const directId =
        localStorage.getItem("customerId") ||
        localStorage.getItem("customer_id");

    if (directId) {
        return directId;
    }

    const possibleKeys = [
        "user",
        "customer",
        "loggedInUser"
    ];

    for (const key of possibleKeys) {
        try {
            const saved = JSON.parse(
                localStorage.getItem(key) || "null"
            );

            if (saved) {
                const id =
                    saved.customer_id ??
                    saved.customerId ??
                    saved.Customer_ID;

                if (id !== undefined && id !== null) {
                    return id;
                }
            }
        } catch {
            // Ignore invalid stored JSON
        }
    }

    return null;
}

export default function RestaurantReviews({ restaurantId }) {
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);

    const [deliveredOrders, setDeliveredOrders] = useState([]);

    const [rating, setRating] = useState(5);
    const [comments, setComments] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const token = localStorage.getItem("token");
    const customerId = getCustomerId();

    // =========================================
    // FETCH RESTAURANT REVIEWS
    // =========================================

    const fetchReviews = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_URL}/restaurants/${restaurantId}/reviews`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not load reviews."
                );
            }

            setReviews(
                Array.isArray(data.reviews)
                    ? data.reviews
                    : []
            );

            setAverageRating(
                Number(data.average_rating || 0)
            );

            setReviewCount(
                Number(data.review_count || 0)
            );

        } catch (err) {
            setError(
                err.message || "Unable to load reviews."
            );
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // =========================================
    // FETCH CUSTOMER DELIVERED ORDERS
    // =========================================

    const fetchDeliveredOrders = useCallback(async () => {
        if (!customerId) {
            setDeliveredOrders([]);
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/orders/customer/${customerId}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not load your orders."
                );
            }

            const orders = Array.isArray(data)
                ? data
                : Array.isArray(data.orders)
                    ? data.orders
                    : [];

          const delivered = orders.filter((order) => {
    const status = String(
        order.order_status ||
        order.Order_Status ||
        ""
    ).trim().toLowerCase();

    const belongsToRestaurant = (order.items || []).some(
        (item) =>
            Number(item.restaurant_id) === Number(restaurantId)
    );

    return status === "delivered" && belongsToRestaurant;
});

setDeliveredOrders(delivered);

        } catch (err) {
            setError(
                err.message || "Unable to load delivered orders."
            );
        }
    }, [customerId, restaurantId]);

    // =========================================
    // INITIAL LOAD
    // =========================================

    useEffect(() => {
        fetchReviews();
        fetchDeliveredOrders();
    }, [fetchReviews, fetchDeliveredOrders]);

    // =========================================
    // SUBMIT REVIEW
    // =========================================

    const submitReview = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        setError("");
        setMessage("");

        if (!token) {
            setError("Please log in to submit a review.");
            return;
        }

        const orderId = form.orderId.value;

        if (!orderId) {
            setError("Please select a delivered order.");
            return;
        }

        if (rating < 1 || rating > 5) {
            setError("Please select a rating between 1 and 5.");
            return;
        }

        if (comments.trim().length > 2000) {
            setError("Your review cannot exceed 2000 characters.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(
                `${API_URL}/reviews`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        restaurant_id: Number(restaurantId),
                        order_id: Number(orderId),
                        rating: Number(rating),
                        comments: comments.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not submit your review."
                );
            }

            setMessage(
                data.message || "Your review was submitted successfully!"
            );

            setRating(5);
            setComments("");

            form.reset();

            await fetchReviews();

        } catch (err) {
            setError(
                err.message || "Unable to submit your review."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // =========================================
    // STAR DISPLAY
    // =========================================

    const renderStars = (value) => {
        const roundedRating = Math.round(Number(value || 0));

        return (
            <span style={styles.stars}>
                {"★".repeat(roundedRating)}
                {"☆".repeat(5 - roundedRating)}
            </span>
        );
    };

    // =========================================
    // DATE FORMAT
    // =========================================

    const formatDate = (dateValue) => {
        if (!dateValue) return "";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };
    const formatReviewDateTime = (dateValue) => {
    if (!dateValue) return "";

    // MySQL DATETIME has no timezone suffix.
    // Treat it as IST; preserve timezone if one is already supplied.
    const value = String(dateValue);
    const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(value);

    const date = new Date(
        hasTimezone ? value : `${value}+05:30`
    );

    if (Number.isNaN(date.getTime())) return "";

    return (
        date.toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }) + " IST"
    );
};

    // =========================================
    // LOADING STATE
    // =========================================

    if (loading) {
        return (
            <section style={styles.container}>
                <p style={styles.loading}>
                    Loading restaurant reviews...
                </p>
            </section>
        );
    }

    // =========================================
    // MAIN UI
    // =========================================

    return (
        <section style={styles.container}>

            <div style={styles.headingSection}>
                <h2 style={styles.heading}>
                    Ratings & Reviews
                </h2>

                <p style={styles.subtitle}>
                    See what other customers think about this restaurant.
                </p>
            </div>

            {/* AVERAGE RATING */}

            <div style={styles.ratingSummary}>
                <div style={styles.average}>
                    <span style={styles.averageNumber}>
                        {averageRating.toFixed(1)}
                    </span>

                    <div>
                        {renderStars(averageRating)}

                        <p style={styles.reviewCount}>
                            {reviewCount}{" "}
                            {reviewCount === 1 ? "Review" : "Reviews"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ERROR / SUCCESS MESSAGES */}

            {error && (
                <div style={styles.error}>
                    {error}
                </div>
            )}

            {message && (
                <div style={styles.success}>
                    {message}
                </div>
            )}

            {/* WRITE A REVIEW */}

            <div style={styles.formCard}>
                <h3 style={styles.formHeading}>
                    Write a Review
                </h3>

                {!token ? (
                    <p style={styles.info}>
                        Please log in to write a review.
                    </p>
                ) : deliveredOrders.length === 0 ? (
                    <p style={styles.info}>
                        You can review this restaurant after one of your
                        orders has been delivered.
                    </p>
                ) : (
                    <form onSubmit={submitReview}>

                        <label style={styles.label}>
                            Select Delivered Order
                        </label>

                        <select
                            name="orderId"
                            required
                            defaultValue=""
                            style={styles.input}
                        >
                            <option value="" disabled>
                                Choose an order
                            </option>

                            {deliveredOrders.map((order) => {
                                const orderId =
                                    order.order_id ??
                                    order.Order_ID;

                                const orderDate =
                                    order.order_date ??
                                    order.Order_Date;

                                return (
                                    <option
                                        key={orderId}
                                        value={orderId}
                                    >
                                        Order #{orderId}
                                        {orderDate
                                            ? ` - ${formatDate(orderDate)}`
                                            : ""}
                                    </option>
                                );
                            })}
                        </select>

                        <label style={styles.label}>
                            Your Rating
                        </label>

                        <div style={styles.ratingSelector}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    style={{
                                        ...styles.starButton,
                                        color:
                                            star <= rating
                                                ? "#F5A623"
                                                : "#CCCCCC"
                                    }}
                                    aria-label={`Rate ${star} out of 5`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <label style={styles.label}>
                            Your Comments
                        </label>

                        <textarea
                            value={comments}
                            onChange={(event) =>
                                setComments(event.target.value)
                            }
                            placeholder="Share your experience with this restaurant..."
                            maxLength={2000}
                            rows={4}
                            style={styles.textarea}
                        />

                        <p style={styles.characterCount}>
                            {comments.length}/2000 characters
                        </p>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                ...styles.submitButton,
                                opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting
                                ? "Submitting..."
                                : "Submit Review"}
                        </button>

                    </form>
                )}
            </div>

            {/* CUSTOMER REVIEWS */}

            <div style={styles.reviewsSection}>
                <h3 style={styles.reviewsHeading}>
                    Customer Reviews
                </h3>

                {reviews.length === 0 ? (
                    <div style={styles.empty}>
                        <span style={styles.emptyIcon}>💬</span>

                        <p>
                            No reviews yet.
                        </p>

                        <p style={styles.emptySubtext}>
                            Be the first to share your experience!
                        </p>
                    </div>
                ) : (
                    <div style={styles.reviewList}>
                        {reviews.map((review) => {
                            const reviewId =
                                review.review_id ??
                                review.Review_ID;

                            const customerName =
                                review.customer_name ||
                                review.Customer_Name ||
                                "Customer";

                            const reviewRating =
                                Number(
                                    review.rating ??
                                    review.Rating ??
                                    0
                                );

                            const reviewComments =
                                review.comments ??
                                review.Comments ??
                                "";

                            const reviewDate =
                                review.review_date ??
                                review.Review_Date;

                            return (
                                <article
                                    key={reviewId}
                                    style={styles.reviewCard}
                                >
                                    <div style={styles.reviewTop}>
                                        <div>
                                            <h4 style={styles.customerName}>
                                                {customerName}
                                            </h4>

                                            <div>
                                                {renderStars(reviewRating)}
                                            </div>
                                        </div>

                                        <span style={styles.date}>
    {formatReviewDateTime(reviewDate)}
</span>
                                    </div>

                                    {reviewComments && (
                                        <p style={styles.reviewComment}>
                                            {reviewComments}
                                        </p>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

        </section>
    );
}

// =========================================
// COMPONENT STYLES
// =========================================

const styles = {
    container: {
        width: "100%",
        maxWidth: "1100px",
        margin: "45px auto",
        padding: "25px",
        boxSizing: "border-box",
        color: "#292929"
    },

    headingSection: {
        marginBottom: "22px"
    },

    heading: {
        fontSize: "27px",
        fontWeight: "700",
        margin: "0 0 8px"
    },

    subtitle: {
        color: "#777",
        fontSize: "14px",
        margin: 0
    },

    ratingSummary: {
        background: "#FFF8F0",
        border: "1px solid #F4E5D5",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "25px"
    },

    average: {
        display: "flex",
        alignItems: "center",
        gap: "18px"
    },

    averageNumber: {
        fontSize: "42px",
        fontWeight: "700",
        color: "#D71928"
    },

    stars: {
        color: "#F5A623",
        fontSize: "20px",
        letterSpacing: "2px"
    },

    reviewCount: {
        margin: "5px 0 0",
        color: "#777",
        fontSize: "13px"
    },

    formCard: {
        background: "#FFFFFF",
        border: "1px solid #EAEAEA",
        borderRadius: "12px",
        padding: "22px",
        marginBottom: "35px",
        boxShadow: "0 3px 12px rgba(0,0,0,0.04)"
    },

    formHeading: {
        fontSize: "20px",
        margin: "0 0 20px"
    },

    label: {
        display: "block",
        fontSize: "14px",
        fontWeight: "600",
        margin: "16px 0 8px"
    },

    input: {
        width: "100%",
        padding: "12px",
        border: "1px solid #DDDDDD",
        borderRadius: "7px",
        fontSize: "14px",
        background: "#FFFFFF",
        boxSizing: "border-box"
    },

    ratingSelector: {
        display: "flex",
        gap: "5px",
        margin: "8px 0 15px"
    },

    starButton: {
        border: "none",
        background: "transparent",
        fontSize: "32px",
        cursor: "pointer",
        padding: "0 3px"
    },

    textarea: {
        width: "100%",
        padding: "12px",
        border: "1px solid #DDDDDD",
        borderRadius: "7px",
        fontSize: "14px",
        resize: "vertical",
        boxSizing: "border-box",
        fontFamily: "inherit"
    },

    characterCount: {
        textAlign: "right",
        fontSize: "12px",
        color: "#888",
        margin: "5px 0 15px"
    },

    submitButton: {
        background: "#D71928",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "7px",
        padding: "12px 24px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer"
    },

    error: {
        background: "#FFF0F0",
        color: "#C62828",
        padding: "12px 15px",
        borderRadius: "7px",
        marginBottom: "15px",
        fontSize: "14px"
    },

    success: {
        background: "#EAF7EE",
        color: "#247A3D",
        padding: "12px 15px",
        borderRadius: "7px",
        marginBottom: "15px",
        fontSize: "14px"
    },

    info: {
        color: "#777",
        fontSize: "14px",
        lineHeight: "1.6"
    },

    reviewsSection: {
        marginTop: "25px"
    },

    reviewsHeading: {
        fontSize: "21px",
        marginBottom: "18px"
    },

    reviewList: {
        display: "flex",
        flexDirection: "column",
        gap: "14px"
    },

    reviewCard: {
        background: "#FFFFFF",
        border: "1px solid #EAEAEA",
        borderRadius: "10px",
        padding: "18px"
    },

    reviewTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px"
    },

    customerName: {
        fontSize: "15px",
        fontWeight: "700",
        margin: "0 0 6px"
    },

    date: {
        color: "#999",
        fontSize: "12px",
        whiteSpace: "nowrap"
    },

    reviewComment: {
        fontSize: "14px",
        lineHeight: "1.6",
        color: "#555",
        margin: "13px 0 0"
    },

    empty: {
        textAlign: "center",
        padding: "35px 15px",
        background: "#FAFAFA",
        borderRadius: "10px",
        color: "#777"
    },

    emptyIcon: {
        fontSize: "30px"
    },

    emptySubtext: {
        fontSize: "13px",
        color: "#999"
    },

    loading: {
        textAlign: "center",
        padding: "25px",
        color: "#777"
    }
};