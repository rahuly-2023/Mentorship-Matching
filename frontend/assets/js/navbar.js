document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.getElementById('navbar');
    navbar.innerHTML = `
    <nav>
        <label class="logo1"><a class="mentorship-logo" href="/">Mentorship Matching</a></label>
        <ul>
            <li><a class="nav-discovery" href="/discovery">Discover User</a></li>
            <li><a class="nav-profile" href="/profile">My Profile</a></li>
            <li><div class="logout" id="logoutBtn">Logout</div></li>
        </ul>
    </nav>
    `;
    if(document.location.pathname=='/profile'){
        document.querySelector('.nav-profile').classList.add('active');
    }
    else if(document.location.pathname=='/discovery'){
        document.querySelector('.nav-discovery').classList.add('active');
    }

    document.getElementById('logoutBtn').addEventListener('click', async function() {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('refreshToken')}`
            }
        });

        if (response.ok) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('role');
            localStorage.removeItem('Profile');
            window.location.href = '/';
        } else {
            console.error('Logout failed:', response.statusText);
            alert('Logout failed. Please try again.');
        }
    });
});