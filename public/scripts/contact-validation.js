document.getElementById('contactForm').addEventListener('submit', function(event) {
    // NAME must contain at least 3 letters
    const name = document.getElementById('name').value.trim();
    if (name.length < 3) {
        alert('Name must contain at least 3 letters.');
        event.preventDefault();
        return;
    }

    // EMAIL must be a valid email address
    const email = document.getElementById('email').value;
    const emailPattern = /^[^@]+@[^@]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
        alert('Please enter a valid email address.');
        event.preventDefault();
        return;
    }

    const phone = document.getElementById('phone').value.trim();
    const contactMethod = document.querySelector('input[name="contact_method"]:checked');
    //one preferred CONTACT METHOD is selected
    if (!contactMethod) {
        alert('Please select at least one preferred contact method (email or phone).');
        event.preventDefault();
        return;
    }
    // PHONE must exist if it's the preferred contact method
    if (contactMethod.value === 'phone') {
        if (phone === '') {
            alert('Please provide a phone number since phone is the preferred contact method.');
            event.preventDefault();
            return;
        }

        // PHONE length and format (09 to 11 digits, numeric)
        if (phone.length < 9 || phone.length > 11 || isNaN(phone)) {
            alert('Please enter a valid phone number (09 to 11 digits).');
            event.preventDefault();
            return;
        }
    }

    // if provided, PHONE must contain between 9 and 11 digits
    if (phone !== '' && (phone.length < 9 || phone.length > 11 || isNaN(phone))) {
        alert('Please enter a valid phone number (09 to 11 digits).');
        event.preventDefault();
        return;
    }

    // Contact Days validation (at least one must be selected)
    const contact_days = document.querySelectorAll('input[name="contact_days"]:checked');
    if (contact_days.length === 0) {
        alert('Please select at least one contact day.');
        event.preventDefault();
        return;
    }

    // Message validation (must contain between 50 and 500 letters)
    const message = document.getElementById('message').value.trim();
    if (message.length < 50 || message.length > 500) {
        alert('Message must be between 50 and 500 letters.');
        event.preventDefault();
    }
});