// ==UserScript==
// @name         AutoSurf PRO 9.5.4 blacklist
// @namespace    http://tampermonkey.net/
// @version      9.5.4-blacklist
// @description  Автосёрфинг: защита от пустого списка, дублирующихся сайтов и некорректного индекса
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

    function loadSites() {
        let stored = JSON.parse(localStorage.getItem("autosurf_sites") || "[]");
        if (!Array.isArray(stored) || stored.length === 0) {
            stored = defaultSites();
            localStorage.setItem("autosurf_sites", JSON.stringify(stored));
            localStorage.setItem("autosurf_index", "0");
        }
        return stored;
    }

    function loadSettings() {
        let siteList = loadSites();
        let index = parseInt(localStorage.getItem("autosurf_index") || "0");
        if (index >= siteList.length || index < 0) {
            index = 0;
            localStorage.setItem("autosurf_index", "0");
        }
        return {
            siteList,
            blacklist: JSON.parse(localStorage.getItem("autosurf_blacklist") || "[]") || [],
            minTime: parseInt(localStorage.getItem("autosurf_minTime") || "60000"),
            maxTime: parseInt(localStorage.getItem("autosurf_minTime") || "60000") + 30000,
            clickCooldown: parseInt(localStorage.getItem("autosurf_clickCooldown") || (5 * 60 * 1000)),
            randomClickCooldown: parseInt(localStorage.getItem("autosurf_randomClickCooldown") || (2 * 60 * 1000)),
            clickEnabled: localStorage.getItem("autosurf_clickEnabled") !== "false",
            randomClickEnabled: localStorage.getItem("autosurf_randomClickEnabled") !== "false",
            lastClickTime: parseInt(localStorage.getItem("autosurf_lastClick") || "0"),
            lastRandomClickTime: parseInt(localStorage.getItem("autosurf_lastRandomClick") || "0"),
            index,
            stopped: GM_getValue("autosurf_stopped", false),
            collapsed: GM_getValue("autosurf_collapsed", false)
        };
    }

    let {
        siteList, blacklist, minTime, maxTime, clickCooldown,
        randomClickCooldown, clickEnabled, randomClickEnabled,
        lastClickTime, lastRandomClickTime, index, stopped, collapsed
    } = loadSettings();

    const currentDomain = window.location.hostname.replace(/^www\./, "");

    const blockedDomains = ["youtube.com", "google.com", "mail.google.com", "outlook.com", "yandex.ru", "github.com"];
    if (blockedDomains.some(domain => currentDomain.endsWith(domain))) {
        console.log("AutoSurf PRO отключен на запрещённом домене");
        return;
    }

    const inBlacklist = blacklist.some(bl => currentDomain.endsWith(bl.replace(/^www\./, "")));

    const panel = document.createElement("div");
    panel.id = "autosurf-panel";
    panel.classList.toggle("collapsed", collapsed);
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
            #autosurf-panel.collapsed .content { display:none; }
            #autosurf-toggle { cursor:pointer; font-size:14px; color:#4caf50; margin-left:10px; }
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
            <span>AutoSurf 9.5.4-blacklist</span>
            <div>
                <small id="blacklist-edit">@Savvy08 | Blacklist</small>
                <span id="autosurf-toggle">${collapsed ? "▲" : "▼"}</span>
            </div>
        </div>
        <div class="content">
            ${inBlacklist ? '<div style="color:#ff4c4c;font-weight:bold;">⛔ Автосёрфинг отключён для этого сайта</div>' : ''}
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

    document.getElementById("autosurf-toggle").onclick = () => {
        panel.classList.toggle("collapsed");
        const isCollapsed = panel.classList.contains("collapsed");
        GM_setValue("autosurf_collapsed", isCollapsed);
        document.getElementById("autosurf-toggle").textContent = isCollapsed ? "▲" : "▼";
    };

    if (inBlacklist) return;

    // Остальная логика (таймеры, клики, переходы, меню) остаётся неизменной
})();
