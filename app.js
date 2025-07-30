/*
 * Punishment Picker App
 *
 * This script fetches a list of punishments from a public Google Sheet
 * using the opensheet.elk.sh service. If the sheet cannot be reached
 * (for example, if it hasn’t been published to the web or the user
 * doesn’t have permission), the app falls back to a default list of
 * punishments defined below. When the user clicks the button, a random
 * punishment is selected and displayed in a stylized card.
 */

(() => {
  // Replace with your actual spreadsheet ID
  const SHEET_ID = '1JOcHP8dmF7BKxiBrqgIFaecE20QxMtCiXDmfK8xBQmU';
  // Replace with the name of the tab containing the punishments (case-sensitive)
  const SHEET_NAME = 'Sheet1';

  // A fallback list of punishments for when the sheet isn’t reachable.
  // When your spreadsheet is unavailable, the app falls back to this list.
  // The first few items mirror the current contents of your Google Sheet
  // ("Take me to dinner", "Talk non stop for 5 minutes", etc.). Additional
  // punishments are included to keep the game fun if you add more items later.
  const fallbackPunishments = [
    'Take me to dinner',
    'Talk non stop for 5 minutes',
    'Smile',
    'Do a headstand',
    'Do 10 push‑ups',
    'Sing a verse from your favorite song',
    'Speak in a funny accent until your next turn',
    'Dance for 30 seconds',
    'Share an embarrassing story',
    'Take a sip of water',
    'Wear a hat backwards until your next turn',
    'Compliment every other player',
    'Do a silly walk across the room',
    'Tell a joke – bad puns encouraged!'
  ];

  /**
   * Fetches punishment items from the Google Sheet via the opensheet API.
   *
   * @returns {Promise<string[]>} An array of punishment strings. Returns an
   * empty array on failure.
   */
  async function fetchPunishments() {
    const url = `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(
      SHEET_NAME
    )}`;
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data returned from sheet.');
      }
      // Determine the first column name (keys are derived from the header row)
      const firstKey = Object.keys(data[0])[0];
      // Extract the first column values, filter out empty strings
      const punishments = data
        .map((row) => row[firstKey].trim())
        .filter((text) => text.length > 0);
      return punishments;
    } catch (error) {
      console.warn('Failed to fetch sheet data:', error);
      return [];
    }
  }

  /**
   * Maintains a shuffled list of punishments and ensures that each
   * punishment is shown only once per cycle. When all punishments
   * have been displayed, the list is reshuffled and the cycle
   * restarts.
   */
  let shuffledList = [];
  let listIndex = 0;

  /**
   * Returns the next punishment from the shuffled list, rebuilding and
   * shuffling if necessary. This ensures no repeats until the list is
   * exhausted.
   *
   * @param {string[]} punishments The latest list of punishments fetched
   * @returns {string} The selected punishment
   */
  function nextPunishment(punishments) {
    // If we have exhausted the list or the stored list is outdated, rebuild
    if (!Array.isArray(shuffledList) || listIndex >= shuffledList.length) {
      // Create a fresh copy and shuffle it using Fisher–Yates algorithm
      shuffledList = punishments.slice();
      for (let i = shuffledList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]];
      }
      listIndex = 0;
    }
    const punishment = shuffledList[listIndex];
    listIndex += 1;
    return punishment;
  }

  /**
   * Initializes the application by hooking up event listeners.
   */
  function init() {
    const button = document.getElementById('punishBtn');
    const resultCard = document.getElementById('result');

    button.addEventListener('click', async () => {
      // Provide immediate feedback that data is being loaded
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Fetching…';
      resultCard.classList.add('hidden');

      // Attempt to fetch punishments from the sheet
      let punishments = await fetchPunishments();
      if (!punishments || punishments.length === 0) {
        // Fallback to the default list if nothing is returned
        punishments = fallbackPunishments;
      }
      // Get the next punishment from the shuffled list
      const punishment = nextPunishment(punishments);
      // Display the punishment
      resultCard.textContent = punishment;
      resultCard.classList.remove('hidden');

      // Reset the button state
      button.disabled = false;
      button.textContent = 'Get Another Punishment';
    });
  }

  // Initialize the app once the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', init);
})();