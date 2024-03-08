const apiBaseUrl = '/api';

const currentUser = {
    username: "example_user",
    auth_key: "example_user_auth_key"
};


// Function to handle navigation to a channel or thread
function navigateToChannel(channelId) {
    // Use the History API to push the state and update the URL
    history.pushState({ channel: channelId }, `Channel ${channelId}`, `/channel/${channelId}`);

    // Fetch and render channel messages using your API
    fetch(`${apiBaseUrl}/channels/${channelId}`)
        .then(response => response.json())
        .then(data => {
            // Render channel messages
            renderChannelMessages(data);
        })
        .catch(error => console.error('Error fetching channel messages:', error));
}

// Function to handle navigation back to the previous state
function navigateBack() {
    // Use the History API to pop the state
    history.back();
}

// Function to handle authentication and set user data in localStorage
function authenticateUser(username, password) {
    // Perform authentication using your API
    fetch(`${apiBaseUrl}/authenticate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
        .then(response => response.json())
        .then(data => {
            // Save authentication token and user data to localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);

            // Navigate to the original requested page (if any)
            const originalPage = localStorage.getItem('originalPage');
            if (originalPage) {
                localStorage.removeItem('originalPage');
                window.location.href = originalPage;
            } else {
                // Navigate to a default page (e.g., home)
                navigateToDefaultPage();
            }
        })
        .catch(error => console.error('Authentication failed:', error));
}

// Function to check if the user is authenticated
function isAuthenticated() {
    // Check if the authentication token is present in localStorage
    return !!localStorage.getItem('authToken');
}

// Function to handle user logout
function logoutUser() {
    // Clear user data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');

    // Navigate to the login/signup page
    navigateToLoginSignup();
}

// Function to navigate to the login/signup page
function navigateToLoginSignup() {
    // Use the History API to push the state and update the URL
    history.pushState({ page: 'loginSignup' }, 'Login/Signup', '/login-signup');

    // Render the login/signup page content
    renderLoginSignupPage();
}

// Function to render the login/signup page content
function renderLoginSignupPage() {
    // Implement the rendering logic for the login/signup page
    // This may include showing login/signup forms, handling form submissions, etc.
    // ...

    // Example: Show a login form
    const loginForm = document.getElementById('login-form');
    loginForm.style.display = 'block';
}

// Function to navigate to the default page (e.g., home)
function navigateToDefaultPage() {
    // Use the History API to push the state and update the URL
    history.pushState({ page: 'default' }, 'Home', '/');

    // Render the default page content
    renderDefaultPage();
}

// Function to render the default page content
function renderDefaultPage() {
    // Implement the rendering logic for the default page
    // This may include showing a list of channels, latest messages, etc.

    // Example: Show a list of channels
    const channelsList = document.getElementById('channels-list');
    channelsList.style.display = 'block';
}

// Event listener for navigation clicks (e.g., clicking on a channel)
document.addEventListener('click', event => {
    const target = event.target;

    // Check if the clicked element has a data-channel attribute (channel ID)
    const channelId = target.getAttribute('data-channel');

    if (channelId) {
        // Navigate to the selected channel
        navigateToChannel(channelId);
    }

    // Check if the clicked element has a data-back attribute
    if (target.getAttribute('data-back') !== null) {
        // Navigate back to the previous state
        navigateBack();
    }

    // Check if the clicked element has a data-logout attribute
    if (target.getAttribute('data-logout') !== null) {
        // Logout the user
        logoutUser();
    }
});

// Check if the user is authenticated when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
        // If authenticated, render the default page
        renderDefaultPage();
    } else {
        // If not authenticated, navigate to the login/signup page
        navigateToLoginSignup();
    }
});

// Event listener for popstate (e.g., when the user clicks the back button)
window.addEventListener('popstate', event => {
    const state = event.state;

    if (state && state.channel) {
        // If the state contains a channel ID, navigate to that channel
        navigateToChannel(state.channel);
    } else if (state && state.page === 'loginSignup') {
        // If the state indicates the login/signup page, render that page
        renderLoginSignupPage();
    } else {
        // Otherwise, render the default page
        renderDefaultPage();
    }
});


// Event listener for document ready
document.addEventListener("DOMContentLoaded", function () {
    // Check if the user is authenticated
    if (isAuthenticated()) {
        // Fetch and display channel list
        fetchChannels();
        // Start checking for new messages
        startCheckingForMessages();
    } else {
        // Redirect to login page or show login modal
        showLogin();
    }
});

// Function to check if the user is authenticated
function isAuthenticated() {
    return currentUser.auth_key !== null;
}

// Function to fetch and display the list of channels
function fetchChannels() {
    // Implement logic to fetch channels from the server
}

// Function to start checking for new messages
function startCheckingForMessages() {
    // Implement logic to periodically check for new messages
}

// ... Add more functions based on the rubric ...

// Function to show the login page
function showLogin() {
    // Implement logic to show the login page/modal
}
