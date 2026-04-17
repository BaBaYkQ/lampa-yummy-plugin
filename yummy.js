(function () {
    if (window.yummy_plugin_loaded) return;
    window.yummy_plugin_loaded = true;

    function start() {
        console.log('Yummy menu старт');

        Lampa.Menu.add({
            title: 'YummyAnime',
            icon: '🎬',
            component: 'yummy_main'
        });

        function YummyMain() {
            this.create = function () {
                Lampa.Noty.show('YummyAnime меню працює!');
            };
        }

        Lampa.Component.add('yummy_main', YummyMain);

        Lampa.Noty.show('YummyAnime додано в меню');
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
