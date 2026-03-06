let userData = JSON.parse(localStorage.getItem('userData')) || {};
let generatedOTP = "";
let tempEmail = "";

const emailConfig = window.EMAILJS_CONFIG || null;
const hasEmailConfig = !!(
    emailConfig &&
    emailConfig.PUBLIC_KEY &&
    emailConfig.SERVICE_ID &&
    emailConfig.TEMPLATE_ID
);

const EMAILJS_PUBLIC_KEY = emailConfig ? emailConfig.PUBLIC_KEY : null;
const EMAILJS_SERVICE_ID = emailConfig ? emailConfig.SERVICE_ID : null;
const EMAILJS_TEMPLATE_ID = emailConfig ? emailConfig.TEMPLATE_ID : null;

document.addEventListener('DOMContentLoaded', () => {
    const nicknameOverlay = document.getElementById('nicknameOverlay');
    const loginOverlay = document.getElementById('loginOverlay');

    const hideNicknameOverlay = () => {
        nicknameOverlay.style.display = 'none';
    };
    const hideLoginOverlay = () => {
        loginOverlay.style.display = 'none';
    };

    const showNicknameOverlay = () => {
        nicknameOverlay.style.display = 'flex';
    };
    const showLoginOverlay = () => {
        loginOverlay.style.display = 'flex';
    };
    const hasNickname = () => typeof userData.nickname === 'string' && userData.nickname.trim().length > 0;
    const syncOverlaysForNickname = () => {
        if (hasNickname()) {
            hideLoginOverlay();
            hideNicknameOverlay();
            return;
        }
        if (!hasEmailConfig) {
            hideLoginOverlay();
            showNicknameOverlay();
            return;
        }
        showLoginOverlay();
        hideNicknameOverlay();
    };

    syncOverlaysForNickname();

    // Close button for login overlay (single button)
    document.getElementById('closeOverlayButton').addEventListener('click', () => {
        if (!hasEmailConfig) {
            hideLoginOverlay();
            showNicknameOverlay();
            return;
        }
        if (!hasNickname()) {
            if (confirm('If you continue without registering, your progress will not be saved. Do you want to continue anyway?')) {
                hideLoginOverlay();
                showNicknameOverlay();
            } else {
                showLoginOverlay();
            }
        } else {
            hideLoginOverlay();
        }
    });

    // Save user data to local storage
    const saveUserData = (key, value) => {
        userData[key] = value;
        localStorage.setItem('userData', JSON.stringify(userData));
    };

    // Initialize EmailJS
    if (hasEmailConfig) {
        emailjs.init({
            publicKey: EMAILJS_PUBLIC_KEY
        });
    }

    // Send OTP on login form submit
    document.getElementById('loginForm').addEventListener('submit', function (event) {
        event.preventDefault();
        if (!hasEmailConfig) {
            alert('Email login is unavailable (missing config). Please choose a nickname.');
            hideLoginOverlay();
            showNicknameOverlay();
            return;
        }
        const email = document.getElementById('email').value.trim();
        if (!email) {
            alert('Please enter a valid email.');
            return;
        }
        tempEmail = email;
        sendOtp(email);
        document.getElementById('otpForm').classList.remove('hidden');
    });

    // Function to send the OTP using EmailJS
    function sendOtp(email) {
        if (!hasEmailConfig) {
            alert('Email login is unavailable (missing config).');
            return;
        }
        if (!email || !email.includes("@")) {
            alert("Please enter a valid email address.");
            return;
        }

        generatedOTP = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");

        const templateParams = {
            to_email: email,
            passcode: generatedOTP
        };

        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
            .then(function () {
                alert("One-time password sent successfully to " + email);
            })
            .catch(function (error) {
                alert("Failed to send OTP: " + error.text);
            });
    }

    // --- Helper functions ---
    function loadLeaderboard() {
        return JSON.parse(localStorage.getItem('leaderboard')) || [];
    }
    function saveLeaderboard(leaderboard) {
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }
    function isNicknameTaken(nickname, email) {
        const leaderboard = loadLeaderboard();
        return leaderboard.some(entry => entry.nickname.toLowerCase() === nickname.toLowerCase() && entry.email !== email);
    }
    function upsertLeaderboardEntry(nickname, email, difficulty, score) {
        let leaderboard = loadLeaderboard();
        let entry = leaderboard.find(e => e.email === email && e.difficulty === difficulty);
        if (entry) {
            entry.nickname = nickname;
            if (score !== undefined && score > (entry.score || 0)) {
                entry.score = score;
            }
        } else if (score !== undefined) {
            leaderboard.push({ nickname, email, score, difficulty });
        }
        saveLeaderboard(leaderboard);
    }

    // Verify OTP
    document.getElementById('otpForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const enteredOtp = document.getElementById('otp').value;
        if (enteredOtp === generatedOTP) {
            alert('One-time password verified successfully!');
            const email = document.getElementById('email').value;
            saveUserData('email', email);

            // Check if email already exists in leaderboard
            const leaderboard = loadLeaderboard();
            const entry = leaderboard.find(e => e.email === email);
            if (entry) {
                // Auto-fill nickname and skip nickname overlay
                saveUserData('nickname', entry.nickname);
                hideLoginOverlay();
                hideNicknameOverlay();
            } else {
                hideLoginOverlay();
                showNicknameOverlay();
            }
        } else {
            alert('Invalid one-time password. Please try again.');
        }
    });

    // Save Nickname
    document.getElementById('nicknameForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const nickname = document.getElementById('nickname').value.trim();
        const email = userData.email;
        if (!nickname) {
            alert('Please enter a valid nickname.');
            return;
        }
        if (isNicknameTaken(nickname, email)) {
            alert('This nickname is already taken.');
            return;
        }
        saveUserData('nickname', nickname);
        upsertLeaderboardEntry(nickname, email);
        hideNicknameOverlay();
    });
});
