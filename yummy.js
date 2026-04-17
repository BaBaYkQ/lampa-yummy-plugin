(function () {
    if (window.yummy_full_loaded) return;
    window.yummy_full_loaded = true;

    const API_TOKEN = 'k8deq_gljhple1r3q-ia-b7u-7ee3lbh';
    const API_BASE = 'https://api.yani.tv';

    function api(url, success, error) {
        Lampa.Network.get(url, success, error, {
            headers: {
                'X-Application': API_TOKEN
            }
        });
    }

    function YummyMain() {
        this.create = function () {
            this.activity.loader(true);

            api(`${API_BASE}/anime?limit=40`, (resp) => {
                try {
                    const json = JSON.parse(resp);
                    const items = json.response || [];

                    const cards = items.map(item => ({
                        title: item.title,
                        poster: item.poster_url,
                        description: item.description,
                        id: item.id,
                        component: 'yummy_card'
                    }));

                    this.activity.loader(false);
                    this.activity.push(cards);

                } catch (e) {
                    console.error(e);
                    this.activity.loader(false);
                }
            }, () => this.activity.loader(false));
        };
    }

    function YummyCard(object) {
        this.create = function () {
            this.activity.loader(true);

            api(`${API_BASE}/anime/${object.id}?include_videos=true`, (resp) => {
                try {
                    const json = JSON.parse(resp);
                    const anime = json.response;
                    const videos = anime.videos || [];

                    const episodes = videos.map(ep => ({
                        title: 'Серія ' + ep.episode,
                        file: ep.stream_url
                    }));

                    this.activity.loader(false);

                    Lampa.Player.play({
                        title: anime.title,
                        playlist: episodes
                    });

                } catch (e) {
                    console.error(e);
                    this.activity.loader(false);
                }
            }, () => this.activity.loader(false));
        };
    }

    function addMenuButton() {
        Lampa.Template.add('yummy_menu_btn', `
            <li class="menu__item selector" data-action="yummyanime">
                <div class="menu__ico">🎬</div>
                <div class="menu__text">YummyAnime</div>
            </li>
        `);

        Lampa.Listener.follow('menu', function (e) {
            if (e.type === 'ready') {
                $('.menu .menu__list').append(
                    Lampa.Template.get('yummy_menu_btn')
                );
            }

            if (e.type === 'select' && e.action === 'yummyanime') {
                Lampa.Activity.push({
                    title: 'YummyAnime',
                    component: 'yummy_main'
                });
            }
        });
    }

    function start() {
        Lampa.Component.add('yummy_main', YummyMain);
        Lampa.Component.add('yummy_card', YummyCard);

        addMenuButton();

        console.log('YummyAnime FULL plugin loaded');
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
