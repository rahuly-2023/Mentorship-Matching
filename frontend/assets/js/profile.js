const accessToken=localStorage.getItem('accessToken')
if (!accessToken) {
    // alert('You must be logged in to view this page.');
    window.location.href = '/'; // Redirect to login page if not logged in
}
    
    
    
document.addEventListener('DOMContentLoaded', async function() {
        try {
            // Fetch profile data from the server
            const response = await makeApiCall('/api/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}` // Include the access token
                }
            });
            
            const data = await response.json();
            if (data.success) {
                skills = data.profile.skills.replace(/[\[\]']/g, '').replace(/"/g, '').replace(/,/g, ', ');
                interests = data.profile.interests.replace(/[\[\]']/g, '').replace(/"/g, '').replace(/,/g, ', ');
                
                if(data.profile.role=='mentee'){
                    document.querySelector('.role-mentor').style.display = 'none';
                }
                else{
                    document.querySelector('.role-mentee').style.display = 'none';
                }
                localStorage.setItem('role', data.profile.role);
                document.querySelector('.name').innerText=data.profile.name || 'Your Name';
                // Populate the form fields with the fetched data
                document.getElementById('name').value = data.profile.name || '';
                // document.getElementById('email').value = data.profile.email || '';
                document.querySelector(`input[name="role"][value="${data.profile.role}"]`).checked = true;
                document.getElementById('skills').value = skills || '';
                document.getElementById('interests').value = interests || '';
                document.getElementById('bio').value = data.profile.bio || '';
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            showAlert('An error occurred while fetching profile data.','error');
        }
        
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            // console.log("Loaded");
            profileForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                
                const name = document.getElementById('name').value;
                const role = document.querySelector('input[name="role"]:checked');
                const skills = document.getElementById('skills').value.split(',').filter(skill => skill.trim() !== '').map((skill) => skill.trim());
                const interests = document.getElementById('interests').value.split(',').filter(skill => skill.trim() !== '').map((interest) => interest.trim());
                const bio = document.getElementById('bio').value;
                // console.log("updating profile ",name,role,skills,interests,bio);
                console.log(skills);

                if (name.length < 3 || name.length > 50) {
                    console.log("name");
                    showAlert('Name should not be empty');
                    return;
                }
            
                // Role validation
                if (!role) {
                    showAlert('Select a role.');
                    return;
                }
            
                // Skills validation
                if (skills.length < 1) {
                    showAlert('Skills should be a comma-separated list of at least 1 skill.');
                    return;
                }
            
                // Interests validation
                if (interests.length < 1) {
                    showAlert('Interests should be a comma-separated list of at least 1 interest.');
                    return;
                }
            
                // Bio validation
                if (bio.length < 10 || bio.length > 500) {
                    showAlert('Bio should be between 10 and 500 characters long.');
                    return;
                }
                
                
                
                // Send profile data to the server
                const response = await makeApiCall('/api/profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}` // Include the access token
                    },
                    body: JSON.stringify({ name, role:role.value, skills, interests, bio })
                });
                
                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('Profile','true');
                    localStorage.setItem('role',role.value);
                    showAlert('Profile saved successfully!','success');
                    // Optionally redirect to another page
                    // window.location.href = '/discovery_page'; // Redirect to discovery page
                } else {
                    showAlert('Failed to save profile: ' + data.message);
                }
            });
        }
















        async function makeApiCall(url, options) {
            let accessToken = localStorage.getItem('accessToken');
        
            // Check if the token is expired
            if (isTokenExpired(accessToken)) {
                accessToken = await refreshAccessToken(); // Refresh the token
            }
        
            // Set the Authorization header with the (possibly new) access token
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${accessToken}`
            };
        
            return fetch(url, options); // Make the API call
        }
        
        function isTokenExpired(token) {
            if (!token) return true; // If no token, consider it expired
            const payload = JSON.parse(atob(token.split('.')[1])); // Decode the token
            const now = Math.floor(Date.now() / 1000); // Current time in seconds
            return payload.exp < now; // Check if the token is expired
        }
        
        async function refreshAccessToken() {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await fetch('/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: refreshToken })
            });
        
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('accessToken', data.accessToken); // Update access token
                return data.accessToken; // Return the new access token
            } else {
                showAlert('Session expired. Please log in again.');
                window.location.href = '/'; // Redirect to login page
            }
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
            }, 3000);

            // Remove the alert when the close button is clicked
            alert.querySelector('.alert-close').addEventListener('click', () => {
                alert.remove();
            });
        }
});