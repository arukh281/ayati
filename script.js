
// EmailJS configuration (replace with your actual IDs)
const EMAILJS_SERVICE_ID = 'service_gjgupdq';
const EMAILJS_TEMPLATE_ID_CALLBACK = 'template_f3cx98q';
const EMAILJS_TEMPLATE_ID_CONTACT = 'template_j8r7kwi';
const EMAILJS_PUBLIC_KEY = '000Q39I3ifhYbRgpu';

document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile navigation toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    
    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    const heroBackground = document.querySelector('.hero-background');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        if (heroBackground) {
            heroBackground.style.transform = `translateY(${rate}px)`;
        }
    });
    
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.property-card, .feature, .about-text, .contact-form, .contact-info');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
    
    // Property card hover effects
    const propertyCards = document.querySelectorAll('.property-card');
    propertyCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Feature icons animation
    const featureIcons = document.querySelectorAll('.feature-icon');
    featureIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1) rotate(5deg)';
            this.style.boxShadow = '0 0 30px rgba(212, 175, 55, 0.4)';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
            this.style.boxShadow = 'none';
        });
    });
    
    // Form validation and styling
    const form = document.querySelector('.contact-form form');
    const inputs = document.querySelectorAll('.contact-form input, .contact-form select, .contact-form textarea');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Add floating label effect
        input.addEventListener('input', function() {
            if (this.value) {
                this.parentElement.classList.add('has-value');
            } else {
                this.parentElement.classList.remove('has-value');
            }
        });
    });
    
    // Form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Simple validation
            const requiredFields = ['name', 'email'];
            let isValid = true;
            
            requiredFields.forEach(field => {
                const input = this.querySelector(`[name="${field}"]`);
                if (!input || !input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#e74c3c';
                } else {
                    input.style.borderColor = '#d4af37';
                }
            });
            
            if (isValid) {
                // Send email via EmailJS
                if (window.emailjs && typeof emailjs.send === 'function') {
                    const params = {
                        to_name: data.name || 'Customer',
                        to_email: data.email,
                        reply_to: data.email,
                        from_name: 'Ayati Developers',
                        phone: data.phone || '',
                        message: (data.message && data.message.trim()) ? data.message.trim() : 'We have received your request and will call you shortly.'
                    };

                    emailjs
                        .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_CONTACT, params, { publicKey: EMAILJS_PUBLIC_KEY })
                        .then(() => {
                            showNotification('Thank you! Your message has been sent.', 'success');
                            form.reset();
                        })
                        .catch((err) => {
                            console.error('EmailJS error:', err);
                            const msg = err && (err.text || err.message) ? (err.text || err.message) : 'Unknown error';
                            showNotification(`Email failed: ${msg}`, 'error');
                        });
                } else {
                    console.error('EmailJS SDK not available');
                    showNotification('Email service unavailable. Please try again later.', 'error');
                }
            } else {
                showNotification('Please fill in all required fields.', 'error');
            }
        });
    }
    
    // Notification system
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#d4af37' : '#e74c3c'};
            color: ${type === 'success' ? '#000' : '#fff'};
            padding: 1rem 2rem;
            border-radius: 0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
            font-weight: 500;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }
    
    // Gold divider animation
    const goldDividers = document.querySelectorAll('.gold-divider');
    goldDividers.forEach(divider => {
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.width = '60px';
                    entry.target.style.transition = 'width 1s ease-out';
                }
            });
        }, { threshold: 0.5 });
        
        divider.style.width = '0';
        observer.observe(divider);
    });
    
    // Scroll progress indicator
    const scrollProgress = document.createElement('div');
    scrollProgress.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #d4af37, #f4e4bc);
        z-index: 10001;
        transition: width 0.1s ease-out;
    `;
    document.body.appendChild(scrollProgress);
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.offsetHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        scrollProgress.style.width = scrollPercent + '%';
    });
    
    // Lazy loading for images (if any are added later)
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    // Add loading animation to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.href && this.href.includes('#')) {
                // Add ripple effect
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s ease-out;
                    pointer-events: none;
                `;
                
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            }
        });
    });
    
    // Add ripple animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .lazy {
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .lazy.loaded {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize AOS (Animate On Scroll) alternative
    function initScrollAnimations() {
        const elements = document.querySelectorAll('[data-aos]');
        elements.forEach(el => {
            const animation = el.dataset.aos;
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        });
        
        const scrollObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });
        
        elements.forEach(el => scrollObserver.observe(el));
    }
    
    // Initialize all animations
    initScrollAnimations();
    
    // Performance optimization: Throttle scroll events
    let ticking = false;
    function updateOnScroll() {
        // Scroll-based animations here
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
    
    // Add smooth reveal animation for sections
    const sections = document.querySelectorAll('section');
    const sectionObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
        section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        sectionObserver.observe(section);
    });
    
    // Add revealed class styles
    const revealStyle = document.createElement('style');
    revealStyle.textContent = `
        section.revealed {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(revealStyle);
    
    // Lead capture modals and EmailJS integration (Excel removed)
    const overlay = document.getElementById('modal-overlay');
    const brochureModal = document.getElementById('brochure-modal');
    const callbackModal = document.getElementById('callback-modal');
    const brochureForm = document.getElementById('brochure-form');
    const callbackForm = document.getElementById('callback-form');
    const propertyHiddenInput = document.getElementById('brochure-property-name');

    function openModal(modal) {
        if (!modal) return;
        overlay.hidden = false;
        modal.hidden = false;
    }

    function closeModals() {
        overlay.hidden = true;
        if (brochureModal) brochureModal.hidden = true;
        if (callbackModal) callbackModal.hidden = true;
    }

    document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', closeModals));
    if (overlay) overlay.addEventListener('click', closeModals);

    // Excel helpers removed


    function handleBrochureContinue(formValues, brochureSrc, mode) {
        if (!brochureSrc) {
            showNotification('Brochure not found.', 'error');
            return;
        }

        // Show welcome message on brochure interaction
        showNotification('Welcome to Ayati Developer.', 'success');

        // Send data to Google Sheets for brochure tracking
        sendToGoogleSheet({
            type: 'brochure',
            name: formValues.name || '',
            no: formValues.phone || '',
            email: formValues.email || ''
        });

        if (mode === 'preview') {
            const win = window.open(brochureSrc, '_blank', 'noopener');
            if (!win) {
                showNotification('Pop-up blocked. Please allow pop-ups to preview the brochure.', 'error');
                return;
            }
            showNotification('Opening brochure preview...', 'success');
        } else {
            const a = document.createElement('a');
            a.href = brochureSrc;
            a.download = '';
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            a.remove();
            showNotification('Brochure download started...', 'success');
        }
    }

    function handleCallbackSubmit(formValues) {
        showNotification('Submitting your request...', 'success');

        // Return a Promise to handle async operations properly
        return new Promise((resolve, reject) => {
            // Send data to Google Sheets for visit scheduling tracking
            console.log('Sending callback data to Google Sheets:', {
                type: 'visit',
                name: formValues.name || '',
                phone: formValues.phone || '',
                email: formValues.email || '',
                msg: formValues.message || ''
            });
            
            sendToGoogleSheet({
                type: 'visit',
                name: formValues.name || '',
                phone: formValues.phone || '',
                email: formValues.email || '',
                msg: formValues.message || ''
            });

            // Send email via EmailJS
            if (window.emailjs && typeof emailjs.send === 'function') {
                const params = {
                    to_name: formValues.name || 'Customer',
                    to_email: formValues.email,
                    reply_to: formValues.email,
                    from_name: 'Ayati Developers',
                    phone: formValues.phone || '',
                    message: (formValues.message && formValues.message.trim())
                        ? formValues.message.trim()
                        : 'Thank you for reaching out. We will contact you shortly.'
                };

                emailjs
                    .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_CALLBACK, params, { publicKey: EMAILJS_PUBLIC_KEY })
                    .then(() => {
                        showNotification('Request submitted successfully!', 'success');
                        resolve();
                    })
                    .catch((err) => {
                        console.error('EmailJS error:', err);
                        const msg = err && (err.text || err.message) ? (err.text || err.message) : 'Unknown error';
                        showNotification(`Email failed: ${msg}`, 'error');
                        reject(err);
                    });
            } else {
                console.error('EmailJS SDK not available');
                showNotification('Email service unavailable. Please try again later.', 'error');
                reject(new Error('EmailJS SDK not available'));
            }
        });
    }

    // Attach handlers to brochure buttons to open modal first
    document.querySelectorAll('.brochure-actions .preview-btn, .brochure-actions .download-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const brochureSrc = this.dataset.brochureSrc;
            const propertyName = this.dataset.property;
            if (propertyHiddenInput) propertyHiddenInput.value = propertyName || '';
            brochureForm.dataset.brochureSrc = brochureSrc || '';
            brochureForm.dataset.mode = this.classList.contains('preview-btn') ? 'preview' : 'download';
            openModal(brochureModal);
        });
    });

    if (brochureForm) {
        brochureForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(brochureForm);
            const values = Object.fromEntries(formData.entries());
            values.propertyName = propertyHiddenInput ? propertyHiddenInput.value : '';
            const src = brochureForm.dataset.brochureSrc;
            const mode = brochureForm.dataset.mode || 'preview';

            // Send confirmation email to the user (no admin email)
            if (window.emailjs && typeof emailjs.send === 'function' && values.email) {
                const brochureMessage = `Thank you for your interest in ${values.propertyName || 'our project'}. We have received your request and will call you shortly.`;
                const params = {
                    to_name: values.name || 'Customer',
                    to_email: values.email,
                    reply_to: values.email,
                    from_name: 'Ayati Developers',
                    phone: values.phone || '',
                    message: brochureMessage
                };
                emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_CALLBACK, params, { publicKey: EMAILJS_PUBLIC_KEY })
                    .catch((err) => {
                        console.error('EmailJS brochure email error:', err);
                    });
            }

            handleBrochureContinue(values, src, mode);
            brochureForm.reset();
            closeModals();
        });
    }

    // Schedule button should navigate to contact section instead of opening a modal
    const scheduleBtn = document.querySelector('#home .btn.btn-secondary');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector('#contact');
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    }

    // Also allow contact form submit to be treated as callback lead
    if (callbackForm) {
        callbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(callbackForm);
            const values = Object.fromEntries(formData.entries());
            
            // Add some debugging
            console.log('Callback form values:', values);
            
            // Call the handler and wait for it to complete
            handleCallbackSubmit(values).then(() => {
                // Only reset and close after successful submission
                callbackForm.reset();
                closeModals();
            }).catch((error) => {
                console.error('Callback submission error:', error);
                showNotification('There was an error submitting your request. Please try again.', 'error');
            });
        });
    }

    // Handle main contact form submission (Schedule Visit button)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const values = Object.fromEntries(formData.entries());
            
            // Add some debugging
            console.log('Contact form values:', values);
            
            // Call the handler and wait for it to complete
            handleCallbackSubmit(values).then(() => {
                // Only reset after successful submission
                contactForm.reset();
                showNotification('Thank you! We will contact you shortly to schedule your visit.', 'success');
            }).catch((error) => {
                console.error('Contact form submission error:', error);
                showNotification('There was an error submitting your request. Please try again.', 'error');
            });
        });
    }
    
    // Admin shortcut removed
    
    // Logo Carousel Enhancement
    initLogoCarousel();
    
    // DOMAIN FIX: Force logo sizing as fallback
    forceLogoSize();
    
    console.log('Luxury Estates website initialized successfully');
    
    // Add test function for debugging Google Sheets
    window.testGoogleSheets = function() {
        console.log('Testing Google Sheets connection...');
        sendToGoogleSheet({
            type: 'visit',
            name: 'Test User',
            phone: '1234567890',
            email: 'test@example.com',
            msg: 'This is a test message from callback form'
        });
    };
});

// Logo Carousel Functionality
function initLogoCarousel() {
    const carousel = document.querySelector('.logo-carousel');
    const track = document.querySelector('.logo-track');
    
    if (!carousel || !track) return;
    
    // Add smooth scroll behavior
    let isScrolling = false;
    let scrollDirection = 1; // 1 for right, -1 for left
    
    // Pause animation on hover and resume on mouse leave
    carousel.addEventListener('mouseenter', function() {
        track.style.animationPlayState = 'paused';
    });
    
    carousel.addEventListener('mouseleave', function() {
        track.style.animationPlayState = 'running';
    });
    
    // Add touch/swipe support for mobile
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    carousel.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        isDragging = true;
        track.style.animationPlayState = 'paused';
    });
    
    carousel.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diffX = startX - currentX;
        
        // Add slight resistance to dragging
        if (Math.abs(diffX) > 10) {
            e.preventDefault();
        }
    });
    
    carousel.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;
        
        const diffX = startX - currentX;
        if (Math.abs(diffX) > 50) {
            // User swiped significantly, change direction
            scrollDirection = diffX > 0 ? 1 : -1;
            updateCarouselDirection();
        }
        
        track.style.animationPlayState = 'running';
    });
    
    // Add click to change direction
    carousel.addEventListener('click', function(e) {
        if (e.target.closest('.logo-slide')) {
            scrollDirection *= -1;
            updateCarouselDirection();
        }
    });
    
    function updateCarouselDirection() {
        const currentTransform = track.style.transform || 'translateX(0px)';
        const currentX = parseFloat(currentTransform.match(/-?\d+\.?\d*/) || [0])[0];
        
        // Smooth transition to new direction
        track.style.transition = 'transform 0.5s ease-in-out';
        track.style.transform = `translateX(${currentX}px)`;
        
        setTimeout(() => {
            track.style.transition = '';
            if (scrollDirection === 1) {
                track.style.animation = 'scroll 30s linear infinite';
            } else {
                track.style.animation = 'scrollReverse 30s linear infinite';
            }
        }, 500);
    }
    
    // Add CSS for reverse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes scrollReverse {
            0% {
                transform: translateX(-33.333%);
            }
            100% {
                transform: translateX(0);
            }
        }
        
        .logo-track {
            will-change: transform;
        }
        
        .logo-slide {
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        }
    `;
    document.head.appendChild(style);
    
    // Add intersection observer to pause animation when not visible
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                track.style.animationPlayState = 'running';
            } else {
                track.style.animationPlayState = 'paused';
            }
        });
    }, { threshold: 0.1 });
    
    observer.observe(carousel);
    
    // Add performance optimization
    carousel.style.willChange = 'transform';
    
    // Add keyboard support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            scrollDirection = e.key === 'ArrowLeft' ? -1 : 1;
            updateCarouselDirection();
        }
    });
}

