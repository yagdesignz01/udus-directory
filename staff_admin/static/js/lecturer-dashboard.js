const currentStaffId = localStorage.getItem('currentStaffId');

if (!currentStaffId) {
    window.location.replace('/lecturer-login/');
}

function handleLogout() {
    localStorage.removeItem('currentStaffId');
    window.location.href = '/lecturer-login/';
}

document.getElementById('logoutLink')?.addEventListener('click', handleLogout);
document.getElementById('mobileLogoutBtn')?.addEventListener('click', handleLogout);

document.getElementById('discardBtn')?.addEventListener('click', () => {
    window.location.reload();
});

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

document.getElementById('uploadTriggerBtn')?.addEventListener('click', () => {
    document.getElementById('imageUpload')?.click();
});

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

function showProfileImage(imageUrl, displayPhoto, sidebarAvatar) {
    const imageHTML = `<img src="${imageUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;

    if (displayPhoto) {
        displayPhoto.innerHTML = imageHTML;
    }

    if (sidebarAvatar) {
        sidebarAvatar.innerHTML = imageHTML;
    }
}

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

function fillProfileFields(profileData) {
    const profileFields = {
        profName: profileData.name,
        profTitle: profileData.title,
        profQual: profileData.highest_qualification,
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

document.getElementById('otherSpecCheckbox')?.addEventListener('change', function() {
    const otherInput = document.getElementById('otherSpecInput');
    if(otherInput) {
        otherInput.disabled = !this.checked;
        if (this.checked) {
            otherInput.focus();
        } else {
            otherInput.value = '';
        }
    }
});

async function loadProfileData() {
    if (!currentStaffId) return;

    try {
        const response = await fetch(`/api/lecturer/profile/${currentStaffId}/`);
        const data = await response.json();

        if (response.ok) {
            const nameEl = document.querySelector('.sidebar-profile .name');
            const titleEl = document.getElementById('sidebarTitle');

            if (nameEl) nameEl.textContent = data.name;
            if (titleEl) titleEl.textContent = data.title || 'Academic Staff';

            fillProfileFields(data);

            if (data.research_interests) {
                const specs = data.research_interests.split(',').map(s => s.trim());
                const checkboxes = document.querySelectorAll('#specializationCheckboxes input[type="checkbox"]');
                const otherInput = document.getElementById('otherSpecInput');
                const otherCheckbox = document.getElementById('otherSpecCheckbox');

                specs.forEach(spec => {
                    let matched = false;
                    checkboxes.forEach(cb => {
                        if (cb.value !== 'Other' && cb.value.toLowerCase() === spec.toLowerCase()) {
                            cb.checked = true;
                            matched = true;
                        }
                    });
                    if (!matched && spec !== '') {
                        if(otherCheckbox) otherCheckbox.checked = true;
                        if(otherInput) {
                            otherInput.disabled = false;
                            otherInput.value = spec;
                        }
                    }
                });
            }

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

loadProfileData();

// --- VALIDATION & SAVE LOGIC ---
const emailInput = document.getElementById('profEmail');
const emailError = document.getElementById('emailError');
const phoneInput = document.getElementById('profWhatsapp');
const phoneError = document.getElementById('phoneError');
const otherInput = document.getElementById('otherSpecInput');
const otherError = document.getElementById('otherSpecError');
const publishBtn = document.getElementById('publishBtn');

function validateContactInfo() {
    let isValid = true;
    
    // Email Validation
    const emailVal = emailInput?.value.trim().toLowerCase() || '';
    if (emailVal !== '' && !emailVal.endsWith('@udusok.edu.ng')) {
        if(emailError) emailError.style.display = 'block';
        isValid = false;
    } else {
        if(emailError) emailError.style.display = 'none';
    }

    // Phone Validation
    const phoneVal = phoneInput?.value.trim() || '';
    const phoneRegex = /^\+?[0-9\s\-]+$/;
    if (phoneVal !== '' && !phoneRegex.test(phoneVal)) {
        if(phoneError) phoneError.style.display = 'block';
        isValid = false;
    } else {
        if(phoneError) phoneError.style.display = 'none';
    }

    // --- PASSWORD STRENGTH LOGIC ---
    const passwordInput = document.getElementById('profPassword');
    const strengthContainer = document.getElementById('passwordStrengthContainer');
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthLabel = document.getElementById('strengthLabel');

    passwordInput?.addEventListener('input', function() {
    const val = this.value;
    
    // Hide the bar if the password field is empty
    if (val.length === 0) {
        strengthContainer.style.display = 'none';
        return;
    }

    strengthContainer.style.display = 'block';

    // Calculate points based on complexity
    let score = 0;
    if (val.length >= 8) score++; // Good length
    if (/[a-z]/.test(val)) score++; // Has lowercase
    if (/[A-Z]/.test(val)) score++; // Has uppercase
    if (/[0-9]/.test(val)) score++; // Has number
    if (/[^A-Za-z0-9]/.test(val)) score++; // Has special character

    let strengthText = 'Weak';
    let barColor = '#D32F2F'; // Red
    let barWidth = '33%';

    if (score >= 4 && val.length >= 8) {
        strengthText = 'Great';
        barColor = 'var(--udus-dgreen)'; // UDUS Green
        barWidth = '100%';
    } else if (score >= 3 && val.length >= 6) {
        strengthText = 'Good';
        barColor = '#F59E0B'; // Orange
        barWidth = '66%';
    }

    // Update the UI
    strengthBar.style.width = barWidth;
    strengthBar.style.backgroundColor = barColor;
    strengthLabel.textContent = strengthText;
    strengthLabel.style.color = barColor;
    });
    
    // "Other" Specialization Validation
    const otherVal = otherInput?.value.trim() || '';
    const nameRegex = /^[A-Za-z\s']+$/; // Letters, spaces, apostrophes only
    if (otherInput && !otherInput.disabled && otherVal !== '' && !nameRegex.test(otherVal)) {
        if(otherError) otherError.style.display = 'block';
        isValid = false;
    } else {
        if(otherError) otherError.style.display = 'none';
    }

    // Lock Submit Button if anything is invalid
    if (publishBtn) {
        if (!isValid) {
            publishBtn.disabled = true;
            publishBtn.style.opacity = '0.5';
        } else {
            publishBtn.disabled = false;
            publishBtn.style.opacity = '1';
        }
    }
    
    return isValid;
}

// Trigger checks in real-time as the lecturer types
emailInput?.addEventListener('input', validateContactInfo);
phoneInput?.addEventListener('input', validateContactInfo);
otherInput?.addEventListener('input', validateContactInfo);

// Re-check validation when the checkbox is toggled
document.getElementById('otherSpecCheckbox')?.addEventListener('change', function() {
    if(otherInput) {
        otherInput.disabled = !this.checked;
        if (this.checked) {
            otherInput.focus();
        } else {
            otherInput.value = '';
        }
    }
    validateContactInfo();
});

document.getElementById('publishBtn')?.addEventListener('click', async (event) => {
    event.preventDefault();
    
    if (!validateContactInfo()) {
        Swal.fire({
            title: 'Validation Error',
            text: 'Please fix the errors in your inputs before saving.',
            icon: 'error',
            confirmButtonColor: '#D32F2F',
            borderRadius: '12px'
        });
        return;
    }

    const formData = new FormData();

    const selectedTitle = document.getElementById('profTitle')?.value;
    if (!selectedTitle) {
        Swal.fire({
            title: 'Action Required',
            text: 'Please select your Academic Title before saving.',
            icon: 'warning',
            confirmButtonColor: '#9F4A71',
            borderRadius: '12px'
        });
        return;
    }

    const selectedSpecs = [];
    document.querySelectorAll('#specializationCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        if (cb.value === 'Other') {
            const otherVal = document.getElementById('otherSpecInput')?.value.trim();
            if (otherVal) selectedSpecs.push(otherVal.replace(/,/g, '')); // Strip commas to protect database format
        } else {
            selectedSpecs.push(cb.value);
        }
    });

    formData.append('title', selectedTitle);
    formData.append('highest_qualification', document.getElementById('profQual')?.value || '');
    formData.append('research_interests', selectedSpecs.join(', '));
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
                title: 'Save Failed',
                text: 'There was an issue updating your profile.',
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