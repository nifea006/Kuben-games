// Fetch leaderboard data from localStorage
function updateLeaderboard() {
    const difficultyDropdown = document.getElementById('difficultyDropdown');
    const selectedDifficulty = difficultyDropdown ? difficultyDropdown.value : 'easy';
    const leaderboard = (JSON.parse(localStorage.getItem('leaderboard')) || []).filter(e => e.difficulty === selectedDifficulty);
    leaderboard.sort((a, b) => b.score - a.score);

    const leaderboardList = document.getElementById('leaderboardList');
    const firstPlaceTemplate = document.getElementById('firstPlaceTemplate');
    firstPlaceTemplate.style.display = 'none';

    const userData = JSON.parse(localStorage.getItem('userData')) || {};

    // First place
    if (leaderboard.length > 0) {
        const first = leaderboard[0];
        const nicknameSpan = firstPlaceTemplate.querySelector('#firstPlaceNickname');
        const pointsSpan = firstPlaceTemplate.querySelector('#firstPlacePoints');
        nicknameSpan.textContent = `${first.nickname}`;
        pointsSpan.textContent = `   ${first.score} points`;

        // Highlight logged-in user
        nicknameSpan.className = "nickname";
        if (userData.nickname && first.nickname === userData.nickname) {
            nicknameSpan.classList.add('logged-in');
        }
        firstPlaceTemplate.style.display = '';
    } else {
        firstPlaceTemplate.style.display = 'none';
    }

    // Remove all other places (keep firstPlaceTemplate)
    Array.from(leaderboardList.children).forEach((li) => {
        if (li !== firstPlaceTemplate) leaderboardList.removeChild(li);
    });

    // Other places
    leaderboard.slice(1).forEach((entry, index) => {
        const listItem = document.createElement('li');

        // Nickname span
        const nicknameSpan = document.createElement('span');
        nicknameSpan.textContent = `${index + 2}. ${entry.nickname}`;
        nicknameSpan.classList.add('nickname');
        if (userData.nickname && entry.nickname === userData.nickname) {
            nicknameSpan.classList.add('logged-in');
        }

        // Points span
        const pointsSpan = document.createElement('span');
        pointsSpan.textContent = ` ${entry.score} points`;
        pointsSpan.classList.add('points');

        listItem.appendChild(nicknameSpan);
        listItem.appendChild(pointsSpan);

        leaderboardList.appendChild(listItem);
    });
}

document.getElementById('difficultyDropdown').addEventListener('change', updateLeaderboard);

updateLeaderboard();
