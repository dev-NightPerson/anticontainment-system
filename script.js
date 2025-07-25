document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add interactive hover effects
    const bannerCta = document.querySelector('.banner-cta');
    if (bannerCta) {
        bannerCta.addEventListener('click', function() {
            // Add ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.3)';
            ripple.style.pointerEvents = 'none';
            ripple.style.animation = 'ripple 0.6s linear';
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }
    
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
    
    // Cursor trail effect
    const trailContainer = document.getElementById('cursor-trail-container');
    if (trailContainer) {
        let canCreateParticle = true;
        
        const createParticle = (x, y) => {
            const particle = document.createElement('div');
            particle.className = 'trail-particle';

            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;

            const size = Math.random() * 8 + 2;
            particle.style.width = `${size}px`;
            // Make some particles rectangles
            particle.style.height = `${Math.random() > 0.5 ? size : size * (Math.random() * 1.5 + 0.5)}px`;

            const colors = ['#cd7f32', '#b8860b', '#daa520', '#e6a861'];
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.setProperty('--drift-x', (Math.random() - 0.5) * 2);
            particle.style.setProperty('--drift-y', (Math.random() - 0.5) * 2);
            
            trailContainer.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 500); // Corresponds to animation duration
        };

        document.addEventListener('mousemove', (e) => {
            if (canCreateParticle) {
                createParticle(e.clientX, e.clientY);
                canCreateParticle = false;
                setTimeout(() => {
                    canCreateParticle = true;
                }, 50); // Throttle to 20 particles per second max
            }
        });
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
    
    // Add parallax effect to floating shapes
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const shapes = document.querySelectorAll('.floating-shape');
        
        shapes.forEach((shape, index) => {
            const rate = scrolled * -0.5 * (index + 1);
            shape.style.transform = `translateY(${rate}px)`;
        });
    });
    
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
    
    // Update all footer links to point to example.com
    const footerLinks = document.querySelectorAll('.footer-column a');
    footerLinks.forEach(link => {
        link.href = 'https://example.com';
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
