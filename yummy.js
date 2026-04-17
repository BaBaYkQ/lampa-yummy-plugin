(function () {
    if (window.yummy_plugin_loaded) return;
    window.yummy_plugin_loaded = true;

    function start() {

        // ===== ГОЛОВНА СТОРІНКА =====
        Lampa.Component.add('yummy_main', {
            create: function () {
                const activity = this.activity;
                activity.loader(true);

                Lampa.Network.get(
                    'https://api.yani.tv/anime?limit=30',
                    (resp) => {
                        try {
                            const json = JSON.parse(resp);
                            const items = json.response || [];

                            activity.loader(false);

                            activity.push(items.map(i => ({
                                title: i.title,
                                poster: i.poster_url,
                                id: i.id,
                                component: 'yummy_card'
                            })));

                        } catch (e) {
                            console.error(e);
                            activity.loader(false);
                        }
                    },
                    () => activity.loader(false)
                );
            }
        });

        // ===== КАРТКА АІМЕ =====
        Lampa.Component.add('yummy_card', {
            create: function (object) {
                const activity = this.activity;
                activity.loader(true);

                Lampa.Network.get(
                    `https://api.yani.tv/anime/${object.id}?include_videos=true`,
                    (resp) => {
                        try {
                            const json = JSON.parse(resp);
                            const anime = json.response;
                            const videos = anime.videos || [];

                            const playlist = videos.map(v => ({
                                title: 'Серія ' + v.episode,
                                file: v.stream_url
                            }));

                            activity.loader(false);

                            Lampa.Player.play({
                                title: anime.title,
                                playlist: playlist
                            });

                        } catch (e) {
                            console.error(e);
                            activity.loader(false);
                        }
                    },
                    () => activity.loader(false)
                );
            }
        });

        // ===== МЕНЮ (100% РОБОЧЕ В 1.12.4) =====
        Lampa.Listener.follow('menu', function (e) {

            if (e.type === 'ready') {

                const html = `
                    <li class="menu__item selector" data-action="yummy_open">
                        <div class="menu__ico">🎬</div>
                        <div class="menu__text">YummyAnime</div>
                    </li>
                `;

                $('.menu__list').append(html);
            }

            if (e.type === 'select' && e.action === 'yummy_open') {

                Lampa.Activity.push({
                    title: 'YummyAnime',
                    component: 'yummy_main'
                });
            }
        });

        Lampa.Noty.show('YummyAnime встановлено');
        console.log('Yummy plugin loaded');
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', e => {
            if (e.type === 'ready') start();
        });
    }
})();
