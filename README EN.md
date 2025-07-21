# AutoScroll
Automatic website surfing with support for clicks, random clicks, click-through timer and blacklist.
The script for **Tampermonkey**.

---

## **Installation**

1. Install the extension **[Tampermonkey](https://www.tampermonkey.net /)** for your browser.
2. Click **"Create a new script"** in the Tampermonkey panel.
3. Delete the template code and paste the contents of the `AutoSurf PRO 9.4.2' file Beta.js `.
4. Save the script (**Ctrl+S**) and make sure it is enabled.
5. You can also install the newest version of `AutoSurf PRO 9.5.4'. STABLE-beta.js `, it is located in the folder "*beta version*"

---

## **How to use**

1. After installation, the script will automatically run on all sites except those on the blacklist.
2. The control panel is displayed in the lower left corner:

   * **NEXT** — go to the next site.
   * **RESTART CLICK** — reset the click timer.
   * **Click ON/OFF** — enable/disable auto-clicks.
   * **Random ON/OFF** — enable/disable random clicks.
3. The panel status can be minimized or expanded by pressing **"Down"**.
4. Tampermonkey menu (**extension icon in the browser**):

   * **▶ Start / ⛔ Stop** — autosurfing control.
   * **📋 Insert sites** — enter the list of sites separated by commas.
   * **📥 Import / 📤 Export** — work with JSON files of the list of sites.
   * **♻ Reset** — reset all settings and the list of sites to factory settings.
   * **🔄 Update** — restart the script.
5. **Blacklist**:

   * click on the "Blacklist" in the panel and enter the domains separated by commas.
   * the script is completely disabled on these sites (clicks and scroll do not work).

---

## **Features**

* The list of sites is automatically cleared of empty entries and duplicates.
* When resetting, all settings return to their default values.
* The index of the current site is reset if it goes beyond the list.
* The script does not work on blacklist sites.
