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

    // --- Birdseye View Logic ---
    const birdseyeBtn = document.getElementById('birdseye-btn');
    const sceneElement = document.querySelector('.scene');
    let isBirdseyeView = false;

    // --- Start of Carousel and Cube Interaction Logic ---

    const outerCarousel = document.querySelector('.outer-carousel'); // New outer carousel wrapper
    const innerCarousels = document.querySelectorAll('.carousel'); // All inner carousels
    const cube = document.querySelector('.cube');
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');

    // Ensure all required elements exist before proceeding with 3D logic
    if (sceneElement && outerCarousel && innerCarousels.length > 0 && cube) {
        let rotationCounter = 0; // Tracks number of 120-degree rotations, can be negative for right clicks
        const totalGroups = innerCarousels.length; // 3 groups
        const outerAngleIncrement = 360 / totalGroups; // 120 degrees

        let innerCarouselAngles = new Map();
        innerCarousels.forEach(carouselEl => {
            innerCarouselAngles.set(carouselEl, 0);
        });

        let cubeXAngle = 0;
        let cubeYAngle = 0;
        let cubeStartAngleX = 0; // New: Store cube's X angle at drag start
        let cubeStartAngleY = 0; // New: Store cube's Y angle at drag start

        let isOuterCarouselDragging = false;
        let isCubeDragging = false;
        let startX, startY;
        let dragStartRotationCounter; // Store rotationCounter at drag start

        let innerCarouselsAnimationId = null; // Initialize to null
        let cubeAnimationId = null; // Initialize to null
        
        const innerCarouselSpeed = 0.05;
        const cubeSpeedX = 0.1;
        const cubeSpeedY = 0.12;
        const desktopGroupRadius = 350; // Reduced from 450
        const mobileGroupRadius = 250; // Reduced from 300

        // --- Animation Loops ---
        // Animate individual inner carousels
        const animateInnerCarousels = () => {
            innerCarousels.forEach(carouselEl => {
                let currentAngle = innerCarouselAngles.get(carouselEl);
                currentAngle = (currentAngle + innerCarouselSpeed) % 360;
                innerCarouselAngles.set(carouselEl, currentAngle);

                const groupIndex = parseInt(carouselEl.dataset.groupIndex);
                
                let currentGroupRadius = desktopGroupRadius; // Default to desktop
                if (window.matchMedia('(max-width: 768px)').matches) {
                    currentGroupRadius = mobileGroupRadius; // Use mobile radius if applicable
                }

                // The baseAngle positions the entire inner carousel within the outer ring
                // The currentAngle is the inner carousel's own rotation
                carouselEl.style.transform = `
                    translate(-50%, -50%)
                    rotateY(${groupIndex * outerAngleIncrement}deg)
                    translateZ(${currentGroupRadius}px)
                    rotateY(${currentAngle}deg)
                `;
            });
            innerCarouselsAnimationId = requestAnimationFrame(animateInnerCarousels);
        };

        const animateCube = () => {
            if (!isCubeDragging) {
                cubeYAngle = (cubeYAngle + cubeSpeedY) % 360;
                cubeXAngle = (cubeXAngle + cubeSpeedX) % 360;
                cube.style.transform = `rotateX(${cubeXAngle}deg) rotateY(${cubeYAngle}deg)`;
            }
            cubeAnimationId = requestAnimationFrame(animateCube);
        };

        // Function to start all animations (called when not in birdseye or on load)
        const startAllAnimations = () => {
            if (!innerCarouselsAnimationId) {
                animateInnerCarousels();
            }
            if (!cubeAnimationId) {
                animateCube();
            }
        };
        
        // --- Event Handlers for Dragging ---
        const onDragStart = (e) => {
            e.preventDefault();
            const target = e.target.closest('.cube-container');
            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            if (target) {
                isCubeDragging = true;
                // Stop automatic cube rotation during drag
                if (cubeAnimationId) {
                    cancelAnimationFrame(cubeAnimationId);
                    cubeAnimationId = null;
                }
                // Store current cube angles at the start of drag
                cubeStartAngleX = cubeXAngle;
                cubeStartAngleY = cubeYAngle;
            } else {
                // If not cube, assume outer carousel dragging
                isOuterCarouselDragging = true;
                dragStartRotationCounter = rotationCounter; // Capture current accumulated rotation count
                // Stop automatic inner carousel rotation during outer carousel drag
                if (innerCarouselsAnimationId) {
                    cancelAnimationFrame(innerCarouselsAnimationId);
                    innerCarouselsAnimationId = null;
                }
            }
            
            startX = clientX;
            startY = clientY;
            sceneElement.style.cursor = 'grabbing';
        };

        const onDragMove = (e) => {
            if (!isOuterCarouselDragging && !isCubeDragging) return;
            
            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            if (isOuterCarouselDragging) {
                const rotationSensitivity = 0.25;
                // Calculate new angle based on drag relative to the start of drag
                const currentDragAngle = dragStartRotationCounter * outerAngleIncrement + dx * rotationSensitivity;
                // Snap the rotationCounter to the nearest full outerAngleIncrement step
                rotationCounter = Math.round(currentDragAngle / outerAngleIncrement);
                // Apply the transform based on the snapped rotationCounter
                outerCarousel.style.transform = `translate(-50%, -50%) rotateY(${rotationCounter * outerAngleIncrement}deg)`;
            }

            if (isCubeDragging) {
                const rotationSensitivity = 0.5;
                cubeYAngle = cubeStartAngleY + dx * rotationSensitivity;
                cubeXAngle = cubeStartAngleX - dy * rotationSensitivity; // Invert Y for natural feel
                cube.style.transform = `rotateX(${cubeXAngle}deg) rotateY(${cubeYAngle}deg)`;
            }
        };

        const onDragEnd = () => {
            isCubeDragging = false;
            isOuterCarouselDragging = false;
            sceneElement.style.cursor = 'grab';

            // Resume animations if not in birdseye view
            if (!isBirdseyeView) {
                startAllAnimations();
            }
        };

        // --- Arrow Navigation for Outer Carousel ---
        const rotateOuterCarousel = (direction) => {
            // Stop automatic inner carousel rotation during manual outer carousel rotation
            if (innerCarouselsAnimationId) {
                cancelAnimationFrame(innerCarouselsAnimationId);
                innerCarouselsAnimationId = null;
            }

            if (direction === 'left') {
                rotationCounter++; // Increment for counter-clockwise rotation (visual movement to previous group)
            } else { // direction === 'right'
                rotationCounter--; // Decrement for clockwise rotation (visual movement to next group)
            }
            // Ensure continuous looping
            // The modulo operator (%) in JavaScript behaves differently for negative numbers.
            // (a % n + n) % n ensures a positive result.
            rotationCounter = (rotationCounter % totalGroups + totalGroups) % totalGroups;

            outerCarousel.style.transform = `translate(-50%, -50%) rotateY(${rotationCounter * outerAngleIncrement}deg)`;

            // Resume animations after rotation (if not in birdseye view)
            if (!isBirdseyeView) {
                startAllAnimations();
            }
        };

        if (leftArrow) {
            leftArrow.addEventListener('click', () => rotateOuterCarousel('left'));
        }
        if (rightArrow) {
            rightArrow.addEventListener('click', () => rotateOuterCarousel('right'));
        }

        // --- Add Event Listeners ---
        sceneElement.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('mouseleave', onDragEnd); // Handle mouse leaving the window

        sceneElement.addEventListener('touchstart', onDragStart, { passive: false });
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);
        document.addEventListener('touchcancel', onDragEnd);

        // Initial start of animations
        startAllAnimations();
        sceneElement.style.cursor = 'grab';
    }

    // Birdseye button functionality
    if (birdseyeBtn) {
        birdseyeBtn.addEventListener('click', () => {
            isBirdseyeView = !isBirdseyeView;
            if (isBirdseyeView) {
                sceneElement.classList.add('birdseye');
                birdseyeBtn.textContent = 'Normal View';
                // Explicitly cancel animations
                if (innerCarouselsAnimationId) {
                    cancelAnimationFrame(innerCarouselsAnimationId);
                    innerCarouselsAnimationId = null;
                }
                if (cubeAnimationId) {
                    cancelAnimationFrame(cubeAnimationId);
                    cubeAnimationId = null;
                }
            } else {
                sceneElement.classList.remove('birdseye');
                birdseyeBtn.textContent = 'Birdseye View';
                // Resume animations
                if (typeof startAllAnimations === 'function') { // Check if function is defined due to scope
                     startAllAnimations();
                }
            }
        });
    }

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

        // Get all cards from all carousels
        const allCards = document.querySelectorAll('.carousel .card');
        activeProjectsList.innerHTML = ''; // Clear existing list

        allCards.forEach(card => {
            const title = card.querySelector('h3').textContent;
            const description = card.querySelector('p').textContent;
            const link = card.querySelector('.card-link').href;
            
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link;
            a.target = '_blank';
            a.textContent = `${title} - ${description}`;
            li.appendChild(a);
            activeProjectsList.appendChild(li);
        });
    }

    // Create brass lines for footer (this function is already in collab-script.js)
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

    // Add touch support for mobile (Existing - might be somewhat redundant with mousedown/move/up for touch)
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        // These are already handled by onDragStart, but kept here for robustness
        // if other touch logic were to be added.
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
        // (This part is not connected to the 3D carousel drag, which uses the mousemove/touchmove handlers above)
    }, { passive: true });
});