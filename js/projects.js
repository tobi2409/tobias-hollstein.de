document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.page-button')
    const pages = document.querySelectorAll('.pages > .overview')
    const storageKey = 'projects.activeRubrik'

    function showPage(target) {
        pages.forEach(p => p.style.display = p.classList.contains(target) ? '' : 'none')
        buttons.forEach(b => b.classList.toggle('active', b.dataset.target === target))
        sessionStorage.setItem(storageKey, target)
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', () => showPage(btn.dataset.target));
    })

    // Restore last selected page (if available), otherwise show first page
    if (buttons.length > 0) {
        const savedTarget = sessionStorage.getItem(storageKey)
        const hasSavedTarget = savedTarget && Array.from(buttons).some(b => b.dataset.target === savedTarget)
        showPage(hasSavedTarget ? savedTarget : buttons[0].dataset.target)
    }
});
