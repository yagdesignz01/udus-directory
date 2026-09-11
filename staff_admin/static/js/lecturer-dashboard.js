const currentStaffId = localStorage.getItem('currentStaffId');

// Send the user back to login when no staff ID is stored.
if (!currentStaffId) {
    window.location.replace('/lecturer-login/');
}

// Remove the saved staff ID and return to the login page.
function handleLogout() {
    localStorage.removeItem('currentStaffId');
    window.location.href = '/lecturer-login/';
}

document.getElementById('logoutLink')?.addEventListener('click', handleLogout);
document.getElementById('mobileLogoutBtn')?.addEventListener('click', handleLogout);

document.getElementById('discardBtn')?.addEventListener('click', () => {
    window.location.reload();
});

// Scroll to a dashboard section when a sidebar link is clicked.
document.querySelectorAll('.nav-link[data-target]').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.nav-link[data-target]').forEach(sidebarLink => {
            sidebarLink.classList.remove('active');
        });

        link.classList.add('active');
        const targetSection = document.getElementById(link.dataset.target);

        if (targetSection) {
            const targetPosition = (
                targetSection.getBoundingClientRect().top
                + window.scrollY
                - 100
            );

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Open the hidden file input when the upload button is clicked.
document.getElementById('uploadTriggerBtn')?.addEventListener('click', () => {
    document.getElementById('imageUpload')?.click();
});

// Show a preview when a new profile image is selected.
document.getElementById('imageUpload')?.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();

        reader.onload = function(event) {
            const displayPhoto = document.getElementById('displayPhoto');
            if (displayPhoto) {
                displayPhoto.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:20px;">`;
            }

            const saveStatus = document.querySelector('.save-status');
            if (saveStatus) {
                saveStatus.innerHTML = '<span class="dot" style="background:var(--udus-plum)"></span> Unsaved photo changes';
            }
        };

        reader.readAsDataURL(this.files[0]);
    }
});

// These elements are used to add and remove course chips.
const tagShell = document.getElementById('tagShell');
const tagInput = document.getElementById('tagInput');

function addChip(value) {
    if (!value.trim() || !tagShell || !tagInput) return;

    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${value.trim().toUpperCase()}<button data-remove="${value.trim()}">✕</button>`;

    tagShell.insertBefore(chip, tagInput);
    tagInput.value = '';
}

// Show the same profile image in the main preview and the sidebar avatar.
function showProfileImage(imageUrl, displayPhoto, sidebarAvatar) {
    const imageHTML = `<img src="${imageUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;

    if (displayPhoto) {
        displayPhoto.innerHTML = imageHTML;
    }

    if (sidebarAvatar) {
        sidebarAvatar.innerHTML = imageHTML;
    }
}

// Show initials when the lecturer has not uploaded a profile image.
function showProfileInitials(name, displayPhoto, sidebarAvatar) {
    const safeName = name || 'User';

    const nameParts = safeName
        .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/i, '')
        .trim()
        .split(' ');

    const initials = (
        nameParts[0][0]
        + (nameParts[1] ? nameParts[1][0] : '')
    ).toUpperCase();

    if (displayPhoto) {
        displayPhoto.innerHTML = initials;
    }

    if (sidebarAvatar) {
        sidebarAvatar.innerHTML = initials;
    }
}

// Put the profile values into the matching HTML input fields.
function fillProfileFields(profileData) {
    // Match each HTML input ID with the value from the server.
    const profileFields = {
        profName: profileData.name,
        profRank: profileData.rank,
        profQual: profileData.highest_qualification,
        profResearch: profileData.research_interests,
        profBuilding: profileData.building,
        profFloor: profileData.floor,
        profOffice: profileData.office_number,
        profGuidance: profileData.guidance,
        profOfficeHours: profileData.working_hours,
        profEmail: profileData.email,
        profWhatsapp: profileData.whatsapp
    };

    for (const [fieldId, fieldValue] of Object.entries(profileFields)) {
        const field = document.getElementById(fieldId);

        if (field) {
            field.value = fieldValue || '';
        }
    }
}

tagInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        addChip(tagInput.value);
    }
});

tagShell?.addEventListener('click', event => {
    const removeButton = event.target.closest('button[data-remove]');

    if (removeButton) {
        removeButton.closest('.tag-chip').remove();
    }
});

// Load the current lecturer profile from the server.
async function loadProfileData() {
    if (!currentStaffId) return;

    try {
        const response = await fetch(`/api/lecturer/profile/${currentStaffId}/`);
        const data = await response.json();

        if (response.ok) {
            // Update the lecturer name and rank in the sidebar.
            const nameEl = document.querySelector('.sidebar-profile .name');
            const rankEl = document.querySelector('.sidebar-profile .rank');

            if (nameEl) nameEl.textContent = data.name;
            if (rankEl) rankEl.textContent = `${data.rank} · ${data.unit}`;

            fillProfileFields(data);

            const displayPhoto = document.getElementById('displayPhoto');
            const sidebarAvatar = document.querySelector('.sidebar-avatar');

            if (data.profile_image && data.profile_image.trim() !== '') {
                showProfileImage(data.profile_image, displayPhoto, sidebarAvatar);
            } else {
                showProfileInitials(data.name, displayPhoto, sidebarAvatar);
            }

            if (tagShell && data.courses_taught) {
                tagShell.querySelectorAll('.tag-chip').forEach(chip => chip.remove());

                const courses = data.courses_taught
                    .split(',')
                    .map(course => course.trim())
                    .filter(course => course);

                courses.forEach(course => addChip(course));
            }
        } else {
            console.warn(
                'Could not fetch profile. Ensure server is running.',
                data.error
            );
        }
    } catch (error) {
        console.error('Network error fetching profile:', error);
    }
}

// Start loading the profile immediately.
loadProfileData();

// Save the changed profile information.
document.getElementById('publishBtn')?.addEventListener('click', async () => {
    const formData = new FormData();

    // Add the text fields to the form data.
    formData.append('highest_qualification', document.getElementById('profQual')?.value || '');
    formData.append('research_interests', document.getElementById('profResearch')?.value || '');
    formData.append('building', document.getElementById('profBuilding')?.value || '');
    formData.append('floor', document.getElementById('profFloor')?.value || '');
    formData.append('office_number', document.getElementById('profOffice')?.value || '');
    formData.append('guidance', document.getElementById('profGuidance')?.value || '');
    formData.append('working_hours', document.getElementById('profOfficeHours')?.value || '');
    formData.append('email', document.getElementById('profEmail')?.value || '');
    formData.append('whatsapp', document.getElementById('profWhatsapp')?.value || '');
    formData.append('password', document.getElementById('profPassword')?.value || '');

    if (tagShell) {
        const courseChips = Array.from(
            tagShell.querySelectorAll('.tag-chip')
        ).map(chip => chip.textContent.replace('✕', '').trim());

        formData.append('courses_taught', courseChips.join(', '));
    }

    const fileInput = document.getElementById('imageUpload');
    if (fileInput && fileInput.files.length > 0) {
        formData.append('profile_image', fileInput.files[0]);
    }

    try {
        const response = await fetch(`/api/lecturer/profile/${currentStaffId}/`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const statusText = document.querySelector('.save-status');
            if (statusText) {
                statusText.innerHTML = '<span class="dot" style="background:var(--udus-dark-green)"></span> All changes published';
            }

            // Clear the password box after a successful save.
            const pwBox = document.getElementById('profPassword');
            if (pwBox) pwBox.value = '';

            Swal.fire({
                title: 'Success!',
                text: 'Profile updated successfully!',
                icon: 'success',
                confirmButtonColor: '#008001',
                borderRadius: '12px'
            });

            loadProfileData();
        } else {
            Swal.fire({
                title: 'Access Denied',
                text: 'Invalid Staff ID or Password',
                icon: 'error',
                confirmButtonColor: '#D32F2F',
                borderRadius: '12px'
            });
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Network Error: Failed to connect to server.');
    }
});