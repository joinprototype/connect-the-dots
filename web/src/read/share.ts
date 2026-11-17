// "Share this story" at the end of every written story (theme/templates/read.html): the phone's own share
// sheet where there is one, else the story's link is copied; where copying is refused, the button shows the
// link to copy by hand. A story joined below brings its own button, so one listener serves them all.
document.addEventListener('click', async (e) => {
  const button = (e.target as Element | null)?.closest<HTMLButtonElement>('.read-share');
  if (!button) return;
  const url = new URL(button.dataset.url ?? location.pathname, location.origin).href;
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ title: button.dataset.title, url });
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // the reader closed the sheet
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    button.textContent = 'Link copied';
  } catch {
    button.textContent = url;
    button.classList.add('read-share-link');
  }
});
