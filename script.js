(function () {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-theme-toggle]');
  const toast = document.querySelector('[data-toast]');
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

  loadPromptWindows();
})();
