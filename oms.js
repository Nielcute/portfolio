(function () {
  'use strict';

  
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  // Profile photo 
  const PROFILE_PHOTO = "profile.jpg";

  // Quiz items 
  const QUIZ_ITEMS = [
    {
      title: "Quiz 1",
      score: "18/20",
      date: "August 25, 2026",
      images: [
        "quiz1.jpg",
        "quiz1-2.jpg"
      ]
    } ,
    {
      title: "Quiz 2",
      score: "20/20",
      date: "October 04, 2026",
      images: [
        "quiz 2.jpg"
        
      ]
    }
    
  ];

  // Activity items
  
  const ACTIVITY_ITEMS = [
    {
      title: "ACTIVITY 1",
      subtitle: "Emerging Technology",
      images: [
        "activity 1.pdf"
      ]
    },
    {
      title: "ACTIVITY 2",
      subtitle: "Requirements Determination and Gathering Techniques",
      images: [
        "activity 2.pdf"
      ]
    }
  ];

  // Exam items
  const EXAM_ITEMS = [];

  const DATA = { quiz: QUIZ_ITEMS, activity: ACTIVITY_ITEMS, exam: EXAM_ITEMS };
  const sections = ['quiz', 'activity', 'exam'];

  /* NAVIGATION */
  const navButtons = document.querySelectorAll('nav.nav-links button');
  const pages = document.querySelectorAll('.page');
  const navLinks = document.getElementById('navLinks');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const globalBackBtn = document.getElementById('globalBackBtn');

  function goToPage(pageId) {
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageId);
    });

    if (globalBackBtn) {
      globalBackBtn.classList.toggle('visible', pageId !== 'home');
    }

    if (navLinks) navLinks.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => goToPage(btn.dataset.page));
  });

  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => goToPage(el.dataset.goto));
  });

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      if (navLinks) navLinks.classList.toggle('open');
    });
  }

  /* AVATAR*/
  const avatarFrame = document.getElementById('avatarFrame');
  function renderAvatar() {
    if (!avatarFrame) return;
    if (PROFILE_PHOTO) {
      avatarFrame.innerHTML = `<img src="${PROFILE_PHOTO}" alt="Profile photo">`;
    } else {
      avatarFrame.innerHTML = '<span class="avatar-fallback">JD</span>';
    }
  }

  
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* FILE TYPE */
  function isPDF(path) {
    return typeof path === 'string' && path.toLowerCase().endsWith('.pdf');
  }

  /* PDF THUMBNAIL RENDERING */
  async function renderPdfThumbnail(path) {
    if (!window.pdfjsLib) return null;
    try {
      const loadingTask = pdfjsLib.getDocument(path);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const targetWidth = 400;
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = targetWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('Could not render PDF thumbnail for', path, err);
      return null;
    }
  }

  function loadPdfThumbnailsForSection(section) {
    const container = document.getElementById('gallery-' + section);
    if (!container) return;
    const placeholders = container.querySelectorAll('[data-pdf-path]');

    placeholders.forEach(async (el) => {
      const path = decodeURIComponent(el.dataset.pdfPath);
      const dataUrl = await renderPdfThumbnail(path);
      if (!dataUrl) return;
      const img = document.createElement('img');
      img.className = 'gallery-thumb';
      img.src = dataUrl;
      img.alt = el.dataset.pdfTitle || 'PDF preview';
      el.replaceWith(img);
    });
  }

  /*  RENDER GALLERIES */
  function renderGallery(section) {
    const container = document.getElementById('gallery-' + section);
    if (!container) return;
    const items = DATA[section];

    if (!items.length) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = items.map((item, index) => {
      const hasImages = item.images && item.images.length > 0;
      const count = hasImages ? item.images.length : 0;
      const firstIsPDF = hasImages && isPDF(item.images[0]);

      let thumb;
      if (!hasImages) {
        thumb = `<div class="gallery-thumb-placeholder">🖼️</div>`;
      } else if (firstIsPDF) {
        thumb = `<div class="gallery-thumb-placeholder" data-pdf-path="${encodeURIComponent(item.images[0])}" data-pdf-title="${escapeHtml(item.title)}">📄</div>`;
      } else {
        thumb = `<img class="gallery-thumb" src="${item.images[0]}" alt="${escapeHtml(item.title)}">`;
      }

      const badge = count > 1 ? `<div class="image-count-badge">${count} files</div>` : '';

      
      const metaParts = [];
      if (item.score) metaParts.push('Score: ' + item.score);
      if (item.date) metaParts.push(item.date);
      if (!metaParts.length && item.subtitle) metaParts.push(item.subtitle);
      const subText = metaParts.join(' • ');

      return `
        <div class="gallery-item ${hasImages ? '' : 'is-empty'}" data-section="${section}" data-index="${index}">
          ${badge}
          ${thumb}
          <div class="gallery-item-info">
            <div class="gallery-item-title">${escapeHtml(item.title)}</div>
            ${subText ? `<div class="gallery-item-sub">${escapeHtml(subText)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    loadPdfThumbnailsForSection(section);
  }

  sections.forEach(section => {
    const container = document.getElementById('gallery-' + section);
    if (!container) return;
    container.addEventListener('click', (e) => {
      const galleryItem = e.target.closest('.gallery-item');
      if (!galleryItem || galleryItem.classList.contains('is-empty')) return;
      const index = parseInt(galleryItem.dataset.index, 10);
      openModal(section, index, 0);
    });
  });

  /*  MODAL LOGIC */
  const modalOverlay = document.getElementById('modalOverlay');
  const modalContent = document.querySelector('.modal-content');
  const modalImage = document.getElementById('modalImage');
  const modalPdfFrame = document.getElementById('modalPdfFrame');
  const modalTitle = document.getElementById('modalTitle');
  const modalCounter = document.getElementById('modalCounter');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalPrevBtn = document.getElementById('modalPrevBtn');
  const modalNextBtn = document.getElementById('modalNextBtn');

  let currentModal = null; // { section, itemIndex, imageIndex }

  function openModal(section, itemIndex, imageIndex) {
    const item = DATA[section][itemIndex];
    if (!item || !item.images || !item.images.length) return;
    currentModal = { section, itemIndex, imageIndex };
    renderModal();
    if (modalOverlay) modalOverlay.classList.add('active');
  }

  function renderModal() {
    if (!currentModal) return;
    const { section, itemIndex, imageIndex } = currentModal;
    const item = DATA[section][itemIndex];
    const total = item.images.length;
    const path = item.images[imageIndex];
    const showingPdf = isPDF(path);

    if (showingPdf) {
      if (modalPdfFrame) { modalPdfFrame.src = path; modalPdfFrame.style.display = 'block'; }
      if (modalImage) { modalImage.style.display = 'none'; modalImage.src = ''; }
    } else {
      if (modalImage) { modalImage.src = path; modalImage.style.display = 'block'; }
      if (modalPdfFrame) { modalPdfFrame.style.display = 'none'; modalPdfFrame.src = ''; }
    }

    
    if (modalOverlay) modalOverlay.classList.toggle('pdf-open', showingPdf);
    if (modalContent) modalContent.classList.toggle('pdf-mode', showingPdf);

    if (modalTitle) modalTitle.textContent = item.title;

    const metaParts = [];
    if (item.score) metaParts.push('Score: ' + item.score);
    if (item.date) metaParts.push(item.date);
    if (!metaParts.length && item.subtitle) metaParts.push(item.subtitle);
    if (total > 1) metaParts.push(`File ${imageIndex + 1} of ${total}`);
    if (modalCounter) modalCounter.textContent = metaParts.join(' • ');

    // Hide Previous button on first file
    if (modalPrevBtn) {
      modalPrevBtn.classList.toggle('hidden', imageIndex === 0 || total <= 1);
    }

    // Hide Next button on last file
    if (modalNextBtn) {
      modalNextBtn.classList.toggle('hidden', imageIndex === total - 1 || total <= 1);
    }
  }

  function showPrev(e) {
    if (e) e.stopPropagation();
    if (!currentModal) return;
    if (currentModal.imageIndex > 0) {
      currentModal.imageIndex -= 1;
      renderModal();
    }
  }

  function showNext(e) {
    if (e) e.stopPropagation();
    if (!currentModal) return;
    const item = DATA[currentModal.section][currentModal.itemIndex];
    if (currentModal.imageIndex < item.images.length - 1) {
      currentModal.imageIndex += 1;
      renderModal();
    }
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      modalOverlay.classList.remove('pdf-open');
    }
    if (modalContent) modalContent.classList.remove('pdf-mode');
    currentModal = null;
  }

  
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalPrevBtn) modalPrevBtn.addEventListener('click', showPrev);
  if (modalNextBtn) modalNextBtn.addEventListener('click', showNext);

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!modalOverlay || !modalOverlay.classList.contains('active')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') showPrev(e);
    if (e.key === 'ArrowRight') showNext(e);
  });

  
  renderAvatar();
  sections.forEach(renderGallery);
})();