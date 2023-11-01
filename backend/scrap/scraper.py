from playwright.async_api import async_playwright
import asyncio
import urllib.parse
import json
import random
from datetime import date
from tqdm import tqdm
import os
import sys
import logging



async def browserAndScrape(browser, title: str, location: str, path: str, thread: int):
    """
    Scrape data from Google Jobs website with search query
    Args:
        browser: playwright browser
        title: job title for query
        location: location for query
        path: data output path
        thread: thread number of multithread

    """
    count = 5
    jobs = []
    l = location[thread]
    search_url = "https://www.google.com/search"
    search_params = {
        # query例子："software development in Los Angeles"
        "q": title + " in " + l,
        # "source": "hp",
        # "oq": "software engineer in pittsburgh",
        "ibp": "htl;jobs",
        "sa": "X",
        "hl": "en",
    }
    jobs_search_url = "{0}?{1}".format(search_url, urllib.parse.urlencode(search_params))
    context = await browser.new_context(
        viewport={"width": 1024, "height": 800},
        locale="en_US",
        user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
    )
    page = await context.new_page()
    await page.goto(jobs_search_url)
    await page.wait_for_selector(".lteri .zxU94d", timeout=10_000)

    # top filter element
    top_filter_l = page.locator("#choice_box_root")
    # 筛选发布日期
    # if configs.APP_SCRAPER_OPTIONS_DATE_POSTED_TEXT != configs.APP_SCRAPER_OPTIONS_DATE_POSTED_DAYS_RULES["default"]:
    # date_posted_el = top_filter_l.locator('[role="tablist"]').locator("text=Date posted")
    if True:
        # await date_posted_el.click()
        # await page.wait_for_timeout(2_000)
        # date_posted_days_el = top_filter_l.locator('text="Past 3 days"')
        if True:
            # await date_posted_days_el.click()
            await page.wait_for_timeout(3_000)
    # scrape Google Search左侧scroll view的数据, Google的scroll view上限是150条职位数据
    while True:
        job_groups = page.locator(".lteri .zxU94d li")
        groups_seen = len(await job_groups.element_handles())
        if groups_seen > 0:
            scroll = (await job_groups.element_handles())[-1]
            await scroll.scroll_into_view_if_needed()
        await page.wait_for_timeout(2_000)
        # 查看scoll down是否还有新的数据
        groups_seen_after_scroll = len(await job_groups.element_handles())
        if groups_seen_after_scroll > groups_seen:
            continue
        else:
            break

    all_items = await page.query_selector_all(".lteri .zxU94d li")
    c = 0
    for item in all_items:
        c += 1
        # if c == count:
        #     break
        job = {}
        title_el = await item.query_selector(".Fol1qc > .BjJfJf")
        job["title"] = await (title_el).inner_text()
        company_el = await item.query_selector(".oNwCmf > .vNEEBe")
        job["company"] = await (company_el).inner_text()
        location_el = await item.query_selector(".oNwCmf > .Qk80Jf")
        job["location"] = await (location_el).inner_text()
        via_el = await item.query_selector(".oNwCmf > .Qk80Jf >> nth=-1")
        job["via"] = await (via_el).inner_text()

        # print(job['title'] + ' ' + job['company'] + ' ' + job['via'])

        all_attributes = await item.query_selector_all(".oNwCmf > .KKh3md > .I2Cbhb")
        time_bool = False
        type_bool = False
        salary_bool = False
        for attribute in all_attributes:
            if await (attribute.query_selector(".EZMfad")) != None:
                time_el = await attribute.query_selector(".LL4CDc")
                job["time"] = await (time_el).inner_text()
                time_bool = True

            if await (attribute.query_selector(".mQ5pwc")) != None:
                type_el = await attribute.query_selector(".LL4CDc")
                job["type"] = await (type_el).inner_text()
                type_bool = True

            if await (attribute.query_selector(".fYYH5e")) != None:
                salary_el = await attribute.query_selector(".LL4CDc")
                job["salary"] = await (salary_el).inner_text()
                salary_bool = True

        if not time_bool:
            job["time"] = "none"
        if not type_bool:
            job["type"] = "none"
        if not salary_bool:
            job["salary"] = "none"

        # 从上到下依次点击左侧框内数据来改变右侧内容
        logo = await item.query_selector(".x1z8cb")
        await logo.hover()
        random1 = random.randint(100, 300)
        await logo.click(timeout=2000, delay=random1)
        right_panel = await page.query_selector(".lteri > .whazf >.jolnDe > div > .KGjGe >.pE8vnd")

        link_el = await right_panel.query_selector("g-scrolling-carousel > div > .EDblX > span > .B8oxKe > span > .pMhGee")
        job["links"] = [await link_el.get_attribute("href")]
        link_extra_el = await right_panel.query_selector(
            " g-scrolling-carousel > div > .EDblX > span > .B8oxKe"
        )
        if link_extra_el:
            extra_links = await link_extra_el.query_selector_all("span")
            for link in extra_links:
                res = await link.query_selector("a")
                if res:
                    job["links"].append(await res.get_attribute("href"))
        job["links"].pop(0)
        description_1_el = await right_panel.query_selector(".YgLbBe > div > .HBvzbc")
        if not description_1_el:
            continue
        description_2_el = await description_1_el.query_selector(".WbZuDe")
        job["description"] = (await description_1_el.inner_text()) + (await description_2_el.inner_text())
        job["occupation"] = title
        jobs.append(job)
    final_data = {"url": jobs_search_url, "jobs": jobs}
    # 将数据储存到json，例子：software development_Los Angeles.json
    if not os.path.exists(path):
        os.mkdir(path)
    with open(os.path.join(path, title + "_" + l + ".json"), "w") as file:
        json.dump(final_data, file)


async def main():
    # 创建logger
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)  # set log level
    # define file handler and set formatter
    file_handler = logging.FileHandler("../../logfile.log")
    formatter = logging.Formatter("%(asctime)s: %(levelname)s: %(name)s: %(message)s")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)  # add file handler to logger
    # 读取今日的时间
    today = date.today()
    d = today.strftime("%b-%d-%Y")
    # d = today.strftime(configs.APP_SCRAPER_DATE_FOLDER_FORMAT)
    # 获取职位和城市地点，input_data.json为12职位*8地点，small_data.json为1职位*1地点为测试数据
    # 开发环境下使用small_data.json
    # with open(
    #     os.path.join(configs.APP_SCRAPER_SERVICE_DATA, "small_data.json" if configs.APP_IS_DEV else "input_data.json"),
    #     "r",
    # ) as file:
    #     data = json.load(file)
    # title = data["title"]
    # location = data["location"]
    title = ["Software Engineer"]
    location = ["Los Angeles"]

    for t in title:
        location_length = len(location)
        # 此代码支持multi-thread,但google有单位时间内访问次数限制，所以在生产中thread_number保持1
        thread_number = 1
        length_of_thread = location_length // thread_number
        for location_index in tqdm(range(length_of_thread)):
            path = os.path.join("../../data", d)
            tasks = list()
            async with async_playwright() as pw:
                browser = await pw.chromium.launch(channel="chrome", headless=True)
                for thread in range(
                    location_length // length_of_thread * location_index,
                    location_length // length_of_thread * (location_index + 1),
                ):
                    l = location[thread]
                    if os.path.exists(os.path.join(path, t + "_" + l + ".json")):
                        continue

                    try:
                        tasks.append(browserAndScrape(browser, t, location, path, thread))
                    except:
                        logger.error("Couldn't process browserAndScrape function")
                await asyncio.gather(*tasks)
                await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
