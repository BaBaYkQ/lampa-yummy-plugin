(function () {
    if (window.yummy_plugin_loaded) return;
    window.yummy_plugin_loaded = true;

    function start() {
        Lampa.Component.add('yummy_main', {
            create: function () {
                Lampa.Noty.show('YummyAnime відкрито');
            }
        });

        if (!Lampa.Manifest.plugins) Lampa.Manifest.plugins = [];

        Lampa.Manifest.plugins.push({
            type: 'video',
            name: 'YummyAnime',
            component: 'yummy_main'
        });

        Lampa.Noty.show('YummyAnime plugin додано');
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
