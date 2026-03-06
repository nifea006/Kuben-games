let generatedOTP = "";

const EMAILJS_PUBLIC_KEY = window.EMAILJS_CONFIG.PUBLIC_KEY;
const EMAILJS_SERVICE_ID = window.EMAILJS_CONFIG.SERVICE_ID;
const EMAILJS_TEMPLATE_ID = window.EMAILJS_CONFIG.TEMPLATE_ID;

document.addEventListener('DOMContentLoaded', () => {
    const nicknameOverlay = document.getElementById('nicknameOverlay');
    const emailOverlay = document.getElementById('emailOverlay');
    const otpSection = document.getElementById('otpSection');

    // Load leaderboard from localStorage or create default
    const loadLeaderboard = () => {
        return JSON.parse(localStorage.getItem('leaderboard')) || [];
    };

    // Save leaderboard to localStorage
    const saveLeaderboard = (leaderboard) => {
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    };

    // Load user data from localStorage
    const getUserData = () => {
        return JSON.parse(localStorage.getItem('userData')) || { nickname: 'Player123', email: 'example@domain.com' };
    };

    // Save updated user data to localStorage
    const saveUserData = (key, value) => {
        const userData = getUserData();
        userData[key] = value;
        localStorage.setItem('userData', JSON.stringify(userData));
        // Update all leaderboard entries for this user
        let leaderboard = loadLeaderboard();
        if (userData.email) {
            leaderboard.forEach(entry => {
                if (entry.email === userData.email) {
                    if (key === 'nickname') entry.nickname = value;
                    if (key === 'email') entry.email = value;
                }
            });
        } else {
            // For users without email, use a temporary unique id
            const tempId = userData.nickname + '_temp_' + Date.now();
            leaderboard.forEach(entry => {
                if (entry.email === undefined || entry.email === null || entry.email === '') {
                    entry.email = tempId;
                }
                if (key === 'nickname' && entry.nickname === userData.nickname) {
                    entry.nickname = value;
                }
            });
            // Remove temp entries on unload
            window.addEventListener('beforeunload', function () {
                let lb = loadLeaderboard();
                lb = lb.filter(entry => !(entry.email && entry.email.endsWith('_temp_' + Date.now())));
                saveLeaderboard(lb);
            });
        }
        saveLeaderboard(leaderboard);
    };

    // Mask email for security
    const maskEmail = (email) => {
        return email.replace(/(.{3}).+(.{2}@.+)/, '$1***$2');
    };

    // Render player info and live leaderboard
    const renderPlayerInfo = () => {
        const userData = getUserData();
        document.getElementById('nicknameDisplay').textContent = userData.nickname;
        if (userData.email && userData.email.endsWith('_temp_')) {
            document.getElementById('emailDisplay').textContent = '(Guest)';
        } else {
            document.getElementById('emailDisplay').textContent = maskEmail(userData.email);
        }

        renderLiveLeaderboard();
    };

    function renderLiveLeaderboard() {
        const selectedDifficulty = document.getElementById('playerDifficultyDropdown').value;
        const leaderboard = loadLeaderboard()
            .filter(entry => entry.difficulty === selectedDifficulty)
            .sort((a, b) => b.score - a.score);
        const list = document.getElementById('playerLiveLeaderboard');
        const firstPlaceTemplate = document.getElementById('playerFirstPlaceTemplate');
        firstPlaceTemplate.style.display = 'none';

        const userData = getUserData();
        const userIndex = leaderboard.findIndex(entry => entry.nickname === userData.nickname);

        let start = Math.max(0, userIndex - 1);
        let end = Math.min(leaderboard.length, userIndex + 2);
        if (userIndex === 0) {
            end = Math.min(leaderboard.length, 3);
        } else if (userIndex === leaderboard.length - 1) {
            start = Math.max(0, leaderboard.length - 3);
        }

        // Remove all other places (keep firstPlaceTemplate)
        Array.from(list.children).forEach((li) => {
            if (li !== firstPlaceTemplate) list.removeChild(li);
        });

        for (let i = start; i < end; i++) {
            const entry = leaderboard[i];
            if (!entry) continue;
            if (i === 0) {
                // Use the template for first place
                firstPlaceTemplate.style.display = '';
                const nicknameSpan = firstPlaceTemplate.querySelector('#playerFirstPlaceNickname');
                const pointsSpan = firstPlaceTemplate.querySelector('#playerFirstPlacePoints');
                nicknameSpan.textContent = entry.nickname;
                pointsSpan.textContent = `${entry.score} points`;
                nicknameSpan.className = "nickname";
                if (userData.nickname && entry.nickname === userData.nickname) {
                    nicknameSpan.classList.add('logged-in');
                }
                if (list.firstChild !== firstPlaceTemplate) {
                    list.insertBefore(firstPlaceTemplate, list.firstChild);
                }
            } else {
                const li = document.createElement('li');
                li.className = '';
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';
                const nicknameSpan = document.createElement('span');
                nicknameSpan.textContent = `${i + 1}. ${entry.nickname}`;
                nicknameSpan.classList.add('nickname');
                if (userData.nickname && entry.nickname === userData.nickname) {
                    nicknameSpan.classList.add('logged-in');
                    li.style.fontWeight = 'bold';
                }
                const pointsSpan = document.createElement('span');
                pointsSpan.textContent = `${entry.score} points`;
                pointsSpan.classList.add('points');
                li.appendChild(nicknameSpan);
                li.appendChild(pointsSpan);
                if (i === 1 && firstPlaceTemplate.style.display !== 'none') {
                    if (list.children.length > 1) {
                        list.insertBefore(li, list.children[1]);
                    } else {
                        list.appendChild(li);
                    }
                } else {
                    list.appendChild(li);
                }
            }
        }
    }

    document.getElementById('playerDifficultyDropdown').addEventListener('change', renderLiveLeaderboard);

    // Check if nickname is taken (by another email)
    const isNicknameTaken = (nickname, email) => {
        const leaderboard = loadLeaderboard();
        return leaderboard.some(entry => entry.nickname.toLowerCase() === nickname.toLowerCase() && entry.email !== email);
    };

    // Add or update leaderboard entry for current user
    const upsertLeaderboardEntry = (nickname, email) => {
        let leaderboard = loadLeaderboard();
        let entry = leaderboard.find(e => e.email === email);
        if (entry) {
            entry.nickname = nickname;
        } else {
            leaderboard.push({ nickname, email, points: 0 });
        }
        saveLeaderboard(leaderboard);
    };

    // Change Nickname
    document.getElementById('changeNicknameButton').addEventListener('click', () => {
        nicknameOverlay.classList.remove('hidden');
    });

    document.getElementById('saveNicknameButton').addEventListener('click', () => {
        const newNickname = document.getElementById('newNickname').value.trim();
        const userData = getUserData();
        if (!newNickname) {
            alert('Please enter a valid nickname.');
            return;
        }
        if (isNicknameTaken(newNickname, userData.email)) {
            alert('This nickname is already taken.');
            return;
        }
        // Save nickname to userData and leaderboard
        saveUserData('nickname', newNickname);
        upsertLeaderboardEntry(newNickname, userData.email);
        nicknameOverlay.classList.add('hidden');
        renderPlayerInfo();
    });

    // Cancel button for nickname overlay
    const cancelNicknameBtn = document.getElementById('cancelNicknameButton');
    cancelNicknameBtn.addEventListener('click', () => {
        nicknameOverlay.classList.add('hidden');
    });

    // Change Email
    document.getElementById('changeEmailButton').addEventListener('click', () => {
        emailOverlay.classList.remove('hidden');
    });

    // Cancel button for email overlay
    const cancelEmailBtn = document.getElementById('cancelEmailButton');
    cancelEmailBtn.addEventListener('click', () => {
        emailOverlay.classList.add('hidden');
    });


    // Initialize EmailJS
    emailjs.init(EMAILJS_PUBLIC_KEY); // Use your public key

    // Send OTP on email form submit (player info)
    document.getElementById('sendOtpButton').addEventListener('click', function(event) {
        event.preventDefault();
        const email = document.getElementById('newEmail').value.trim();
        if (!email) {
            alert('Please enter a valid email.');
            return;
        }
        generatedOTP = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
        sendOtp(email);
        otpSection.classList.remove('hidden');
    });

    // Function to send the OTP using EmailJS (player info)
    function sendOtp(email) {
        if (!email || !email.includes("@")) {
            alert("Please enter a valid email address.");
            return;
        }
        const templateParams = {
            to_email: email,
            passcode: generatedOTP
        };
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
            .then(function () {
                alert("One-time password sent successfully to " + email);
            })
            .catch(function(error) {
                alert("Failed to send OTP: " + error.text);
            });
    }

    // Verify OTP (player info)
    document.getElementById('verifyOtpButton').addEventListener('click', function(event) {
        event.preventDefault();
        const enteredOtp = document.getElementById('otp').value;
        if (enteredOtp === generatedOTP) {
            alert('One-time password verified successfully!');
            const newEmail = document.getElementById('newEmail').value;
            // Update leaderboard entry with new email
            let leaderboard = loadLeaderboard();
            leaderboard.forEach(entry => {
                if (entry.email === getUserData().email) {
                    entry.email = newEmail;
                }
            });
            saveLeaderboard(leaderboard);
            // Save new email to userData
            saveUserData('email', newEmail);
            emailOverlay.classList.add('hidden');
            alert('Email changed successfully!');
            renderPlayerInfo();
        } else {
            alert('Invalid one-time password. Please try again.');
        }
    });

    // Logout
    document.getElementById('logoutButton').addEventListener('click', () => {
        alert('Logged out');
        localStorage.removeItem('userData');
        window.location.href = '../../index.html';
    });

    // Initial render
    renderPlayerInfo();
});