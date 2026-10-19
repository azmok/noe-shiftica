document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('mobile-menu-open');
    const closeBtn = document.getElementById('mobile-menu-close');
    const menu = document.getElementById('mobile-menu');

    function openMenu() {
        menu.style.transform = 'translateX(0)';
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        menu.style.transform = 'translateX(100%)';
        document.body.style.overflow = '';
    }

    // Add both click and touchstart for DevTools mobile emulation compatibility
    function addTapHandler(element, handler) {
        if (!element) return;
        element.addEventListener('click', handler);
        element.addEventListener('touchstart', function(e) {
            e.preventDefault(); // Prevent ghost click after touchstart
            handler();
        }, { passive: false });
    }

    addTapHandler(openBtn, openMenu);
    addTapHandler(closeBtn, closeMenu);

    // Close menu on nav link click
    const menuLinks = menu ? menu.querySelectorAll('a') : [];
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
});
