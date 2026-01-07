// Navigation button functionality
document.addEventListener('DOMContentLoaded', function() {
    // Typewriter effect for greeting
    const greetingText = document.getElementById('name');
    if (greetingText) {
        const originalText = greetingText.textContent;
        greetingText.textContent = '';
        greetingText.classList.add('typing');
        
        let charIndex = 0;
        const typingSpeed = 100; // milliseconds per character
        
        function typeWriter() {
            if (charIndex < originalText.length) {
                greetingText.textContent += originalText.charAt(charIndex);
                charIndex++;
                setTimeout(typeWriter, typingSpeed);
            }
        }
        
        // Start typing after a short delay
        setTimeout(typeWriter, 500);
    }

    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');



    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Remove active class from all buttons and sections
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked button and corresponding section
            this.classList.add('active');
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
                
                // Smooth scroll to top
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add keyboard navigation
    document.addEventListener('keydown', function(event) {
        const activeButton = document.querySelector('.nav-btn.active');
        const allButtons = Array.from(document.querySelectorAll('.nav-btn'));
        const currentIndex = allButtons.indexOf(activeButton);

        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            event.preventDefault();
            const nextIndex = (currentIndex + 1) % allButtons.length;
            allButtons[nextIndex].click();
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const prevIndex = (currentIndex - 1 + allButtons.length) % allButtons.length;
            allButtons[prevIndex].click();
        }
    });

    // Add ripple effect on click
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(button => {
        button.addEventListener('mousedown', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            // Remove any existing ripple
            const existingRipple = this.querySelector('.ripple');
            if (existingRipple) {
                existingRipple.remove();
            }
            
            this.appendChild(ripple);
        });
    });

    // Animate project cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeIn 0.6s ease-in-out forwards';
            }
        });
    }, observerOptions);

    // Observe project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        observer.observe(card);
    });

    // Add staggered animation to contact links
    const contactLinks = document.querySelectorAll('.contact-link');
    contactLinks.forEach((link, index) => {
        link.style.animationDelay = (index * 0.1) + 's';
        link.style.animation = 'fadeIn 0.6s ease-in-out forwards';
        link.style.opacity = '0';
    });

    // Add cursor-tracking glow effect to profile image
    const profileImageWrapper = document.querySelector('.profile-image-wrapper');
    const profileImage = document.querySelector('.profile-image');
    
    if (profileImageWrapper && profileImage) {
        profileImageWrapper.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate distance from center
            const distX = Math.abs(x - centerX);
            const distY = Math.abs(y - centerY);
            const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
            const distance = Math.sqrt(distX * distX + distY * distY);
            const intensity = Math.min(1, distance / maxDist);
            
            // Apply glow effect based on intensity
            const glowColor = `rgba(102, 126, 234, ${intensity * 0.6})`;
            profileImage.style.boxShadow = `0 20px 40px rgba(0, 0, 0, 0.2), 0 0 ${30 + intensity * 20}px ${glowColor}`;
            
            // Slight scale effect at borders
            const scale = 1 + (intensity * 0.05);
            profileImage.style.transform = `scale(${scale})`;
        });
        
        profileImageWrapper.addEventListener('mouseleave', function() {
            profileImage.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
            profileImage.style.transform = 'scale(1)';
        });
    }
});

// Add ripple CSS dynamically
const style = document.createElement('style');
style.textContent = `
    .nav-btn {
        position: relative;
        overflow: visible;
    }

    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }

    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    .contact-link {
        animation: fadeIn 0.6s ease-in-out forwards;
    }
`;
document.head.appendChild(style);
