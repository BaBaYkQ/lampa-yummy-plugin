(function() {
    'use strict';

    // Чекаємо, поки Lampa повністю завантажиться
    function waitForLampa(callback) {
        if (window.Lampa) {
            callback();
        } else {
            setTimeout(() => waitForLampa(callback), 100);
        }
    }

    waitForLampa(function() {
        const Lampa = window.Lampa;

        // Конфігурація API YummyAnime
        const API_CONFIG = {
            baseUrl: 'https://api.yani.tv',
            clientId: 'k0v3pydu7v2o4_sf', // <-- ОБОВ'ЯЗКОВО ЗАМІНІТЬ НА СВІЙ ПУБЛІЧНИЙ ТОКЕН (client_id)
            // Отримати публічний токен можна тут: https://yummyani.me/dev/applications
        };

        // Об'єкт для взаємодії з API
        const YummyAPI = {
            // Пошук аніме
            search: async function(query, page = 1) {
                try {
                    const response = await Lampa.Network.fetch(
                        `${API_CONFIG.baseUrl}/anime?filter[search]=${encodeURIComponent(query)}&page[number]=${page}`,
                        {
                            headers: {
                                'X-Application': API_CONFIG.clientId, // Правильний заголовок для публічного токена
                                'Accept': 'application/json'
                            }
                        }
                    );
                    return await response.json();
                } catch (error) {
                    console.error('YummyAPI search error:', error);
                    return { data: [], meta: { total: 0 } };
                }
            },

            // Отримати деталі конкретного аніме
            getAnime: async function(id) {
                try {
                    const response = await Lampa.Network.fetch(
                        `${API_CONFIG.baseUrl}/anime/${id}`,
                        {
                            headers: {
                                'X-Application': API_CONFIG.clientId,
                                'Accept': 'application/json'
                            }
                        }
                    );
                    return await response.json();
                } catch (error) {
                    console.error('YummyAPI getAnime error:', error);
                    return null;
                }
            },

            // Отримати список серій
            getEpisodes: async function(animeId, page = 1) {
                try {
                    const response = await Lampa.Network.fetch(
                        `${API_CONFIG.baseUrl}/anime/${animeId}/episodes?page[number]=${page}`,
                        {
                            headers: {
                                'X-Application': API_CONFIG.clientId,
                                'Accept': 'application/json'
                            }
                        }
                    );
                    return await response.json();
                } catch (error) {
                    console.error('YummyAPI getEpisodes error:', error);
                    return { data: [] };
                }
            },

            // (Необов'язково) Отримати інформацію про авторизованого користувача.
            // Тут знадобиться ПРИВАТНИЙ токен користувача, отриманий через OAuth2 / логін.
            // Для цього методу заголовок буде: 'Authorization': 'Bearer ${userPrivateToken}'
            getUserProfile: async function(userPrivateToken) {
                try {
                    const response = await Lampa.Network.fetch(
                        `${API_CONFIG.baseUrl}/profile`,
                        {
                            headers: {
                                'Authorization': `Bearer ${userPrivateToken}`,
                                'Accept': 'application/json'
                            }
                        }
                    );
                    return await response.json();
                } catch (error) {
                    console.error('YummyAPI getUserProfile error:', error);
                    return null;
                }
            }
        };

        // Функція для перетворення відповіді API у формат Lampa
        function transformAnimeToLampa(item) {
            return {
                id: item.id,
                title: item.attributes?.titles?.ru || item.attributes?.titles?.en || 'Без назви',
                original_title: item.attributes?.titles?.en,
                poster: item.attributes?.posterImage?.original || '',
                description: item.attributes?.description || '',
                year: item.attributes?.startDate ? new Date(item.attributes.startDate).getFullYear() : '',
                genres: item.attributes?.genres || [],
                rating: item.attributes?.averageRating || 0,
                // Додаткові поля
                raw: item
            };
        }

        // Головний компонент плагіна
        const YummyComponent = {
            name: 'yummyani',
            title: 'YummyAnime',
            type: 'catalog',
            async getItems(params = {}) {
                const query = params.query || '';
                const page = params.page || 1;

                if (!query) {
                    return { items: [], hasMore: false };
                }

                const result = await YummyAPI.search(query, page);
                const items = (result.data || []).map(transformAnimeToLampa);
                const total = result.meta?.total || 0;
                const hasMore = items.length > 0 && (page * 20) < total;

                return { items, hasMore };
            },

            async getItem(id) {
                const anime = await YummyAPI.getAnime(id);
                if (!anime) return null;
                return transformAnimeToLampa(anime.data);
            },

            async getEpisodes(id, params = {}) {
                const page = params.page || 1;
                const result = await YummyAPI.getEpisodes(id, page);
                const episodes = (result.data || []).map(ep => ({
                    id: ep.id,
                    title: `Серія ${ep.attributes?.number || '?'}`,
                    season: ep.attributes?.seasonNumber || 1,
                    episode: ep.attributes?.number || 1,
                    preview: ep.attributes?.thumbnail?.original || '',
                    // Тут можна додати логіку для отримання посилання на відео
                    url: `https://yummyani.me/anime/${id}/episode/${ep.id}`
                }));

                return episodes;
            },

            // Метод для отримання посилання на відео (опціонально)
            async getStreamUrl(episodeId, animeId) {
                // Реалізація залежить від API. Потрібен додатковий запит до ендпоінту відео.
                return null;
            }
        };

        // Реєструємо компонент в Lampa
        Lampa.Component.add(YummyComponent.name, YummyComponent);

        // Додаємо пункт в головне меню
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                const menu = Lampa.Storage.get('menu', []);
                // Перевіряємо, чи вже є такий пункт
                if (!menu.find(item => item.component === YummyComponent.name)) {
                    menu.push({
                        title: YummyComponent.title,
                        component: YummyComponent.name,
                        icon: 'https://yummyani.me/favicon.ico', // Можна замінити на свою іконку
                        search: true
                    });
                    Lampa.Storage.set('menu', menu);
                }
            }
        });

        console.log('✅ YummyAnime плагін успішно завантажено!');
    });
})();
