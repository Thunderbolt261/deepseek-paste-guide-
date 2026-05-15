# DeepSeek Paste Fix - Гайд и workaround

&gt; **На русском** | [English below](#english-version)

Если в веб-версии [DeepSeek Chat](https://chat.deepseek.com) перестала работать вставка изображений через `Ctrl+V` (скриншоты, скопированные картинки), а кнопка 📎 «скрепка» работает - этот репозиторий для вас.

**Статус:** workaround для фронтенд-бага. Работает, пока DeepSeek не починит вставку нативно.

---

## Быстрая диагностика (30 секунд)

Прежде чем ставить скрипт, проверьте - проблема у вас или у DeepSeek:

### Шаг 1. Инкогнито
Откройте `chat.deepseek.com` в режиме инкогнито (`Ctrl+Shift+N`) и нажмите `Ctrl+V` со скриншотом.
- **Работает?** → Проблема в расширениях/кэше вашего профиля. Отключите AdGuard, Tampermonkey, блокировщики.
- **Не работает?** → Идём в шаг 2.

### Шаг 2. Консоль (F12)
На основной вкладке DeepSeek нажмите `F12` → вкладка `Console`. Сделайте `Ctrl+V`.
- **Видите красные ошибки?** → Скопируйте текст ошибки в [Issues](../../issues). Это поможет понять, что сломалось.
- **Ничего нет?** → Фронтенд DeepSeek просто не ловит событие `paste` для файлов. Используйте userscript ниже.

### Шаг 3. Кнопка скрепки
Нажмите на 📎 и выберите файл вручную.
- **Работает?** → Значит, API загрузки живой, а `Ctrl+V` не реализован/сломан на фронте.
- **Не работает?** → Сервер DeepSeek перегружен или упал. Ждите.

---

## Установка Userscript (Tampermonkey)

Если диагностика показала, что фронтенд не обрабатывает вставку:

1. Установите [Tampermonkey](https://www.tampermonkey.net/) (Chrome / Firefox / Edge).
2. Создайте новый скрипт: иконка Tampermonkey → «Создать новый скрипт».
3. Удалите шаблонный код и вставьте содержимое файла [`userscript/deepseek-paste-fix.user.js`](userscript/deepseek-paste-fix.user.js).
4. Сохраните (`Ctrl+S`).
5. Перезагрузите `chat.deepseek.com`.

**Что умеет скрипт:**
- `Ctrl+V` - автоматически прикрепляет изображение из буфера обмена.
- `Esc` - удаляет прикреплённое превью (если вставили не то).
- Toast-уведомления - не нужно смотреть в консоль.

---

## 🔧 Почему это происходит

Веб-приложение DeepSeek построено на React. Вставка текста работает через стандартный `onPaste`, но вставка **файлов** (изображений из буфера) требует ручной обработки `ClipboardEvent` и передачи `File` в скрытый `&lt;input type="file"&gt;`. В некоторых билдах фронтенда этот обработчик отсутствует или ломается после обновлений.

Этот скрипт перехватывает событие `paste` раньше React, извлекает `Blob` из `clipboardData`, создаёт `File` и эмулирует событие `change` на нативном input, который DeepSeek использует для кнопки 📎.

---

## 📝 История

- **2026-05-14** - У автора репозитория в Chrome перестал работать `Ctrl+V` в DeepSeek. Кнопка 📎 работала. После диагностики оказалось, что фронтенд не реагирует на `paste` с файлами.
- **2026-05-15** - Написан userscript-workaround. После тестов проблема исчезла и в чистом браузере (вероятно, DeepSeek откатил/починил фронтенд), но скрипт остаётся как fallback на случай регресса.

---

## Лицензия

MIT - используйте, модифицируйте, распространяйте. Без гарантий.

---

---

&lt;a name="english-version"&gt;&lt;/a&gt;
# English Version

If `Ctrl+V` (paste image from clipboard) stopped working in [DeepSeek Chat](https://chat.deepseek.com) web version, but the 📎 paperclip button still works, this repo is for you.

**Status:** frontend bug workaround. Use until DeepSeek fixes native paste.

## Quick Diagnosis

1. **Incognito test** - Open `chat.deepseek.com` in incognito (`Ctrl+Shift+N`), try `Ctrl+V` with a screenshot. If it works, the problem is in your browser extensions/cache.
2. **Console check** - Press `F12` → `Console`, then `Ctrl+V`. Red errors = broken frontend logic. No errors = frontend simply ignores file paste events.
3. **Paperclip test** - If manual upload via 📎 works but Ctrl+V doesn't, the upload API is alive and only the paste handler is missing.

## Userscript Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Create new script, paste code from [`userscript/deepseek-paste-fix.user.js`](userscript/deepseek-paste-fix.user.js).
3. Save (`Ctrl+S`), reload DeepSeek.

**Features:**
- `Ctrl+V` - auto-attaches image from clipboard.
- `Esc` - removes attached preview.
- Toast notifications - no need to open DevTools.

## Why it happens

DeepSeek's web app is React-based. Text paste works out of the box, but **file paste** from clipboard requires manual `ClipboardEvent` handling and passing the `File` to a hidden `&lt;input type="file"&gt;`. In some frontend builds this handler is missing or breaks after updates.

## License

MIT.
