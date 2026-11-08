import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const foodImages = {
    hero: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=85",
    indian: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=700&q=85",
    italian: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=700&q=85",
    chinese: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=700&q=85",
    healthy: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=85",
    biryani: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=85",
    pizza: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=900&q=85",
};

const categories = [
    { name: "Indian", description: "Curries, thalis & regional favourites", image: foodImages.indian },
    { name: "Italian", description: "Pizza, pasta & more", image: foodImages.italian },
    { name: "Chinese", description: "Noodles, rice & Asian favourites", image: foodImages.chinese },
    { name: "Healthy", description: "Fresh bowls & wholesome meals", image: foodImages.healthy }
];

const highlights = [
    {
        title: "Biryani favourites",
        subtitle: "Aromatic, comforting and full of flavour",
        image: foodImages.biryani,
        searchTerm: "biryani"
    },
    {
        title: "Pizza nights",
        subtitle: "Cheesy slices for every craving",
        image: foodImages.pizza,
        searchTerm: "pizza"
    }
];

export default function LandingPage() {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState("");

    // Keep search and category navigation separate so a search is never reset by "All".
    const goToRestaurants = (category = "", query = searchText) => {
        if (category) {
            navigate("/restaurants", { state: { category, search: "" } });
            return;
        }

        navigate("/restaurants", { state: { search: String(query || "").trim() } });
    };

    const handleSearch = (event) => {
        event.preventDefault();
        goToRestaurants("", searchText);
    };

    return (
        <div className="cl-home">
            <Navbar />
            <main>
                <section className="cl-hero">
                    <div className="cl-hero-copy">
                        <span className="cl-kicker">GOOD FOOD, DELIVERED</span>
                        <h1>Find your next<br /><span>favourite meal.</span></h1>
                        <p>Discover great food from restaurants around you. Browse the menu, place your order, and enjoy every bite.</p>

                        <form className="cl-search" role="search" onSubmit={handleSearch}>
                            <span className="cl-search-icon" aria-hidden="true">⌕</span>
                            <input
                                type="search"
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Search restaurants, dishes, cuisines or locations..."
                                aria-label="Search restaurants, dishes, cuisines or locations"
                            />
                            <button type="submit">Search</button>
                        </form>

                        <div className="cl-hero-meta">
                            <span><b>01</b> Browse restaurants</span>
                            <span><b>02</b> Choose your meal</span>
                            <span><b>03</b> Order with ease</span>
                        </div>
                    </div>

                    <div className="cl-hero-photo-wrap">
                        <img className="cl-hero-photo" src={foodImages.hero} alt="A colourful fresh meal bowl" />
                        <div className="cl-photo-caption">
                            <span className="cl-caption-dot" />
                            <div>
                                <strong>Made for your cravings</strong>
                                <small>Good food is just a few clicks away</small>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="cl-section cl-category-section">
                    <div className="cl-section-heading">
                        <div>
                            <span className="cl-kicker">EXPLORE THE MENU</span>
                            <h2>What are you craving?</h2>
                            <p>Find something delicious, whatever you're in the mood for.</p>
                        </div>
                        <button className="cl-link-button" type="button" onClick={() => goToRestaurants("", "")}>
                            View all restaurants <span aria-hidden="true">→</span>
                        </button>
                    </div>

                    <div className="cl-category-grid">
                        {categories.map((category) => (
                            <button
                                className="cl-category-card"
                                key={category.name}
                                type="button"
                                onClick={() => goToRestaurants(category.name, "")}
                            >
                                <div className="cl-category-image-wrap">
                                    <img src={category.image} alt={`${category.name} cuisine`} loading="lazy" />
                                </div>
                                <div className="cl-category-copy">
                                    <h3>{category.name}</h3>
                                    <p>{category.description}</p>
                                </div>
                                <span className="cl-card-arrow" aria-hidden="true">↗</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="cl-highlights">
                    <div className="cl-section-heading">
                        <div>
                            <span className="cl-kicker">A LITTLE INSPIRATION</span>
                            <h2>Popular cravings</h2>
                            <p>Some delicious ideas for your next order.</p>
                        </div>
                    </div>
                    <div className="cl-highlight-grid">
                        {highlights.map((item) => (
                            <button
                                className="cl-highlight-card"
                                key={item.title}
                                type="button"
                                onClick={() => goToRestaurants("", item.searchTerm)}
                            >
                                <img src={item.image} alt={item.title} loading="lazy" />
                                <span className="cl-highlight-shade" />
                                <span className="cl-highlight-text">
                                    <strong>{item.title}</strong>
                                    <small>{item.subtitle}</small>
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="cl-how">
                    <div className="cl-how-heading">
                        <span className="cl-kicker">HOW CRAVELANE WORKS</span>
                        <h2>Your meal, made simple.</h2>
                    </div>
                    <div className="cl-how-grid">
                        <article className="cl-how-card">
                            <span>01</span>
                            <h3>Discover</h3>
                            <p>Explore restaurants and browse menus to find exactly what you want.</p>
                        </article>
                        <article className="cl-how-card">
                            <span>02</span>
                            <h3>Order</h3>
                            <p>Add your favourites to the cart and complete checkout securely.</p>
                        </article>
                        <article className="cl-how-card">
                            <span>03</span>
                            <h3>Enjoy</h3>
                            <p>Follow your order and get ready to enjoy your meal.</p>
                        </article>
                    </div>
                </section>

                <section className="cl-bottom-cta">
                    <div>
                        <span className="cl-kicker">READY WHEN YOU ARE</span>
                        <h2>Your next delicious meal is waiting.</h2>
                        <p>Explore the restaurants and find something you'll love.</p>
                    </div>
                    <button type="button" onClick={() => goToRestaurants("", "")}>
                        Explore restaurants <span aria-hidden="true">→</span>
                    </button>
                </section>
            </main>

            <footer className="cl-footer">
                <div className="cl-footer-brand">
                    <strong>CraveLane<span>.</span></strong>
                    <p>Good food. Great moments.</p>
                </div>
                <button type="button" onClick={() => navigate("/about")}>About CraveLane</button>
                <small>© {new Date().getFullYear()} CraveLane. All rights reserved.</small>
            </footer>
        </div>
    );
}
