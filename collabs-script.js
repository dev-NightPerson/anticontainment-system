document.addEventListener('DOMContentLoaded', function() {
    // Back button functionality
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // Set CSS custom properties for card hover animations
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const angle = card.getAttribute('data-angle');
        card.style.setProperty('--angle', angle + 'deg');
        
        // Make entire card clickable but allow button to handle its own clicks
        const cardContent = card.querySelector('.card-content');
        const cardLink = card.querySelector('.card-link');
        
        if (cardContent && cardLink) {
            cardContent.addEventListener('click', (e) => {
                // Only navigate if the click wasn't on the button itself
                if (!e.target.closest('.card-link')) {
                    e.preventDefault();
                    window.open(cardLink.href, '_blank');
                }
            });
            
            // Handle button clicks separately
            cardLink.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(cardLink.href, '_blank');
            });
        }
    });

    // Create brass lines for footer
    function createBrassLines() {
        const containers = document.querySelectorAll('.brass-lines-container');
        containers.forEach(container => {
            const numLines = 10;
            
            for (let i = 0; i < numLines; i++) {
                const line = document.createElement('div');
                line.classList.add('brass-line');
                
                // Random direction and type
                const isHorizontal = Math.random() > 0.5;
                const isReverse = Math.random() > 0.5;
                
                if (isHorizontal) {
                    line.classList.add('horizontal');
                    line.style.setProperty('--length', Math.random() * 200 + 100 + 'px');
                    line.style.setProperty('--position', Math.random() * 100 + '%');
                    line.style.setProperty('--duration', Math.random() * 10 + 5 + 's');
                    
                    if (isReverse) {
                        line.style.animationName = 'moveHorizontalReverse';
                        line.style.right = '-250px';
                        line.style.left = 'auto';
                    }
                } else {
                    line.classList.add('vertical');
                    line.style.setProperty('--length', Math.random() * 200 + 100 + 'px');
                    line.style.setProperty('--position', Math.random() * 100 + '%');
                    line.style.setProperty('--duration', Math.random() * 10 + 5 + 's');
                    
                    if (isReverse) {
                        line.style.animationName = 'moveVerticalReverse';
                        line.style.bottom = '-250px';
                        line.style.top = 'auto';
                    }
                }
                
                // Random opacity
                line.style.opacity = Math.random() * 0.4 + 0.1;
                
                container.appendChild(line);
            }
        });
    }
    
    createBrassLines();

    // Add intersection observer for footer animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe footer columns for staggered animation
    const footerColumns = document.querySelectorAll('.footer-column');
    footerColumns.forEach(column => {
        observer.observe(column);
    });

    // Add touch support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // Simple swipe detection could be added here for carousel interaction
    }, { passive: true });
});