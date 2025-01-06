const accessToken=localStorage.getItem('accessToken')
const profile=localStorage.getItem('Profile');
if (!accessToken) {
    window.location.href = '/'; // Redirect to login page if not logged in
}

if(profile==='false'){
    window.location.href = '/profile';
}


document.addEventListener('DOMContentLoaded',()=>{
    const loggedInUser_Role = localStorage.getItem('role');
    let allUsers = [];
    let allRequests = [];
    let currentPage = 1;
    const usersPerPage = 5;

    let currentPageUsers = 1;
    let currentPageRequests = 1;
    const requestsPerPage = 5;


    fetchRequests();
    async function fetchRequests() {
        const response = await makeApiCall('/api/requests', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            // allRequests = [...data.sentRequests, ...data.receivedRequests]; // Combine sent and received requests
            allRequests = [...data.sentRequests, ...data.receivedRequests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            displayRequests(allRequests); // Display requests
        } else {
            console.error('Error fetching requests:', response.statusText);
        }
    }


    function displayRequests(requests) {
        const requestList = document.getElementById('requestList');
        requestList.innerHTML = ''; // Clear the request list before populating

        // Calculate the start and end index for pagination
        const startIndex = (currentPageRequests - 1) * requestsPerPage;
        const endIndex = startIndex + requestsPerPage;
        const paginatedRequests = requests.slice(startIndex, endIndex); // Get requests for the current page

        if(paginatedRequests.length==0){
            const noRequests = document.createElement('p');
            noRequests.classList.add('NoRequest');
            noRequests.textContent = "No requests found";
            requestList.appendChild(noRequests);
        }

        paginatedRequests.forEach(request => {
            const requestCard = document.createElement('div');
            requestCard.classList.add('request-card', 'p-4', 'rounded', 'shadow', 'flex', 'justify-between', 'items-center','cursor-pointer');
            requestCard.classList.add(request.status === 'accepted' ? 'accepted-card' : request.status === 'declined' ? 'rejected-card' : 'pending-card');
            requestCard.innerHTML = `
                <div>
                    <h3 class="text-xl font-semibold">${request.name}</h3>
                    
                    <p> ${loggedInUser_Role=="mentor" ? `Received`:`Sent`} On: ${new Date(request.created_at).toLocaleDateString()}</p>
                </div>
            `;

            if (request.status === 'accepted') {
                requestCard.innerHTML += `
                    <button class="chat-btn px-4 py-2 bg-blue-500 text-white rounded" request-id="${request.request_id}">Chat</button>
                `;
            }
            

            requestCard.addEventListener('click', () => {
                document.getElementById('modal-Name').textContent = request.name;
                document.getElementById('modal-CreatedAt').textContent = `${loggedInUser_Role=="mentor" ? `Received`:`Sent`} On: ${new Date(request.created_at).toLocaleDateString()}`;
                document.getElementById('modal-Skills').textContent = `Skills: ${JSON.parse(request.skills).join(', ')}`;
                document.getElementById('modal-Interests').textContent = `Interests: ${JSON.parse(request.interests).join(', ')}`;
                
                const modalActions = document.getElementById('modal-Actions');
                modalActions.innerHTML = '';

                if (request.status === 'pending') {
                    if (loggedInUser_Role === 'mentor') {
                        modalActions.innerHTML = `
                            <button class="accept-btn px-4 py-2 bg-green-500 text-white rounded" data-id="${request.request_id}">Accept Request</button>
                            <button class="reject-btn px-4 py-2 bg-red-400 text-white rounded" data-id="${request.request_id}">Reject Request</button>
                        `;
                    } else if (loggedInUser_Role === 'mentee') {
                        modalActions.innerHTML = `
                            <button class="delete-btn px-4 py-2 bg-red-400 text-white rounded" data-id="${request.request_id}">Delete Request</button>
                        `;
                    }
                }

                document.getElementById('requestModal').style.display = 'flex';

                document.querySelectorAll('.accept-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const requestId = button.getAttribute('data-id');
                        updateRequestStatus(requestId, 'accepted');
                        document.getElementById('requestModal').style.display = 'none';
                    });
                });

                document.querySelectorAll('.reject-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const requestId = button.getAttribute('data-id');
                        updateRequestStatus(requestId, 'declined');
                        document.getElementById('requestModal').style.display = 'none';
                    });
                });

                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const requestId = button.getAttribute('data-id');
                        deleteRequest(requestId);
                        document.getElementById('requestModal').style.display = 'none';
                    });
                });

                
            });

            // Add event listeners for accept, reject, and delete buttons

            

            requestList.appendChild(requestCard);
        });

        // Update pagination buttons visibility
        document.getElementById('prevButtonRequests').style.display = currentPageRequests === 1 ? 'none' : 'inline';
        document.getElementById('nextButtonRequests').style.display = currentPageRequests >= Math.ceil(requests.length / requestsPerPage) ? 'none' : 'inline';
        
        

        document.querySelectorAll('.chat-btn').forEach(button => {
            button.addEventListener('click', () => {
                document.getElementById('chatModal').style.display = 'flex';
                const Id = button.getAttribute('request-id');
                document.getElementById('sendChatBtn').addEventListener('click',()=>{
                    const message = document.getElementById('chatMessage').value;
                    sendChatMessage(Id, message, loggedInUser_Role);
                    document.getElementById('chatModal').style.display = 'none';
                    document.getElementById('requestModal').style.display='none';
                    document.getElementById('chatMessage').value = '';
                })
            });
        });
    }



    function sendChatMessage(Id, message, role){
        const chatMessage = {
            Id, message, role
        };
        makeApiCall('/api/sendChatMessage', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(chatMessage)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Message sent successfully') {
                showAlert('Message sent successfully!', 'success');
            } else {
                showAlert('Error sending message', 'error');
            }
        })
        .catch(error => console.error('Error:', error));

    }










    function filterRequests() {
        const statusFilter = document.getElementById('statusFilter').value;

        const filteredRequests = allRequests.filter(request => {
            return statusFilter ? request.status === statusFilter : true;
        });

        displayRequests(filteredRequests);
    }

    document.getElementById('prevButtonRequests').addEventListener('click', () => {
        if (currentPageRequests > 1) {
            currentPageRequests--;
            filterRequests();
        }
    });

    document.getElementById('nextButtonRequests').addEventListener('click', () => {
        if (currentPageRequests < Math.ceil(allRequests.length / requestsPerPage)) {
            currentPageRequests++;
            filterRequests();
        }
    });

    
    document.getElementById('statusFilter').addEventListener('change', filterRequests);





    



    async function updateRequestStatus(requestId, status) {
        const response = await makeApiCall(`/api/requests/${requestId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            fetchRequests(); // Refresh the requests list
        } else {
            console.error('Error updating request status:', response.statusText);
        }
    }

    async function deleteRequest(requestId) {
        const response = await makeApiCall(`/api/requests/${requestId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            fetchRequests(); // Refresh the requests list
        } else {
            console.error('Error deleting request:', response.statusText);
        }
    }




































    fetchUsers();
    async function fetchUsers() {
        const response = await makeApiCall('/api/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            allUsers = data.users; // Store all users
            displayUsers(allUsers); // Display users on the first load
        } else {
            console.error('Error fetching users:', response.statusText);
        }
    }

    function displayUsers(users) {
        const userList = document.getElementById('userList');
        userList.innerHTML = ''; // Clear the user list before populating

        // Calculate the start and end index for pagination
        const startIndex = (currentPage - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const paginatedUsers = users.slice(startIndex, endIndex); // Get users for the current page

        paginatedUsers.forEach(user => {
            const userCard = document.createElement('div');
            userCard.classList.add('user-card', 'p-4', 'rounded', 'shadow', 'cursor-pointer', 'flex', 'justify-between', 'items-center');
            userCard.classList.add(user.role === 'mentor' ? 'mentor-card' : 'mentee-card');
            const skillsArray = JSON.parse(user.skills);
            if(skillsArray){

                userCard.innerHTML = `
                    <h3 class="text-xl font-semibold">${user.name}</h3>
                    <div class="skills flex">
                        ${skillsArray.slice(0, 3).map(skill => `<span class="skill">${skill}</span>`).join('')}
                        ${skillsArray.length > 3 ? '<span class="skill">...</span>' : ''}
                    </div>
                `;
    
                userCard.addEventListener('click', () => {
                    document.getElementById('modalName').textContent = user.name;
                    document.getElementById('modalSkills').textContent = `Skills: ${skillsArray.join(', ')}`;
                    document.getElementById('modalBio').textContent = `Bio: ${user.bio}`;
                    document.getElementById('modalInterests').textContent = `Interests: ${JSON.parse(user.interests).join(', ')}`;
                    document.getElementById('mentorshipRequestBtn').setAttribute('mentor-id', user.user_id);
                    document.getElementById('userModal').style.display = 'flex';
                    
                    if(user.role == 'mentee' || loggedInUser_Role=='mentor'){
                        const btn = document.querySelector('.mentorshipBtn').style.display='none';
                    }
                    else{
                        const btn = document.querySelector('.mentorshipBtn').style.display='inline-block';
                    }
                });
    
    
                userList.appendChild(userCard);
            }
        });

        // Update pagination buttons visibility
        document.getElementById('prevButton').style.display = currentPage === 1 ? 'none' : 'inline';
        document.getElementById('nextButton').style.display = currentPage >= Math.ceil(users.length / usersPerPage) ? 'none' : 'inline';
    }

    function filterUsers() {
        const roleFilter = document.getElementById('roleFilter').value;
        const skillsFilter = document.getElementById('skillsFilter').value!='' ? document.getElementById('skillsFilter').value.toLowerCase().split(',').map(skill => skill.trim()) : [];
        const interestsFilter = document.getElementById('interestsFilter').value!=''? document.getElementById('interestsFilter').value.toLowerCase().split(',').map(interest => interest.trim()) : [];

        const filteredUsers = allUsers.filter(user => {
            const userSkills = JSON.parse(user.skills).map(skill => skill.toLowerCase());
            const userInterests = JSON.parse(user.interests).map(interest => interest.toLowerCase());

            const roleMatch = roleFilter ? user.role === roleFilter : true;
            const skillsMatch = skillsFilter.length > 0 ? skillsFilter.every(skill => userSkills.includes(skill)) : true;
            const interestsMatch = interestsFilter.length > 0 ? interestsFilter.every(interest => userInterests.includes(interest)) : true;

            return roleMatch && skillsMatch && interestsMatch;
        });

        displayUsers(filteredUsers);
    }

    document.getElementById('roleFilter').addEventListener('change', filterUsers);
    document.getElementById('skillsFilter').addEventListener('input', filterUsers);
    document.getElementById('interestsFilter').addEventListener('input', filterUsers);

    document.getElementById('prevButton').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            filterUsers();
        }
    });

    document.getElementById('nextButton').addEventListener('click', () => {
        if (currentPage < Math.ceil(allUsers.length / usersPerPage)) {
            currentPage++;
            filterUsers();
        }
    });

    document.getElementById('closeModalBtn').addEventListener('click', () => {
        document.getElementById('userModal').style.display = 'none';
    });
    document.getElementById('close-ModalBtn').addEventListener('click', () => {
        document.getElementById('requestModal').style.display = 'none';
    });
    document.getElementById('closeChatModalBtn').addEventListener('click',()=>{
        document.getElementById('chatModal').style.display = 'none';
        document.getElementById('requestModal').style.display = 'none';
    })
    

    document.getElementById('btn-section1').addEventListener('click', () => {
        document.getElementById('section1').classList.remove('hidden');
        document.getElementById('section2').classList.add('hidden');
        document.getElementById('btn-section1').classList.add('active');
        document.getElementById('btn-section2').classList.remove('active');
    });

    document.getElementById('btn-section2').addEventListener('click', () => {
        document.getElementById('section2').classList.remove('hidden');
        document.getElementById('section1').classList.add('hidden');
        document.getElementById('btn-section1').classList.remove('active');
        document.getElementById('btn-section2').classList.add('active');
    });

    // Display dummy data on page load
    // displayUsers(allUsers);


    document.getElementById('clearFilter').addEventListener('click', function(){
        document.getElementById('roleFilter').value = '';
        document.getElementById('skillsFilter').value = '';
        document.getElementById('interestsFilter').value = '';
        filterUsers();
    })

    document.getElementById('clearFilterRequests').addEventListener('click', function(){
        document.getElementById('statusFilter').value = '';
        filterRequests();
    })




    const buttons = document.querySelectorAll('.mentorshipBtn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const mentorID = this.getAttribute('mentor-id');
            sendMentorshipRequest(mentorID);
        });
    });

    

















    function sendMentorshipRequest(mentorID) {
        const accessToken = localStorage.getItem('accessToken');
    
        makeApiCall('/api/mentorship-request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mentorID })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Mentorship request sent successfully!','success');
                fetchRequests();
                // Optionally refresh the request list
                // location.reload();
            } else {
                showAlert('Failed to send request: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
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