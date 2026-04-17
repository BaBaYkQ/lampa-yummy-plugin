(function () {
    if (window.test_plugin_loaded) return;
    window.test_plugin_loaded = true;

    function start() {
        console.log('TEST PLUGIN START');

        Lampa.Noty.show('TEST plugin працює!');
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
