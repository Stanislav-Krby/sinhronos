'use strict';

import * as params from '@params';
import { Pig } from './pig';
import { newSwiper } from './helpers';

var debug = console.log.bind(console, '[gallery-deluxe]');


let GalleryDeluxe = {
	init: async function () {
		// One gallery per page (for now).
		const galleryId = 'gallerydeluxe';
		const dataAttributeName = 'data-gd-image-data-url';
		const container = document.getElementById(galleryId);
		if (!container) {
			throw new Error(`No element with id ${galleryId} found.`);
		}
		const dataUrl = container.getAttribute(dataAttributeName);
		if (!dataUrl) {
			throw new Error(`No ${dataAttributeName} attribute found.`);
		}

		// The image opened in the lightbox.
		let activeImage;
		let exifTimeoutId;

		// Lightbox setup.
		const modal = document.getElementById('gd-modal');
		const modalClose = modal.querySelector('#gd-modal-close');

		const preventDefault = function (e) {
			// For iphone.
			e.preventDefault();
		};

		let imageWrapper = document.createElement('div');
		imageWrapper.classList.add('gd-modal-content-wrapper');
		modal.insertBefore(imageWrapper, modal.firstChild);

		const closeModal = (e) => {
			if (e) {
				e.preventDefault();
			}

			imageWrapper.removeEventListener('touchmove', preventDefault);
			imageWrapper.removeEventListener('gesturestart', preventDefault);

			// Hide the modal.
			modal.style.display = 'none';
			let iframes = imageWrapper.querySelectorAll('iframe');
			iframes.forEach((el) => el.remove());

			// Enable scrolling.
			document.body.style.overflow = 'auto';
		};

		// Крестик
		modalClose.addEventListener('click', function (e) {
			closeModal(e);
		});

		// Клик по затемнению (фон) + по wrapper (часто он занимает всю площадь)
		modal.addEventListener('click', function (e) {
			if (e.target === modal || e.target === imageWrapper) {
				closeModal(e);
			}
		});

		// Клик по самому контенту не должен закрывать
		imageWrapper.addEventListener('click', function (e) {
			const content = e.target.closest('.gd-modal-content');
			if (content) {
				e.stopPropagation();
			}
		});


		const swipe = function (direction) {
			debug('swipe', direction);
			switch (direction) {
				case 'left':
					activeImage = activeImage.next;
					openActiveImage();
					break;
				case 'right':
					activeImage = activeImage.prev;
					openActiveImage();
					break;
				default:
					closeModal();
					break;
			}
		};

		// Add some basic swipe logic.
		newSwiper(imageWrapper, function (direction) {
			swipe(direction);
		});

		document.addEventListener('keydown', function (e) {
			switch (e.key) {
				case 'ArrowLeft':
					swipe('right');
					break;
				case 'ArrowRight':
					swipe('left');
					break;
				case 'Escape':
					closeModal(e);
					break;
			}
		});

		const openActiveImage = () => {
			imageWrapper.querySelectorAll('.gd-caption').forEach((el) => el.remove());
			let caption = '';
			if (activeImage.caption_1) caption += `<div>${activeImage.caption_1}</div>`;
			if (activeImage.caption_2) caption += `<div>${activeImage.caption_2}</div>`;
			if (activeImage.caption_3) caption += `<div>${activeImage.caption_3}</div>`;

			imageWrapper.addEventListener('touchmove', preventDefault);
			imageWrapper.addEventListener('gesturestart', preventDefault);

			const classLoaded = 'gd-modal-loaded';
			const classThumbnail = 'gd-modal-thumbnail';

			// Prevent scrolling of the background.
			document.body.style.overflow = 'hidden';
			let oldEls = modal.querySelectorAll('.gd-modal-content');
			let oldElsRemoved = false;

			// Delay the removal of the old elements to make sure we
			// have a image on screen before we remove the old one,
			// even on slower connections.
			const removeOldEls = () => {
				if (oldElsRemoved) {
					return;
				}
				oldElsRemoved = true;
				oldEls.forEach((element) => {
					element.remove();
				});
			};

			if (activeImage) {
					if (activeImage.youtube) {
					oldEls.forEach((element) => element.remove());
					oldElsRemoved = true;


					let wrap = document.createElement('div');
					wrap.classList.add('gd-modal-content', 'gd-modal-video');
					wrap.style.position = 'fixed';
					wrap.style.top = '50%';
					wrap.style.left = '50%';
					wrap.style.transform = 'translate(-50%, -50%)';
					wrap.style.right = '';
					wrap.style.bottom = '';

					wrap.style.width = '100%';
					wrap.style.maxWidth = '1280px';
					wrap.style.aspectRatio = activeImage.width / activeImage.height;

					let iframe = document.createElement('iframe');
					iframe.src = `https://www.youtube-nocookie.com/embed/${activeImage.youtube}?autoplay=1&rel=0`;
					iframe.style.position = 'absolute';
					iframe.style.top = '0';
					iframe.style.left = '0';
					iframe.style.width = '100%';
					iframe.style.height = '100%';
					iframe.frameBorder = '0';
					iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
					iframe.allowFullscreen = true;

					wrap.appendChild(iframe);
					imageWrapper.appendChild(wrap);
					if (caption) {
					let cap = document.createElement('div');
					cap.className = 'gd-caption';
					cap.innerHTML = caption;
					imageWrapper.appendChild(cap);
}


					modal.style.display = 'block';
					document.body.style.overflow = 'hidden';
					return;
				}


				if (params.enable_exif) {
					if (exifTimeoutId) {
						clearTimeout(exifTimeoutId);
					}

					let exif = modal.querySelector('#gd-modal-exif');
					const onTimeOutClass = 'gd-modal-exif-ontimeout';

					let child = exif.lastElementChild;
					while (child) {
						exif.removeChild(child);
						child = exif.lastElementChild;
					}
					let dl = document.createElement('dl');
					exif.appendChild(dl);

					const addTag = (tag, value) => {
						let dt = document.createElement('dt');
						dt.innerText = camelToTitle(tag);
						dl.appendChild(dt);
						let dd = document.createElement('dd');
						dd.innerText = value;
						dl.appendChild(dd);
					};

				let date = new Date(activeImage.exif.Date);
				if (!isNaN(date.getTime())) {
					var dateString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
					addTag('Date', dateString);
				}

					exif.classList.remove(onTimeOutClass);

					exifTimeoutId = setTimeout(() => {
						exif.classList.add(onTimeOutClass);
					}, 1200);
				}

				let thumbnail = new Image();
				thumbnail.classList.add('gd-modal-content');
				thumbnail.width = activeImage.width;
				thumbnail.height = activeImage.height;
				thumbnail.style.aspectRatio = activeImage.width / activeImage.height;

				const fullImage = thumbnail.cloneNode(false);

				thumbnail.classList.add(classThumbnail);

				fullImage.src = activeImage.full;
				thumbnail.src = activeImage['20'];

				thumbnail.onload = function () {
					if (thumbnail) {
						imageWrapper.appendChild(thumbnail);
						removeOldEls();
					}
				};

				fullImage.onload = function () {
					if (fullImage) {
						imageWrapper.appendChild(fullImage);
						if (caption) {
						let cap = document.createElement('div');
						cap.className = 'gd-caption';
						cap.innerHTML = caption;
						imageWrapper.appendChild(cap);
						}

						fullImage.classList.add(classLoaded);
						if (thumbnail) {
							thumbnail.classList.add(classLoaded);
						}
						removeOldEls();
					}
				};

				modal.style.display = 'block';
			}

			if (!activeImage || !activeImage.youtube) {
  				setTimeout(function () {
  			  removeOldEls();
 			 }, 1000);
			}

		};

		// Load the gallery.
		let images = await (await fetch(dataUrl)).json();

		if (params.shuffle) {
			// Shuffle them to make it more interesting.
			images = images
				.map((value) => ({ value, sort: Math.random() }))
				.sort((a, b) => a.sort - b.sort)
				.map(({ value }) => value);
		} else if (params.reverse) {
			images = images.reverse();
		}

		let imagesMap = new Map();
		let imageData = [];
		for (let i = 0; i < images.length; i++) {
			let image = images[i];
			image.prev = images[(i + images.length - 1) % images.length];
			image.next = images[(i + 1) % images.length];
			imageData.push({ filename: image.name, aspectRatio: image.width / image.height, image: image });
			imagesMap.set(image.name, image);
		}
			const gapStr = getComputedStyle(container).getPropertyValue('--gd-space-between').trim();
			const gap = Number(gapStr) || 1;

		var options = {
			onClickHandler: function (filename) {
				debug('onClickHandler', filename);
				activeImage = imagesMap.get(filename);
				if (activeImage) {
					openActiveImage();
				}
			},
			containerId: galleryId,
			classPrefix: 'gd',
			spaceBetweenImages: gap,
					urlForSize: function (filename, size) {
				const img = imagesMap.get(filename);
				return img['800'] || img[size] || img.full || img['20'];
			},

			styleForElement: function (filename) {
				let image = imagesMap.get(filename);
				if (!image || !image.colors || image.colors.length < 1) {
					return '';
				}
				let colors = image.colors;
				let first = colors[0];
				let second = '#ccc';
				if (colors.length > 1) {
					second = colors[1];
				}
				return ` background: linear-gradient(15deg, ${first}, ${second});`;
			},
		};

		const pig = new Pig(imageData, options);
pig.enable();

const renderGridCaptions = () => {
  const figures = container.querySelectorAll('.gd-figure');
  figures.forEach((fig) => {
    // убираем старую подпись (если перерисовка/ресайз)
    fig.querySelectorAll('.gd-grid-caption').forEach((el) => el.remove());

    // Pig почти всегда кладёт filename в data-атрибут
   const imgEl = fig.querySelector('img');
	const filename =
	(imgEl && (imgEl.getAttribute('data-filename') || imgEl.getAttribute('data-gd-filename'))) ||
	(imgEl && (imgEl.dataset.filename || imgEl.dataset.gdFilename)) ||
	fig.getAttribute('data-filename') ||
	fig.getAttribute('data-gd-filename') ||
	fig.dataset.filename ||
	fig.dataset.gdFilename;

    if (!filename) return;

    const img = imagesMap.get(filename);
    if (!img) return;

    let html = '';
    if (img.caption_1) html += `<div>${img.caption_1}</div>`;
    if (img.caption_2) html += `<div>${img.caption_2}</div>`;
    if (img.caption_3) html += `<div>${img.caption_3}</div>`;
    if (!html) return;

    const cap = document.createElement('div');
    cap.className = 'gd-grid-caption';
    cap.innerHTML = html;
    fig.appendChild(cap);
  });
};

// первичный проход
renderGridCaptions();

// если Pig дорисовывает элементы чуть позже — ловим изменения
const mo = new MutationObserver(() => renderGridCaptions());
mo.observe(container, { childList: true, subtree: true });

// на ресайз тоже полезно
window.addEventListener('resize', () => renderGridCaptions());

	},
	};

	function camelToTitle(text) {
		return text.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
			return str.toUpperCase();
		});
	}

	export default GalleryDeluxe;

