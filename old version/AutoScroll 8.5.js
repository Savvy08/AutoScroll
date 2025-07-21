// ==UserScript==
// @name         AutoSurf PRO 8.5
// @namespace    http://tampermonkey.net/
// @version      8.5
// @description  Панель с управлением, таймер клика, кнопка рестарт клика, защита от дублей, открытие в новой вкладке.
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(async function () {
    'use strict';

    /*** === НАСТРОЙКИ === ***/
    const siteList = [
        "https://rutube.ru",
        "https://www.nytimes.com",
        "https://www.theguardian.com",
        "https://www.washingtonpost.com",
        "https://www.reuters.com",
        "https://www.bloomberg.com",
        "https://www.forbes.com",
        "https://www.rt.com",
        "https://lenta.ru",
        "https://ria.ru"
    ];

    const minTime = 60000; // 60 сек
    const maxTime = 90000; // 90 сек
    const clickCooldown = 10 * 60 * 1000; // 10 минут
    const autoRepeat = true;

    /*** === СОСТОЯНИЯ === ***/
    let index = parseInt(localStorage.getItem("autosurf_index") || "0");
    const currentURL = window.location.href;
    const manualIndex = siteList.findIndex(site => currentURL.startsWith(site));
    if (manualIndex !== -1) index = manualIndex;
    localStorage.setItem("autosurf_index", index);

    let clickEnabled = localStorage.getItem("autosurf_clickEnabled") !== "false";
    let lastClickTime = parseInt(localStorage.getItem("autosurf_lastClick") || "0");
    let clickInProgress = false;

    /*** === СТИЛИ === ***/
    const style = document.createElement('style');
    style.innerHTML = `
        #autosurf-panel {
            position:fixed; bottom:15px; left:15px;
            background:#1f1f1f; color:#fff; padding:10px 12px;
            border-radius:8px; font-size:13px; z-index:999999;
            font-family:Arial,sans-serif; width:350px;
            box-shadow:0 4px 12px rgba(0,0,0,.4);
        }
        #autosurf-header { display:flex; justify-content:space-between; align-items:center; font-size:14px; margin-bottom:6px; }
        #autosurf-header small { color:#888; font-size:11px; }
        #collapse-btn {
            background:#444; color:#fff; border:none; padding:2px 6px;
            border-radius:4px; font-size:12px; cursor:pointer; margin-left:8px;
        }
        #autosurf-panel .buttons { display:flex; gap:4px; flex-wrap:wrap; margin-top:6px; }
        #autosurf-panel button {
            flex:1;
            background:#333; color:#fff; border:none; padding:6px;
            font-size:12px; border-radius:5px; cursor:pointer;
            transition:background 0.2s ease;
        }
        #autosurf-panel button:hover { background:#4caf50; }
        #autosurf-panel button.active { background:#d32f2f; }
        #progress { font-size:12px; margin-top:3px; color:#ccc; }
    `;
    document.head.appendChild(style);

    /*** === ПАНЕЛЬ === ***/
    const panel = document.createElement("div");
    panel.id = "autosurf-panel";
    panel.innerHTML = `
        <div id="autosurf-header">
            <span>AutoSurf PRO 8.5</span>
            <div>
                <small>#Savvy08</small>
                <button id="collapse-btn">−</button>
            </div>
        </div>
        <div id="content">
            <div id="timer">⏳ Loading...</div>
            <div id="clickStatus">Клик: ${clickEnabled ? "ON" : "OFF"} | Через: ...</div>
            <div id="progress">Сайт ${index + 1} из ${siteList.length}</div>
            <div class="buttons">
                <button id="nextBtn">➡ NEXT</button>
                <button id="stopBtn">⛔ STOP</button>
                <button id="resumeBtn" style="display:none;">▶ RESUME</button>
                <button id="restartBtn">🔄 RESTART</button>
                <button id="toggleClickBtn" class="${clickEnabled ? "" : "active"}">🖱 ${clickEnabled ? "Click ON" : "Click OFF"}</button>
                <button id="restartClickBtn">♻ RESTART CLICK</button>
            </div>
            <div id="log" style="margin-top:4px;font-size:11px;color:#4caf50;"></div>
        </div>
    `;
    document.body.appendChild(panel);

    const content = panel.querySelector("#content");
    const timerDiv = panel.querySelector("#timer");
    const clickStatusDiv = panel.querySelector("#clickStatus");
    const progressDiv = panel.querySelector("#progress");
    const logDiv = panel.querySelector("#log");
    const nextBtn = panel.querySelector("#nextBtn");
    const stopBtn = panel.querySelector("#stopBtn");
    const resumeBtn = panel.querySelector("#resumeBtn");
    const restartBtn = panel.querySelector("#restartBtn");
    const toggleClickBtn = panel.querySelector("#toggleClickBtn");
    const restartClickBtn = panel.querySelector("#restartClickBtn");
    const collapseBtn = panel.querySelector("#collapse-btn");

    let stopped = false;
    let collapsed = false;

    /*** === КНОПКИ === ***/
    stopBtn.onclick = () => { stopped = true; stopBtn.style.display = "none"; resumeBtn.style.display = "inline"; clearInterval(watchdog); log("⏸ Пауза"); };
    resumeBtn.onclick = () => { stopped = false; stopBtn.style.display = "inline"; resumeBtn.style.display = "none"; scheduleNext(); log("▶ Продолжено"); };
    nextBtn.onclick = () => goNext(true);
    restartBtn.onclick = () => { localStorage.setItem("autosurf_index", 0); location.href = siteList[0]; };
    toggleClickBtn.onclick = () => {
        clickEnabled = !clickEnabled;
        localStorage.setItem("autosurf_clickEnabled", clickEnabled);
        toggleClickBtn.textContent = `🖱 ${clickEnabled ? "Click ON" : "Click OFF"}`;
        toggleClickBtn.classList.toggle("active", !clickEnabled);
        clickStatusDiv.textContent = `Клик: ${clickEnabled ? "ON" : "OFF"} | Через: ...`;
    };
    restartClickBtn.onclick = () => {
        log("♻ Рестарт клика...");
        lastClickTime = 0;
        localStorage.setItem("autosurf_lastClick", "0");
        clickInProgress = false;
        tryClick(); // сразу кликнуть, если включено
    };
    collapseBtn.onclick = () => {
        collapsed = !collapsed;
        content.style.display = collapsed ? "none" : "block";
        collapseBtn.textContent = collapsed ? "+" : "−";
    };

    function log(msg) { console.log("[AutoSurf]", msg); logDiv.textContent = msg; }

    /*** === ПРОГРЕСС === ***/
    progressDiv.textContent = `Сайт ${index + 1} из ${siteList.length}`;

    /*** === ТАЙМЕРЫ === ***/
    const targetDelay = Date.now() + Math.floor(Math.random() * (maxTime - minTime)) + minTime;
    const watchdog = setInterval(() => {
        if (stopped) return;
        const remaining = Math.max(0, targetDelay - Date.now());
        const clickRemaining = Math.max(0, (clickCooldown - (Date.now() - lastClickTime)) / 1000);
        timerDiv.textContent = `⏳ Переход через: ${Math.ceil(remaining / 1000)} сек`;
        clickStatusDiv.textContent = `Клик: ${clickEnabled ? "ON" : "OFF"} | Через: ${Math.ceil(clickRemaining)} сек`;
        if (remaining <= 0) safeGoNext();
    }, 1000);

    /*** === КЛИК В НОВОЙ ВКЛАДКЕ (СТРОГО 1 РАЗ) === ***/
    function tryClick() {
        if (!clickEnabled || clickInProgress || Date.now() - lastClickTime < clickCooldown) return;
        clickInProgress = true;
        const links = Array.from(document.querySelectorAll("a[href]")).filter(a =>
            a.offsetParent !== null && !a.href.startsWith("#") && !a.href.includes("javascript:")
        );
        if (links.length > 0) {
            const link = links[Math.floor(Math.random() * links.length)];
            log(`Клик по: ${link.href}`);

            const a = document.createElement("a");
            a.href = link.href;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            document.body.appendChild(a);
            const event = new MouseEvent("click", { bubbles: true, cancelable: true, view: window });
            a.dispatchEvent(event);
            a.remove();

            lastClickTime = Date.now();
            localStorage.setItem("autosurf_lastClick", lastClickTime.toString());
        }
    }
    tryClick(); // попытка клика при загрузке

    /*** === АВТОСКРОЛЛ === ***/
    let scrollTop = 0;
    setInterval(() => { if (!stopped) { scrollTop += 2; window.scrollTo(0, scrollTop); } }, 30);

    /*** === ПЕРЕХОД === ***/
    function safeGoNext() {
        clearInterval(watchdog);
        goNext();
    }
    function goNext() {
        if (stopped) return;
        let nextIndex = index + 1;
        if (nextIndex >= siteList.length) {
            if (autoRepeat) { nextIndex = 0; log("🔄 Начинаем заново"); }
            else { log("✅ Завершено"); return; }
        }
        localStorage.setItem("autosurf_index", nextIndex);
        location.href = siteList[nextIndex];
    }
})();
