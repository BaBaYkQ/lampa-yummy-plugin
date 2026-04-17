(function () {
    if (window.yummy_safe_loaded) return;
    window.yummy_safe_loaded = true;

    const API = 'https://api.yani.tv';
    const TOKEN = 'k8deq_gljhple1r3q-ia-b7u-7ee3lbh';

    function api(url, ok, fail) {
        try {
            Lampa.Network.get(url, ok, fail, {
                headers: { 'X-Application': TOKEN }
            });
        } catch (e) {
            console.error('Network error', e);
        }
    }

    function start() {

        console.log('Yummy SAFE start');

        // ======================
        // SAFE MENU (без крашу)
        // ======================
        Lampa.Listener.follow('menu', function (e) {

            try {
                if (e.type === 'ready') {

                    const menu = document.querySelector('.menu__list');

                    if (!menu) return;

                    menu.insertAdjacentHTML('beforeend', `
                        <li class="menu__item selector" data-action="yummy_open">
                            <div class="menu__ico">🍥</div>
                            <div class="menu__text">YummyAnime</div>
                        </li>
                    `);
                }

                if (e.type === 'select' && e.action === 'yummy_open') {

                    Lampa.Activity.push({
                        title: 'YummyAnime',
                        component: 'yummy_main'
                    });
                }

            } catch (e) {
                console.error('Menu error', e);
            }
        });

        // ======================
        // SAFE MAIN
        // ======================
        Lampa.Component.add('yummy_main', {
            create: function () {
                const a = this.activity;

                a.loader(true);

                api(`${API}/anime?limit=30`, (r) => {
                    try {
                        const j = JSON.parse(r);
                        const items = j.response || [];

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

        // ======================
        // SAFE CARD (без player поки)
        // ======================
        Lampa.Component.add('yummy_card', {
            create: function (object) {
                const a = this.activity;

                a.loader(true);

                api(`${API}/anime/${object.id}?include_videos=true`, (r) => {
                    try {
                        const j = JSON.parse(r);
                        const anime = j.response;
                        const vids = anime.videos || [];

                        const episodes = vids.map(v => ({
                            title: 'Серія ' + v.episode,
                            file: v.stream_url
                        }));

                        a.loader(false);

                        // просто список (без крашів плеєра)
                        a.push(episodes);

                        a.onSelect = function (item) {
                            Lampa.Player.play({
                                title: anime.title,
                                playlist: episodes
                            });
                        };

                    } catch (e) {
                        console.error(e);
                        a.loader(false);
                    }
                }, () => a.loader(false));
            }
        });

        Lampa.Noty.show('Yummy SAFE loaded');
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', e => {
        if (e.type === 'ready') start();
    });

})();