// DOMAIN FIX: Force logo sizing as fallback
function forceLogoSize() {
    const carouselLogos = document.querySelectorAll('.carousel-logo');
    
    carouselLogos.forEach(logo => {
        // Force specific sizing based on logo type
        if (logo.src && logo.src.includes('icici')) {
            logo.style.maxHeight = '60px';
            logo.style.maxWidth = '150px';
        } else if (logo.src && logo.src.includes('pirmal')) {
            logo.style.maxHeight = '70px';
            logo.style.maxWidth = '160px';
        } else if (logo.src && logo.src.includes('aavas')) {
            logo.style.maxHeight = '65px';
            logo.style.maxWidth = '140px';
        } else {
            // Fallback for any other logos
            logo.style.maxHeight = '80px';
            logo.style.maxWidth = '100%';
        }
        
        // Ensure these properties are always applied
        logo.style.height = 'auto';
        logo.style.width = 'auto';
        logo.style.objectFit = 'contain';
        logo.style.display = 'block';
        logo.style.margin = '0 auto';
    });
    
    // Also ensure logo slides are properly sized
    const logoSlides = document.querySelectorAll('.logo-slide');
    logoSlides.forEach(slide => {
        slide.style.width = '200px';
        slide.style.height = '120px';
        slide.style.overflow = 'hidden';
        slide.style.display = 'flex';
        slide.style.alignItems = 'center';
        slide.style.justifyContent = 'center';
    });
    
    console.log('Logo sizing forced as fallback for domain deployment');
}

