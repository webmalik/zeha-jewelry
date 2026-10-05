(() => {
    const initReveal = (root = document) => {
        const items = root.querySelectorAll('.zeha-scope .reveal:not([data-zeha-reveal-bound])');

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    });
                },
                { threshold: 0.12 },
            );

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
        const sections = root.querySelectorAll(
            '[data-zeha-packaging]:not([data-zeha-video-bound])',
        );

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

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const item = videoItems.find(({ card }) => card === entry.target);
                        if (!item) return;

                        if (entry.isIntersecting) {
                            playVideo(item.card, item.video);
                        } else {
                            item.video.pause();
                        }
                    });
                },
                { threshold: 0.35 },
            );

            videoItems.forEach(({ card }) => observer.observe(card));
        });
    };

    const loadZehaSwiper = () => {
        return new Promise((resolve, reject) => {
            if (window.Swiper) {
                resolve(window.Swiper);
                return;
            }

            const existingScript = document.querySelector('script[data-zeha-swiper]');

            if (existingScript) {
                existingScript.addEventListener('load', () => {
                    resolve(window.Swiper);
                });

                return;
            }

            if (!document.querySelector('link[data-zeha-swiper]')) {
                const stylesheet = document.createElement('link');

                stylesheet.rel = 'stylesheet';
                stylesheet.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';

                stylesheet.dataset.zehaSwiper = '';

                document.head.appendChild(stylesheet);
            }

            const script = document.createElement('script');

            script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';

            script.async = true;
            script.dataset.zehaSwiper = '';

            script.addEventListener('load', () => {
                resolve(window.Swiper);
            });

            script.addEventListener('error', reject);

            document.body.appendChild(script);
        });
    };

    const initReviewsSlider = async (root = document) => {
        const sections = root.querySelectorAll('[data-zeha-reviews-slider]');

        if (!sections.length) return;

        try {
            await loadZehaSwiper();
        } catch (error) {
            console.error('Zeha: Swiper could not be loaded.', error);
            return;
        }

        sections.forEach((section) => {
            const slider = section.querySelector('.zeha-reviews-swiper');

            if (!slider) return;

            if (slider.swiper) {
                slider.swiper.destroy(true, true);
            }

            const prevButton = section.querySelector('[data-zeha-reviews-prev]');

            const nextButton = section.querySelector('[data-zeha-reviews-next]');

            new window.Swiper(slider, {
                slidesPerView: 1.12,
                spaceBetween: 12,

                speed: 550,

                grabCursor: true,
                simulateTouch: true,

                allowTouchMove: true,

                watchOverflow: true,

                observer: true,
                observeParents: true,

                resistance: true,
                resistanceRatio: 0.85,

                preventClicks: true,
                preventClicksPropagation: true,

                navigation: {
                    prevEl: prevButton,
                    nextEl: nextButton,
                },

                breakpoints: {
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 16,
                    },

                    1024: {
                        slidesPerView: 3,
                        spaceBetween: 16,
                    },
                },
            });
        });
    };

    const init = (root = document) => {
        initReveal(root);
        initPackagingVideos(root);
        initReviewsSlider(root);
    };

    if (!window.__zehaSectionsBound) {
        window.__zehaSectionsBound = true;

        document.addEventListener('DOMContentLoaded', () => init(document));
        document.addEventListener('shopify:section:load', (event) => init(event.target));
    }

    init(document);
})();

if (!window.__zehaPopupTriggerBound) {
    window.__zehaPopupTriggerBound = true;

    document.addEventListener('click', async (e) => {
        const button = e.target.closest('[data-zeha-popup-open]');

        if (!button) return;

        e.preventDefault();

        await customElements.whenDefined('sht-popup');

        const popup = document.querySelector('sht-popup');

        if (!popup) return;

        popup.classList.remove('d-none');
        popup.togglePopup(true);
    });
}
