// Плагін Lampa для YummyAnime (виправлена версія)
(function () {
    if (window.yummy_plugin_loaded) return;
    window.yummy_plugin_loaded = true;

    // ===== НАЛАШТУВАННЯ =====
    // Отримайте токен тут: https://yummyani.me/dev/applications
    const API_TOKEN = 'k8deq_gljhple1r3q-ia-b7u-7ee3lbh';  // ← ЗАМІНІТЬ НА РЕАЛЬНИЙ ТОКЕН!
    const API_BASE = 'https://api.yani.tv';
    // =========================

    const startPlugin = function () {
        console.log('✅ YummyAnime Plugin: запущено');

        // Перевірка наявності токена
        if (!API_TOKEN || API_TOKEN === 'ВАШ_API_ТОКЕН') {
            console.error('❌ YummyAnime: Потрібно вказати API_TOKEN у коді плагіна!');
            return;
        }

        Lampa.Api.sources.push({
            id: 'yummy_source_v2',
            name: '🎬 YummyAnime',
            filter: false,

            // ========== ОТРИМАННЯ СПИСКУ ==========
            list: (page, filter, category, callback) => {
                const limit = 30;
                const offset = (page - 1) * limit;
                const url = `${API_BASE}/anime?limit=${limit}&offset=${offset}`;

                console.log(`📡 Запит списку: ${url}`);

                Lampa.Network.get(url, (response) => {
                    try {
                        const data = JSON.parse(response);
                        console.log('📦 Отримано дані:', data);
                        
                        // ВИПРАВЛЕНО: використовуємо data.response замість data.anime
                        let animeList = data.response || data.anime || [];
                        
                        // Якщо response не масив, а об'єкт з полем data
                        if (animeList.data && Array.isArray(animeList.data)) {
                            animeList = animeList.data;
                        }
                        
                        const items = animeList.map(item => ({
                            title: item.title || item.original_title || 'Без назви',
                            poster: item.poster_url || (item.poster && item.poster.url) || null,
                            description: item.description || '',
                            id: item.anime_id || item.id,
                        }));
                        
                        const total = data.total || data.count || animeList.length;
                        console.log(`✅ Завантажено ${items.length} аніме з ${total}`);
                        callback(items, total);
                        
                    } catch (e) {
                        console.error('❌ Помилка парсингу списку:', e);
                        callback([], 0);
                    }
                }, (error) => {
                    console.error('❌ Помилка мережі:', error);
                    callback([], 0);
                }, { headers: { 'X-Application': API_TOKEN } });
            },

            // ========== ОТРИМАННЯ ВІДЕО ==========
            play: (data, callback) => {
                const animeId = data.id;
                const episodeNumber = data.episode;
                const url = `${API_BASE}/anime/${animeId}?include_videos=true`;

                console.log(`📡 Запит відео для аніме ID: ${animeId}, серія: ${episodeNumber}`);

                Lampa.Network.get(url, (response) => {
                    try {
                        const animeData = JSON.parse(response);
                        
                        // ВИПРАВЛЕНО: отримуємо відео з правильного місця
                        let videos = animeData.videos || [];
                        
                        // Якщо відео всередині response
                        if (animeData.response && animeData.response.videos) {
                            videos = animeData.response.videos;
                        }
                        
                        const video = videos.find(v => v.episode === episodeNumber);
                        
                        if (video && video.stream_url) {
                            console.log(`🎞️ Знайдено відео: ${video.stream_url}`);
                            callback({
                                url: video.stream_url,
                                quality: video.quality || 'HD',
                            });
                        } else {
                            console.error('❌ Відео для серії не знайдено');
                            callback(null);
                        }
                        
                    } catch (e) {
                        console.error('❌ Помилка парсингу відео:', e);
                        callback(null);
                    }
                }, (error) => {
                    console.error('❌ Помилка мережі при отриманні відео:', error);
                    callback(null);
                }, { headers: { 'X-Application': API_TOKEN } });
            },

            // ========== ПОШУК ==========
            search: (query, page, callback) => {
                if (!query || query.length < 3) {
                    callback([], 0);
                    return;
                }
                
                const limit = 20;
                const offset = (page - 1) * limit;
                const url = `${API_BASE}/anime/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;

                console.log(`🔍 Пошук: ${query}`);

                Lampa.Network.get(url, (response) => {
                    try {
                        const data = JSON.parse(response);
                        
                        // ВИПРАВЛЕНО: аналогічно методу list
                        let animeList = data.response || data.anime || [];
                        if (animeList.data && Array.isArray(animeList.data)) {
                            animeList = animeList.data;
                        }
                        
                        const items = animeList.map(item => ({
                            title: item.title || item.original_title || 'Без назви',
                            poster: item.poster_url || (item.poster && item.poster.url) || null,
                            description: item.description || '',
                            id: item.anime_id || item.id,
                        }));
                        
                        const total = data.total || items.length;
                        callback(items, total);
                        
                    } catch (e) {
                        console.error('❌ Помилка пошуку:', e);
                        callback([], 0);
                    }
                }, (error) => {
                    console.error('❌ Помилка мережі при пошуку:', error);
                    callback([], 0);
                }, { headers: { 'X-Application': API_TOKEN } });
            },
        });
        
        console.log('✅ YummyAnime: джерело зареєстровано!');
    };

    // Очікуємо готовності Lampa
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', (e) => {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
