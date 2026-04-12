document.addEventListener('DOMContentLoaded', async () => {
  const randomBtn = document.getElementById('randomBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  
  // Localize UI
  document.getElementById('randomText').textContent = browser.i18n.getMessage('randomizeMovie');
  optionsBtn.textContent = browser.i18n.getMessage('openOptions');

  randomBtn.addEventListener('click', async () => {
    // TODO: Implement randomizer logic or message background
    console.log('Randomizer clicked');
    const response = await browser.runtime.sendMessage({ action: "getRandomMovie" });
    document.getElementById('result').textContent = "Feature coming soon...";
  });

  optionsBtn.addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
});
