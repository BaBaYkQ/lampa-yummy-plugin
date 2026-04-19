(function() {
    'use strict';

    function waitForLampa(callback) {
        if (window.Lampa) callback();
        else setTimeout(() => waitForLampa(callback), 100);
    }

    waitForLampa(function() {
        const Lampa = window.Lampa;
        const API_CONFIG = {
            baseUrl: 'https://api.yani.tv',
            clientId: 'k0v3pydu7v2o4_sf' // ваш токен
        };

        const YummyAPI = {
            search: async (query, page = 1) => {
                const url = `${API_CONFIG.baseUrl}/anime?filter[search]=${encodeURIComponent(query)}&page[number]=${page}`;
                const res = await fetch(url, { headers: { 'X-Application': API_CONFIG.clientId } });
                return res.json();
            },
            getAnime: async (id) => {
                const res = await fetch(`${API_CONFIG.baseUrl}/anime/${id}`, { headers: { 'X-Application': API_CONFIG.clientId } });
                return res.json();
            },
            getEpisodes: async (animeId, page = 1) => {
                const res = await fetch(`${API_CONFIG.baseUrl}/anime/${animeId}/episodes?page[number]=${page}`, { headers: { 'X-Application': API_CONFIG.clientId } });
                return res.json();
            }
        };

        function transform(item) {
            return {
                id: item.id,
                title: item.attributes?.titles?.ru || item.attributes?.titles?.en || 'Без назви',
                poster: item.attributes?.posterImage?.original || '',
                description: item.attributes?.description || '',
                year: item.attributes?.startDate ? new Date(item.attributes.startDate).getFullYear() : '',
                raw: item
            };
        }

        const YummyComponent = {
            name: 'yummyani',
            title: 'YummyAnime',
            type: 'catalog',
            async getItems(params = {}) {
                const query = params.query || '';
                if (!query) return { items: [], hasMore: false };
                const result = await YummyAPI.search(query, params.page || 1);
                return {
                    items: (result.data || []).map(transform),
                    hasMore: result.data?.length === 20
                };
            },
            async getItem(id) {
                const anime = await YummyAPI.getAnime(id);
                return anime ? transform(anime.data) : null;
            },
            async getEpisodes(id) {
                const result = await YummyAPI.getEpisodes(id);
                return (result.data || []).map(ep => ({
                    id: ep.id,
                    title: `Серія ${ep.attributes?.number}`,
                    season: ep.attributes?.seasonNumber || 1,
                    episode: ep.attributes?.number || 1,
                    url: `https://yummyani.me/anime/${id}/episode/${ep.id}`
                }));
            }
        };

        Lampa.Component.add(YummyComponent.name, YummyComponent);

        // Додаємо пункт меню з невеликою затримкою
        setTimeout(() => {
            const menu = Lampa.Storage.get('menu', []);
            if (!menu.find(item => item.component === YummyComponent.name)) {
                menu.push({
                    title: YummyComponent.title,
                    component: YummyComponent.name,
                    icon: 'https://yummyani.me/favicon.ico',
                    search: true
                });
                Lampa.Storage.set('menu', menu);
                alert('Плагін YummyAnime додано в меню!');
            }
        }, 2000);

        console.log('✅ YummyAnime плагін готовий');
    });
})();
