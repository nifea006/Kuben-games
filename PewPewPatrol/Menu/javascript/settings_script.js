// Save settings to local storage
document.getElementById('saveSettings').addEventListener('click', () => {
    const masterVolume = document.getElementById('masterVolume').value;
    const musicVolume = document.getElementById('musicVolume').value;
    const effectsVolume = document.getElementById('effectsVolume').value;
    const difficulty = document.getElementById('difficulty').value;

    // Save settings to local storage
    localStorage.setItem('masterVolume', masterVolume);
    localStorage.setItem('musicVolume', musicVolume);
    localStorage.setItem('effectsVolume', effectsVolume);
    localStorage.setItem('difficulty', difficulty);

    alert('Settings saved!');
});

// Navigate back to the main menu
document.getElementById('backToMenu').addEventListener('click', () => {
    window.location.href = '../../index.html';
});

// Reset settings to default values
document.getElementById('defaultSettings').addEventListener('click', () => {
    // Default values for settings
    const defaultMasterVolume = 50;
    const defaultMusicVolume = 50;
    const defaultEffectsVolume = 50;
    const defaultDifficulty = 'medium';

    // Reset sliders and dropdown to default values
    document.getElementById('masterVolume').value = defaultMasterVolume;
    document.getElementById('musicVolume').value = defaultMusicVolume;
    document.getElementById('effectsVolume').value = defaultEffectsVolume;
    document.getElementById('difficulty').value = defaultDifficulty;

    // Update the volume value displays
    document.getElementById('masterVolumeValue').textContent = defaultMasterVolume;
    document.getElementById('musicVolumeValue').textContent = defaultMusicVolume;
    document.getElementById('effectsVolumeValue').textContent = defaultEffectsVolume;

    // Save default settings to local storage
    localStorage.setItem('masterVolume', defaultMasterVolume);
    localStorage.setItem('musicVolume', defaultMusicVolume);
    localStorage.setItem('effectsVolume', defaultEffectsVolume);
    localStorage.setItem('difficulty', defaultDifficulty);

    alert('Settings have been reset to default!');
});

// Navigate to the controls settings page
document.getElementById('controlsSettings').addEventListener('click', () => {
    window.location.href = '../html/controls.html';
});

// Load settings from local storage on page load
window.onload = () => {
    const masterVolume = localStorage.getItem('masterVolume') || 50;
    const musicVolume = localStorage.getItem('musicVolume') || 50;
    const effectsVolume = localStorage.getItem('effectsVolume') || 50;
    const difficulty = localStorage.getItem('difficulty') || 'medium';

    // Set slider values
    document.getElementById('masterVolume').value = masterVolume;
    document.getElementById('musicVolume').value = musicVolume;
    document.getElementById('effectsVolume').value = effectsVolume;
    document.getElementById('difficulty').value = difficulty;

    // Update the volume value displays
    document.getElementById('masterVolumeValue').textContent = masterVolume;
    document.getElementById('musicVolumeValue').textContent = musicVolume;
    document.getElementById('effectsVolumeValue').textContent = effectsVolume;
};

const sliders = [
    { id: 'masterVolume', valueId: 'masterVolumeValue' },
    { id: 'musicVolume', valueId: 'musicVolumeValue' },
    { id: 'effectsVolume', valueId: 'effectsVolumeValue' }
];

sliders.forEach(({ id, valueId }) => {
    const slider = document.getElementById(id);
    const valueBox = document.getElementById(valueId);

    slider.addEventListener('input', () => {
        const value = slider.value;
        valueBox.textContent = value;
    });
});

// Update volume values dynamically
document.getElementById('masterVolume').addEventListener('input', (event) => {
    document.getElementById('masterVolumeValue').textContent = event.target.value;
    localStorage.setItem('masterVolume', event.target.value);
    applyVolumeSettings();
});

document.getElementById('musicVolume').addEventListener('input', (event) => {
    document.getElementById('musicVolumeValue').textContent = event.target.value;
    localStorage.setItem('musicVolume', event.target.value);
    applyVolumeSettings();
});

document.getElementById('effectsVolume').addEventListener('input', (event) => {
    document.getElementById('effectsVolumeValue').textContent = event.target.value;
    localStorage.setItem('effectsVolume', event.target.value);
    applyVolumeSettings();
});