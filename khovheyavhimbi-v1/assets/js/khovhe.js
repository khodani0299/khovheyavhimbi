/* Khovhe Yavhimbi – site behaviour (no dependencies) */
(function () {
	'use strict';

	/* TODO: confirm the bookings WhatsApp number; use international format without +. */
	var BOOKINGS_NUMBER = '27762065657';

	var $ = function (s, c) { return (c || document).querySelector(s); };
	var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

	function bindPageTransitions() {
		var loader = $('#k-page-loader');
		if (!loader) return;

		var navigating = false;
		document.addEventListener('click', function (e) {
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			if (!e.target || typeof e.target.closest !== 'function') return;

			var link = e.target.closest('a[href]');
			if (!link || link.hasAttribute('download')) return;
			var target = link.getAttribute('target');
			if (target && target.toLowerCase() !== '_self') return;

			var destination;
			try {
				destination = new URL(link.href, window.location.href);
			} catch (error) {
				return;
			}
			if (destination.origin !== window.location.origin) return;

			function canonicalPath(path) {
				if (path === '/index.html') return '/';
				return path.replace(/\/+$/, '') || '/';
			}
			if (canonicalPath(destination.pathname) === canonicalPath(window.location.pathname)) return;

			e.preventDefault();
			if (navigating) return;
			navigating = true;
			loader.classList.add('is-active');
			loader.setAttribute('aria-hidden', 'false');

			var delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
			window.setTimeout(function () { window.location.assign(destination.href); }, delay);
		});
	}

	function init() {
		bindPageTransitions();

		/* ---------- Header ---------- */
		var header = $('.k-header');
		var burger = $('#k-burger');
		function closeMenu() {
			if (!header || !burger) return;
			header.classList.remove('menu-open');
			burger.setAttribute('aria-expanded', 'false');
			burger.setAttribute('aria-label', 'Open menu');
			$$('#k-nav details').forEach(function (item) { item.open = false; });
		}
		if (header && burger) {
			function onScroll() { header.classList.toggle('is-solid', window.scrollY > 40); }
			onScroll();
			window.addEventListener('scroll', onScroll, { passive: true });
			burger.addEventListener('click', function () {
				var open = header.classList.toggle('menu-open');
				burger.setAttribute('aria-expanded', String(open));
				burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
			});
			$$('#k-nav a').forEach(function (a) { a.addEventListener('click', closeMenu); });
		}

		/* ---------- Reveal on scroll ---------- */
		var reveals = $$('.k-reveal');
		if ('IntersectionObserver' in window) {
			var io = new IntersectionObserver(function (entries) {
				entries.forEach(function (e) {
					if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
				});
			}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
			reveals.forEach(function (el) { io.observe(el); });
		} else {
			reveals.forEach(function (el) { el.classList.add('is-in'); });
		}

		/* ---------- Quote form ---------- */
		var form = $('#quote-form');
		if (form) {
			var fields = $$('input[required],select[required]', form);
			var dateEl = $('#f-date', form);
			var serviceEl = $('#f-service', form);
			var packageEl = $('#f-package', form);
			var addonEl = $('#f-addon', form);
			var button = $('#quote-submit', form);
			var done = $('#quote-done', form);
			var submitText = button.textContent;
			var now = new Date();
			dateEl.min = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

			var picnicPackages = ['Couple Picnic', 'Family Picnic', 'Group Picnic'];
			var hikingPackages = [
				'Hiking to Meditation Area and Rock Flowing Water only',
				'Hiking to Meditation Area and Rock Flowing Water only, with coffee break',
				'Hiking to Meditation Area, Rock Flowing Water and Matalelani, back to Camp Site, with coffee break'
			];
			var packageNames = Array.prototype.map.call(packageEl.options, function (option) { return option.value; });

			function serviceForPackage(packageName) {
				if (picnicPackages.indexOf(packageName) !== -1) return 'Picnic';
				if (hikingPackages.indexOf(packageName) !== -1) return 'Hike';
				return 'Camping stay';
			}

			try {
				var params = new URLSearchParams(window.location.search);
				var serviceParam = params.get('service');
				var packageParam = params.get('package');
				var addonParam = params.get('addon');
				if (['Picnic', 'Hike', 'Camping stay'].indexOf(serviceParam) !== -1) {
					serviceEl.value = serviceParam;
				}
				if (packageNames.indexOf(packageParam) !== -1) {
					packageEl.value = packageParam;
					if (packageParam !== 'Not sure yet') serviceEl.value = serviceForPackage(packageParam);
				}
				if (Array.prototype.some.call(addonEl.options, function (option) { return option.value === addonParam; })) {
					addonEl.value = addonParam;
				}
			} catch (e) {
				console.warn('Could not read the preselected quote service.', e);
			}

			function validateField(field) {
				var message = '';
				var value = field.value.trim();
				if (!value) {
					message = 'This field is required.';
				} else if (field.type === 'email' && !field.validity.valid) {
					message = 'Enter a valid email address.';
				} else if (field.type === 'tel' && !/^(?:\+27|0)[1-9]\d{8}$/.test(value.replace(/[()\s-]/g, ''))) {
					message = 'Enter a valid South African phone number.';
				} else if (field.type === 'number' && (!Number.isInteger(Number(value)) || Number(value) < 1)) {
					message = 'Enter a whole number of 1 or more.';
				} else if (field.type === 'date' && value < dateEl.min) {
					message = 'Choose today or a future date.';
				}

				var error = $('#' + field.id + '-error', form);
				error.textContent = message;
				field.setAttribute('aria-invalid', message ? 'true' : 'false');
				return !message;
			}

			fields.forEach(function (field) {
				field.addEventListener('input', function () {
					if (field.getAttribute('aria-invalid') === 'true') validateField(field);
				});
				field.addEventListener('change', function () {
					if (field.getAttribute('aria-invalid') === 'true') validateField(field);
				});
			});

			packageEl.addEventListener('change', function () {
				if (packageEl.value !== 'Not sure yet') {
					serviceEl.value = serviceForPackage(packageEl.value);
					if (serviceEl.getAttribute('aria-invalid') === 'true') validateField(serviceEl);
				}
			});

			$$('[data-service][data-package]').forEach(function (link) {
				link.addEventListener('click', function () {
					var service = link.getAttribute('data-service');
					var packageName = link.getAttribute('data-package');
					var addonName = link.getAttribute('data-addon');
					if (['Picnic', 'Hike', 'Camping stay'].indexOf(service) !== -1) serviceEl.value = service;
					if (packageNames.indexOf(packageName) !== -1) packageEl.value = packageName;
					if (addonName && Array.prototype.some.call(addonEl.options, function (option) { return option.value === addonName; })) {
						addonEl.value = addonName;
					}
					if (packageEl.getAttribute('aria-invalid') === 'true') validateField(packageEl);
					if (serviceEl.getAttribute('aria-invalid') === 'true') validateField(serviceEl);
				});
			});

			function formatDate(value) {
				var parts = value.split('-');
				return new Date(+parts[0], +parts[1] - 1, +parts[2]).toLocaleDateString('en-ZA', {
					weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
				});
			}

			form.addEventListener('submit', function (e) {
				if (form.hasAttribute('data-server-submit')) return;
				e.preventDefault();
				var firstInvalid = null;
				fields.forEach(function (field) {
					if (!validateField(field) && !firstInvalid) firstInvalid = field;
				});
				if (firstInvalid) {
					firstInvalid.focus();
					return;
				}

				var values = {
					name: form.elements.name.value.trim(),
					email: form.elements.email.value.trim(),
					phone: form.elements.phone.value.trim(),
					service: serviceEl.value,
					package: packageEl.value,
					addon: addonEl.value,
					date: formatDate(form.elements.date.value),
					people: form.elements.people.value,
					requests: form.elements.notes.value.trim()
				};
				var lines = [
					'*Quote request – Khovhe Yavhimbi*',
					'Name: ' + values.name,
					'Email: ' + values.email,
					'Contact number: ' + values.phone,
					'Service: ' + values.service,
					'Package: ' + values.package,
					'Preferred date: ' + values.date,
					'Number of people: ' + values.people
				];
				if (values.addon) lines.push('Additional picnic or hiking package: ' + values.addon);
				if (values.requests) lines.push('Additional requests: ' + values.requests);
				var url = 'https://wa.me/' + BOOKINGS_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));

				button.disabled = true;
				button.textContent = 'Opening WhatsApp…';
				window.open(url, '_blank', 'noopener');

				done.textContent = "Thanks, we'll reply with your quote shortly.";
				var fallback = document.createElement('a');
				fallback.href = url;
				fallback.target = '_blank';
				fallback.rel = 'noopener noreferrer';
				fallback.textContent = 'If WhatsApp did not open, open your request here.';
				done.appendChild(document.createElement('br'));
				done.appendChild(fallback);
				done.hidden = false;
				done.focus();

				window.setTimeout(function () {
					button.disabled = false;
					button.textContent = submitText;
				}, 900);
			});
		}

		/* ---------- Lightbox ---------- */
		var lb = $('#k-lightbox');
		if (lb) {
			var lbImg = $('img', lb);
			$$('.k-gallery button').forEach(function (b) {
				b.addEventListener('click', function () {
					lbImg.src = b.getAttribute('data-full');
					lbImg.alt = $('img', b).alt;
					lb.hidden = false;
					document.body.style.overflow = 'hidden';
				});
			});
			function closeLb() { lb.hidden = true; document.body.style.overflow = ''; }
			lb.addEventListener('click', closeLb);
			document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeLb(); closeMenu(); } });
		}

		/* ---------- Placeholders & footer ---------- */
		$$('a[data-placeholder]').forEach(function (a) {
			a.addEventListener('click', function (e) { e.preventDefault(); });
			a.style.opacity = '.45';
		});
		var yr = $('#yr');
		if (yr) yr.textContent = new Date().getFullYear();
	}

	/* Wait for header/footer partials, then wire up the page */
	var ready = window.siteReady || Promise.resolve();
	ready.then(init).catch(init);
})();
