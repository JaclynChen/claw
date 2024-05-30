// Add event listener to navigation links
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        const href = link.getAttribute('href');
        window.location.href = href;
    });
});