// ==UserScript==
// @name         DeepSeek Auto-Paste Image
// @namespace    ds-auto-paste
// @version      3.1
// @description  Ctrl+V - paste image from clipboard. Esc - remove attached preview.
// @author       Community workaround
// @match        https://chat.deepseek.com/*
// @match        https://www.deepseek.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function notify(msg, type = 'info') {
        const id = 'ds-autopaste-toast';
        const existing = document.getElementById(id);
        if (existing) existing.remove();

        const colors = {
            info: '#2563eb',
            success: '#16a34a',
            error: '#dc2626',
            warn: '#d97706'
        };

        const div = document.createElement('div');
        div.id = id;
        div.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:16px;">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '📋'}</span>
                <span>${msg}</span>
            </div>
        `;
        div.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 2147483647;
            background: ${colors[type]};
            color: white;
            padding: 12px 18px;
            border-radius: 10px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 8px 24px rgba(0,0,0,0.25);
            pointer-events: none;
            animation: ds-toast-in 0.25s ease-out;
        `;

        if (!document.getElementById('ds-toast-style')) {
            const style = document.createElement('style');
            style.id = 'ds-toast-style';
            style.textContent = `
                @keyframes ds-toast-in {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(div);
        setTimeout(() => {
            div.style.transition = 'opacity 0.3s, transform 0.3s';
            div.style.opacity = '0';
            div.style.transform = 'translateY(10px)';
            setTimeout(() => div.remove(), 300);
        }, 2500);
    }

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function findAttachmentButton() {
        const svgSelectors = [
            'svg[class*="paperclip"]',
            'svg[class*="attach"]',
            'svg[class*="upload"]',
            'svg[class*="clip"]'
        ];
        for (const sel of svgSelectors) {
            const svg = document.querySelector(sel);
            if (svg) {
                const btn = svg.closest('button') || svg.closest('div[role="button"]') || svg.closest('label') || svg.parentElement;
                if (btn) return btn;
            }
        }
        const btnSelectors = [
            'button[aria-label*="upload" i]',
            'button[aria-label*="attach" i]',
            'button[aria-label*="file" i]',
            'div[role="button"][aria-label*="upload" i]'
        ];
        for (const sel of btnSelectors) {
            const el = document.querySelector(sel);
            if (el) return el;
        }
        return null;
    }

    function findInputArea() {
        return (
            document.querySelector('textarea') ||
            document.querySelector('[contenteditable="true"]') ||
            document.querySelector('[class*="input"]') ||
            document.querySelector('main') ||
            document.body
        );
    }

    async function injectFile(file) {
        let input = document.querySelector('input[type="file"]');
        if (input) {
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }

        const clipBtn = findAttachmentButton();
        if (clipBtn) {
            clipBtn.click();
            await sleep(400);
            input = document.querySelector('input[type="file"]');
            if (input) {
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }

        const dropTarget = findInputArea();
        if (dropTarget) {
            const dt = new DataTransfer();
            dt.items.add(file);
            ['dragenter', 'dragover', 'drop'].forEach(type => {
                dropTarget.dispatchEvent(new DragEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    dataTransfer: dt
                }));
            });
            return true;
        }
        return false;
    }

    function removeAttachment() {
        const possibleContainers = [
            ...document.querySelectorAll('[class*="attachment"]'),
            ...document.querySelectorAll('[class*="preview"]'),
            ...document.querySelectorAll('[class*="file"]'),
            ...document.querySelectorAll('[class*="upload"]')
        ];

        const previewContainer = possibleContainers.find(el => {
            const hasImg = el.querySelector('img') !== null;
            const hasDeleteBtn = el.querySelector('button, svg[class*="close"], svg[class*="delete"], svg[class*="remove"], [class*="delete"], [class*="remove"]') !== null;
            return hasImg && hasDeleteBtn;
        });

        if (!previewContainer) return false;

        const deleteBtn = previewContainer.querySelector('button') ||
                          previewContainer.querySelector('[class*="delete"]') ||
                          previewContainer.querySelector('[class*="remove"]') ||
                          previewContainer.querySelector('svg[class*="close"]')?.closest('button') ||
                          previewContainer.querySelector('svg[class*="delete"]')?.closest('button');

        if (deleteBtn) {
            deleteBtn.click();
            deleteBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return true;
        }

        previewContainer.remove();
        return true;
    }

    document.addEventListener('paste', async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        let imageFile = null;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                imageFile = item.getAsFile();
                break;
            }
        }

        if (!imageFile) return;

        e.preventDefault();
        e.stopPropagation();

        notify('Pasting image...', 'info');

        try {
            const ok = await injectFile(imageFile);
            if (ok) {
                notify('Image attached. Esc to remove.', 'success');
                const inputArea = findInputArea();
                if (inputArea && inputArea.focus) inputArea.focus();
            } else {
                notify('Auto-paste failed. Use 📎 button.', 'error');
            }
        } catch (err) {
            console.error('[DeepSeek Paste]', err);
            notify('Paste error. Check console (F12).', 'error');
        }
    }, true);

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        const modal = document.querySelector('[role="dialog"], [aria-modal="true"], [class*="modal"], [class*="dialog"]');
        if (modal) return;

        const removed = removeAttachment();
        if (removed) {
            e.preventDefault();
            e.stopPropagation();
            notify('Attachment removed', 'warn');
        }
    }, true);

    console.log('[DeepSeek Auto-Paste] Active: Ctrl+V = paste, Esc = remove.');
})();
