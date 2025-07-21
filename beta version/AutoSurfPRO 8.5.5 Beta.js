// ==UserScript==
// @name         AutoSurfPRO 8.5.5 Beta
// @namespace    http://tampermonkey.net/
// @version      8.5.5-beta
// @description  Автосёрфинг с UI, кликом как пользователь, меню настроек и экспортом
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const siteList = JSON.parse(localStorage.getItem("autosurf_sites") || "null") || [
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

    const minTime = parseInt(localStorage.getItem("autosurf_minTime") || "60000");
    const maxTime = parseInt(localStorage.getItem("autosurf_maxTime") || "90000");
    const clickCooldown = parseInt(localStorage.getItem("autosurf_clickCooldown") || (5 * 60 * 1000));
    let index = parseInt(localStorage.getItem("autosurf_index") || "0");
    const currentURL = window.location.href;
    const manualIndex = siteList.findIndex(site => currentURL.startsWith(site));
    if (manualIndex !== -1) index = manualIndex;
    localStorage.setItem("autosurf_index", index);

    let clickEnabled = localStorage.getItem("autosurf_clickEnabled") !== "false";
    let lastClickTime = parseInt(localStorage.getItem("autosurf_lastClick") || "0");
    let clickInProgress = false;
    let stopped = GM_getValue("autosurf_stopped", false);
    let collapsed = false;

    const panel = document.createElement("div");
    panel.id = "autosurf-panel";
    panel.innerHTML = `
        <style>
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
        </style>
        <div id="autosurf-header">
            <span>AutoSurf PRO 8.5.5 Beta</span>
            <div>
                <small>@Savvy08</small>
                <button id="collapse-btn">−</button>
            </div>
        </div>
        <div id="content">
            <div id="timer">⏳ Загрузка...</div>
            <div id="clickStatus">Клик: ${clickEnabled ? "ON" : "OFF"} | Через: ...</div>
            <div id="progress">Сайт ${index + 1} из ${siteList.length}</div>
            <div class="buttons">
                <button id="nextBtn">➡ NEXT</button>
                <button id="restartClickBtn">♻ RESTART CLICK</button>
                <button id="toggleClickBtn" class="${clickEnabled ? "" : "active"}">🖱 ${clickEnabled ? "Click ON" : "Click OFF"}</button>
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
    const toggleClickBtn = panel.querySelector("#toggleClickBtn");
    const restartClickBtn = panel.querySelector("#restartClickBtn");
    const collapseBtn = panel.querySelector("#collapse-btn");

    nextBtn.onclick = () => goNext(true);
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
        tryClick();
    };
    collapseBtn.onclick = () => {
        collapsed = !collapsed;
        content.style.display = collapsed ? "none" : "block";
        collapseBtn.textContent = collapsed ? "+" : "−";
    };

    function log(msg) {
        console.log("[AutoSurf]", msg);
        logDiv.textContent = msg;
    }

    function tryClick() {
        if (!clickEnabled || clickInProgress || Date.now() - lastClickTime < clickCooldown) return;

        const links = Array.from(document.querySelectorAll("a[href]")).filter(a =>
            a.offsetParent !== null &&
            !a.href.startsWith("#") &&
            !a.href.includes("javascript:")
        );

        if (links.length === 0) {
            log("⚠ Нет подходящих ссылок для клика");
            return;
        }

        const link = links[Math.floor(Math.random() * links.length)];
        log(`🖱 Эмуляция клика: ${link.href}`);

        clickInProgress = true;
        lastClickTime = Date.now();
        localStorage.setItem("autosurf_lastClick", lastClickTime.toString());

        // ✅ Прямой клик
        link.click();

        clickInProgress = false;
    }

    function goNext(manual = false) {
        if (stopped && !manual) return;
        let nextIndex = index + 1;
        if (nextIndex >= siteList.length) {
            nextIndex = 0;
            log("🔁 Начинаем заново");
        }
        localStorage.setItem("autosurf_index", nextIndex);
        location.href = siteList[nextIndex];
    }

    function scheduleNext() {
        const targetDelay = Date.now() + Math.floor(Math.random() * (maxTime - minTime)) + minTime;
        const interval = setInterval(() => {
            if (stopped) {
                clearInterval(interval);
                return;
            }

            const remaining = Math.max(0, targetDelay - Date.now());
            const clickRemaining = Math.max(0, (clickCooldown - (Date.now() - lastClickTime)) / 1000);
            timerDiv.textContent = `⏳ Переход через: ${Math.ceil(remaining / 1000)} сек`;
            clickStatusDiv.textContent = `Клик: ${clickEnabled ? "ON" : "OFF"} | Через: ${Math.ceil(clickRemaining)} сек`;
            progressDiv.textContent = `Сайт ${index + 1} из ${siteList.length}`;

            if (remaining <= 0) {
                clearInterval(interval);
                tryClick();
                clickInProgress = false;
                setTimeout(goNext, 1000);
            }
        }, 1000);
    }

    if (!stopped) scheduleNext();
    setInterval(() => { if (!stopped) scrollBy(0, 2); }, 30);

    // === Меню Tampermonkey ===
    GM_registerMenuCommand("▶ Старт", () => {
        stopped = false;
        GM_setValue("autosurf_stopped", false);
        scheduleNext();
    });
    GM_registerMenuCommand("⛔ Стоп", () => {
        stopped = true;
        GM_setValue("autosurf_stopped", true);
    });
    GM_registerMenuCommand("🔄 Рестарт", () => {
        localStorage.setItem("autosurf_index", 0);
        location.href = siteList[0];
    });
    GM_registerMenuCommand("➕ Добавить сайты (списком)", () => {
        const newSites = prompt("Вставьте сайты через запятую:");
        if (newSites) {
            const arr = newSites.split(",").map(s => s.trim()).filter(s => s.startsWith("http"));
            if (arr.length) {
                const updated = [...siteList, ...arr];
                localStorage.setItem("autosurf_sites", JSON.stringify(updated));
                alert("Сайты добавлены. Перезагрузите страницу.");
            }
        }
    });
    GM_registerMenuCommand("⏳ Настроить задержку перехода", () => {
        const sec = parseInt(prompt("Интервал перехода в секундах (например 60):", "60")) || 60;
        localStorage.setItem("autosurf_minTime", sec * 1000);
        localStorage.setItem("autosurf_maxTime", (sec + 30) * 1000);
        alert("Интервал перехода обновлён. Перезагрузите страницу.");
    });
    GM_registerMenuCommand("🖱 Интервал клика", () => {
        const min = parseInt(prompt("Интервал между кликами в минутах:", "5")) || 5;
        localStorage.setItem("autosurf_clickCooldown", min * 60 * 1000);
        alert("Интервал клика обновлён. Перезагрузите страницу.");
    });
    GM_registerMenuCommand("📤 Экспорт сайтов", () => {
        const json = JSON.stringify(siteList, null, 2);
        prompt("Скопируйте JSON:", json);
    });
    GM_registerMenuCommand("📥 Импорт сайтов", () => {
        const input = prompt("Вставьте JSON со списком сайтов:");
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
                localStorage.setItem("autosurf_sites", JSON.stringify(parsed));
                alert("Сайты импортированы. Перезагрузите страницу.");
            } else {
                alert("Неверный формат JSON.");
            }
        } catch (e) {
            alert("Ошибка при импорте.");
        }
    });
    GM_registerMenuCommand("🗑 Reset All", () => {
        if (confirm("Вы уверены, что хотите сбросить все настройки и список сайтов?")) {
            [
                "autosurf_sites", "autosurf_minTime", "autosurf_maxTime",
                "autosurf_clickCooldown", "autosurf_index",
                "autosurf_lastClick", "autosurf_clickEnabled"
            ].forEach(key => localStorage.removeItem(key));
            alert("Настройки сброшены. Перезагрузите страницу.");
        }
    });

})();
