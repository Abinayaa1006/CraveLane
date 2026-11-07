
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import { Link, useNavigate } from "react-router-dom";
import AdminHeader from "../components/AdminHeader";
import AdminToast, {
    notifyAdmin
} from "../components/AdminToast";

import API_URL from "../config";

const ORDER_STATUSES = [
    "Pending",
    "Preparing",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
];

export default function AdminOrdersPage() {

    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [updatingOrder, setUpdatingOrder] = useState(null);


    // =================================================
    // FETCH ORDERS
    // =================================================

    const fetchOrders = useCallback(async (showSuccess = false) => {

        setLoading(true);

        try {

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/", { replace: true });
                return false;
            }

            const response = await fetch(
                `${API_URL}/admin/orders`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                throw new Error(
                    data.message ||
                    "Admin authorization failed. Please log in again."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not load orders."
                );
            }

            setOrders(
                Array.isArray(data.orders)
                    ? data.orders
                    : []
            );

            if (showSuccess) {
                notifyAdmin(
                    "Orders refreshed successfully.",
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


    // =================================================
    // INITIAL LOAD
    // =================================================

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);


    // =================================================
    // SEARCH AND FILTER
    // =================================================

    const filteredOrders = useMemo(() => {

        const searchText = search.trim().toLowerCase();

        return orders.filter((order) => {

            const matchesSearch =
                !searchText ||
                String(order.order_id).includes(searchText) ||
                (order.customer_name || "").toLowerCase().includes(searchText) ||
                (order.customer_email || "").toLowerCase().includes(searchText);

            const matchesStatus =
                statusFilter === "All" ||
                order.order_status === statusFilter;

            return matchesSearch && matchesStatus;

        });

    }, [orders, search, statusFilter]);


    // =================================================
    // CURRENCY FORMAT
    // =================================================

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(amount || 0));


    // =================================================
    // UPDATE ORDER STATUS
    // =================================================

    const updateStatus = async (orderId, newStatus) => {

        const currentOrder = orders.find(
            (order) =>
                Number(order.order_id) === Number(orderId)
        );

        if (
            !currentOrder ||
            currentOrder.order_status === newStatus
        ) {
            return;
        }

        const confirmed = window.confirm(
            `Change order #${orderId} status to "${newStatus}"?`
        );

        if (!confirmed) {
            return;
        }

        setUpdatingOrder(orderId);

        try {

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/", { replace: true });
                return;
            }

            const response = await fetch(
                `${API_URL}/orders/${orderId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        order_status: newStatus
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not update order status."
                );
            }

            // Update the order immediately in the UI.

            setOrders((previous) =>
                previous.map((order) =>
                    Number(order.order_id) === Number(orderId)
                        ? {
                            ...order,
                            order_status: newStatus
                        }
                        : order
                )
            );

            // Show success popup.

            notifyAdmin(
                `Order #${orderId} status updated to ${newStatus}.`,
                "success"
            );

        } catch (err) {

            notifyAdmin(
                err.message || "Could not update order.",
                "error"
            );

        } finally {

            setUpdatingOrder(null);

        }

    };


    // =================================================
    // STATUS STYLING
    // =================================================

    const statusClass = (status) => {

        const classes = {
            "Pending": "pending",
            "Preparing": "preparing",
            "Out for Delivery": "delivery",
            "Delivered": "delivered",
            "Cancelled": "cancelled"
        };

        return classes[status] || "pending";

    };


    // =================================================
    // MAIN UI
    // =================================================

    return (

        <div className="admin-page">

            {/* GLOBAL ADMIN POPUPS */}

            <AdminToast />


            {/* SIDEBAR */}

            <aside className="admin-sidebar">

                <h2 className="admin-logo">
                    Crave<span>Lane</span>
                </h2>

                <p className="admin-label">
                    ADMIN PANEL
                </p>

                <nav className="admin-navigation">

                    <Link
                        className="admin-nav-link"
                        to="/admin"
                    >
                        <span>▦</span>
                        Dashboard
                    </Link>

                    <Link
                        className="admin-nav-link active"
                        to="/admin/orders"
                    >
                        <span>📦</span>
                        Orders
                    </Link>

                    <Link
                        className="admin-nav-link"
                        to="/admin/customers"
                    >
                        <span>👥</span>
                        Customers
                    </Link>

                    <Link
                        className="admin-nav-link"
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
                    title="Order Management"
                    subtitle="View customer orders and manage their status."
                />


                {/* PAGE HEADING */}

                <section className="admin-section-heading">

                    <div>

                        <h2>All Orders</h2>

                        <p>
                            {orders.length} order(s) found in your database
                        </p>

                    </div>

                    <button
                        className="admin-refresh"
                        onClick={() => fetchOrders(true)}
                        disabled={loading}
                        type="button"
                    >
                        {loading
                            ? "Refreshing..."
                            : "↻ Refresh Orders"}
                    </button>

                </section>


                {/* SUMMARY */}

                <div className="admin-order-summary">

                    <div className="admin-order-summary-card">

                        <span>📦</span>

                        <div>
                            <small>Total Orders</small>
                            <strong>{orders.length}</strong>
                        </div>

                    </div>


                    <div className="admin-order-summary-card">

                        <span>🕒</span>

                        <div>
                            <small>Pending Orders</small>

                            <strong>
                                {
                                    orders.filter(
                                        (o) => o.order_status === "Pending"
                                    ).length
                                }
                            </strong>
                        </div>

                    </div>


                    <div className="admin-order-summary-card">

                        <span>🚚</span>

                        <div>
                            <small>Out for Delivery</small>

                            <strong>
                                {
                                    orders.filter(
                                        (o) => o.order_status === "Out for Delivery"
                                    ).length
                                }
                            </strong>
                        </div>

                    </div>


                    <div className="admin-order-summary-card">

                        <span>✅</span>

                        <div>
                            <small>Delivered</small>

                            <strong>
                                {
                                    orders.filter(
                                        (o) => o.order_status === "Delivered"
                                    ).length
                                }
                            </strong>
                        </div>

                    </div>

                </div>


                {/* SEARCH AND FILTER */}

                <section className="admin-orders-panel">

                    <div className="admin-order-filters">

                        <input
                            type="search"
                            placeholder="Search order ID, customer name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >

                            <option value="All">
                                All statuses
                            </option>

                            {ORDER_STATUSES.map((status) => (

                                <option
                                    key={status}
                                    value={status}
                                >
                                    {status}
                                </option>

                            ))}

                        </select>

                    </div>


                    {/* ORDERS LIST */}

                    {loading ? (

                        <div className="admin-orders-empty">
                            Loading orders...
                        </div>

                    ) : filteredOrders.length === 0 ? (

                        <div className="admin-orders-empty">

                            <span>📭</span>

                            <h3>No orders found</h3>

                            <p>
                                Try changing your search or status filter.
                            </p>

                        </div>

                    ) : (

                        <div className="admin-orders-list">

                            {filteredOrders.map((order) => (

                                <article
                                    className="admin-order-card"
                                    key={order.order_id}
                                >

                                    {/* ORDER HEADER */}

                                    <div className="admin-order-top">

                                        <div>

                                            <strong>
                                                Order #{order.order_id}
                                            </strong>

                                            <p>
                                                Customer: {order.customer_name}
                                            </p>

                                            <small>
                                                {order.customer_email}
                                            </small>

                                        </div>

                                        <span
                                            className={`admin-status ${statusClass(order.order_status)}`}
                                        >
                                            {order.order_status}
                                        </span>

                                    </div>


                                    {/* ORDER DETAILS */}

                                    <div className="admin-order-details-grid">

                                        <div>
                                            <small>Restaurant</small>

                                            <strong>
                                                {order.restaurant_name}
                                            </strong>
                                        </div>

                                        <div>
                                            <small>Order Amount</small>

                                            <strong>
                                                {formatCurrency(order.total_amount)}
                                            </strong>
                                        </div>

                                        <div>
                                            <small>Payment Method</small>

                                            <strong>
                                                {order.payment_method || "Not available"}
                                            </strong>
                                        </div>

                                        <div>
                                            <small>Payment Status</small>

                                            <strong>
                                                {order.payment_status || "Not available"}
                                            </strong>
                                        </div>

                                    </div>


                                    {/* ORDER ACTIONS */}

                                    <div className="admin-order-actions">

                                        <button
                                            type="button"
                                            className="admin-view-button"
                                            onClick={() =>
                                                setExpandedOrder(
                                                    expandedOrder === order.order_id
                                                        ? null
                                                        : order.order_id
                                                )
                                            }
                                        >
                                            {expandedOrder === order.order_id
                                                ? "Hide Details"
                                                : "View Details"}
                                        </button>


                                        <div className="admin-status-control">

                                            <label>
                                                Update status
                                            </label>

                                            <select
                                                value={order.order_status}
                                                disabled={
                                                    updatingOrder === order.order_id
                                                }
                                                onChange={(e) =>
                                                    updateStatus(
                                                        order.order_id,
                                                        e.target.value
                                                    )
                                                }
                                            >

                                                {ORDER_STATUSES.map((status) => (

                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {status}
                                                    </option>

                                                ))}

                                            </select>

                                        </div>

                                    </div>


                                    {/* EXPANDED ORDER DETAILS */}

                                    {expandedOrder === order.order_id && (

                                        <div className="admin-order-expanded">

                                            <h3>Order Items</h3>

                                            {order.items?.length ? (

                                                <div className="admin-items-table">

                                                    {order.items.map((item, index) => (

                                                        <div
                                                            className="admin-item-row"
                                                            key={`${item.menu_id}-${index}`}
                                                        >

                                                            <span>
                                                                {item.item_name}
                                                            </span>

                                                            <span>
                                                                × {item.quantity}
                                                            </span>

                                                            <strong>
                                                                {formatCurrency(
                                                                    item.unit_price * item.quantity
                                                                )}
                                                            </strong>

                                                        </div>

                                                    ))}

                                                </div>

                                            ) : (

                                                <p>
                                                    No item details available.
                                                </p>

                                            )}


                                            <h3>Delivery Details</h3>

                                            <p>
                                                {order.delivery_address}
                                                {order.city
                                                    ? `, ${order.city}`
                                                    : ""}
                                                {order.pincode
                                                    ? ` - ${order.pincode}`
                                                    : ""}
                                            </p>

                                            <p>
                                                <strong>Customer ID:</strong>{" "}
                                                {order.customer_id}
                                            </p>

                                            <p>
                                                <strong>Payment:</strong>{" "}
                                                {order.payment_method} / {order.payment_status}
                                            </p>

                                            <p>
                                                <strong>Total:</strong>{" "}
                                                {formatCurrency(order.total_amount)}
                                            </p>

                                        </div>

                                    )}

                                </article>

                            ))}

                        </div>

                    )}

                </section>


                {/* FOOTER */}

                <footer className="admin-footer">

                    © {new Date().getFullYear()} CraveLane Admin Panel

                </footer>

            </main>

        </div>

    );

}
