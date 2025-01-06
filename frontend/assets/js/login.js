if (localStorage.getItem('accessToken')) {
    window.location.href = '/discovery'; // Redirect to discovery page if logged in
}




document.addEventListener('DOMContentLoaded', function() {

    const wrapper = document.querySelector(".wrapper"),
    signupHeader = document.querySelector(".signup header"),
    loginHeader = document.querySelector(".login header");
    
    loginHeader.addEventListener("click", () => {
        wrapper.classList.add("active");
    });

    signupHeader.addEventListener("click", () => {
        wrapper.classList.remove("active");
    });

    
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();  
            
            const email = document.getElementById('login_email').value.trim();
            const password = document.getElementById('login_password').value.trim();
            
            // Send login data to the server
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (data.success) {
                // Store tokens in local storage
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                // localStorage.setItem('Email',email);
                localStorage.setItem('role',data.role);
                localStorage.setItem('Profile',data.profile);
                if(data.profile){
                    window.location.href = '/discovery';
                }
                else{
                    window.location.href = '/profile';
                }
            } else {
                showAlert('Login failed: ' + data.message);
            }
        });
    }



















    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();


            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                showAlert('Invalid email format. Please use the following format: example@example.example');
                return;
            }

            // Password validation
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                showAlert('Password should contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
                return;
            }

            // Send registration data to the server
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (data.success) {
                showAlert('Registration successful! Please log in.', 'success');
            } else {
                showAlert('Registration failed: ' + data.message,'error');
            }
        });
    }








    function showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        const alert = document.createElement('div');
        alert.classList.add('alert', type === 'success' ? 'alert-success' : 'alert-error');
        alert.innerHTML = `
            <span>${message}</span>
            <span class="alert-close">&times;</span>
        `;

        alertContainer.appendChild(alert);

        // Automatically remove the alert after 3 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);

        // Remove the alert when the close button is clicked
        alert.querySelector('.alert-close').addEventListener('click', () => {
            alert.remove();
        });
    }
});