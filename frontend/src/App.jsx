
import React from "react";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";


// =====================================================
// EXISTING COMPONENT IMPORTS
// =====================================================

import AuthPage from "./components/AuthPage";
import LandingPage from "./components/LandingPage";

import RestaurantsPage from "./pages/RestaurantsPage";
import MenuPage from "./pages/MenuPage";
import AboutPage from "./pages/AboutPage";
import WishlistPage from "./pages/WishlistPage";
import CartPage from "./pages/CartPage";
import ProfilePage from "./pages/ProfilePage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentPage from "./pages/PaymentPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrdersPage from "./pages/OrdersPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminCustomersPage from "./pages/AdminCustomersPage";
import AdminRestaurantsPage from "./pages/AdminRestaurantsPage";


// =====================================================
// ADMIN COMPONENT
// =====================================================

import AdminDashboard from "./pages/AdminDashboard";


// =====================================================
// CUSTOMER PROTECTED ROUTE
// =====================================================

function ProtectedRoute({ children }) {

    const isLoggedIn =
        localStorage.getItem("isLoggedIn") === "true";

    const role =
        localStorage.getItem("role");

    const token =
        localStorage.getItem("token");


    if (!isLoggedIn || !token) {

        return <Navigate to="/" replace />;

    }


    // Admins should use the admin panel,
    // not the customer pages.

    if (role === "admin") {

        return <Navigate to="/admin" replace />;

    }


    return children;

}


// =====================================================
// ADMIN PROTECTED ROUTE
// =====================================================

function AdminRoute({ children }) {

    const isLoggedIn =
        localStorage.getItem("isLoggedIn") === "true";

    const role =
        localStorage.getItem("role");

    const token =
        localStorage.getItem("token");


    if (!isLoggedIn || !token) {

        return <Navigate to="/" replace />;

    }


    if (role !== "admin") {

        return <Navigate to="/home" replace />;

    }


    return children;

}


// =====================================================
// AUTH ROUTE
// =====================================================

function AuthRoute() {

    const isLoggedIn =
        localStorage.getItem("isLoggedIn") === "true";

    const role =
        localStorage.getItem("role");


    if (isLoggedIn) {

        if (role === "admin") {

            return <Navigate to="/admin" replace />;

        }

        return <Navigate to="/home" replace />;

    }


    return <AuthPage />;

}


// =====================================================
// MAIN APP
// =====================================================

function App() {

    return (

        <BrowserRouter>

            <Routes>


                {/* =====================================
                    LOGIN / REGISTER
                ===================================== */}

                <Route
                    path="/"
                    element={<AuthRoute />}
                />


                {/* =====================================
                    ADMIN DASHBOARD
                ===================================== */}

                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />


                {/* =====================================
                    CUSTOMER HOME
                ===================================== */}

                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <LandingPage />
                        </ProtectedRoute>
                    }
                />


                {/* =====================================
                    RESTAURANTS
                ===================================== */}

                <Route
                    path="/restaurants"
                    element={
                        <ProtectedRoute>
                            <RestaurantsPage />
                        </ProtectedRoute>
                    }
                />


                {/* =====================================
                    PARTICULAR RESTAURANT MENU
                ===================================== */}

                <Route
                    path="/restaurants/:id"
                    element={
                        <ProtectedRoute>
                            <MenuPage />
                        </ProtectedRoute>
                    }
                />


                {/* =====================================
                    ABOUT
                ===================================== */}

                <Route
                    path="/about"
                    element={
                        <ProtectedRoute>
                            <AboutPage />
                        </ProtectedRoute>
                    }
                />


                {/* =====================================
                    WISHLIST
                ===================================== */}

                <Route
                    path="/wishlist"
                    element={
                        <ProtectedRoute>
                            <WishlistPage />
                        </ProtectedRoute>
                    }
                />


                {/* =====================================
                    CART
                ===================================== */}

                <Route
                    path="/cart"
                    element={
                        <ProtectedRoute>
                            <CartPage />
                        </ProtectedRoute>
                    }
                />


                {/* =====================================
                    PROFILE
                ===================================== */}

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />


                {/* =====================================
                    CHECKOUT
                ===================================== */}

                <Route
                    path="/checkout"
                    element={
                        <ProtectedRoute>
                            <CheckoutPage />
                        </ProtectedRoute>
                    }
                />


                {/* =====================================
                    PAYMENT
                ===================================== */}

                <Route
                    path="/payment"
                    element={
                        <ProtectedRoute>
                            <PaymentPage />
                        </ProtectedRoute>
                    }
                />


                {/* =====================================
                    ORDER CONFIRMATION
                ===================================== */}

                <Route
                    path="/order-confirmation"
                    element={
                        <ProtectedRoute>
                            <OrderConfirmationPage />
                        </ProtectedRoute>
                    }
                />


                {/* =====================================
                    CUSTOMER ORDERS
                ===================================== */}

                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute>
                            <OrdersPage />
                        </ProtectedRoute>
                    }
                />


                {/* =====================================
                    ORDER TRACKING
                ===================================== */}

                <Route
                    path="/track-order/:orderId"
                    element={
                        <ProtectedRoute>
                            <OrderTrackingPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                     path="/forgot-password"
                     element={<ForgotPasswordPage />}
                />

                <Route
                      path="/reset-password/:token"
                      element={<ResetPasswordPage />}
                 />
                 <Route
                        path="/admin/orders"
                        element={
                        <AdminRoute>
                              <AdminOrdersPage />
                        </AdminRoute>
                         }
                  />
                  <Route
                      path="/admin/customers"
                      element={
                    <AdminRoute>
                        <AdminCustomersPage />
                    </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/restaurants"
                    element={
                   <AdminRoute>
                      <AdminRestaurantsPage />
                   </AdminRoute>
              }
                  />

                {/* =====================================
                    UNKNOWN URL
                ===================================== */}

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />


            </Routes>

        </BrowserRouter>

    );

}

export default App;
