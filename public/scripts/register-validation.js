document.getElementById('registerForm').addEventListener('submit', function(event) {
    // EMAIL must be a valid email address
    const email = document.getElementById('email').value;
    const emailPattern = /^[^@]+@[^@]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
        alert('Please enter a valid email address.');
        event.preventDefault();
        return;
    }

    const phone = document.getElementById('phone').value.trim();
    // if provided, PHONE must contain between 9 and 11 digits
    if (phone !== '' && (phone.length < 9 || phone.length > 10 || isNaN(phone))) {
        alert('Please enter a valid phone number (09 to 10 digits).');
        event.preventDefault();
        return;
    }
    // First Name and Last Name validation:only letters (including accented and special characters)
    const namePattern = /^[\p{L}]+$/u;
    // NAME and LAST NAME
    const firstName = document.getElementById('firstName').value.trim();
    if (firstName.length < 2 || !namePattern.test(firstName)) {
        alert('Your first name must contain at least 2 letters.');
        event.preventDefault();
        return;
    }
    const lastName = document.getElementById('lastName').value.trim();
    if (lastName.length < 2 || !namePattern.test(lastName)) {
        alert('Your last name must contain at least 2 letters.');
        event.preventDefault();
        return;
    }

    // zipcode
    const zipcode = document.getElementById('zipcode').value.trim();
    const zipPattern = /^\d{4,6}$/;
    if (!zipPattern.test(zipcode)) {
        alert('Please enter a valid ZIP code (4 to 6 digits).');
        event.preventDefault();
        return;
    }

});