// Finance Logo Carousel Functionality
function initFinanceCarousel() {
    const carouselTrack = document.getElementById('carousel-track');
    if (!carouselTrack) return;
    
    // Pause animation on hover
    carouselTrack.addEventListener('mouseenter', function() {
        this.style.animationPlayState = 'paused';
    });
    
    carouselTrack.addEventListener('mouseleave', function() {
        this.style.animationPlayState = 'running';
    });
    
    // Add touch/swipe support for mobile
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    carouselTrack.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        isDragging = true;
        this.style.animationPlayState = 'paused';
    });
    
    carouselTrack.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diffX = startX - currentX;
        
        // Add slight drag effect
        if (Math.abs(diffX) > 10) {
            this.style.transform = `translateX(${-diffX * 0.1}px)`;
        }
    });
    
    carouselTrack.addEventListener('touchend', function() {
        if (!isDragging) return;
        isDragging = false;
        
        // Reset transform and resume animation
        this.style.transform = '';
        this.style.animationPlayState = 'running';
    });
    
    // Ensure carousel starts automatically
    carouselTrack.style.animationPlayState = 'running';
    
    console.log('Finance carousel initialized');
}
function sendToGoogleSheet(data) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwrUo4cq5kINMHwdCaqSQsu7s5DRGj_5GKiOrZzuUBz3WdNC_jyay5AG5v2ykmHW67b/exec'; // Replace with your Web App URL

    console.log('Sending data to Google Sheets:', data);

    // Use a more CORS-friendly approach
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // This bypasses CORS but we won't get response data
        body: formData
    })
    .then(() => {
        console.log('Data sent to Google Sheets successfully (no-cors mode)');
    })
    .catch(error => {
        console.error('Error updating sheet (no-cors mode):', error);
        // Fallback: try with JSON but without CORS mode
        console.log('Trying fallback method...');
        fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            console.log('Fallback method response:', response);
            if (response.ok) {
                console.log('Data sent to Google Sheets successfully (fallback method)');
            } else {
                console.error('Fallback method failed with status:', response.status);
            }
        })
        .catch(fallbackError => {
            console.error('Fallback also failed:', fallbackError);
        });
    });
}
// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initFinanceCarousel();
});


