// Initialize Firebase using config
firebase.initializeApp(config.firebase);
const db = firebase.firestore();

// Story functionality
let stories = [];
let isAdmin = false;
let adminPassword = config.admin.password;

// Variables to store uploaded files and generated thumbnail

let imageUrl = "";
let videoUrl = "";
// Profile picture functionality
let currentProfilePic = 'https://xatimg.com/image/mO5k7dwmDweI.jpg';
let uploadedProfilePicData = null;

// Dashboard functionality
function toggleDashboard() {
  const dashboard = document.getElementById('adminDashboard');
  if (dashboard.style.display === 'none' || dashboard.style.display === '') {
    dashboard.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    updateDashboardStats();
    loadRecentStories();
  } else {
    dashboard.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

function updateDashboardStats() {
  if (!isAdmin) return;

  // Update total stories count
  document.getElementById('totalStories').textContent = stories.length;

  // Calculate total views
  const totalViews = stories.reduce((sum, story) => sum + (story.views || 0), 0);
  document.getElementById('totalViews').textContent = totalViews;
}

function loadRecentStories() {
  if (!isAdmin) return;

  const storiesList = document.getElementById('recentStoriesList');
  storiesList.innerHTML = '';

  if (stories.length === 0) {
    storiesList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No stories available yet.</p>';
    return;
  }

  // Show all stories
  stories.forEach((story, index) => {
    const storyElement = createDashboardStoryElement(story, index);
    storiesList.appendChild(storyElement);
  });
}

function createDashboardStoryElement(story, index) {
  const storyDiv = document.createElement('div');
  storyDiv.className = 'story-item-dashboard';

  // Check visibility (default to true if undefined for legacy stories)
  const isVisible = story.isVisible !== false;

  let storyImage = (story.imageUrl) || ((story.videoInfo && story.videoInfo.thumbnail) ? story.videoInfo.thumbnail : currentProfilePic);

  storyDiv.innerHTML = `
    <img src="${storyImage}" alt="${story.title}" class="story-thumbnail" onerror="this.src='${currentProfilePic}'">
    <div class="story-details">
      <div class="story-title">
        ${story.title || 'Untitled Story'}
        ${!isVisible ? '<span style="font-size:0.7em; background:#333; padding:2px 6px; border-radius:4px; margin-left:5px; color:#aaa;">Hidden</span>' : ''}
      </div>
      <div class="story-meta">
        <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:3px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${story.timestamp}</span>
        <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:3px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>${story.views || 0} views</span>
      </div>
      <div class="story-content-preview">${story.content ? story.content.substring(0, 100) + (story.content.length > 100 ? '...' : '') : 'No content'}</div>
      <div class="story-actions">
        <button class="story-action-btn" onclick="viewStory(stories[${index}], ${index})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> View
        </button>
        
        <button class="story-action-btn visibility" onclick="toggleStoryVisibility('${story.id}', ${isVisible})">
          ${isVisible
      ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> Hide`
      : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Show`
    }
        </button>

        <button class="story-action-btn delete" onclick="deleteStory('${story.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Delete
        </button>
      </div>
    </div>
  `;

  return storyDiv;
}

// Video platform detection (No changes here)
function detectVideoPlatform(url) {
  if (!url) return null;
  const urlLower = url.toLowerCase();

  // YouTube (including Shorts)
  if (urlLower.includes('youtube.com/watch') || urlLower.includes('youtu.be/') || urlLower.includes('youtube.com/shorts/')) {
    const videoId = extractYouTubeId(url);
    const isShorts = urlLower.includes('/shorts/');
    return {
      platform: 'youtube',
      videoId: videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      isShorts: isShorts,
      aspectRatio: isShorts ? 'portrait' : 'landscape'
    };
  }

  // Direct video file
  if (urlLower.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/)) {
    return {
      platform: 'direct',
      videoUrl: url,
      aspectRatio: 'auto'
    };
  }

  return null;
}

function extractYouTubeId(url) {
  if (url.includes('/shorts/')) {
    const shortsMatch = url.match(/\/shorts\/([^/?&#]+)/);
    return shortsMatch ? shortsMatch[1] : null;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Admin functions
function handleGearClick() {
  if (isAdmin) {
    toggleDashboard();
  } else {
    showAdminLoginForGear();
  }
}

function showAdminLoginForGear() {
  const loginModal = document.createElement('div');
  loginModal.className = 'modal active';
  loginModal.style.zIndex = '1003';

  loginModal.innerHTML = `
    <div class="modal-content admin-modal" style="position:relative; border:1.5px solid var(--glass-border); box-shadow: 0 0 60px rgba(124,58,237,.15), 0 20px 60px rgba(0,0,0,.5); max-width:400px;">
      <button class="modal-close" onclick="closeAdminLoginModal()" style="position:absolute;top:14px;right:14px;z-index:10;" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div style="padding:36px 32px 32px; text-align:center;">
        <div style="margin-bottom:24px;">
          <div style="width:56px;height:56px;margin:0 auto 18px;border-radius:16px;background:var(--glass-bg);border:1px solid var(--glass-border);display:flex;align-items:center;justify-content:center;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3 style="font-family:'Space Grotesk','DM Sans',sans-serif; font-size:1.5rem; font-weight:700; margin-bottom:10px; background:linear-gradient(135deg,var(--accent-primary),var(--accent-secondary)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;">Admin Access Required</h3>
          <p style="color:var(--text-secondary); font-size:.95rem; line-height:1.5;">Enter admin password to access admin features</p>
        </div>
        <div style="margin-bottom:24px;">
          <input type="password" id="adminPasswordInput" placeholder="Enter password..." style="width:100%; padding:14px 16px; border:1.5px solid var(--glass-border); border-radius:12px; background:rgba(12,12,20,.5); color:var(--text-primary); font-size:1rem; font-family:inherit; transition:all .3s cubic-bezier(.4,0,.2,1); outline:none;" onfocus="this.style.borderColor='var(--accent-primary)';this.style.boxShadow='0 0 0 3px rgba(124,58,237,.15)';" onblur="this.style.borderColor='var(--glass-border)';this.style.boxShadow='none';">
        </div>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button onclick="closeAdminLoginModal()" style="background:var(--glass-bg); color:var(--text-primary); border:1px solid var(--glass-border); padding:11px 22px; border-radius:50px; cursor:pointer; font-size:.9rem; font-weight:600; display:flex; align-items:center; gap:7px; transition:all .3s cubic-bezier(.4,0,.2,1); font-family:inherit;" onmouseover="this.style.borderColor='var(--accent-primary)';this.style.background='rgba(124,58,237,.1)';" onmouseout="this.style.borderColor='var(--glass-border)';this.style.background='var(--glass-bg)';">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel
          </button>
          <button onclick="verifyAdminPasswordForGear()" style="background:linear-gradient(135deg,var(--accent-primary),var(--accent-secondary)); color:#fff; border:none; padding:11px 22px; border-radius:50px; cursor:pointer; font-size:.9rem; font-weight:600; display:flex; align-items:center; gap:7px; transition:all .3s cubic-bezier(.4,0,.2,1); box-shadow:0 4px 16px rgba(124,58,237,.3); font-family:inherit;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(124,58,237,.45)';" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 16px rgba(124,58,237,.3)';">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Login
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(loginModal);
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    document.getElementById('adminPasswordInput').focus();
  }, 100);

  document.getElementById('adminPasswordInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      verifyAdminPasswordForGear();
    }
  });
}

function closeAdminLoginModal() {
  const modal = document.querySelector('.modal.active[style*="z-index: 1003"]') || document.querySelector('.modal.active:not(#storyModal):not(#adminDashboard)');
  if (modal) {
    modal.remove();
  }
  document.body.style.overflow = 'auto';
}

function verifyAdminPasswordForGear() {
  const inputPassword = document.getElementById('adminPasswordInput').value;

  if (inputPassword === adminPassword) {
    isAdmin = true;
    sessionStorage.setItem('lemoAdminSession', 'true');
    closeAdminLoginModal();
    showNotification('Admin access granted! Welcome back! 🔓');

    updateGearIcon();
    renderStories();
  } else {
    showNotification('Incorrect password! Please try again! ❌');
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminPasswordInput').focus();
  }
}

function updateGearIcon() {
  const gearIcon = document.querySelector('.fab--admin') || document.querySelector('.admin-gear');
  if (!gearIcon) return;
  if (isAdmin) {
    gearIcon.classList.add('admin-active');
    gearIcon.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>';
    gearIcon.title = 'Admin Dashboard - Click to open';
  } else {
    gearIcon.classList.remove('admin-active');
    gearIcon.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
    gearIcon.title = 'Admin Settings';
  }
}

function showLogoutConfirm() {
  const logoutModal = document.createElement('div');
  logoutModal.className = 'modal active';
  logoutModal.style.zIndex = '1003';

  logoutModal.innerHTML = `
    <div class="modal-content admin-modal" style="position:relative; border:1.5px solid var(--glass-border); box-shadow: 0 0 60px rgba(239,68,68,.1), 0 20px 60px rgba(0,0,0,.5); max-width:400px;">
      <button class="modal-close" onclick="closeAdminLoginModal()" style="position:absolute;top:14px;right:14px;z-index:10;" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div style="padding:36px 32px 32px; text-align:center;">
        <div style="margin-bottom:24px;">
          <div style="width:56px;height:56px;margin:0 auto 18px;border-radius:16px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);display:flex;align-items:center;justify-content:center;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
          <h3 style="font-family:'Space Grotesk','DM Sans',sans-serif; font-size:1.5rem; font-weight:700; margin-bottom:10px; background:linear-gradient(135deg,var(--accent-primary),var(--accent-secondary)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;">Logout Admin</h3>
          <p style="color:var(--text-secondary); font-size:.95rem; line-height:1.5;">Are you sure you want to logout from admin mode?</p>
        </div>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button onclick="closeAdminLoginModal()" style="background:var(--glass-bg); color:var(--text-primary); border:1px solid var(--glass-border); padding:11px 22px; border-radius:50px; cursor:pointer; font-size:.9rem; font-weight:600; display:flex; align-items:center; gap:7px; transition:all .3s cubic-bezier(.4,0,.2,1); font-family:inherit;" onmouseover="this.style.borderColor='var(--accent-primary)';this.style.background='rgba(124,58,237,.1)';" onmouseout="this.style.borderColor='var(--glass-border)';this.style.background='var(--glass-bg)';">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel
          </button>
          <button onclick="logoutAdmin()" style="background:linear-gradient(135deg,#ef4444,#f87171); color:#fff; border:none; padding:11px 22px; border-radius:50px; cursor:pointer; font-size:.9rem; font-weight:600; display:flex; align-items:center; gap:7px; transition:all .3s cubic-bezier(.4,0,.2,1); box-shadow:0 4px 16px rgba(239,68,68,.3); font-family:inherit;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(239,68,68,.45)';" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 16px rgba(239,68,68,.3)';">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Logout
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(logoutModal);
  document.body.style.overflow = 'hidden';
}

function logoutAdmin() {
  isAdmin = false;
  sessionStorage.removeItem('lemoAdminSession');
  const activeModal = document.querySelector('.modal.active[style*="z-index: 1003"]') || document.querySelector('.modal.active:not(#storyModal):not(#adminDashboard)');
  if (activeModal) activeModal.remove();
  document.body.style.overflow = 'auto';
  updateGearIcon();
  renderStories();

  // Close dashboard if it's open
  const dashboard = document.getElementById('adminDashboard');
  if (dashboard && (dashboard.style.display === 'flex' || dashboard.style.display === 'block')) {
    dashboard.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  showNotification('Admin logged out successfully! 👋');
}

// Story modal functions
function openStoryModalFromDashboard() {
  // Close the dashboard first
  toggleDashboard();
  // Then open the story modal
  openStoryModal();
}

function openStoryModal() {
  if (!isAdmin) {
    showAdminLoginForGear();
    return;
  }
  document.getElementById('storyModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeStoryModal() {
  document.getElementById('storyModal').classList.remove('active');
  document.body.style.overflow = 'auto';
  document.getElementById('storyForm').reset();

  // تنظيف القيم
  autoGeneratedThumbnail = null;

  document.getElementById('imageFileName').textContent = '';
  document.getElementById('videoFileName').textContent = '';
}

// Add story
async function addStory(title, content, imageUrl = null, videoUrl = null) {
  let videoInfo = detectVideoPlatform(videoUrl);

  const finalImage = imageUrl || (videoInfo && videoInfo.thumbnail) || null;

  const story = {
    title: title || '',
    content: content || '',
    imageUrl: finalImage || null,
    mediaUrl: videoUrl || null,
    mediaType: videoUrl ? 'video' : 'image',
    videoInfo: videoInfo || null,
    timestamp: new Date().toLocaleDateString(),
    views: 0,
    isVisible: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    const docRef = await db.collection('stories').add(story);
    story.id = docRef.id;
    stories.unshift(story);
    renderStories();
    closeStoryModal();
    showNotification('Story added successfully! ✨');
  } catch (error) {
    console.error('Error adding story:', error);
    showNotification('Error adding story. Please try again! ❌');
  }
}

// Toggle Story Visibility
async function toggleStoryVisibility(storyId, currentStatus) {
  try {
    const newStatus = !currentStatus;

    // Update in Firestore
    await db.collection('stories').doc(storyId).update({
      isVisible: newStatus
    });

    // Update local state
    const story = stories.find(s => s.id === storyId);
    if (story) {
      story.isVisible = newStatus;
    }

    // Refresh UI
    renderStories();
    if (document.getElementById('adminDashboard').style.display === 'flex') {
      loadRecentStories(); // Refresh dashboard list to update icon
    }

    showNotification(newStatus ? 'Story is now visible! 👁️' : 'Story hidden from profile! 🙈');

  } catch (error) {
    console.error('Error toggling visibility:', error);
    showNotification('Error updating visibility! ❌');
  }
}

// Render stories
function renderStories() {
  const container = document.getElementById('storiesContainer');
  container.innerHTML = '';

  if (isAdmin) {
    const addButton = document.createElement('div');
    addButton.className = 'story-item add-story';
    addButton.onclick = openStoryModal;
    addButton.innerHTML = `
      <div class="add-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
      <div class="add-text">Create story</div>
    `;
    container.appendChild(addButton);
  }

  // Filter logic: If admin, show all. If not admin, show only visible.
  // We treat undefined isVisible (legacy data) as true.
  const storiesToRender = isAdmin ? stories : stories.filter(story => story.isVisible !== false);

  if (storiesToRender && storiesToRender.length > 0) {
    storiesToRender.forEach((story, index) => {
      const originalIndex = stories.indexOf(story);
      const storyElement = createStoryElement(story, originalIndex);
      container.appendChild(storyElement);
    });
  } else if (!isAdmin) {
    const noStoriesMessage = document.createElement('div');
    noStoriesMessage.style.cssText = `
      text-align: center;
      padding: 20px;
      color: #888;
      font-style: italic;
    `;
    noStoriesMessage.textContent = 'No stories available yet.';
    container.appendChild(noStoriesMessage);
  }

  // Update dashboard stats if admin and dashboard is open
  if (isAdmin) {
    updateDashboardStats();
    loadRecentStories();
  }
}

function createStoryElement(story, index) {
  const storyDiv = document.createElement('div');

  // Add styling for hidden stories (only visible to admin)
  const isHidden = story.isVisible === false;
  storyDiv.className = `story-item ${isHidden ? 'hidden-story' : ''}`;

  storyDiv.onclick = () => viewStory(story, index);

  let storyImage = (story.imageUrl) || ((story.videoInfo && story.videoInfo.thumbnail) ? story.videoInfo.thumbnail : currentProfilePic);

  storyDiv.innerHTML = `
    <img src="${storyImage}" alt="${story.title}" class="story-image" onerror="this.src='${currentProfilePic}'">
    <div class="story-profile">
      <img src="${currentProfilePic}" alt="Profile">
    </div>
    
    ${isHidden ? `<div class="story-badge-hidden"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg></div>` : ''}

    <div class="story-overlay">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    </div>
  `;

  return storyDiv;
}

async function viewStory(story, index) {
  // Only increment views if not admin and story is visible
  // Increment views if story is visible (allow admins to view count too for testing)
  if (story.isVisible !== false) {
    story.views = (parseInt(story.views) || 0) + 1;
    try {
      await db.collection('stories').doc(story.id).update({
        views: story.views
      });
    } catch (error) {
      console.error('Error updating view count:', error);
      story.views--; // Revert on error
    }
  }

  const viewerModal = document.createElement('div');
  viewerModal.className = 'modal active';
  viewerModal.style.zIndex = '1001';

  viewerModal.innerHTML = `
    <div class="modal-content story-viewer" style="
        max-width: 900px;
        width: 95%;
        background: rgba(10, 10, 18, 0.85);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        display: grid;
        grid-template-columns: 1fr;
        overflow: hidden;
        border-radius: 24px;
        position: relative;
    ">
      <button class="modal-close-floating" onclick="this.parentElement.parentElement.remove(); document.body.style.overflow = 'auto';" aria-label="Close" style="
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 20;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
      " onmouseover="this.style.background='var(--accent-primary)'; this.style.transform='rotate(90deg)';" onmouseout="this.style.background='rgba(0, 0, 0, 0.5)'; this.style.transform='rotate(0deg)';">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <div class="story-layout" style="display: flex; flex-direction: column; max-height: 85vh;">
        
        <div class="story-media-wrapper" style="
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            flex: 1;
            position: relative;
            overflow: hidden;
        ">
          ${story.videoUrl ? `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
              ${story.videoInfo && story.videoInfo.platform === 'youtube' ? `
                <div style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">
                  <iframe
                    src="${story.videoInfo.embedUrl}?autoplay=0&rel=0"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                    allowfullscreen>
                  </iframe>
                </div>
              ` : `
                <video controls style="width: 100%; max-height: 60vh; max-width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                  <source src="${story.videoUrl}" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
              `}
            </div>
          ` : ''}

          ${story.imageUrl && !story.videoUrl ? `
             <img src="${story.imageUrl}" alt="${story.title}" style="max-width: 100%; max-height: 60vh; object-fit: contain; display: block;">
             <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.2), transparent, rgba(0,0,0,0.6)); pointer-events: none;"></div>
          ` : ''}
        </div>

        <div class="story-details-panel" style="
            padding: 30px;
            background: linear-gradient(to bottom, rgba(20, 20, 30, 0.95), rgba(10, 10, 18, 1));
            border-top: 1px solid rgba(255,255,255,0.05);
            overflow-y: auto;
            max-height: 40vh;
        ">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
             <div>
                <h3 style="
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                    background: linear-gradient(135deg, #fff, var(--text-secondary));
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.02em;
                ">${story.title || 'Untitled Story'} ${story.isVisible === false ? '<span style="font-size:0.5em; vertical-align:middle; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">Hidden</span>' : ''}</h3>
                
                <div style="display: flex; gap: 16px; font-size: 0.85rem; color: var(--text-muted);">
                    <span style="display: flex; align-items: center; gap: 6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${story.timestamp}
                    </span>
                    <span style="display: flex; align-items: center; gap: 6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        ${story.views} views
                    </span>
                </div>
             </div>
          </div>

          ${story.content ? `
            <div style="
                color: var(--text-primary); 
                line-height: 1.7; 
                font-size: 1.05rem; 
                opacity: 0.9; 
                margin-bottom: 24px;
                white-space: pre-line;
            ">
                ${story.content}
            </div>
          ` : ''}

          <div style="display: flex; gap: 12px; margin-top: auto;">
             ${isAdmin ? `
             <button onclick="toggleStoryVisibility('${story.id}', ${story.isVisible !== false})" style="
                flex: 1;
                background: rgba(255, 255, 255, 0.05);
                color: var(--text-primary);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 12px;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
             " onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'">
                 ${story.isVisible !== false ?
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> Hide` :
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Show`}
             </button>
             
             <button onclick="deleteStory('${story.id}')" style="
                flex: 1;
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.2);
                padding: 12px;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
             " onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete
             </button>` : ''}
             
             <button onclick="this.closest('.modal').remove(); document.body.style.overflow = 'auto';" style="
                flex: 2;
                background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                color: white;
                border: none;
                padding: 12px;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
             " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Close
             </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(viewerModal);
  document.body.style.overflow = 'hidden';
}

async function deleteStory(storyId) {
  if (confirm('Are you sure you want to delete this story?')) {
    try {
      await db.collection('stories').doc(storyId).delete();
      stories = stories.filter(story => story.id !== storyId);
      renderStories();
      const activeViewer = document.querySelector('.modal.active:not(#storyModal):not(#adminDashboard)');
      if (activeViewer) activeViewer.remove();
      document.body.style.overflow = 'auto';
      showNotification('Story deleted successfully! 🗑️');
    } catch (error) {
      console.error('Error deleting story:', error);
      showNotification('Error deleting story. Please try again! ❌');
    }
  }
}

// Load stories from Firebase
async function loadStories() {
  try {
    const snapshot = await db.collection('stories')
      .orderBy('createdAt', 'desc')
      .get();

    stories = [];
    snapshot.forEach(doc => {
      const story = doc.data();
      story.id = doc.id;
      stories.push(story);
    });

    renderStories();
  } catch (error) {
    console.error('Error loading stories:', error);
    showNotification('Error loading stories. Please refresh the page! ❌');
  }
}

// Global exposure for new functions
window.saveProfilePic = saveProfilePic;

async function loadProfilePic() {
  try {
    const doc = await db.collection('config').doc('profile').get();
    if (doc.exists && doc.data().imageUrl) {
      currentProfilePic = doc.data().imageUrl;
      updateAllProfilePics(currentProfilePic);
    }
  } catch (error) {
    console.error('Error loading profile picture:', error);
  }
}

async function saveProfilePic() {
  const urlInput = document.getElementById('profilePicUrlInput').value.trim();
  const finalImageUrl = uploadedProfilePicData || urlInput;

  if (!finalImageUrl) {
    showNotification('Please upload an image or provide a link! ❌');
    return;
  }

  try {
    await db.collection('config').doc('profile').set({ imageUrl: finalImageUrl }, { merge: true });
    currentProfilePic = finalImageUrl;
    updateAllProfilePics(currentProfilePic);

    // Reset inputs
    uploadedProfilePicData = null;
    document.getElementById('profilePicUrlInput').value = '';
    const fileInput = document.getElementById('profilePicFileInput');
    if (fileInput) fileInput.value = '';
    const fileNameSpan = document.getElementById('profilePicFileName');
    if (fileNameSpan) fileNameSpan.textContent = '';

    showNotification('Profile picture updated successfully! ✨');
  } catch (error) {
    console.error('Error saving profile picture:', error);
    showNotification('Error updating profile picture! ❌');
  }
}

function updateAllProfilePics(url) {
  const mainPic = document.getElementById('profilePic');
  if (mainPic) mainPic.src = url;

  const dashPic = document.getElementById('dashboardProfilePic');
  if (dashPic) dashPic.src = url;

  document.querySelectorAll('.story-profile img').forEach(img => {
    img.src = url;
  });

  // also setting CSS variable for ::before add story button
  document.documentElement.style.setProperty('--profile-pic-bg', `url('${url}')`);
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    color: white;
    padding: 14px 24px;
    border-radius: 50px;
    z-index: 10000;
    font-weight: 600;
    font-size: .9rem;
    font-family: 'DM Sans', system-ui, sans-serif;
    box-shadow: 0 8px 24px rgba(124,58,237,.3);
    animation: slideIn 0.3s ease;
    backdrop-filter: blur(10px);
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// File upload handling

// Add event listeners after DOM content loads
document.addEventListener('DOMContentLoaded', function () {
  // Add event listener for image file selection
  document.getElementById('storyImageFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        uploadedImageData = e.target.result;
        document.getElementById('imageFileName').textContent = file.name;
      };
      reader.readAsDataURL(file);
    }
  });

  // Add event listener for video file selection
  document.getElementById('storyVideoFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        uploadedVideoData = e.target.result;
        document.getElementById('videoFileName').textContent = file.name;

        // Automatically generate thumbnail when video is uploaded
        generateAutoThumbnail(file);
      };
      reader.readAsDataURL(file);
    } else {
      // Hide thumbnail generation status when no video is selected
      document.getElementById('thumbnailGenerationStatus').style.display = 'none';
      autoGeneratedThumbnail = null;
    }
  });

  // Update form submission to use auto-generated thumbnail
  document.getElementById('storyForm').addEventListener('submit', async function (e) {
    e.preventDefault();

   const title = document.getElementById('storyTitle')?.value?.trim() || '';
    const content = document.getElementById('storyContent').value.trim();
    
    const imageFile = document.getElementById("storyImageFile").files[0];
    const videoFile = document.getElementById("storyVideoFile").files[0];

    // Use auto-generated thumbnail if available, otherwise use other image sources
  let imageUrl = null;
  let videoUrl = null;

  if (imageFile) {
    imageUrl = await uploadToImageKit(imageFile);
  }

  if (videoFile) {
    videoUrl = await uploadToImageKit(videoFile);
  }

  const finalImageUrl = autoGeneratedThumbnail || uploadedImageData || imageUrl || null;
  const finalVideoUrl = videoUrl || null;

  if (title || content || finalImageUrl || finalVideoUrl) {
    addStory(title, content, finalImageUrl, finalVideoUrl);
  } else {
    showNotification('Please fill in at least one field! 📝');
  }
});

  // Close modal when clicking outside
  document.getElementById('storyModal').addEventListener('click', function (e) {
    if (e.target === this) {
      closeStoryModal();
    }
  });

  // Scroll stories function
  window.scrollStories = function (direction = 'right') {
    const container = document.getElementById('storiesContainer');
    const distance = Math.round(container.clientWidth * 0.8);
    container.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
    setTimeout(updateStoryNav, 350);
  };

  // Show/hide left/right nav buttons based on scroll position
  function updateStoryNav() {
    const container = document.getElementById('storiesContainer');
    const leftBtn = document.getElementById('storyNavLeft');
    const rightBtn = document.getElementById('storyNavRight');
    if (!container || !leftBtn || !rightBtn) return;
    leftBtn.style.display = container.scrollLeft > 4 ? 'flex' : 'none';
    rightBtn.style.display = 'flex';
  }

  // Initialize
  loadStories();

  const sc = document.getElementById('storiesContainer');
  if (sc) {
    sc.addEventListener('scroll', updateStoryNav, { passive: true });
    window.addEventListener('resize', updateStoryNav);
    updateStoryNav();
  }

  // Check if admin session exists
  const adminSession = sessionStorage.getItem('lemoAdminSession');
  if (adminSession === 'true') {
    isAdmin = true;
    updateGearIcon();
    renderStories();
  }

  // Profile Picture Init
  const profileFileInput = document.getElementById('profilePicFileInput');
  if (profileFileInput) {
    profileFileInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          uploadedProfilePicData = e.target.result;
          document.getElementById('profilePicFileName').textContent = file.name;
          document.getElementById('dashboardProfilePic').src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  loadProfilePic();
});

// Automatic thumbnail generation function
async function generateAutoThumbnail(videoFile) {
  if (!videoFile) return;

  // Show thumbnail generation status
  const thumbnailStatus = document.getElementById('thumbnailGenerationStatus');
  const thumbnailStatusText = document.getElementById('thumbnailStatusText');
  thumbnailStatus.style.display = 'block';
  thumbnailStatusText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating thumbnail from video...';

  try {
    // Create video element
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);

    // Wait for video to load metadata
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });

    const duration = video.duration;

    // Try to get a frame from the middle of the video
    const timePoint = duration / 2;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions (maintain aspect ratio but limit size)
    video.currentTime = timePoint;

    // Wait for frame to load
    await new Promise((resolve) => {
      video.ontimeupdate = () => {
        // Check if video has valid frame data (avoid black screens)
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          // Limit canvas size to avoid large data URLs
          const maxWidth = 800;
          const maxHeight = 600;
          let width = video.videoWidth;
          let height = video.videoHeight;

          // Scale down if necessary
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(video, 0, 0, width, height);
          resolve();
        } else {
          // If we can't get a valid frame, try a slightly different time
          video.currentTime = timePoint + 0.1;
        }
      };
      // Fallback in case ontimeupdate doesn't fire
      setTimeout(resolve, 1000);
    });

    // Convert to data URL with quality optimization
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    autoGeneratedThumbnail = dataUrl;

    // Also set as story image
    uploadedImageData = dataUrl;

    // Update status to show success
    thumbnailStatusText.innerHTML = '<i class="fa-solid fa-check" style="color: #4CAF50;"></i> Thumbnail automatically generated and will be used for your story!';

    // Hide status after 3 seconds
    setTimeout(() => {
      thumbnailStatus.style.display = 'none';
    }, 3000);

  } catch (error) {
    console.error('Error generating thumbnail:', error);
    thumbnailStatusText.innerHTML = '<i class="fa-solid fa-exclamation-triangle" style="color: #F44336;"></i> Error generating thumbnail. Please try again.';

    // Hide status after 3 seconds
    setTimeout(() => {
      thumbnailStatus.style.display = 'none';
    }, 3000);
  }
}
async function uploadToImageKit(file) {
  const url = "https://upload.imagekit.io/api/v1/files/upload";

  const publicKey = "public_oFJEva+PCLm663RvLApHf8dU1wc=";

  // تحويل المفتاح إلى Base64
  const base64Key = btoa(publicKey + ":");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", file.name);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64Key}`
      },
      body: formData
    });

    const data = await response.json();

    if (data.url) {
      return data.url;
    } else {
      console.error("Upload error:", data);
      alert("فشل رفع الملف ❌");
      return null;
    }

  } catch (error) {
    console.error("Upload failed:", error);
    alert("خطأ بالاتصال ❌");
    return null;
  }
}
