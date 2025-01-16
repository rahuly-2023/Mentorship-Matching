const accessToken=localStorage.getItem('accessToken')
if (!accessToken) {
    window.location.href = '/';
}
    
    
    
document.addEventListener('DOMContentLoaded', async function() {
        try {
            const response = await makeApiCall('/api/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
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
                document.getElementById('name').value = data.profile.name || '';
                document.querySelector(`input[name="role"][value="${data.profile.role}"]`).checked = true;
                document.getElementById('skills').value = skills || '';
                document.getElementById('interests').value = interests || '';
                document.getElementById('bio').value = data.profile.bio || '';
            }
            else{
                showAlert("Fill all the details first");
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            showAlert('An error occurred while fetching profile data.','error');
        }
        
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                
                const name = document.getElementById('name').value;
                const role = document.querySelector('input[name="role"]:checked');
                const skills = document.getElementById('skills').value.split(',').filter(skill => skill.trim() !== '').map((skill) => skill.trim());
                const interests = document.getElementById('interests').value.split(',').filter(skill => skill.trim() !== '').map((interest) => interest.trim());
                const bio = document.getElementById('bio').value;
                console.log(skills);

                if (name.length < 3 || name.length > 50) {
                    console.log("name");
                    showAlert('Name should not be empty');
                    return;
                }
            
                if (!role) {
                    showAlert('Select a role.');
                    return;
                }
            
                if (skills.length < 1) {
                    showAlert('Skills should be a comma-separated list of at least 1 skill.');
                    return;
                }
            
                if (interests.length < 1) {
                    showAlert('Interests should be a comma-separated list of at least 1 interest.');
                    return;
                }
            
                if (bio.length < 10 || bio.length > 500) {
                    showAlert('Bio should be between 10 and 500 characters long.');
                    return;
                }
                

                const response = await makeApiCall('/api/profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({ name, role:role.value, skills, interests, bio })
                });
                
                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('Profile','true');
                    localStorage.setItem('role',role.value);
                    showAlert('Profile saved successfully!','success');
                } else {
                    showAlert('Failed to save profile: ' + data.message);
                }
            });
        }
















        async function makeApiCall(url, options) {
            let accessToken = localStorage.getItem('accessToken');
        
            if (isTokenExpired(accessToken)) {
                accessToken = await refreshAccessToken();
            }
        
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${accessToken}`
            };
        
            return fetch(url, options);
        }
        
        function isTokenExpired(token) {
            if (!token) return true;
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000); // Current time in seconds
            return payload.exp < now;
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
                localStorage.setItem('accessToken', data.accessToken);
                return data.accessToken;
            } else {
                showAlert('Session expired. Please log in again.');
                window.location.href = '/';
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

            setTimeout(() => {
                alert.remove();
            }, 3000);

            alert.querySelector('.alert-close').addEventListener('click', () => {
                alert.remove();
            });
        }
});