(function() {
    "use strict";

    // ========== НАЛАШТУВАННЯ ==========
    const YUMMY_API_BASE = 'https://api.yani.tv';
    const YUMMY_PUBLIC_TOKEN = 'k8deq_gljhple1r3q-ia-b7u-ee3lbh';
    const YUMMY_APP_HEADER = { 'X-Application': YUMMY_PUBLIC_TOKEN };
    const YUMMY_LANG = 'uk';

    // Унікальний ID користувача для статистики (не обов'язково)
    var unic_id = Lampa.Storage.get('lampac_unic_id', '');
    if (!unic_id) {
        unic_id = Lampa.Utils.uid(8).toLowerCase();
        Lampa.Storage.set('lampac_unic_id', unic_id);
    }

    // Додавання заголовків для запитів
    function addHeaders() {
        return {
            'X-Application': YUMMY_PUBLIC_TOKEN,
            'Accept': 'application/json',
            'Lang': YUMMY_LANG
        };
    }

    // Форматування номера епізоду (01, 02...)
    function formatEpisodeNumber(ep) {
        return (ep < 10 ? '0' : '') + ep;
    }

    // ========== ШАБЛОНИ ==========
    function resetTemplates() {
        // CSS-стилі
        if (!$('#yummyanime-styles').length) {
            $('body').append(`
                <style id="yummyanime-styles">
                    .yummyanime-button svg { width: 1.8em; height: 1.8em; margin-right: 0.5em; }
                    .yummyanime-empty { text-align: center; padding: 2em; color: #aaa; }
                    .yummyanime-item { display: flex; padding: 1em; background: rgba(0,0,0,0.3); border-radius: 0.5em; margin-bottom: 0.8em; }
                    .yummyanime-item img { width: 7em; height: 10em; object-fit: cover; border-radius: 0.3em; margin-right: 1em; }
                    .yummyanime-item-info { flex: 1; }
                    .yummyanime-item-title { font-size: 1.4em; font-weight: bold; margin-bottom: 0.3em; }
                    .yummyanime-item-desc { font-size: 0.9em; color: #ccc; }
                </style>
            `);
        }

        // Шаблон картки аніме в результатах пошуку
        Lampa.Template.add('yummyanime_item', `
            <div class="yummyanime-item selector">
                <img src="{poster}" onerror="this.src='./img/img_broken.svg'"/>
                <div class="yummyanime-item-info">
                    <div class="yummyanime-item-title">{title}</div>
                    <div class="yummyanime-item-desc">{year} ● {episodes} серій</div>
                </div>
            </div>
        `);

        // Шаблон порожнього результату
        Lampa.Template.add('yummyanime_empty', `
            <div class="yummyanime-empty">
                <h2>Нічого не знайдено</h2>
                <p>Спробуйте змінити пошуковий запит</p>
            </div>
        `);
    }

    // ========== КОМПОНЕНТ ПЕРЕГЛЯДУ ==========
    function Component(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var files = new Lampa.Explorer(object);
        var filter = new Lampa.Filter(object);

        var _this = this;

        this.initialize = function() {
            this.loading(true);

            // Налаштування фільтра (джерело тільки одне - YummyAnime)
            filter.set('sort', [{ title: 'YummyAnime', source: 'yummyanime', selected: true }]);
            filter.render().find('.filter--sort span').text('Джерело');
            filter.render().find('.filter--search').remove(); // Прибираємо поле пошуку з фільтра, бо пошук буде окремо

            scroll.body().addClass('list-torrent');
            files.appendFiles(scroll.render());
            files.appendHead(filter.render());
            scroll.minus(files.render().find('.explorer__files-head'));

            Lampa.Controller.enable('content');
            this.loading(false);

            // Почати пошук
            this.search();
        };

        this.search = function() {
            var query = object.search || object.movie.title;
            var url = YUMMY_API_BASE + '/search?q=' + encodeURIComponent(query);
            this.request(url);
        };

        this.request = function(url) {
            var _this = this;
            network.silent(url, function(data) {
                _this.parse(data);
            }, function() {
                _this.empty();
            }, false, { dataType: 'json', headers: addHeaders() });
        };

        this.parse = function(data) {
            this.activity.loader(false);
            scroll.clear();

            if (data && data.data && data.data.length > 0) {
                var items = data.data;
                items.forEach(function(anime) {
                    var html = $(Lampa.Template.get('yummyanime_item', {
                        title: anime.title,
                        year: anime.year || '—',
                        episodes: anime.episodes_count || '?',
                        poster: anime.poster || ''
                    }));

                    html.on('hover:enter', function() {
                        // При виборі аніме показуємо інформацію (поки що просто alert, бо потрібен окремий компонент для серій)
                        Lampa.Noty.show('Вибрано: ' + anime.title);
                        // Тут можна відкрити детальну сторінку з серіями
                    });

                    scroll.append(html);
                });
            } else {
                scroll.append(Lampa.Template.get('yummyanime_empty'));
            }

            Lampa.Controller.collectionSet(scroll.render());
        };

        this.empty = function() {
            scroll.clear();
            scroll.append(Lampa.Template.get('yummyanime_empty'));
            this.loading(false);
        };

        this.loading = function(status) {
            if (status) this.activity.loader(true);
            else {
                this.activity.loader(false);
                this.activity.toggle();
            }
        };

        this.start = function() {
            if (!this.initialized) {
                this.initialized = true;
                this.initialize();
            }
            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render(), files.render());
                },
                up: function() { Navigator.move('up'); },
                down: function() { Navigator.move('down'); },
                right: function() { Navigator.move('right'); },
                left: function() { Navigator.move('left'); },
                back: function() { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function() {
            return files.render();
        };

        this.destroy = function() {
            network.clear();
            files.destroy();
            scroll.destroy();
        };
    }

    // ========== ДОДАВАННЯ КНОПКИ НА КАРТКУ ==========
    function addButtonToMovieCard(card) {
        var render = card.activity.render();
        if (render.find('.yummyanime--button').length) return; // Кнопка вже є

        // SVG-іконка (проста іконка "play")
        var svgIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

        var btn = $('<div class="selector full-launch__button view--online yummyanime--button">' +
                    svgIcon +
                    '<span>Онлайн (Yummy)</span></div>');

        btn.on('hover:enter', function() {
            resetTemplates();
            Lampa.Component.add('yummyanime', Component);

            var movie = card.movie || card.data.movie;
            Lampa.Activity.push({
                url: '',
                title: 'YummyAnime',
                component: 'yummyanime',
                search: movie.title,
                movie: movie,
                page: 1
            });
        });

        render.find('.view--torrent').after(btn);
    }

    // ========== ІНІЦІАЛІЗАЦІЯ ПЛАГІНА ==========
    function initPlugin() {
        if (window.yummyanime_plugin_loaded) return;
        window.yummyanime_plugin_loaded = true;

        // Локалізація
        Lampa.Lang.add({
            yummyanime_button: { uk: 'Онлайн (Yummy)' }
        });

        // Додаємо кнопку при завантаженні картки
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complited') {
                addButtonToMovieCard(e.object);
            }
        });

        // Якщо картка вже відкрита (наприклад, після перезавантаження)
        try {
            var active = Lampa.Activity.active();
            if (active && active.component === 'full') {
                addButtonToMovieCard(active);
            }
        } catch (e) {}

        // Реєстрація плагіна в меню "Розширення"
        Lampa.Manifest.plugins = {
            type: 'video',
            version: '1.0.0',
            name: 'YummyAnime',
            description: 'Пошук та перегляд аніме через YummyAnime API',
            component: 'yummyanime',
            onContextMenu: function() {
                return { name: 'YummyAnime', description: 'Відкрити пошук' };
            },
            onContextLauch: function(obj) {
                resetTemplates();
                Lampa.Component.add('yummyanime', Component);
                Lampa.Activity.push({
                    url: '',
                    title: 'YummyAnime',
                    component: 'yummyanime',
                    search: obj.title,
                    movie: obj,
                    page: 1
                });
            }
        };
    }

    // Запуск
    if (!window.yummyanime_plugin_loaded) {
        initPlugin();
    }
})();
