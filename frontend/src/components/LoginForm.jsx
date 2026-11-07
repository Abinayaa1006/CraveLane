
import { useState } from "react";
import { loginUser } from "../services/api";

function LoginForm({ onLoginSuccess }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);


    // =====================================================
    // LOGIN SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage("");
        setError(false);
        setLoading(true);

        try {

            // Call Flask login API
            const data = await loginUser(email, password);

            // Check whether login response contains required data
            if (!data.customer_id || !data.token) {
                throw new Error(
                    "Login response is missing customer ID or authentication token."
                );
            }

            // =====================================================
            // SAVE LOGGED-IN CUSTOMER DETAILS
            // =====================================================

            localStorage.setItem(
                "customer_id",
                String(data.customer_id)
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data)
            );

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "isLoggedIn",
                "true"
            );

            // Show success message
            setMessage(data.message || "Login successful!");

            // =====================================================
            // NOTIFY PARENT COMPONENT
            // =====================================================

            if (onLoginSuccess) {
                onLoginSuccess(data);
            }

        } catch (err) {

            setError(true);

            setMessage(
                err.message || "Login failed. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="form-container">

            <p className="form-eyebrow">
                WELCOME BACK
            </p>

            <h2>
                Good to see you!
            </h2>

            <p className="form-subtitle">
                Login to continue your food journey.
            </p>


            <form onSubmit={handleSubmit}>

                {/* EMAIL */}

                <label>
                    Email
                </label>

                <div className="input-wrapper">

                    <span>✉</span>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                </div>


                {/* PASSWORD */}

                <label>
                    Password
                </label>

                <div className="input-wrapper">

                    <span>🔒</span>

                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                </div>


                {/* FORGOT PASSWORD */}

                <div className="forgot-password">

                    <button
                        type="button"
                        onClick={() =>
                            alert("Password reset will be added later.")
                        }
                    >
                        Forgot password?
                    </button>

                </div>


                {/* LOGIN BUTTON */}

                <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                >

                    {loading
                        ? "Logging in..."
                        : "Login →"
                    }

                </button>

            </form>


            {/* SUCCESS / ERROR MESSAGE */}

            {message && (

                <p
                    className={
                        error
                            ? "message error"
                            : "message success"
                    }
                >
                    {message}
                </p>

            )}


            {/* DIVIDER */}

            <div className="auth-divider">

                <span></span>

                OR

                <span></span>

            </div>


            {/* GOOGLE LOGIN */}

            <button
                type="button"
                className="google-button"
                onClick={() =>
                    alert("Google login will be added later.")
                }
            >
                <strong>G</strong>
                Continue with Google
            </button>


            {/* REGISTER LINK */}

            <p className="auth-bottom-text">

                New here?

                <button
                    type="button"
                    onClick={() => {}}
                >
                    Create an account
                </button>

            </p>

        </div>

    );
}

export default LoginForm;
