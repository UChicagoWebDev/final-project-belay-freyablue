const apiBaseUrl = '/api';
const signupForm = document.getElementById('signup-form');

// function to fetch and display unread message counts
function fetchUnreadCounts() {
    // Replace this with your actual API endpoint for unread counts
    fetch('/api/unread-counts')
        .then(response => response.json())
        .then(data => {
            // Display unread counts in your UI
            console.log('Unread Message Counts:', data);
        })
        .catch(error => console.error('Error fetching unread counts:', error));
}

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

function signup() {
    const username = document.querySelector('input[name="username"]').value;
    const password = document.querySelector('input[name="password"]').value;
    fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Signup failed with status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Store the API key in browser's localStorage
        
        localStorage.setItem('api_key',data.api_key)
        location.reload();
        window.location.href = 'api/login'
      })
      .catch(error => {
        console.log('Signup failed:', error);
      });
}

// Login function
function login(name,password) {
    // const name = 'newuser';
    // const password = 'newpassword';
    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: name,
        password: password, })
    })
      .then(response => response.json())
      .then(data => {
        // Store the API key in browser's localStorage
        console.log('Login response:', data);
        localStorage.setItem('api_key', data.api_key);
        location.reload();
      })
      .catch(error => {
        console.log('Login failed:', error);
      });
}

// Function to create a new channel
function createChannel() {
    var formData = {
      channel_name: document.getElementById('channel_name').value,
    };
  
    fetch('/api/create-channel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
}

// Function to get the list of channels
function getChannels() {
  fetch('/api/get-channels')
    .then(response => response.json())
    .then(data => {
      // Handle the response
      console.log(data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

document.querySelector('.signup button').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission
    signup();
    const username = document.querySelector('input[name="username"]').value;
    const password = document.querySelector('input[name="password"]').value;
    login(username,password); // Call the login function
});



// Function to handle authentication and set user data in localStorage
function authenticateUser(username, password) {
    // Perform authentication using your API
    fetch(`${apiBaseUrl}/authentication`, {
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
document.addEventListener('DOMContentLoaded', function () {
    // Select relevant UI containers
    const unauthenticatedUI = document.getElementById('unauthenticated-ui');
    const authenticatedUI = document.getElementById('authenticated-ui');
    
    // Select additional UI elements that should be hidden/shown
    const channelsList = document.querySelector('.channels-list');
    const messagesSection = document.querySelector('.messages');
    if (isAuthenticated()) {
        unauthenticatedUI.style.display = 'none';
        authenticatedUI.style.display = 'block';   
        // Show authenticated UI elements
        channelsList.style.display = 'block';
        messagesSection.style.display = 'block';
        fetchUnreadCounts();
    } else {
        // If not authenticated, navigate to the login/signup page
        // User is unauthenticated, show unauthenticated UI
        unauthenticatedUI.style.display = 'block';
        authenticatedUI.style.display = 'none';
        // Hide unauthenticated UI elements
        channelsList.style.display = 'none';
        messagesSection.style.display = 'none';
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



