(function () {
    if (window.yummy_ultra_loaded) return;
    window.yummy_ultra_loaded = true;

    const API = 'https://api.yani.tv';
    const TOKEN = 'k8deq_gljhple1r3q-ia-b7u-7ee3lbh';

    function api(url, ok, fail) {
        Lampa.Network.get(url, ok, fail, {
            headers: { 'X-Application': TOKEN }
        });
    }

    // =========================
    // SOURCE (як Kodik)
    // =========================
    Lampa.Api.sources.yummy = {
        title: 'YummyAnime ULTRA',

        search: function (object, params) {
            const q = object.title || '';

            api(`${API}/anime/search?query=${encodeURIComponent(q)}`, (r) => {
                try {
                    const j = JSON.parse(r);
                    const items = j.response || [];

                    if (!items.length) return params.error();

                    params.success(items.map(i => ({
                        title: i.title,
                        id: i.id,
                        poster: i.poster_url
                    })));

                } catch (e) {
                    console.error(e);
                    params.error();
                }
            }, params.error);
        },

        tv: function (item, params) {
            api(`${API}/anime/${item.id}?include_videos=true`, (r) => {
                try {
                    const j = JSON.parse(r);
                    const anime = j.response;
                    const vids = anime.videos || [];

                    const episodes = vids.map(v => {
                        let file = v.stream_url;

                        if (v.qualities?.length) {
                            file = v.qualities[0].url;
                        }

                        return {
                            title: 'Серія ' + v.episode,
                            file: file,
                            episode: v.episode
                        };
                    });

                    params.success({
                        title: anime.title,
                        episodes: episodes
                    });

                } catch (e) {
                    console.error(e);
                    params.error();
                }
            }, params.error);
        }
    };

    Lampa.Api.sources.tmdb.push({
        title: 'YummyAnime ULTRA',
        source: 'yummy'
    });

    // =========================
    // UI
    // =========================
    function start() {

        // кеш (швидкість)
        const cache = {};

        // головна
        Lampa.Component.add('yummy_main', {
            create: function () {
                const a = this.activity;

                a.loader(true);

                if (cache.list) {
                    a.loader(false);
                    a.push(cache.list);
                    return;
                }

                api(`${API}/anime?limit=40`, (r) => {
                    try {
                        const j = JSON.parse(r);
                        const items = j.response || [];

                        cache.list = items;

                        a.loader(false);

                        a.push(items.map(i => ({
                            title: i.title,
                            poster: i.poster_url,
                            id: i.id,
                            component: 'yummy_card'
                        })));

                    } catch (e) {
                        console.error(e);
                        a.loader(false);
                    }
                }, () => a.loader(false));
            }
        });

        // картка (серії вручну, не автоплеєр)
        Lampa.Component.add('yummy_card', {
            create: function (object) {
                const a = this.activity;
                a.loader(true);

                api(`${API}/anime/${object.id}?include_videos=true`, (r) => {
                    try {
                        const j = JSON.parse(r);
                        const anime = j.response;
                        const vids = anime.videos || [];

                        const last = Lampa.Storage.get('yummy_last_ep_' + object.id);

                        const episodes = vids.map(v => {

                            let file = v.stream_url;

                            if (v.qualities?.length) {
                                file = v.qualities[0].url;
                            }

                            return {
                                title: (v.episode == last ? '▶ ' : '') + 'Серія ' + v.episode,
                                file: file,
                                episode: v.episode
                            };
                        });

                        a.loader(false);

                        // список серій
                        a.push(episodes);

                        // клік по серії
                        a.onSelect = function (item) {

                            Lampa.Storage.set('yummy_last_ep_' + object.id, item.episode);

                            Lampa.Player.play({
                                title: anime.title,
                                playlist: episodes,
                                start: item.episode
                            });
                        };

                    } catch (e) {
                        console.error(e);
                        a.loader(false);
                    }
                }, () => a.loader(false));
            }
        });

        // меню
        Lampa.Listener.follow('menu', function (e) {
            if (e.type === 'ready') {

                $('.menu__list').append(`
                    <li class="menu__item selector" data-action="yummy_open">
                        <div class="menu__ico">🍥</div>
                        <div class="menu__text">Yummy ULTRA</div>
                    </li>
                `);
            }

            if (e.type === 'select' && e.action === 'yummy_open') {
                Lampa.Activity.push({
                    title: 'Yummy ULTRA',
                    component: 'yummy_main'
                });
            }
        });

        Lampa.Noty.show('Yummy ULTRA активовано');
        console.log('Yummy ULTRA loaded');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', e => {
        if (e.type === 'ready') start();
    });

})();
