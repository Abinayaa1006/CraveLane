import API_URL from "../config";


// =========================
// LOGIN
// =========================

export async function loginUser(email, password) {

    const response = await fetch(
        `${API_URL}/login`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })
        }
    );


    const data = await response.json();


    if (!response.ok) {

        throw new Error(
            data.message || "Login failed."
        );

    }


    return data;
}



// =========================
// REGISTER
// =========================

export async function registerUser(formData) {

    const response = await fetch(
        `${API_URL}/register`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(formData)
        }
    );


    const data = await response.json();


    if (!response.ok) {

        throw new Error(
            data.message || "Registration failed."
        );

    }


    return data;
}



// =========================
// GET ALL RESTAURANTS
// =========================

export async function getRestaurants() {

    const response = await fetch(
        `${API_URL}/restaurants`
    );


    const data = await response.json();


    if (!response.ok) {

        throw new Error(
            data.message || "Failed to fetch restaurants."
        );

    }


    return data;
}



// =========================
// GET RESTAURANT MENU
// =========================

export async function getRestaurantMenu(id) {

    const response = await fetch(
        `${API_URL}/restaurants/${id}/menu`
    );


    const data = await response.json();


    if (!response.ok) {

        throw new Error(
            data.message || "Failed to fetch menu."
        );

    }


    return data;
}

// =========================
// GET CUSTOMER PROFILE
// =========================

export async function getCustomerProfile(customerId) {
    const response = await fetch(
        `${API_URL}/profile/${customerId}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Could not load customer profile."
        );
    }

    return data;
}


// =========================
// UPDATE CUSTOMER PROFILE
// =========================

export async function updateCustomerProfile(customerId, profileData) {
    const response = await fetch(
        `${API_URL}/profile/${customerId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(profileData)
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Could not update customer profile."
        );
    }

    return data;
}
