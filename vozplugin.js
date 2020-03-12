// ==UserScript==
// @name         VozPlugin
// @namespace    http://tampermonkey.net/
// @updateURL    https://raw.githubusercontent.com/chungcanhngo/vozplugin/master/vozplugin.js
// @version      1.0.3
// @description  try to take over the world!
// @author       chungcanhngo
// @match        https://*.voz.vn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(function () {
    'use strict';

    const request = (url, options) =>
        new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                ...options,
                url,
                onload: function (response) {
                    if (response.readyState === 4 && response.status === 200) {
                        resolve(response.responseText);
                    } else {
                        reject(new TypeError(`Error ${response.status}: ${url}`));
                    }
                }
            });
        });

    const showLoading = (isDisplay) => {
        let loadingDom = document.querySelector('body').querySelector('span.globalAction');

        if (!loadingDom) {
            loadingDom = document.createElement('span');
            loadingDom.innerHTML = `
                <span class="globalAction-bar"></span>
                <span class="globalAction-block">
                    <i></i><i></i><i></i>
                </span>
            `;
            loadingDom.classList.add('globalAction');
            document.querySelector('body').appendChild(loadingDom);
        }

        if (isDisplay) {
            loadingDom.classList.add('is-active')
        } else {
            loadingDom.classList.remove('is-active');
        }
    }

    const getNewPage = () => {
        if (global.isLoading) return;

        const content = document.querySelector(".block.block--messages");

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const delta = content.clientHeight - content.clientTop - window.innerHeight;

        if (scrollTop > delta && global.nextPage) {

            global.isLoading = true;
            showLoading(false)

            document.querySelector('.globalAction').classList.add('is-active');
            const urlNextPage = global.nextPage.getAttribute('href');

            request(urlNextPage)
                .then(sourceHTML => {

                    global.isLoading = false;
                    showLoading(false)

                    const newPage = new DOMParser().parseFromString(sourceHTML, "text/html");
                    global.nextPage = newPage.querySelector(`.pageNav-jump--next`);
                    global.currentPage = document.querySelector(`.pageNav-page--current`);

                    GM_setValue(VOZ_PLUGIN_CURRENT_PAGE, global.currentPage.innerText);

                    // append article to list
                    const articlesDom = newPage.querySelectorAll(`.js-replyNewMessageContainer article.message`);
                    articlesDom.forEach(article => document.querySelector('.block-body').appendChild(article));

                }).catch(error => {
                    global.isLoading = false;
                    showLoading(false)
                    console.error(error.message);
                })

        }
    }

    // Run

    const global = {};

    const VOZ_PLUGIN_CURRENT_PAGE = 'voz:plugin:current_page';

    global.isLoading = false;
    global.nextPage = document.querySelector(`.pageNav-jump--next`);
    global.currentPage = document.querySelector(`.pageNav-page--current`);
    global.oldPage = GM_getValue(VOZ_PLUGIN_CURRENT_PAGE, null);

    console.log(`oldPage`, global.oldPage);

    GM_setValue(VOZ_PLUGIN_CURRENT_PAGE, global.currentPage.innerText);

    window.addEventListener("scroll", getNewPage);

})();
