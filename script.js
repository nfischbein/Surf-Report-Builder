(function () {
  const FEEDBACK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzkAxUpILIplrfYXZhg8Ci_eKg-qOk24VtyPKtAfe5ji_eVTB-wBlxyycjXhBWgm80/exec';
  const feedbackLoadedAt = Date.now();
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-theme-toggle]');
  const toast = document.querySelector('[data-toast]');
  const feedbackForm = document.querySelector('[data-feedback-form]');
  const feedbackStatus = document.querySelector('[data-feedback-status]');
  const feedbackSetup = document.querySelector('[data-feedback-setup]');
  let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  let toastTimer;

  function setTheme(nextTheme) {
    theme = nextTheme;
    root.setAttribute('data-theme', theme);
    if (themeButton) {
      themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      themeButton.querySelector('span').textContent = theme === 'dark' ? '☼' : '◐';
    }
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function textFromTarget(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return '';
    return (target.dataset.promptText || target.textContent).trim();
  }

  async function loadPromptWindows() {
    const promptWindows = document.querySelectorAll('[data-prompt-src]');
    await Promise.all(
      Array.from(promptWindows).map(async (element) => {
        const source = element.dataset.promptSrc;
        if (!source) return;
        try {
          const response = await fetch(source, { cache: 'no-store' });
          if (!response.ok) throw new Error(`Could not load ${source}`);
          const text = await response.text();
          element.dataset.promptText = text.trim();
          const code = element.querySelector('code') || element;
          code.textContent = text.trim();
        } catch (error) {
          console.warn('Prompt load failed:', error);
          const code = element.querySelector('code') || element;
          code.textContent = 'Prompt could not load. Download the System Guide or refresh the page.';
        }
      })
    );
  }

  async function copyText(text) {
    if (!text) return false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        // Some embedded browsers expose the Clipboard API but block writes.
        // Fall through to the textarea fallback instead of failing the copy action.
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const successful = document.execCommand('copy');
    textarea.remove();
    return successful;
  }

  setTheme(theme);

  themeButton?.addEventListener('click', () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  });

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy-target]');
    if (!button) return;
    const text = textFromTarget(button.dataset.copyTarget);
    const originalText = button.textContent;
    const originalHTML = button.innerHTML;
    const hasStructuredContent = button.children.length > 0;

    try {
      const copied = await copyText(text);
      if (!copied) throw new Error('Copy command failed');
      button.classList.add('copied');
      const copiedLabel = button.dataset.copyTarget === 'systemPrompt' ? 'Prompt copied!' : 'Copied';
      if (hasStructuredContent) {
        const label = button.querySelector('span');
        if (label) label.textContent = copiedLabel;
      } else {
        button.textContent = copiedLabel;
      }
      showToast(button.dataset.copyTarget === 'systemPrompt' ? 'Prompt copied!' : 'Copied to clipboard');
      setTimeout(() => {
        button.classList.remove('copied');
        if (hasStructuredContent) {
          button.innerHTML = originalHTML;
        } else {
          button.textContent = originalText;
        }
      }, 1400);
    } catch (error) {
      showToast('Copy failed. Select and copy manually.');
    }
  });

  if (feedbackForm) {
    if (!FEEDBACK_ENDPOINT || FEEDBACK_ENDPOINT === 'YOUR_APPS_SCRIPT_URL_HERE') {
      feedbackSetup?.classList.add('show');
    }

    feedbackForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!FEEDBACK_ENDPOINT) {
        feedbackStatus.textContent = 'Feedback relay is not connected yet.';
        showToast('Feedback relay not connected yet.');
        return;
      }

      const submitButton = feedbackForm.querySelector('button[type="submit"]');
      const formData = new FormData(feedbackForm);
      const message = String(formData.get('message') || '').trim();
      const honeypot = String(formData.get('website') || '').trim();
      const payload = {
        source: formData.get('source') || 'Surf Report Builder website',
        message,
        reply_to: String(formData.get('reply_to') || '').trim(),
        break_name: String(formData.get('break_name') || '').trim(),
        feedback_type: String(formData.get('feedback_type') || '').trim(),
        website: honeypot,
        page_url: window.location.href,
        page_origin: window.location.origin,
        user_agent: navigator.userAgent,
        form_age_ms: Date.now() - feedbackLoadedAt,
        created_at: new Date().toISOString(),
      };

      if (honeypot) {
        feedbackForm.reset();
        feedbackStatus.textContent = 'Feedback sent. Thanks.';
        showToast('Feedback sent');
        return;
      }

      if (message.length < 5) {
        feedbackStatus.textContent = 'Add a little more detail before sending.';
        return;
      }

      if (message.length > 3000) {
        feedbackStatus.textContent = 'Please shorten the note before sending.';
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';
      feedbackStatus.textContent = 'Sending feedback…';

      try {
        await fetch(FEEDBACK_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(payload),
        });

        feedbackForm.reset();
        feedbackStatus.textContent = 'Feedback sent. Thanks.';
        showToast('Feedback sent');
      } catch (error) {
        console.warn('Feedback submit failed:', error);
        feedbackStatus.textContent = 'Feedback could not be sent. Try again later.';
        showToast('Feedback failed');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Send it';
      }
    });
  }

  loadPromptWindows();
})();
