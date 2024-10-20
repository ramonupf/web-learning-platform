const password = document.getElementById('password');
const passwordRetype = document.getElementById('passwordRetype');
const passwordMatchMessage = document.getElementById('passwordMatchMessage');

// event listeners in both password fields to check 
password.addEventListener('input', checkPasswordMatch);
passwordRetype.addEventListener('input', checkPasswordMatch);

function checkPasswordMatch() {
    if (password.value === passwordRetype.value && password.value !== "") {
        passwordMatchMessage.textContent = "Passwords match";
        passwordMatchMessage.classList.remove('error-message');
        passwordMatchMessage.classList.add('success-message');
    } else {
        passwordMatchMessage.textContent = "Passwords do not match";
        passwordMatchMessage.classList.remove('success-message');
        passwordMatchMessage.classList.add('error-message');
    }
}