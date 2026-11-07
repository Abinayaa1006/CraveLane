import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function AboutPage() {
    const navigate = useNavigate();

    return (
        <div style={styles.page}>
            {/* Shared Navbar — no separate grey navigation buttons */}
            <Navbar />

            <main>
                {/* Hero */}
                <section style={styles.hero}>
                    <div style={styles.heroContent}>
                        <p style={styles.eyebrow}>
                            ✦ OUR STORY
                        </p>

                        <h1 style={styles.heading}>
                            Good Food.
                            <br />
                            <span style={styles.redText}>
                                Good Mood.
                            </span>
                        </h1>

                        <p style={styles.description}>
                            CraveLane brings your favourite restaurants
                            closer to you. Discover delicious meals, save
                            your favourites, and enjoy a simpler way to
                            explore food online.
                        </p>

                        <button
                            type="button"
                            style={styles.primaryButton}
                            onClick={() => navigate("/restaurants")}
                        >
                            Explore Restaurants →
                        </button>
                    </div>

                    <div style={styles.heroVisual}>
                        <div style={styles.foodCircle}>
                            <span style={styles.foodEmoji}>🍽️</span>
                        </div>
                        <div style={styles.yellowCircle} />
                        <div style={styles.floatingEmoji}>🍕</div>
                        <div style={styles.floatingEmojiTwo}>🥗</div>
                    </div>
                </section>

                {/* Mission */}
                <section style={styles.mission}>
                    <p style={styles.eyebrow}>WHY CRAVELANE?</p>

                    <h2 style={styles.sectionTitle}>
                        Making every food choice a little easier.
                    </h2>

                    <p style={styles.missionText}>
                        We designed CraveLane as an easy-to-use online food
                        ordering platform where customers can discover
                        restaurants, browse menus, and organise their
                        favourite food choices in one place.
                    </p>
                </section>

                {/* Features */}
                <section style={styles.featuresSection}>
                    <div style={styles.sectionHeading}>
                        <p style={styles.eyebrow}>MADE FOR FOOD LOVERS</p>
                        <h2 style={styles.sectionTitle}>
                            Everything starts with a craving.
                        </h2>
                    </div>

                    <div style={styles.featureGrid}>
                        {[
                            {
                                emoji: "🍴",
                                title: "Discover",
                                description:
                                    "Explore restaurants and find dishes that match your mood."
                            },
                            {
                                emoji: "♥",
                                title: "Save Favourites",
                                description:
                                    "Keep your favourite restaurants together in your wishlist.",
                                red: true
                            },
                            {
                                emoji: "🛒",
                                title: "Order with Ease",
                                description:
                                    "Browse menus, choose food, and review your selections."
                            }
                        ].map((feature) => (
                            <article
                                key={feature.title}
                                style={styles.featureCard}
                            >
                                <div
                                    style={{
                                        ...styles.featureIcon,
                                        color: feature.red
                                            ? "#d71928"
                                            : "#292929",
                                        background: feature.red
                                            ? "#fff0f1"
                                            : "#fff6dc"
                                    }}
                                >
                                    {feature.emoji}
                                </div>

                                <h3 style={styles.featureTitle}>
                                    {feature.title}
                                </h3>

                                <p style={styles.featureDescription}>
                                    {feature.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* How it works */}
                <section style={styles.howSection}>
                    <div>
                        <p style={styles.eyebrow}>YOUR FOOD JOURNEY</p>
                        <h2 style={styles.sectionTitle}>
                            Three simple steps.
                        </h2>
                    </div>

                    <div style={styles.stepsGrid}>
                        {[
                            ["01", "Explore", "Find a restaurant you love."],
                            ["02", "Choose", "Browse the menu and select your food."],
                            ["03", "Enjoy", "Continue to checkout and follow your order."]
                        ].map(([number, title, description]) => (
                            <article key={number} style={styles.stepCard}>
                                <span style={styles.stepNumber}>
                                    {number}
                                </span>
                                <h3>{title}</h3>
                                <p>{description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Call to action */}
                <section style={styles.cta}>
                    <div>
                        <h2 style={styles.ctaHeading}>
                            Ready to find your next favourite?
                        </h2>
                        <p style={styles.ctaText}>
                            Your next delicious discovery is waiting.
                        </p>
                    </div>

                    <button
                        type="button"
                        style={styles.ctaButton}
                        onClick={() => navigate("/restaurants")}
                    >
                        Browse Restaurants →
                    </button>
                </section>
            </main>

            <footer style={styles.footer}>
                <strong style={styles.footerBrand}>
                    ✦ CraveLane
                </strong>
                <span>Made for food lovers.</span>
                <button
                    type="button"
                    style={styles.footerLink}
                    onClick={() => navigate("/home")}
                >
                    Back to Home ↑
                </button>
            </footer>
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

    hero: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
        alignItems: "center",
        gap: "40px",
        padding: "65px 7%",
        background: "#fffaf3",
        overflow: "hidden"
    },

    heroContent: {
        maxWidth: "650px"
    },

    eyebrow: {
        color: "#d71928",
        fontSize: "12px",
        fontWeight: "bold",
        letterSpacing: "2px",
        lineHeight: "1.7"
    },

    heading: {
        fontSize: "clamp(43px, 6vw, 72px)",
        lineHeight: "1.08",
        letterSpacing: "-2px",
        margin: "18px 0"
    },

    redText: {
        color: "#d71928"
    },

    description: {
        color: "#6e6e6e",
        fontSize: "17px",
        lineHeight: "1.9",
        maxWidth: "580px",
        marginBottom: "28px"
    },

    primaryButton: {
        border: "none",
        borderRadius: "10px",
        padding: "15px 22px",
        background: "#d71928",
        color: "white",
        fontWeight: "bold",
        fontSize: "15px",
        cursor: "pointer"
    },

    heroVisual: {
        minHeight: "320px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
    },

    yellowCircle: {
        position: "absolute",
        width: "270px",
        height: "270px",
        borderRadius: "50%",
        background: "#ffdf70",
        right: "5%",
        top: "12%",
        zIndex: 0
    },

    foodCircle: {
        position: "relative",
        zIndex: 1,
        width: "260px",
        height: "260px",
        maxWidth: "75vw",
        maxHeight: "75vw",
        borderRadius: "50%",
        background: "white",
        boxShadow: "0 15px 45px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },

    foodEmoji: {
        fontSize: "clamp(90px, 13vw, 145px)"
    },

    floatingEmoji: {
        position: "absolute",
        zIndex: 2,
        left: "8%",
        top: "12%",
        fontSize: "43px",
        background: "white",
        padding: "13px",
        borderRadius: "17px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.08)"
    },

    floatingEmojiTwo: {
        position: "absolute",
        zIndex: 2,
        right: "3%",
        bottom: "8%",
        fontSize: "38px",
        background: "white",
        padding: "13px",
        borderRadius: "17px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.08)"
    },

    mission: {
        maxWidth: "850px",
        margin: "0 auto",
        padding: "65px 7%",
        textAlign: "center"
    },

    sectionHeading: {
        textAlign: "center",
        marginBottom: "30px"
    },

    sectionTitle: {
        fontSize: "clamp(27px, 4vw, 38px)",
        lineHeight: "1.35",
        margin: "10px 0"
    },

    missionText: {
        color: "#707070",
        fontSize: "17px",
        lineHeight: "1.9"
    },

    featuresSection: {
        padding: "55px 7% 75px",
        background: "#fafafa"
    },

    featureGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "22px",
        marginTop: "30px"
    },

    featureCard: {
        padding: "27px",
        background: "white",
        border: "1px solid #eeeeee",
        borderRadius: "16px",
        boxShadow: "0 5px 20px rgba(0,0,0,0.035)"
    },

    featureIcon: {
        width: "60px",
        height: "60px",
        borderRadius: "17px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "30px"
    },

    featureTitle: {
        fontSize: "20px",
        margin: "20px 0 10px"
    },

    featureDescription: {
        color: "#707070",
        lineHeight: "1.8",
        fontSize: "14px"
    },

    howSection: {
        padding: "65px 7%"
    },

    stepsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "22px",
        marginTop: "28px"
    },

    stepCard: {
        padding: "24px",
        border: "1px solid #eeeeee",
        borderRadius: "15px",
        background: "white"
    },

    stepNumber: {
        color: "#d71928",
        fontSize: "26px",
        fontWeight: "bold"
    },

    cta: {
        margin: "15px 7% 65px",
        padding: "32px",
        borderRadius: "18px",
        background: "#fff2c9",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "25px",
        flexWrap: "wrap"
    },

    ctaHeading: {
        fontSize: "clamp(23px, 3vw, 32px)",
        margin: "0 0 10px"
    },

    ctaText: {
        color: "#6e6251",
        lineHeight: "1.7"
    },

    ctaButton: {
        padding: "15px 21px",
        background: "#d71928",
        color: "white",
        border: "none",
        borderRadius: "10px",
        fontWeight: "bold",
        cursor: "pointer"
    },

    footer: {
        padding: "25px 6%",
        borderTop: "1px solid #eeeeee",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        color: "#707070",
        fontSize: "14px"
    },

    footerBrand: {
        color: "#d71928",
        fontSize: "22px"
    },

    footerLink: {
        border: "none",
        background: "transparent",
        color: "#d71928",
        fontWeight: "bold",
        cursor: "pointer"
    }
};
