(() => {
  const initReveal = (root = document) => {
    const items = root.querySelectorAll('.zeha-scope .reveal:not([data-zeha-reveal-bound])');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12 });

      items.forEach((item) => {
        item.dataset.zehaRevealBound = 'true';
        observer.observe(item);
      });
      return;
    }

    items.forEach((item) => {
      item.dataset.zehaRevealBound = 'true';
      item.classList.add('is-visible');
    });
  };

  const setVideoState = (card, video) => {
    const isPlaying = !video.paused && !video.ended;
    card.classList.toggle('is-playing', isPlaying);

    if (video.currentTime > 0 || isPlaying) {
      card.classList.add('has-started');
    }
  };

  const playVideo = (card, video) => {
    video.muted = true;
    const playPromise = video.play();

    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => setVideoState(card, video))
        .catch(() => setVideoState(card, video));
      return;
    }

    setVideoState(card, video);
  };

  const initPackagingVideos = (root = document) => {
    const sections = root.querySelectorAll('[data-zeha-packaging]:not([data-zeha-video-bound])');

    sections.forEach((section) => {
      section.dataset.zehaVideoBound = 'true';
      const autoplayMode = section.dataset.autoplayMode || 'viewport';
      const cards = [...section.querySelectorAll('[data-zeha-video-card]')];
      const videoItems = [];

      cards.forEach((card) => {
        const video = card.querySelector('video');
        if (!video) return;

        video.muted = true;
        video.playsInline = true;
        videoItems.push({ card, video });

        const syncState = () => setVideoState(card, video);
        video.addEventListener('play', syncState);
        video.addEventListener('pause', syncState);
        video.addEventListener('ended', syncState);

        card.addEventListener('click', () => {
          if (video.paused) {
            playVideo(card, video);
          } else {
            video.pause();
          }
        });
      });

      if (!videoItems.length) return;

      if (autoplayMode === 'immediate') {
        videoItems.forEach(({ card, video }) => playVideo(card, video));
        return;
      }

      if (!('IntersectionObserver' in window)) {
        videoItems.forEach(({ card, video }) => playVideo(card, video));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const item = videoItems.find(({ card }) => card === entry.target);
          if (!item) return;

          if (entry.isIntersecting) {
            playVideo(item.card, item.video);
          } else {
            item.video.pause();
          }
        });
      }, { threshold: 0.35 });

      videoItems.forEach(({ card }) => observer.observe(card));
    });
  };

  const init = (root = document) => {
    initReveal(root);
    initPackagingVideos(root);
  };

  if (!window.__zehaSectionsBound) {
    window.__zehaSectionsBound = true;

    document.addEventListener('DOMContentLoaded', () => init(document));
    document.addEventListener('shopify:section:load', (event) => init(event.target));
  }

  init(document);
})();
