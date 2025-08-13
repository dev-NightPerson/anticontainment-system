document.addEventListener('DOMContentLoaded', function() {
    // Back button functionality
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // Copy CA button
    const copyBtn = document.getElementById('copy-ca-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const ca = '2pABQvq9Ga8Y2TAAxZWYE2ebRBFsnfFHwQgWZAdapump';
            navigator.clipboard.writeText(ca).then(() => {
                const feedback = document.getElementById('copy-feedback');
                feedback.classList.add('show');
                setTimeout(() => {
                    feedback.classList.remove('show');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
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

    // --- Start of Carousel and Cube Interaction Logic ---

    const scene = document.querySelector('.scene');
    const carousel = document.querySelector('.carousel');
    const cube = document.querySelector('.cube');

    if (scene && carousel && cube) {
        let carouselYAngle = 0;
        let cubeXAngle = 0;
        let cubeYAngle = 0;

        let isCarouselDragging = false;
        let isCubeDragging = false;
        let startX, startY;
        let lastX, lastY;
        let carouselStartAngle;
        let cubeStartAngleX, cubeStartAngleY;

        let carouselAnimationId;
        let cubeAnimationId;
        
        const carouselSpeed = 0.05; // degrees per frame
        const cubeSpeedX = 0.1;
        const cubeSpeedY = 0.12;

        // --- Animation Loops ---
        const animateCarousel = () => {
            if (!isCarouselDragging) {
                carouselYAngle = (carouselYAngle + carouselSpeed) % 360;
                carousel.style.transform = `translate(-50%, -50%) rotateY(${carouselYAngle}deg)`;
            }
            carouselAnimationId = requestAnimationFrame(animateCarousel);
        };

        const animateCube = () => {
            if (!isCubeDragging) {
                cubeYAngle = (cubeYAngle + cubeSpeedY) % 360;
                cubeXAngle = (cubeXAngle + cubeSpeedX) % 360;
                cube.style.transform = `rotateX(${cubeXAngle}deg) rotateY(${cubeYAngle}deg)`;
            }
            cubeAnimationId = requestAnimationFrame(animateCube);
        };
        
        // --- Event Handlers ---
        const onDragStart = (e) => {
            e.preventDefault();
            const target = e.target.closest('.cube-container') || e.target.closest('.cube');
            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

            if (target) {
                isCubeDragging = true;
                cubeStartAngleX = cubeXAngle;
                cubeStartAngleY = cubeYAngle;
            } else {
                isCarouselDragging = true;
                carouselStartAngle = carouselYAngle;
            }
            
            startX = clientX;
            startY = clientY;
            lastX = clientX;
            lastY = clientY;
            scene.style.cursor = 'grabbing';
        };

        const onDragMove = (e) => {
            if (!isCarouselDragging && !isCubeDragging) return;
            
            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            if (isCarouselDragging) {
                const rotationSensitivity = 0.25;
                carouselYAngle = carouselStartAngle + dx * rotationSensitivity;
                carousel.style.transform = `translate(-50%, -50%) rotateY(${carouselYAngle}deg)`;
            }

            if (isCubeDragging) {
                const rotationSensitivity = 0.5;
                cubeYAngle = cubeStartAngleY + dx * rotationSensitivity;
                cubeXAngle = cubeStartAngleX - dy * rotationSensitivity; // Invert Y for natural feel
                cube.style.transform = `rotateX(${cubeXAngle}deg) rotateY(${cubeYAngle}deg)`;
            }

            lastX = clientX;
            lastY = clientY;
        };

        const onDragEnd = () => {
            isCarouselDragging = false;
            isCubeDragging = false;
            scene.style.cursor = 'grab';
        };

        // --- Add Event Listeners ---
        scene.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('mouseleave', onDragEnd); // Handle mouse leaving the window

        scene.addEventListener('touchstart', onDragStart, { passive: false });
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);
        document.addEventListener('touchcancel', onDragEnd);

        // Start animations
        cancelAnimationFrame(carouselAnimationId);
        cancelAnimationFrame(cubeAnimationId);
        animateCarousel();
        animateCube();
        scene.style.cursor = 'grab';
    }

    // --- End of Carousel and Cube Interaction Logic ---

    // Contact on X link functionality
    const contactXLink = document.getElementById('contact-x-link');
    if (contactXLink) {
        contactXLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://x.com/NinetentwoNTT', 'popup', 'width=600,height=400,scrollbars=yes,resizable=yes');
        });
    }

    // More collaborations modal functionality
    const moreCollabsLink = document.getElementById('more-collabs-link');
    const collabsModal = document.getElementById('collabs-modal');
    
    if (moreCollabsLink && collabsModal) {
        const closeModalBtn = collabsModal.querySelector('.modal-close-btn');
        const modalOverlay = collabsModal.querySelector('.modal-overlay');

        const openModal = () => {
            populateActiveProjects();
            collabsModal.classList.add('is-open');
        };
        const closeModal = () => collabsModal.classList.remove('is-open');

        moreCollabsLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
        closeModalBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', closeModal);

        // Close modal with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && collabsModal.classList.contains('is-open')) {
                closeModal();
            }
        });
    }

    // Join us links functionality
    const joinUsLinks = document.querySelectorAll('.join-us-link, .join-us-btn');
    joinUsLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://x.com/i/communities/1948283127836856671/about', '_blank');
        });
    });

    // Function to dynamically populate active projects in modal
    function populateActiveProjects() {
        const activeProjectsList = document.getElementById('active-projects-list');
        if (!activeProjectsList) return;

        // Get all cards from the carousel
        const cards = document.querySelectorAll('.card');
        activeProjectsList.innerHTML = '';

        cards.forEach(card => {
            const title = card.querySelector('h3').textContent;
            const description = card.querySelector('p').textContent;
            const link = card.querySelector('.card-link').href;
            
            // Skip placeholder cards with # links
            if (link === '#' || link.includes('#')) return;

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link;
            a.target = '_blank';
            a.textContent = `${title} - ${description}`;
            li.appendChild(a);
            activeProjectsList.appendChild(li);
        });
    }

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