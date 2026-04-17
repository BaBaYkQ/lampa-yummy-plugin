// Базовий шаблон плагіна Lampa
(function () {
    // Захист від повторного завантаження
    if (window.yummy_plugin_loaded) return;
    window.yummy_plugin_loaded = true;

    // Функція, яка запускає логіку плагіна
    const startPlugin = function () {
        console.log('✅ YummyAnime Plugin: Запуск...');

        // Реєструємо нове джерело в Lampa
        Lampa.Api.sources.push({
            id: 'yummy_source',
            name: '🎬 YummyAnime',
            filter: false,

            // --- Отримання списку аніме ---
            list: (page, filter, category, callback) => {
                // Тут буде логіка отримання списку
                console.log('📺 Завантаження списку, сторінка:', page);
                callback([], 0);
            },

            // --- Отримання посилання на відео ---
            play: (data, callback) => {
                // Тут буде логіка отримання відео
                console.log('🎞️ Отримання відео для серії:', data);
                callback(null);
            },

            // --- Пошук ---
            search: (query, page, callback) => {
                console.log('🔍 Пошук запиту:', query);
                callback([], 0);
            },
        });
    };

    // Очікуємо на повне завантаження Lampa
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', (e) => {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
