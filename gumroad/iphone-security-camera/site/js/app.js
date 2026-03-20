/**
 * app.js — Shared functionality for iPhone Security Camera Guide site
 * Handles: mobile nav toggle, smooth scrolling, FAQ accordion
 */

/* ---- Mobile Nav Toggle ---- */
function initMobileNav() {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', links.classList.contains('open'));
  });

  /* Close nav when a link is clicked */
  links.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---- Smooth Scroll for anchor links ---- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var offset = 70; /* account for sticky header */
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
}

/* ---- FAQ Accordion ---- */
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      /* close all others */
      document.querySelectorAll('.faq-item.open').forEach(function (other) {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-answer').style.maxHeight = null;
        }
      });
      /* toggle this one */
      if (isOpen) {
        item.classList.remove('open');
        item.querySelector('.faq-answer').style.maxHeight = null;
      } else {
        item.classList.add('open');
        var answer = item.querySelector('.faq-answer');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* ---- Gumroad link placeholder ---- */
var GUMROAD_URL = '#purchase';

/* ---- Init on DOM ready ---- */
document.addEventListener('DOMContentLoaded', function () {
  initMobileNav();
  initSmoothScroll();
  initFAQ();
});
