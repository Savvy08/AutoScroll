## 🗂️ **Changelog AutoSurf PRO**


---

### 🧠 **v9.5.4 Beta**

* 🧼 Fixed the "Site 0 of 0" error after inserting or importing sites  
* 🔄 Added automatic cleanup:
  * 🧹 Removes empty lines and duplicate entries from the site list  
  * 🔁 Resets index to `0` if site is not found or list is empty  
  * ♻️ Restores default site list if import or insertion is invalid  
* ✅ Changing the site list now always resets to the first site  

---

### 🧩 **v9.5.3 Beta**

* 📘 Added **Collapse/Expand** button to the UI panel  
* 🧠 UI panel state (collapsed or expanded) is now preserved across reloads  

---

### 🚫 **v9.5.2 Beta**

* 🕳️ Introduced **Blacklist** feature:
  * ❌ Script does not activate on blacklisted sites  
  * 🖱 Blacklist edit button in UI is clickable again  
* 🧊 All features (clicks, scrolling, transitions) are disabled on blacklisted domains  

---

### 🔧 **v9.5.1 Beta**

* 🐞 Fixed bug: default site list was not restored after reset  
* ♻️ Reset now returns all settings and sites to factory defaults  

---

### 🛠️ **v9.5.0 Beta**

* 🆕 Added two new Tampermonkey menu buttons:
  * ♻️ **Reset** — clears all settings to factory defaults  
  * 🔄 **Reload** — restarts the script with fresh settings  
* 🧹 Reset now clears all values from `localStorage` and `GM_setValue`  

---

### 🧱 **v9.4.3 Beta**

* 🔁 Fixed infinite loop in autoscroll and click emulation  
* 📋 All buttons and menus are retained  
* ✅ Base autosurf functionality is working smoothly  

---
### 🧠 **v9.4.2**✅ Stable

* 🐞 Fixed a bug with progress after a random click ("Site 1 of 0" no longer appears)
* ⏱ Random click now works correctly on a timer
* 📋 All buttons and menus are saved

---

### ⚙️ **v9.4.1**

* Fixed synchronization of settings when switching to a new site
* 🧩 All menu buttons and panels are saved

---

### 🛠️ **v9.4.0**

* Fixed all timers: click, random click, and click-throughs
* ♻️ The 'RESTART CLICK' button now resets the timer correctly
* 🧮 The panel displays the time until the next click

---

### 🎛️ **v9.3.5**

* 🔐 Random click is no longer blocked as a "popup"
* 🕓 Added a separate timer for random click
* The Blacklist button appeared in the panel (`@Savvy08 | Blacklist`)

---

### 🎲 **v9.3.0**

* 🖱 Added **Random Click**:
* 🔀 A button on the panel (`Random ON/OFF`) with saved state
* ⚙️ Interval setting via the menu
  * ⏱ The timer is displayed in the UI

---

### 🚦 **v9.2.0**

* 🧰 Returned the **Import/Export sites** buttons to the menu
* ⏱ Added transition and click time settings
* Added **Blacklist** — sites excluded from auto actions

---

### 🚀 **v9.1.0**

* ▶️ Start now always from the first site
* Auto-click works immediately without `Reset Click`

---

### 🧼 **v9.0.0**

* 🔄 The **Reset All** button is a complete reset of settings
* ✍️ Inserting websites manually via the menu (separated by commas)
* Fixed timer output (removed "Loading...")

---

### 🧠 **v8.6.2 Beta**

* 📏 The UI collapse block has been reduced
* ⏱ Timer until auto-click is displayed
* 🖱 The click is performed stably once
* 🚫 Reduced load (without animations)
* 🧠 Timer operation has been stabilized

---

### 🛠 **v8.6.1 Beta**

* Auto reset of the click timer
* 📥📤 Fixed multiple explorer openings
* ⏱ Added a countdown to the click
* 🔧 Updated the logic of the click via `setTimeout`

---

### 🧱 **v8.6.0 Beta**

* 📺 The UI has been updated
* 🖱 The click is stable without manual `RESTART`
* 🧹 The `Reset All` button is added to the menu
* The minimized UI is preserved

---

### 🧾 **v8.5.9 Beta**

* , Button **Insert sites manually** (separated by commas)
* ✅ JSON validator during import

---

### 🧠 **v8.5.8 Beta**

* 🧩 The full UI has been returned (panel, status, buttons)
* 🕶 The timer is running in minimized UI mode

---

### 📺 **v8.5.7 Beta**

* 📥📤 Buttons **Import/Export** moved to Tampermonkey menu
* 🧭 The `Start`, `Stop`, and `Time Setting` buttons have been restored

---

### 🧹 **v8.5.6**

* 🔄 Added the **Reset All button**
* The collapsed UI state is saved

---

### 💼 **v8.5.5**

* 📂 Import sites via `.json` file
* 📦 Export saves `autosurf-sites-YYYY-MM-DD.json`

---

### 📥 **v8.5.4**

* 🧪 Checking the JSON structure during import
* The ability to insert sites manually (separated by commas)
* 💾 The list of sites is saved in `localStorage`

---

### 🧰 **v8.5.3 Beta**

* Fixed click logic (occurs 1 time)
* ♻️ Automatic click reset before transition
* ⏳ Added a visual UI timer

---

### 🧩 **v8.5.2 Beta**

* 📋 Added Tampermonkey menu:
  * ▶️ Start / Stop 🛑 
 * ⏱ Time setting transition
 * 📥 Import / Export 📤 sites (JSON)
* Click 🔧 no longer requires manual reset
* 👤 The author has been changed to `@Savvy08`

---

### 🔁 **v8.5.1**

* Fixed reset of the click timer
* ♻️ The `RESTART CLICK` button has been added

---

### 📦 **v8.5.0**✅ Stable

* Basic autosurfing on a list of sites
* 🖱 Auto-click on a random link on the page
* ⏳ Timer for switching between sites

---
