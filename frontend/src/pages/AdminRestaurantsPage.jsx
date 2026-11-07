
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import { Link, useNavigate } from "react-router-dom";
import AdminHeader from "../components/AdminHeader";
import AdminToast, { notifyAdmin } from "../components/AdminToast";

import API_URL from "../config";

const emptyRestaurant = {
    restaurant_name: "",
    description: "",
    phone: "",
    address: "",
    city: "",
    status: "Open",
    image_url: ""
};

const emptyMenuItem = {
    item_name: "",
    description: "",
    price: "",
    category: "",
    availability: true,
    image_url: ""
};

export default function AdminRestaurantsPage() {

    const navigate = useNavigate();

    const [restaurants, setRestaurants] = useState([]);
    const [menuItems, setMenuItems] = useState({});

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const [expandedId, setExpandedId] = useState(null);
    const [menuLoading, setMenuLoading] = useState(null);

    const [showRestaurantForm, setShowRestaurantForm] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState(null);
    const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
    const [savingRestaurant, setSavingRestaurant] = useState(false);

    const [showMenuForm, setShowMenuForm] = useState(false);
    const [editingMenuItem, setEditingMenuItem] = useState(null);
    const [activeRestaurantId, setActiveRestaurantId] = useState(null);
    const [menuForm, setMenuForm] = useState(emptyMenuItem);
    const [savingMenu, setSavingMenu] = useState(false);

    const token = localStorage.getItem("token");

    const authHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    
const fetchRestaurants = useCallback(async (showSuccess = false) => {

    setLoading(true);

    try {

        const currentToken = localStorage.getItem("token");

        if (!currentToken) {
            navigate("/", { replace: true });
            return false;
        }

        const response = await fetch(
            `${API_URL}/admin/restaurants`,
            {
                headers: {
                    Authorization: `Bearer ${currentToken}`
                }
            }
        );

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
            throw new Error(
                data.message || "Admin authorization failed."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.message || "Could not load restaurants."
            );
        }

        setRestaurants(data.restaurants || []);

        if (showSuccess) {
            notifyAdmin(
                "Restaurants refreshed successfully.",
                "success"
            );
        }

        return true;

    } catch (err) {

        notifyAdmin(
            err.message || "Could not connect to the backend.",
            "error"
        );

        return false;

    } finally {
        setLoading(false);
    }

}, [navigate]);


    useEffect(() => {
        fetchRestaurants();
    }, [fetchRestaurants]);

    const fetchMenu = async (restaurantId) => {

        setMenuLoading(restaurantId);

        try {

            const response = await fetch(
                `${API_URL}/admin/restaurants/${restaurantId}/menu`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not load menu.");
            }

            setMenuItems(previous => ({
                ...previous,
                [restaurantId]: data.menu_items || []
            }));

        } catch (err) {
              notifyAdmin(err.message, "error");
        } finally {
            setMenuLoading(null);
        }

    };

    const toggleRestaurant = (restaurantId) => {

        if (expandedId === restaurantId) {
            setExpandedId(null);
            return;
        }

        setExpandedId(restaurantId);

        if (!Object.prototype.hasOwnProperty.call(menuItems, restaurantId)) {
            fetchMenu(restaurantId);
        }

    };

    const filteredRestaurants = useMemo(() => {

        const term = search.trim().toLowerCase();

        return restaurants.filter(restaurant =>
            String(restaurant.restaurant_id).includes(term) ||
            (restaurant.restaurant_name || "").toLowerCase().includes(term)
        );

    }, [restaurants, search]);

    const formatCurrency = amount =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(amount || 0));

    const totalMenuItems = restaurants.reduce(
        (sum, restaurant) =>
            sum + Number(restaurant.total_menu_items || 0),
        0
    );

    // =================================================
    // RESTAURANT FORM
    // =================================================

    const openAddRestaurant = () => {
        setEditingRestaurant(null);
        setRestaurantForm({ ...emptyRestaurant });
        setShowRestaurantForm(true);
    };

    const openEditRestaurant = (restaurant) => {

        setEditingRestaurant(restaurant);

        setRestaurantForm({
            restaurant_name: restaurant.restaurant_name || "",
            description: restaurant.description || "",
            phone: restaurant.phone || "",
            address: restaurant.address || "",
            city: restaurant.city || "",
            status: restaurant.status || "Open",
            image_url: restaurant.image_url || restaurant.Image_URL || ""
        });

        setShowRestaurantForm(true)
    };

    const saveRestaurant = async (event) => {

        event.preventDefault();

        setSavingRestaurant(true);

        try {

            const url = editingRestaurant
                ? `${API_URL}/admin/restaurants/${editingRestaurant.restaurant_id}`
                : `${API_URL}/admin/restaurants`;

            const response = await fetch(url, {
                method: editingRestaurant ? "PUT" : "POST",
                headers: authHeaders,
                body: JSON.stringify(restaurantForm)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not save restaurant.");
            }

            setShowRestaurantForm(false);

            notifyAdmin(
                editingRestaurant
                    ? "Restaurant updated successfully."
                    : "Restaurant added successfully.",
                "success"
            );

            await fetchRestaurants();

        
            } catch (err) {
    notifyAdmin(err.message, "error");
} finally {
    setSavingRestaurant(false);
}

    };

    const deleteRestaurant = async (restaurant) => {

        const confirmed = window.confirm(
            `Delete "${restaurant.restaurant_name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {

            const response = await fetch(
                `${API_URL}/admin/restaurants/${restaurant.restaurant_id}`,
                {
                    method: "DELETE",
                    headers: authHeaders
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not delete restaurant.");
            }

            notifyAdmin(data.message || "Restaurant deleted successfully.", "success");
            setMenuItems(previous => {
                const updated = { ...previous };
                delete updated[restaurant.restaurant_id];
                return updated;
            });

            await fetchRestaurants();

        } catch (err) {
            notifyAdmin(err.message || "Could not delete restaurant.", "error");
        }

    };

    // =================================================
    // MENU FORM
    // =================================================

    const openAddMenu = (restaurantId) => {

        setActiveRestaurantId(restaurantId);
        setEditingMenuItem(null);
        setMenuForm({ ...emptyMenuItem });
        setShowMenuForm(true);
    };

    const openEditMenu = (restaurantId, item) => {

        setActiveRestaurantId(restaurantId);
        setEditingMenuItem(item);

        setMenuForm({
            item_name: item.item_name || "",
            description: item.description || "",
            price: String(item.price ?? ""),
            category: item.category || "",
            availability: Boolean(item.availability),
            image_url: item.image_url || item.Image_URL || ""
        });

        setShowMenuForm(true);
    };

    const saveMenuItem = async (event) => {

        event.preventDefault();

        setSavingMenu(true);
        try {

            const url = editingMenuItem
                ? `${API_URL}/admin/menu/${editingMenuItem.menu_id}`
                : `${API_URL}/admin/restaurants/${activeRestaurantId}/menu`;

            const response = await fetch(url, {
                method: editingMenuItem ? "PUT" : "POST",
                headers: authHeaders,
                body: JSON.stringify({
                    ...menuForm,
                    price: Number(menuForm.price)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not save menu item.");
            }

            setShowMenuForm(false);

            notifyAdmin(
                editingMenuItem
                    ? "Menu item updated successfully."
                    : "Menu item added successfully.",
                "success"
            );

            await fetchMenu(activeRestaurantId);
            await fetchRestaurants();

        } catch (err) {
            notifyAdmin(err.message || "Could not save menu item.", "error");
        } finally {
            setSavingMenu(false);
        }

    };

    const deleteMenuItem = async (restaurantId, item) => {

        const confirmed = window.confirm(
            `Delete "${item.item_name}" from this menu?`
        );

        if (!confirmed) return;

        try {

            const response = await fetch(
                `${API_URL}/admin/menu/${item.menu_id}`,
                {
                    method: "DELETE",
                    headers: authHeaders
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not delete menu item.");
            }

            notifyAdmin(data.message || "Menu item deleted successfully.", "success");

            await fetchMenu(restaurantId);
            await fetchRestaurants();

        } catch (err) {
            notifyAdmin(err.message || "Could not delete menu item.", "error");
        }

    };

    const toggleAvailability = async (restaurantId, item) => {

        try {

            const response = await fetch(
                `${API_URL}/admin/menu/${item.menu_id}`,
                {
                    method: "PUT",
                    headers: authHeaders,
                    body: JSON.stringify({
                        item_name: item.item_name,
                        description: item.description,
                        price: item.price,
                        category: item.category,
                        availability: !item.availability
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not update availability.");
            }

            await fetchMenu(restaurantId);

            notifyAdmin(
                `${item.item_name} is now ${
                    item.availability ? "unavailable" : "available"
                }.`,
                "success"
            );

        } catch (err) {
            notifyAdmin(err.message || "Could not update availability.", "error");
        }

    };

    return (
        <div className="admin-page">
            <AdminToast />

            {/* SIDEBAR */}

            <aside className="admin-sidebar">

                <h2 className="admin-logo">
                    Crave<span>Lane</span>
                </h2>

                <p className="admin-label">ADMIN PANEL</p>

                <nav className="admin-navigation">

                    <Link className="admin-nav-link" to="/admin">
                        <span>▦</span>
                        Dashboard
                    </Link>

                    <Link className="admin-nav-link" to="/admin/orders">
                        <span>📦</span>
                        Orders
                    </Link>

                    <Link className="admin-nav-link" to="/admin/customers">
                        <span>👥</span>
                        Customers
                    </Link>

                    <Link
                        className="admin-nav-link active"
                        to="/admin/restaurants"
                    >
                        <span>🍽️</span>
                        Restaurants
                    </Link>

                </nav>

            </aside>

            {/* MAIN CONTENT */}

            <main className="admin-main">

                <AdminHeader
                    title="Restaurant Management"
                    subtitle="Manage restaurants and their menus."
                />

                <section className="admin-section-heading">

                    <div>
                        <h2>All Restaurants</h2>
                        <p>
                            {restaurants.length} restaurant(s) in your database
                        </p>
                    </div>

                    <div className="admin-restaurant-header-actions">

                        <button
                            className="admin-refresh"
                            type="button"
                            onClick={() => fetchRestaurants(true)}
                            disabled={loading}
                        >
                            {loading ? "Refreshing..." : "↻ Refresh"}
                        </button>

                        <button
                            className="admin-add-button"
                            type="button"
                            onClick={openAddRestaurant}
                        >
                            + Add Restaurant
                        </button>

                    </div>

                </section>


                {/* SUMMARY */}

                <section className="admin-restaurant-summary">

                    <div className="admin-restaurant-stat">
                        <span>🍽️</span>
                        <div>
                            <small>Total Restaurants</small>
                            <strong>{restaurants.length}</strong>
                        </div>
                    </div>

                    <div className="admin-restaurant-stat">
                        <span>🍴</span>
                        <div>
                            <small>Total Menu Items</small>
                            <strong>{totalMenuItems}</strong>
                        </div>
                    </div>

                </section>

                {/* SEARCH */}

                <section className="admin-restaurants-panel">

                    <div className="admin-restaurant-search">
                        <input
                            type="search"
                            placeholder="Search restaurant by name or ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {loading ? (

                        <div className="admin-restaurants-empty">
                            Loading restaurants...
                        </div>

                    ) : filteredRestaurants.length === 0 ? (

                        <div className="admin-restaurants-empty">
                            <span>🍽️</span>
                            <h3>No restaurants found</h3>
                            <p>Try another search or add a restaurant.</p>
                        </div>

                    ) : (

                        <div className="admin-restaurant-list">

                            {filteredRestaurants.map(restaurant => (

                                <article
                                    className="admin-restaurant-card"
                                    key={restaurant.restaurant_id}
                                >

                                    <div className="admin-restaurant-top">

                                        <div className="admin-restaurant-identity">

                                            <span
                                                className="admin-restaurant-icon"
                                                style={{
                                                    width: "66px",
                                                    height: "66px",
                                                    minWidth: "66px",
                                                    borderRadius: "14px",
                                                    overflow: "hidden",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    background: "#fff0e8"
                                                }}
                                            >
                                                {(
                                                    restaurant.image_url ||
                                                    restaurant.Image_URL
                                                ) ? (
                                                    <>
                                                        <img
                                                            src={restaurant.image_url || restaurant.Image_URL}
                                                            alt={`${restaurant.restaurant_name} restaurant`}
                                                            onError={(event) => {
                                                                event.currentTarget.style.display = "none";
                                                                const fallback = event.currentTarget.nextElementSibling;
                                                                if (fallback) fallback.style.display = "flex";
                                                            }}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                                display: "block"
                                                            }}
                                                        />
                                                        <span
                                                            aria-hidden="true"
                                                            style={{
                                                                display: "none",
                                                                width: "100%",
                                                                height: "100%",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "21px",
                                                                fontWeight: 700,
                                                                color: "#b83227"
                                                            }}
                                                        >
                                                            {(restaurant.restaurant_name || "R").trim().charAt(0).toUpperCase()}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span
                                                        aria-hidden="true"
                                                        style={{
                                                            display: "flex",
                                                            width: "100%",
                                                            height: "100%",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "21px",
                                                            fontWeight: 700,
                                                            color: "#b83227"
                                                        }}
                                                    >
                                                        {(restaurant.restaurant_name || "R").trim().charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </span>

                                            <div>
                                                <h3>{restaurant.restaurant_name}</h3>
                                                <small>
                                                    Restaurant ID: {restaurant.restaurant_id}
                                                </small>
                                            </div>

                                        </div>

                                        <span className="admin-menu-count">
                                            {restaurant.total_menu_items} menu items
                                        </span>

                                    </div>

                                    <div className="admin-restaurant-actions">

                                        <button
                                            type="button"
                                            className="admin-view-button"
                                            onClick={() => toggleRestaurant(restaurant.restaurant_id)}
                                        >
                                            {expandedId === restaurant.restaurant_id
                                                ? "Hide Menu"
                                                : "View Menu"}
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-edit-button"
                                            onClick={() => openEditRestaurant(restaurant)}
                                        >
                                            ✎ Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-delete-button"
                                            onClick={() => deleteRestaurant(restaurant)}
                                        >
                                            Delete
                                        </button>

                                    </div>

                                    {/* EXPANDED MENU */}

                                    {expandedId === restaurant.restaurant_id && (

                                        <div className="admin-restaurant-menu">

                                            <div className="admin-menu-heading">
                                                <div>
                                                    <h4>Menu Items</h4>
                                                    <p>Manage this restaurant's dishes.</p>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="admin-add-button"
                                                    onClick={() => openAddMenu(restaurant.restaurant_id)}
                                                >
                                                    + Add Menu Item
                                                </button>
                                            </div>

                                            {menuLoading === restaurant.restaurant_id ? (

                                                <p>Loading menu...</p>

                                            ) : menuItems[restaurant.restaurant_id]?.length ? (

                                                <div className="admin-menu-table-wrapper">

                                                    <table className="admin-menu-table">

                                                        <thead>
                                                            <tr>
                                                                <th>Item</th>
                                                                <th>Category</th>
                                                                <th>Price</th>
                                                                <th>Availability</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>

                                                            {menuItems[restaurant.restaurant_id].map(item => (

                                                                <tr key={item.menu_id}>

                                                                    <td>
                                                                        <strong>{item.item_name}</strong>
                                                                        <small>{item.description}</small>
                                                                    </td>

                                                                    <td>{item.category || "—"}</td>

                                                                    <td>{formatCurrency(item.price)}</td>

                                                                    <td>
                                                                        <button
                                                                            type="button"
                                                                            className={
                                                                                item.availability
                                                                                    ? "admin-available"
                                                                                    : "admin-unavailable"
                                                                            }
                                                                            onClick={() => toggleAvailability(restaurant.restaurant_id, item)}
                                                                        >
                                                                            {item.availability
                                                                                ? "Available"
                                                                                : "Unavailable"}
                                                                        </button>
                                                                    </td>

                                                                    <td>
                                                                        <div className="admin-menu-actions">
                                                                            <button
                                                                                type="button"
                                                                                className="admin-edit-button"
                                                                                onClick={() => openEditMenu(restaurant.restaurant_id, item)}
                                                                            >
                                                                                Edit
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                className="admin-delete-button"
                                                                                onClick={() => deleteMenuItem(restaurant.restaurant_id, item)}
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </td>

                                                                </tr>

                                                            ))}

                                                        </tbody>

                                                    </table>

                                                </div>

                                            ) : (

                                                <div className="admin-restaurants-empty">
                                                    No menu items yet. Add your first dish!
                                                </div>

                                            )}

                                        </div>

                                    )}

                                </article>

                            ))}

                        </div>

                    )}

                </section>

                <footer className="admin-footer">
                    © {new Date().getFullYear()} CraveLane Admin Panel
                </footer>

            </main>

            {/* RESTAURANT FORM MODAL */}

            {showRestaurantForm && (

                <div className="admin-modal-backdrop">

                    <form
                        className="admin-management-modal"
                        onSubmit={saveRestaurant}
                    >

                        <div className="admin-modal-heading">
                            <div>
                                <h2>
                                    {editingRestaurant ? "Edit Restaurant" : "Add Restaurant"}
                                </h2>
                                <p>Enter the restaurant information.</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowRestaurantForm(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <label>Restaurant Name *</label>
                        <input
                            required
                            maxLength="100"
                            value={restaurantForm.restaurant_name}
                            onChange={e => setRestaurantForm({
                                ...restaurantForm,
                                restaurant_name: e.target.value
                            })}
                            placeholder="Enter restaurant name"
                        />

                        <label>Description</label>
                        <textarea
                            value={restaurantForm.description}
                            onChange={e => setRestaurantForm({
                                ...restaurantForm,
                                description: e.target.value
                            })}
                            placeholder="Describe the restaurant"
                        />

                        <label>Phone</label>
                        <input
                            maxLength="15"
                            value={restaurantForm.phone}
                            onChange={e => setRestaurantForm({
                                ...restaurantForm,
                                phone: e.target.value
                            })}
                            placeholder="Phone number"
                        />

                        <label>Address</label>
                        <textarea
                            value={restaurantForm.address}
                            onChange={e => setRestaurantForm({
                                ...restaurantForm,
                                address: e.target.value
                            })}
                            placeholder="Restaurant address"
                        />

                        <label>City</label>
                        <input
                            maxLength="50"
                            value={restaurantForm.city}
                            onChange={e => setRestaurantForm({
                                ...restaurantForm,
                                city: e.target.value
                            })}
                            placeholder="City"
                        />

                        <label>Restaurant Image URL</label>
                        <input
                            type="url"
                            maxLength="500"
                            value={restaurantForm.image_url}
                            onChange={e => setRestaurantForm({
                                ...restaurantForm,
                                image_url: e.target.value
                            })}
                            placeholder="https://example.com/restaurant-photo.jpg"
                        />
                        <small style={{ color: "#806f67", display: "block", marginTop: "-6px" }}>
                            Paste a direct HTTPS image link. Leave blank to use the default image.
                        </small>
                        {restaurantForm.image_url.trim() && (
                            <img
                                src={restaurantForm.image_url}
                                alt="Restaurant preview"
                                onError={e => { e.currentTarget.style.display = "none"; }}
                                onLoad={e => { e.currentTarget.style.display = "block"; }}
                                style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "10px", marginBottom: "12px" }}
                            />
                        )}

                        <label>Status</label>
                        <select
                            value={restaurantForm.status}
                            onChange={e => setRestaurantForm({
                                ...restaurantForm,
                                status: e.target.value
                            })}
                        >
                            <option value="Open">Open</option>
                            <option value="Closed">Closed</option>
                        </select>

                        <div className="admin-modal-actions">
                            <button
                                type="button"
                                className="admin-modal-cancel"
                                onClick={() => setShowRestaurantForm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="admin-add-button"
                                disabled={savingRestaurant}
                            >
                                {savingRestaurant ? "Saving..." : "Save Restaurant"}
                            </button>
                        </div>

                    </form>

                </div>

            )}

            {/* MENU FORM MODAL */}

            {showMenuForm && (

                <div className="admin-modal-backdrop">

                    <form
                        className="admin-management-modal"
                        onSubmit={saveMenuItem}
                    >

                        <div className="admin-modal-heading">
                            <div>
                                <h2>
                                    {editingMenuItem ? "Edit Menu Item" : "Add Menu Item"}
                                </h2>
                                <p>Enter the food item details.</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowMenuForm(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <label>Item Name *</label>
                        <input
                            required
                            maxLength="100"
                            value={menuForm.item_name}
                            onChange={e => setMenuForm({
                                ...menuForm,
                                item_name: e.target.value
                            })}
                            placeholder="Example: Paneer Butter Masala"
                        />

                        <label>Description</label>
                        <textarea
                            value={menuForm.description}
                            onChange={e => setMenuForm({
                                ...menuForm,
                                description: e.target.value
                            })}
                            placeholder="Describe the dish"
                        />

                        <label>Price (₹) *</label>
                        <input
                            type="number"
                            required
                            min="0.01"
                            max="99999999.99"
                            step="0.01"
                            value={menuForm.price}
                            onChange={e => setMenuForm({
                                ...menuForm,
                                price: e.target.value
                            })}
                            placeholder="Enter price"
                        />

                        <label>Category</label>
                        <input
                            maxLength="50"
                            value={menuForm.category}
                            onChange={e => setMenuForm({
                                ...menuForm,
                                category: e.target.value
                            })}
                            placeholder="Example: Main Course"
                        />

                        <label>Food Image URL</label>
                        <input
                            type="url"
                            maxLength="500"
                            value={menuForm.image_url}
                            onChange={e => setMenuForm({
                                ...menuForm,
                                image_url: e.target.value
                            })}
                            placeholder="https://example.com/food-photo.jpg"
                        />
                        <small style={{ color: "#806f67", display: "block", marginTop: "-6px" }}>
                            Paste a direct HTTPS image link. Leave blank to use the default image.
                        </small>
                        {menuForm.image_url.trim() && (
                            <img
                                src={menuForm.image_url}
                                alt="Food item preview"
                                onError={e => { e.currentTarget.style.display = "none"; }}
                                onLoad={e => { e.currentTarget.style.display = "block"; }}
                                style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "10px", marginBottom: "12px" }}
                            />
                        )}

                        <label className="admin-availability-checkbox">
                            <input
                                type="checkbox"
                                checked={menuForm.availability}
                                onChange={e => setMenuForm({
                                    ...menuForm,
                                    availability: e.target.checked
                                })}
                            />
                            Available for ordering
                        </label>

                        <div className="admin-modal-actions">
                            <button
                                type="button"
                                className="admin-modal-cancel"
                                onClick={() => setShowMenuForm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="admin-add-button"
                                disabled={savingMenu}
                            >
                                {savingMenu ? "Saving..." : "Save Menu Item"}
                            </button>
                        </div>

                    </form>

                </div>

            )}

        </div>
    );
}
