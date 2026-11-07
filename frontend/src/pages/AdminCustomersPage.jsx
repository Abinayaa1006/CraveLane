
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

export default function AdminCustomersPage() {

    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activityFilter, setActivityFilter] = useState("All");
    const [selectedCustomer, setSelectedCustomer] = useState(null);


    // =================================================
    // FETCH CUSTOMERS
    // =================================================

    const fetchCustomers = useCallback(async (showSuccess = false) => {

        setLoading(true);

        try {

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/", { replace: true });
                return false;
            }

            const response = await fetch(
                `${API_URL}/admin/customers`,
                {
                    method: "GET",
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
                    data.message || "Could not load customers."
                );
            }

            setCustomers(
                Array.isArray(data.customers)
                    ? data.customers
                    : []
            );

            if (showSuccess) {
                notifyAdmin(
                    "Customer list refreshed successfully.",
                    "success"
                );
            }

            return true;

        } catch (err) {

            notifyAdmin(
                err.message ||
                "Could not connect to the backend.",
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

        fetchCustomers();

    }, [fetchCustomers]);


    // =================================================
    // CURRENCY FORMAT
    // =================================================

    const formatCurrency = (amount) => {

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(amount || 0));

    };


    // =================================================
    // SEARCH AND ACTIVITY FILTER
    // =================================================

    const filteredCustomers = useMemo(() => {

        const searchText = search.trim().toLowerCase();

        return customers.filter((customer) => {

            const customerName =
                String(customer.name || "").toLowerCase();

            const customerEmail =
                String(customer.email || "").toLowerCase();

            const customerPhone =
                String(customer.phone || "").toLowerCase();

            const matchesSearch =
                !searchText ||
                String(customer.customer_id || "").includes(searchText) ||
                customerName.includes(searchText) ||
                customerEmail.includes(searchText) ||
                customerPhone.includes(searchText);

            const matchesActivity =
                activityFilter === "All" ||
                (
                    activityFilter === "Ordered" &&
                    Number(customer.total_orders) > 0
                ) ||
                (
                    activityFilter === "No Orders" &&
                    Number(customer.total_orders) === 0
                );

            return matchesSearch && matchesActivity;

        });

    }, [customers, search, activityFilter]);


    // =================================================
    // SUMMARY CALCULATIONS
    // =================================================

    const totalOrders = customers.reduce(
        (sum, customer) =>
            sum + Number(customer.total_orders || 0),
        0
    );

    const totalCustomerValue = customers.reduce(
        (sum, customer) =>
            sum + Number(customer.total_order_value || 0),
        0
    );

    const customersWithOrders = customers.filter(
        (customer) =>
            Number(customer.total_orders) > 0
    ).length;


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
                        className="admin-nav-link"
                        to="/admin/orders"
                    >
                        <span>📦</span>
                        Orders
                    </Link>

                    <Link
                        className="admin-nav-link active"
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
                    title="Customer Management"
                    subtitle="View and monitor registered CraveLane customers."
                />


                {/* PAGE HEADING */}

                <section className="admin-section-heading">

                    <div>

                        <h2>Registered Customers</h2>

                        <p>
                            {customers.length} customer account(s)
                        </p>

                    </div>

                    <button
                        className="admin-refresh"
                        type="button"
                        onClick={() => fetchCustomers(true)}
                        disabled={loading}
                    >
                        {loading
                            ? "Refreshing..."
                            : "↻ Refresh"}
                    </button>

                </section>


                {/* SUMMARY CARDS */}

                <section className="admin-customer-summary">

                    <div className="admin-customer-stat">

                        <span>👥</span>

                        <div>
                            <small>Total Customers</small>
                            <strong>{customers.length}</strong>
                        </div>

                    </div>


                    <div className="admin-customer-stat">

                        <span>📦</span>

                        <div>
                            <small>Total Orders</small>
                            <strong>{totalOrders}</strong>
                        </div>

                    </div>


                    <div className="admin-customer-stat">

                        <span>🛍️</span>

                        <div>
                            <small>Customers With Orders</small>
                            <strong>{customersWithOrders}</strong>
                        </div>

                    </div>


                    <div className="admin-customer-stat">

                        <span>💰</span>

                        <div>
                            <small>Non-cancelled Order Value</small>

                            <strong>
                                {formatCurrency(totalCustomerValue)}
                            </strong>
                        </div>

                    </div>

                </section>


                {/* SEARCH AND FILTER */}

                <section className="admin-customers-panel">

                    <div className="admin-customer-filters">

                        <input
                            type="search"
                            placeholder="Search by name, email, phone or customer ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            value={activityFilter}
                            onChange={(e) =>
                                setActivityFilter(e.target.value)
                            }
                        >

                            <option value="All">
                                All Customers
                            </option>

                            <option value="Ordered">
                                With Orders
                            </option>

                            <option value="No Orders">
                                No Orders Yet
                            </option>

                        </select>

                    </div>


                    {/* CUSTOMER LIST */}

                    {loading ? (

                        <div className="admin-customers-empty">
                            Loading customers...
                        </div>

                    ) : filteredCustomers.length === 0 ? (

                        <div className="admin-customers-empty">

                            <span>👥</span>

                            <h3>No customers found</h3>

                            <p>
                                Try another search term or filter.
                            </p>

                        </div>

                    ) : (

                        <div className="admin-customer-table-wrapper">

                            <table className="admin-customer-table">

                                <thead>

                                    <tr>
                                        <th>Customer</th>
                                        <th>Contact</th>
                                        <th>Location</th>
                                        <th>Orders</th>
                                        <th>Order Value</th>
                                        <th>Details</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredCustomers.map((customer) => (

                                        <React.Fragment
                                            key={customer.customer_id}
                                        >

                                            <tr>

                                                {/* CUSTOMER IDENTITY */}

                                                <td>

                                                    <div className="admin-customer-identity">

                                                        <span className="admin-customer-avatar">
                                                            {(
                                                                customer.name || "C"
                                                            ).charAt(0).toUpperCase()}
                                                        </span>

                                                        <div>

                                                            <strong>
                                                                {customer.name || "Unnamed"}
                                                            </strong>

                                                            <small>
                                                                ID: {customer.customer_id}
                                                            </small>

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* CONTACT */}

                                                <td>

                                                    <strong>
                                                        {customer.email || "No email"}
                                                    </strong>

                                                    <small className="admin-customer-subtext">
                                                        {customer.phone || "No phone"}
                                                    </small>

                                                </td>


                                                {/* LOCATION */}

                                                <td>

                                                    <span>
                                                        {customer.city || "Not provided"}
                                                    </span>

                                                    <small className="admin-customer-subtext">
                                                        {customer.pincode || ""}
                                                    </small>

                                                </td>


                                                {/* ORDERS */}

                                                <td>

                                                    <span className="admin-customer-order-count">
                                                        {Number(customer.total_orders || 0)}
                                                    </span>

                                                </td>


                                                {/* ORDER VALUE */}

                                                <td>

                                                    <strong>
                                                        {formatCurrency(
                                                            customer.total_order_value
                                                        )}
                                                    </strong>

                                                </td>


                                                {/* VIEW DETAILS */}

                                                <td>

                                                    <button
                                                        type="button"
                                                        className="admin-customer-view"
                                                        onClick={() =>
                                                            setSelectedCustomer(
                                                                selectedCustomer === customer.customer_id
                                                                    ? null
                                                                    : customer.customer_id
                                                            )
                                                        }
                                                    >
                                                        {selectedCustomer === customer.customer_id
                                                            ? "Hide"
                                                            : "View"}
                                                    </button>

                                                </td>

                                            </tr>


                                            {/* EXPANDED CUSTOMER DETAILS */}

                                            {selectedCustomer === customer.customer_id && (

                                                <tr className="admin-customer-detail-row">

                                                    <td colSpan="6">

                                                        <div className="admin-customer-detail">

                                                            <h3>
                                                                Customer Details
                                                            </h3>


                                                            <div>
                                                                <strong>Full Name</strong>

                                                                <span>
                                                                    {customer.name || "Not provided"}
                                                                </span>
                                                            </div>


                                                            <div>
                                                                <strong>Email</strong>

                                                                <span>
                                                                    {customer.email || "Not provided"}
                                                                </span>
                                                            </div>


                                                            <div>
                                                                <strong>Phone</strong>

                                                                <span>
                                                                    {customer.phone || "Not provided"}
                                                                </span>
                                                            </div>


                                                            <div>
                                                                <strong>Address</strong>

                                                                <span>
                                                                    {customer.address || "Not provided"}
                                                                </span>
                                                            </div>


                                                            <div>
                                                                <strong>City</strong>

                                                                <span>
                                                                    {customer.city || "Not provided"}
                                                                </span>
                                                            </div>


                                                            <div>
                                                                <strong>Pincode</strong>

                                                                <span>
                                                                    {customer.pincode || "Not provided"}
                                                                </span>
                                                            </div>


                                                            <div>
                                                                <strong>Total Orders</strong>

                                                                <span>
                                                                    {Number(customer.total_orders || 0)}
                                                                </span>
                                                            </div>


                                                            <div>
                                                                <strong>Non-cancelled Order Value</strong>

                                                                <span>
                                                                    {formatCurrency(
                                                                        customer.total_order_value
                                                                    )}
                                                                </span>
                                                            </div>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )}

                                        </React.Fragment>

                                    ))}

                                </tbody>

                            </table>

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
