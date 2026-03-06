// Default controls
const defaultControls = {
    moveLeft: { control1: 'ArrowLeft', control2: 'KeyA' },
    moveRight: { control1: 'ArrowRight', control2: 'KeyD' },
    shoot: { control1: 'Space', control2: 'MouseClick' }
};

// Load controls from localStorage or use defaults
let controls = JSON.parse(localStorage.getItem('controls')) || { ...defaultControls };

// Function to update control labels in the UI
function updateControlLabels() {
    Object.keys(controls).forEach((action) => {
        const control1Button = document.querySelector(`#${action} .control1`);
        const control2Button = document.querySelector(`#${action} .control2`);
        control1Button.textContent = controls[action].control1;
        control2Button.textContent = controls[action].control2;
    });

    const hideControlsCheckbox = document.getElementById('hideControlsUI');
    const hideControlsUI = JSON.parse(localStorage.getItem('hideControlsUI') || 'false');
    hideControlsCheckbox.checked = hideControlsUI;
}

// Function to change a control
function changeControl(action, type) {
    const button = document.querySelector(`#${action} .${type}`);
    button.textContent = 'Press a key...';

    const keyListener = (event) => {
        event.preventDefault();

        if (event.code === 'Escape') {
            // Dismiss the change if Esc is pressed
            button.textContent = controls[action][type];
            document.removeEventListener('keydown', keyListener);
            document.removeEventListener('mousedown', mouseListener);
            return;
        }

        controls[action][type] = event.code;
        button.textContent = event.code;
        localStorage.setItem('controls', JSON.stringify(controls));
        document.removeEventListener('keydown', keyListener);
        document.removeEventListener('mousedown', mouseListener);
    };

    const mouseListener = (event) => {
        event.stopPropagation();
        controls[action][type] = 'MouseClick';
        button.textContent = 'MouseClick';
        localStorage.setItem('controls', JSON.stringify(controls));
        document.removeEventListener('mousedown', mouseListener);
        document.removeEventListener('keydown', keyListener);
    };

    document.addEventListener('keydown', keyListener);
    document.addEventListener('mousedown', mouseListener);
}

// Save controls
function saveControls() {
    localStorage.setItem('controls', JSON.stringify(controls));
    alert('Controls have been saved!');
}

// Reset controls to default
function resetControls() {
    controls = { ...defaultControls };
    localStorage.setItem('controls', JSON.stringify(controls));
    updateControlLabels();
    alert('Controls have been reset to default!');
}

// Add event listeners to buttons
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for Save and Default buttons
    document.getElementById('saveControls').addEventListener('click', saveControls);
    document.getElementById('defaultControls').addEventListener('click', resetControls);

    // Add event listeners for control buttons
    Object.keys(controls).forEach((action) => {
        const control1Button = document.querySelector(`#${action} .control1`);
        const control2Button = document.querySelector(`#${action} .control2`);

        control1Button.addEventListener('click', () => changeControl(action, 'control1'));
        control2Button.addEventListener('click', () => changeControl(action, 'control2'));
    });

    const hideControlsCheckbox = document.getElementById('hideControlsUI');
    hideControlsCheckbox.addEventListener('change', () => { localStorage.setItem('hideControlsUI', JSON.stringify(hideControlsCheckbox.checked)); });

    // Update the control labels on page load
    updateControlLabels();
});