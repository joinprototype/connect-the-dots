// "Another name" on the home page (theme/templates/home.html). Every thread is in the page, in one place,
// so this only shows the next: nothing below it moves.

export function startThreads(): void {
  const threads = [...document.querySelectorAll<HTMLElement>('.thread')];
  const said = document.getElementById('thread-said');
  let at = 0;
  document.querySelector('.thread-next')?.addEventListener('click', () => {
    threads[at].classList.remove('on');
    at = (at + 1) % threads.length;
    threads[at].classList.add('on');
    // the button keeps the focus, so a screen reader hears the new name from here
    if (said) said.textContent = threads[at].querySelector('h2')?.textContent ?? '';
  });
}
