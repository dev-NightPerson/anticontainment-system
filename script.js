document.addEventListener('DOMContentLoaded', function() {
    // Modal Logic
    const updatesBtn = document.getElementById('updates-btn');
    const modal = document.getElementById('updates-modal');
    
    if (updatesBtn && modal) {
        const closeModalBtn = modal.querySelector('.modal-close-btn');
        const modalOverlay = modal.querySelector('.modal-overlay');

        const openModal = () => modal.classList.add('is-open');
        const closeModal = () => modal.classList.remove('is-open');

        updatesBtn.addEventListener('click', openModal);
        closeModalBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', closeModal);

        // Close modal with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.classList.contains('is-open')) {
                closeModal();
            }
        });
    }

    // Collabs button logic
    const collabsBtn = document.getElementById('collabs-btn');
    if (collabsBtn) {
        collabsBtn.addEventListener('click', () => {
            window.open('https://anticontainmentsystem.fun', '_blank');
        });
    }

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Header image click animation
    const headerImage = document.querySelector('.header-image');
    if (headerImage) {
        headerImage.addEventListener('click', function() {
            if (this.classList.contains('animating')) return; // Prevent re-triggering during animation

            this.classList.add('animating');

            // Reset animation by removing and re-adding the class
            this.classList.remove('animate-zoom-fade');
            void this.offsetWidth; // Trigger reflow
            this.classList.add('animate-zoom-fade');

            this.addEventListener('animationend', () => {
                this.classList.remove('animating');
            }, { once: true });
        });
    }
    
    // Cursor trail effect - Enhanced for cross-browser compatibility
    const trailContainer = document.getElementById('cursor-trail-container');
    if (trailContainer) {
        let canCreateParticle = true;
        let lastX = 0;
        let lastY = 0;
        
        const createParticle = (x, y) => {
            const particle = document.createElement('div');
            particle.className = 'trail-particle';
            
            // Use transform for positioning to ensure hardware acceleration
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.position = 'absolute';
            
            const size = Math.random() * 8 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${Math.random() > 0.5 ? size : size * (Math.random() * 1.5 + 0.5)}px`;
            
            const colors = ['#cd7f32', '#b8860b', '#daa520', '#e6a861'];
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.opacity = '0.9';
            
            // Set CSS custom properties for drift
            particle.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 2}`);
            particle.style.setProperty('--drift-y', `${(Math.random() - 0.5) * 2}`);
            
            trailContainer.appendChild(particle);
            
            // Force reflow to ensure animation starts
            void particle.offsetWidth;
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 500);
        };
        
        // Enhanced event listener with better browser support
        const handleMouseMove = (e) => {
            if (canCreateParticle) {
                createParticle(e.clientX, e.clientY);
                canCreateParticle = false;
                
                setTimeout(() => {
                    canCreateParticle = true;
                }, 50);
            }
        };
        
        // Add event listener with passive option for better performance
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        
        // Ensure container exists and is visible
        trailContainer.style.pointerEvents = 'none';
        trailContainer.style.position = 'fixed';
        trailContainer.style.zIndex = '9999';
    }
    
    // Create random brass lines
    function createBrassLines() {
        const containers = document.querySelectorAll('.brass-lines-container');
        containers.forEach(container => {
            const numLines = 15;
            
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
                
                // Random thickness
                line.style.height = isHorizontal ? (Math.random() * 20 + 20) + 'px' : line.style.height;
                line.style.width = !isHorizontal ? (Math.random() * 20 + 20) + 'px' : line.style.width;
                
                container.appendChild(line);
            }
        });
    }
    
    createBrassLines();
    
    // Add intersection observer for animations
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
});

// Add ripple animation keyframes via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);