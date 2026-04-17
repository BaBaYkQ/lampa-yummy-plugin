(function () {
    if (window.yummy_plugin_loaded) return;
    window.yummy_plugin_loaded = true;

    const API_TOKEN = 'k8deq_gljhple1r3q-ia-b7u-7ee3lbh';
    const API_BASE = 'https://api.yani.tv';

    function startPlugin() {
        console.log('YummyAnime стартував');

        Lampa.Api.sources.yummyanime = {
            title: '🎬 YummyAnime',

            search: function (object, params) {
                const query = object.title || object.original_title;
                const url = `${API_BASE}/anime/search?query=${encodeURIComponent(query)}`;

                Lampa.Network.get(url, function (response) {
                    try {
                        const json = JSON.parse(response);
                        let items = json.response || [];

                        if (!items.length) {
                            params.error();
                            return;
                        }

                        const anime = items[0];

                        params.success([
                            {
                                title: anime.title,
                                id: anime.id
                            }
                        ]);
                    } catch (e) {
                        console.error(e);
                        params.error();
                    }
                }, function () {
                    params.error();
                }, {
                    headers: {
                        'X-Application': API_TOKEN
                    }
                });
            },

            tv: function (item, params) {
                const url = `${API_BASE}/anime/${item.id}?include_videos=true`;

                Lampa.Network.get(url, function (response) {
                    try {
                        const json = JSON.parse(response);
                        let videos = json.response?.videos || [];

                        if (!videos.length) {
                            params.error();
                            return;
                        }

                        const episodes = videos.map(video => ({
                            title: 'Серія ' + video.episode,
                            file: video.stream_url
                        }));

                        params.success({
                            episodes: episodes
                        });

                    } catch (e) {
                        console.error(e);
                        params.error();
                    }
                }, function () {
                    params.error();
                }, {
                    headers: {
                        'X-Application': API_TOKEN
                    }
                });
            }
        };

        Lampa.Api.sources.tmdb.push({
            title: '🎬 YummyAnime',
            source: 'yummyanime'
        });

        console.log('YummyAnime джерело додано');
    }

    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
