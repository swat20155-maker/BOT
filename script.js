import { IlluxatAPI } from './illuxat-api.js';

// ── Image Viewer ──
function openImageViewer(imageSrc) {
    try {
        let modal = document.getElementById('imageViewerModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'imageViewerModal';
            modal.className = 'image-viewer-modal';
            modal.innerHTML = `
                <div class="image-viewer-content">
                    <button class="image-viewer-close" onclick="closeImageViewer()" aria-label="Close">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    <div class="image-viewer-wrapper">
                        <div class="image-viewer-container">
                            <img src="" alt="Profile Picture" class="image-viewer-img" id="imageViewerImg">
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('image-viewer-wrapper')) {
                    closeImageViewer();
                }
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    closeImageViewer();
                }
            });
        }
        const img = document.getElementById('imageViewerImg');
        if (!img) return;
        img.src = imageSrc;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error in openImageViewer:', error);
    }
}

function closeImageViewer() {
    const modal = document.getElementById('imageViewerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

window.openImageViewer = openImageViewer;
window.closeImageViewer = closeImageViewer;

// ── Particles ──
function createParticles(container, count = 16) {
    for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        p.classList.add('particle');
        const size = Math.random() * 6 + 3;
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 50;
        p.style.cssText = `
            width:${size}px; height:${size}px;
            top:${50 + Math.random() * 10 - 5}%;
            left:${50 + Math.random() * 10 - 5}%;
            --dx:${Math.cos(angle) * dist}px;
            --dy:${Math.sin(angle) * dist}px;
            animation: particleDrift ${3 + Math.random() * 3}s ease-in-out infinite;
            animation-delay: ${Math.random() * 4}s;
            background: ${i % 3 === 0 ? 'var(--accent-primary)' : i % 3 === 1 ? 'var(--accent-neon)' : 'var(--accent-secondary)'};
            box-shadow: 0 0 6px currentColor;
        `;
        container.appendChild(p);
    }
}

// ── Main Init ──
document.addEventListener('DOMContentLoaded', function () {
    const profileContainer = document.getElementById('profileContainer');
    const particles = document.getElementById('particles');
    const username = document.getElementById('username');
    const profilePic = document.getElementById('profilePic');

    if (!profilePic) return;

    // Create particles
    if (particles) createParticles(particles);

    // Status indicator
    const statusIndicator = document.getElementById('statusIndicator');
    const statusDot = statusIndicator?.querySelector('.status-dot');
    if (statusDot) {
        statusDot.classList.add('loading');
        checkOnlineStatus();
        setInterval(checkOnlineStatus, 1000);
    }

    // Entrance animation
    profileContainer.style.opacity = '0';
    username.style.opacity = '0';

    setTimeout(() => {
        profileContainer.style.transition = 'opacity .8s ease, transform .8s ease';
        profileContainer.style.opacity = '1';

        setTimeout(() => {
            username.style.transition = 'opacity .8s ease';
            username.style.opacity = '1';

            // Typing effect
            const text = username.textContent;
            username.textContent = '';
            let i = 0;
            const type = setInterval(() => {
                if (i < text.length) {
                    username.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(type);
                }
            }, 90);
        }, 400);
    }, 250);

    // 3D tilt on hover
    profileContainer.addEventListener('mousemove', (e) => {
        const rect = profileContainer.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        profileContainer.style.transform = `perspective(800px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg)`;
    });
    profileContainer.addEventListener('mouseleave', () => {
        profileContainer.style.transform = '';
    });

    // Profile pic click → image viewer
    profilePic.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        const src = this.src || this.getAttribute('src');
        if (src) openImageViewer(src);
    });

    // Container click → pulse
    profileContainer.addEventListener('click', (e) => {
        if (e.target !== profilePic) {
            username.classList.add('name-pulse');
            profilePic.classList.add('pic-pulse');
            setTimeout(() => {
                username.classList.remove('name-pulse');
                profilePic.classList.remove('pic-pulse');
            }, 600);
        }
    });

    // Username click
    username.addEventListener('click', () => {
        username.classList.add('name-pulse');
        setTimeout(() => username.classList.remove('name-pulse'), 600);
    });

    // Online status checker
    async function checkOnlineStatus() {
        try {
            const api = new IlluxatAPI();
            const response = await api.online('lemo');
            if (response.error) {
                statusDot.classList.remove('loading', 'online');
                statusDot.classList.add('offline');
                return;
            }
            if (response.data && response.data.status === 'Online') {
                statusDot.classList.remove('loading', 'offline');
                statusDot.classList.add('online');
            } else {
                statusDot.classList.remove('loading', 'online');
                statusDot.classList.add('offline');
            }
        } catch {
            statusDot.classList.remove('loading', 'online');
            statusDot.classList.add('offline');
        }
    }
});

// ── Admin Gear ──
function handleGearClick() {
    if (typeof isAdmin !== 'undefined') {
        if (isAdmin) {
            toggleDashboard();
        } else {
            showAdminLoginForGear();
        }
    } else {
        showAdminLoginForGear();
    }
}

// ── Theme Switcher ──
function toggleThemeMenu() {
    const menu = document.getElementById('themeMenu');
    if (menu) menu.classList.toggle('active');
}

function changeTheme(name) {
    document.documentElement.removeAttribute('data-theme');
    if (name !== 'default') {
        document.documentElement.setAttribute('data-theme', name);
    }
    localStorage.setItem('selectedTheme', name);

    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('data-theme') === name);
    });

    const colors = {
        default: '#7c3aed', blue: '#3b82f6', green: '#10b981',
        red: '#ef4444', orange: '#f59e0b', dark: '#e4e4e7'
    };
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', colors[name] || colors.default);

    const menu = document.getElementById('themeMenu');
    if (menu) setTimeout(() => menu.classList.remove('active'), 250);
}

// Theme init
document.addEventListener('DOMContentLoaded', function () {
    const saved = localStorage.getItem('selectedTheme') || 'default';
    document.documentElement.removeAttribute('data-theme');
    if (saved !== 'default') document.documentElement.setAttribute('data-theme', saved);

    const colors = {
        default: '#7c3aed', blue: '#3b82f6', green: '#10b981',
        red: '#ef4444', orange: '#f59e0b', dark: '#e4e4e7'
    };
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', colors[saved] || colors.default);

    setTimeout(() => {
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.toggle('active', opt.getAttribute('data-theme') === saved);
        });
    }, 50);

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('themeMenu');
        const fab = document.getElementById('themeFab');
        if (menu && fab && !menu.contains(e.target) && !fab.contains(e.target) && menu.classList.contains('active')) {
            menu.classList.remove('active');
        }
    });
});

// Global exports
window.toggleThemeMenu = toggleThemeMenu;
window.changeTheme = changeTheme;
// ── Delete Story Function ──
window.deleteStory = async function(storyId) {
    // 1. طلب تأكيد من المستخدم قبل الحذف
    if (!confirm("هل أنت متأكد من حذف هذا الستوري؟ 🗑️")) return;

    try {
        // 2. إنشاء نسخة من الـ API لإرسال الطلب
        const api = new IlluxatAPI();
        
        // 3. استدعاء دالة الحذف (تأكد أن الدالة اسمها delete في ملف illuxat-api.js)
        // إذا كان اسم الدالة مختلف في ملف الـ API قم بتعديله هنا
        const response = await api.deleteStory(storyId); 

        if (response && !response.error) {
            alert("تم حذف الستوري بنجاح! ✅");
            
            // 4. إخفاء العنصر من الشاشة فوراً دون إعادة تحميل الصفحة
            const storyElement = document.getElementById(`story-item-${storyId}`) || 
                               document.querySelector(`[onclick*="${storyId}"]`).closest('.story-item-dashboard');
            
            if (storyElement) {
                storyElement.style.transform = 'scale(0.8)';
                storyElement.style.opacity = '0';
                setTimeout(() => storyElement.remove(), 300);
            } else {
                location.reload(); // إذا لم نجد العنصر نحدث الصفحة
            }
        } else {
            console.error("خطأ من السيرفر:", response.error);
            alert("حدث خطأ أثناء الحذف: " + (response.error || "خطأ غير معروف"));
        }
    } catch (error) {
        console.error("فشل تنفيذ عملية الحذف:", error);
        alert("Error deleting story. Please try again! ❌");
    }
};
