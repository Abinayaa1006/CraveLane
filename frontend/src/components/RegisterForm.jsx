import { useState } from "react";
import { registerUser } from "../services/api";

function RegisterForm() {

    const [formData, setFormData] = useState({

        name: "",
        email: "",
        phone: "",
        password: "",
        address: "",
        city: "",
        pincode: ""

    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);


    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });
    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage("");
        setError(false);

        try {

            const data = await registerUser(
                formData
            );

            setMessage(data.message);

            if (!data.error) {

                setFormData({

                    name: "",
                    email: "",
                    phone: "",
                    password: "",
                    address: "",
                    city: "",
                    pincode: ""

                });
            }

        } catch (error) {

            setError(true);

            setMessage(
                error.message || "Registration failed."
            );
        }
    };


    return (

        <div className="form-container">

            <h2>Create Account</h2>

            <p className="form-subtitle">
                Register to start ordering
            </p>


            <form onSubmit={handleSubmit}>

                <label>Full Name</label>

                <input
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />


                <label>Email</label>

                <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />


                <label>Phone Number</label>

                <input
                    type="text"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                />


                <label>Password</label>

                <input
                    type="password"
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />


                <label>Address</label>

                <input
                    type="text"
                    name="address"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={handleChange}
                />


                <div className="two-column">

                    <div>

                        <label>City</label>

                        <input
                            type="text"
                            name="city"
                            placeholder="City"
                            value={formData.city}
                            onChange={handleChange}
                        />

                    </div>


                    <div>

                        <label>Pincode</label>

                        <input
                            type="text"
                            name="pincode"
                            placeholder="Pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                        />

                    </div>

                </div>


                <button
                    type="submit"
                    className="primary-button"
                >
                    Create Account
                </button>

            </form>


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

        </div>
    );
}

export default RegisterForm;