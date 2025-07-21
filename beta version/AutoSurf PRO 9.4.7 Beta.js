// ==UserScript==
// @name         AutoSurf PRO 9.4.7 Beta
// @namespace    http://tampermonkey.net/
// @version      9.4.7-beta
// @description  Автосёрфинг с поддержкой чёрного списка и сбросом настроек
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    function defaultSites() {
        return [
            "https://rutube.ru", "https://www.nytimes.com", "https://www.theguardian.com",
            "https://www.washingtonpost.com", "https://www.reuters.com", "https://www.bloomberg.com",
            "https://www.forbes.com", "https://www.rt.com", "https://lenta.ru", "https://ria.ru"
        ];
    }

    function loadSettings() {
        return {
            siteList: JSON.parse(localStorage.getItem("autosurf_sites") || "[]") || defaultSites(),
            blacklist: JSON.parse(localStorage.getItem("autosurf_blacklist") || "[]") || [],
            minTime: parseInt(localStorage.getItem("autosurf_minTime") || "60000"),
            maxTime: parseInt(localStorage.getItem("autosurf_minTime") || "60000") + 30000,
            clickCooldown: parseInt(localStorage.getItem("autosurf_clickCooldown") || (5 * 60 * 1000)),
            randomClickCooldown: parseInt(localStorage.getItem("autosurf_randomClickCooldown") || (2 * 60 * 1000)),
            clickEnabled: localStorage.getItem("autosurf_clickEnabled") !== "false",
            randomClickEnabled: localStorage.getItem("autosurf_randomClickEnabled") !== "false",
            lastClickTime: parseInt(localStorage.getItem("autosurf_lastClick") || "0"),
            lastRandomClickTime: parseInt(localStorage.getItem("autosurf_lastRandomClick") || "0"),
            index: parseInt(localStorage.getItem("autosurf_index") || "0"),
            stopped: GM_getValue("autosurf_stopped", false)
        };
    }

    let {
        siteList, blacklist, minTime, maxTime, clickCooldown,
        randomClickCooldown, clickEnabled, randomClickEnabled,
        lastClickTime, lastRandomClickTime, index, stopped
    } = loadSettings();

    const currentDomain = window.location.hostname.replace(/^www\./, "");
    const inBlacklist = blacklist.some(bl => currentDomain.endsWith(bl.replace(/^www\./, "")));

    const panel = document.createElement("div");
    panel.id = "autosurf-panel";
    panel.innerHTML = `
        <style>
            #autosurf-panel {
                position:fixed; bottom:15px; left:15px;
                background:#1f1f1f; color:#fff; padding:10px;
                border-radius:8px; font-size:13px; z-index:999999;
                font-family:Arial,sans-serif; width:380px;
                box-shadow:0 4px 12px rgba(0,0,0,.4);
            }
            #autosurf-header { display:flex; justify-content:space-between; align-items:center; font-size:14px; margin-bottom:6px; }
            #autosurf-header small { color:#888; font-size:11px; cursor:pointer; margin-right:8px; text-decoration:underline; }
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
        </style>
        <div id="autosurf-header">
            <span>AutoSurf PRO 9.4.7 Beta</span>
            <small id="blacklist-edit">@Savvy08 | Blacklist</small>
        </div>
        ${inBlacklist ? '<div style="color:#ff4c4c;font-weight:bold;">⛔ В чёрном списке</div>' : ''}
        <div id="timer"></div>
        <div id="clickTimer"></div>
        <div id="randomTimer"></div>
        <div id="clickStatus"></div>
        <div id="progress"></div>
        <div class="buttons">
            <button id="nextBtn">➡ NEXT</button>
            <button id="restartClickBtn">♻ RESTART CLICK</button>
            <button id="toggleClickBtn" class="${clickEnabled ? "" : "active"}">🖱 Click ${clickEnabled ? "ON" : "OFF"}</button>
            <button id="toggleRandomClickBtn" class="${randomClickEnabled ? "" : "active"}">✨ Random ${randomClickEnabled ? "ON" : "OFF"}</button>
        </div>
    `;
    document.body.appendChild(panel);

    document.getElementById("blacklist-edit").onclick = () => {
        const input = prompt("Введите сайты (домены) через запятую:", blacklist.join(", "));
        if (input !== null) {
            blacklist = input.split(",").map(s => s.trim()).filter(Boolean);
            localStorage.setItem("autosurf_blacklist", JSON.stringify(blacklist));
            alert("Blacklist обновлён. Перезагрузите страницу.");
        }
    };

    if (inBlacklist) return;

    const timerDiv = panel.querySelector("#timer");
    const clickTimerDiv = panel.querySelector("#clickTimer");
    const randomTimerDiv = panel.querySelector("#randomTimer");
    const clickStatusDiv = panel.querySelector("#clickStatus");
    const progressDiv = panel.querySelector("#progress");

    const currentURL = window.location.href;
    const manualIndex = siteList.findIndex(site => currentURL.startsWith(site));
    if (manualIndex !== -1) {
        index = manualIndex;
        localStorage.setItem("autosurf_index", index);
    }

    let clickInProgress = false;

    function getClickableElements() {
        return Array.from(document.querySelectorAll("a[href], button, input[type='button'], input[type='submit']"))
            .filter(el => el.offsetParent !== null);
    }

    function emulateClick(element) {
        try { element.click(); }
        catch { if (element.href) window.location.href = element.href; }
    }

    function tryClick() {
        if (!clickEnabled || clickInProgress || Date.now() - lastClickTime < clickCooldown) return;
        const elements = getClickableElements();
        if (elements.length === 0) return;
        const element = elements[Math.floor(Math.random() * elements.length)];
        lastClickTime = Date.now();
        localStorage.setItem("autosurf_lastClick", lastClickTime.toString());
        emulateClick(element);
    }

    function tryRandomClick() {
        if (!randomClickEnabled || Date.now() - lastRandomClickTime < randomClickCooldown) return;
        const elements = getClickableElements();
        if (elements.length === 0) return;
        const element = elements[Math.floor(Math.random() * elements.length)];
        lastRandomClickTime = Date.now();
        localStorage.setItem("autosurf_lastRandomClick", lastRandomClickTime.toString());
        emulateClick(element);
    }

    function scheduleNext() {
        const targetDelay = Date.now() + Math.floor(Math.random() * (maxTime - minTime)) + minTime;
        const interval = setInterval(() => {
            if (stopped) return clearInterval(interval);

            const remaining = Math.max(0, targetDelay - Date.now());
            const clickRemaining = Math.max(0, (clickCooldown - (Date.now() - lastClickTime)) / 1000);
            const randomRemaining = Math.max(0, (randomClickCooldown - (Date.now() - lastRandomClickTime)) / 1000);

            timerDiv.textContent = `⏳ Переход через: ${Math.ceil(remaining / 1000)} сек`;
            clickTimerDiv.textContent = `🖱 Клик через: ${Math.ceil(clickRemaining)} сек`;
            randomTimerDiv.textContent = `✨ Рандом клик через: ${Math.ceil(randomRemaining)} сек`;
            clickStatusDiv.textContent = `Клик: ${clickEnabled ? "ON" : "OFF"} | Random: ${randomClickEnabled ? "ON" : "OFF"}`;
            progressDiv.textContent = `Сайт ${Math.min(index + 1, siteList.length)} из ${siteList.length}`;

            tryClick();
            tryRandomClick();

            if (remaining <= 0) {
                clearInterval(interval);
                setTimeout(goNext, 1000);
            }
        }, 1000);
    }

    function goNext(manual = false) {
        if (stopped && !manual) return;
        let nextIndex = index + 1;
        if (nextIndex >= siteList.length) nextIndex = 0;
        localStorage.setItem("autosurf_index", nextIndex);
        location.href = siteList[nextIndex];
    }

    document.getElementById("nextBtn").onclick = () => goNext(true);
    document.getElementById("restartClickBtn").onclick = () => {
        lastClickTime = 0;
        clickInProgress = false;
        localStorage.setItem("autosurf_lastClick", "0");
        tryClick();
    };
    document.getElementById("toggleClickBtn").onclick = function () {
        clickEnabled = !clickEnabled;
        localStorage.setItem("autosurf_clickEnabled", clickEnabled);
        this.textContent = `🖱 Click ${clickEnabled ? "ON" : "OFF"}`;
        this.classList.toggle("active", !clickEnabled);
    };
    document.getElementById("toggleRandomClickBtn").onclick = function () {
        randomClickEnabled = !randomClickEnabled;
        localStorage.setItem("autosurf_randomClickEnabled", randomClickEnabled);
        this.textContent = `✨ Random ${randomClickEnabled ? "ON" : "OFF"}`;
        this.classList.toggle("active", !randomClickEnabled);
    };

    if (!stopped) scheduleNext();
    setInterval(() => { if (!stopped) scrollBy(0, 2); }, 30);

    GM_registerMenuCommand("▶ Старт", () => { GM_setValue("autosurf_stopped", false); stopped = false; scheduleNext(); });
    GM_registerMenuCommand("⛔ Стоп", () => { GM_setValue("autosurf_stopped", true); stopped = true; });
    GM_registerMenuCommand("📋 Вставить сайты", () => {
        const input = prompt("Введите сайты через запятую:", siteList.join(", "));
        if (input) {
            siteList = input.split(",").map(s => s.trim()).filter(Boolean);
            localStorage.setItem("autosurf_sites", JSON.stringify(siteList));
            alert("Сайты обновлены.");
        }
    });
    GM_registerMenuCommand("📥 Импорт сайтов", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = JSON.parse(evt.target.result);
                    if (Array.isArray(data)) {
                        localStorage.setItem("autosurf_sites", JSON.stringify(data));
                        alert("Импорт завершён. Перезагрузите страницу.");
                    } else alert("❌ Неверный формат JSON.");
                } catch { alert("❌ Ошибка чтения JSON."); }
            };
            reader.readAsText(file);
        };
        input.click();
    });
    GM_registerMenuCommand("📤 Экспорт сайтов", () => {
        const json = JSON.stringify(siteList, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "autosurf-sites-" + new Date().toISOString().slice(0, 19).replace(/:/g, "-") + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    GM_registerMenuCommand("♻ Сброс", () => {
        localStorage.clear();
        localStorage.setItem("autosurf_sites", JSON.stringify(defaultSites()));
        localStorage.setItem("autosurf_blacklist", JSON.stringify([]));
        GM_setValue("autosurf_stopped", false);
        alert("Все настройки сброшены. Перезагрузка страницы.");
        location.reload();
    });
    GM_registerMenuCommand("🔄 Обновить", () => location.reload());
})();
