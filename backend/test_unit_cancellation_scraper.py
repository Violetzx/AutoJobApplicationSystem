
#   Author: Fanghao Meng
#   These are the unit tests for cancel scraper API

import asyncio
from scrape.scraper import scraper_main
from scrape.cancellation_signal import CancellationSignal
async def test_cancellation():
    # Create a cancellation signal
    cancellation_signal = CancellationSignal()

    # Start the scraper in the background
    scraper_task = asyncio.create_task(
        scraper_main(["Web Developer Coop"], ["Toronto"], cancellation_signal)
    )
    # Wait for a few seconds before cancelling
    await asyncio.sleep(5)  # Let's say we wait 5 seconds before cancelling
    cancellation_signal.set_cancelled()  # Trigger the cancellation

    # Now we wait for the scraper to finish (which should now cancel)
    try:
        await scraper_task
    except asyncio.CancelledError:
        print("The scraper was cancelled.")

# Run the test
asyncio.run(test_cancellation())
