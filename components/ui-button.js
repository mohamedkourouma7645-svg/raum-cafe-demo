// <ui-button variant="solid|line" href="..." target="_blank" rel="noopener" type="button">Label</ui-button>
// Renders a real <a> or <button> using the site's existing .btn/.btn-solid/.btn-line classes,
// so it inherits the current design automatically — no new CSS, no Shadow DOM (keeps global
// fonts/tokens from style.css working exactly as they do everywhere else on the site).
class UIButton extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;

    const variant = this.getAttribute('variant') === 'line' ? 'btn-line' : 'btn-solid';
    const href = this.getAttribute('href');
    const label = this.innerHTML;

    const el = document.createElement(href ? 'a' : 'button');
    el.className = `btn ${variant}`;
    el.innerHTML = label;

    if (href) {
      el.href = href;
      if (this.hasAttribute('target')) el.target = this.getAttribute('target');
      if (this.hasAttribute('rel')) el.rel = this.getAttribute('rel');
    } else {
      el.type = this.getAttribute('type') || 'button';
    }

    this.innerHTML = '';
    this.appendChild(el);
    this.dataset.rendered = 'true';
  }
}

customElements.define('ui-button', UIButton);
