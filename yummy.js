// Робоча версія плагіна Lampa для YummyAnime
(function () {
    if (window.yummy_plugin_loaded) return;
    window.yummy_plugin_loaded = true;

    // ⚙️ НАЛАШТУВАННЯ: Вставте ваш API-ключ
    const API_TOKEN = '2m1x9bxtu1t-p29w';
    const API_BASE_URL = 'https://api.yani.tv'; // Базовий URL API

    const startPlugin = function () {
        console.log('✅ YummyAnime Plugin: Запуск успішний!');

        Lampa.Api.sources.push({
            id: 'yummy_source',
            name: '🎬 YummyAnime',
            filter: false,

            // --- Отримання списку аніме ---
            list: (page, filter, category, callback) => {
                const limit = 30;
                const offset = (page - 1) * limit;
                const url = `${API_BASE_URL}/anime?limit=${limit}&offset=${offset}`;

                Lampa.Network.get(url, (response) => {
                    try {
                        const data = JSON.parse(response);
                        const items = (data.anime || []).map(item => ({
                            title: item.title || item.original_title || 'Без назви',
                            poster: item.poster_url || null,
                            description: item.description || '',
                            id: item.id,
                        }));
                        callback(items, data.total || 0);
                    } catch (e) {
                        console.error('Помилка обробки списку:', e);
                        callback([], 0);
                    }
                }, (error) => {
                    console.error('Помилка завантаження списку:', error);
                    callback([], 0);
                }, { headers: { 'X-Application': API_TOKEN } });
            },

            // --- Отримання посилання на відео ---
            play: (data, callback) => {
                const animeId = data.id;
                const episodeNumber = data.episode;
                const url = `${API_BASE_URL}/anime/${animeId}?include_videos=true`;

                Lampa.Network.get(url, (response) => {
                    try {
                        const animeData = JSON.parse(response);
                        const video = (animeData.videos || []).find(v => v.episode === episodeNumber);
                        if (video && video.stream_url) {
                            callback({
                                url: video.stream_url,
                                quality: 'HD',
                            });
                        } else {
                            console.error('Відео для серії не знайдено');
                            callback(null);
                        }
                    } catch (e) {
                        console.error('Помилка обробки відео:', e);
                        callback(null);
                    }
                }, (error) => {
                    console.error('Помилка завантаження відео:', error);
                    callback(null);
                }, { headers: { 'X-Application': API_TOKEN } });
            },

            // --- Пошук ---
            search: (query, page, callback) => {
                if (!query || query.length < 3) return callback([], 0);
                const limit = 20;
                const offset = (page - 1) * limit;
                const url = `${API_BASE_URL}/anime/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;

                Lampa.Network.get(url, (response) => {
                    try {
                        const data = JSON.parse(response);
                        const items = (data.anime || []).map(item => ({
                            title: item.title || item.original_title || 'Без назви',
                            poster: item.poster_url || null,
                            description: item.description || '',
                            id: item.id,
                        }));
                        callback(items, data.total || 0);
                    } catch (e) {
                        console.error('Помилка пошуку:', e);
                        callback([], 0);
                    }
                }, (error) => {
                    console.error('Помилка під час пошуку:', error);
                    callback([], 0);
                }, { headers: { 'X-Application': API_TOKEN } });
            },
        });
    };

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', (e) => {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
