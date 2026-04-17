(function() {
    "use strict";

    // --- НАЛАШТУВАННЯ ПЛАГІНА ---
    const YUMMY_API_BASE = 'https://api.yani.tv';
    const YUMMY_PUBLIC_TOKEN = 'k8deq_gljhple1r3q-ia-b7u-ee3lbh';
    const YUMMY_APP_HEADER = { 'X-Application': YUMMY_PUBLIC_TOKEN };
    const YUMMY_LANG = 'uk';

    var unic_id = Lampa.Storage.get('lampac_unic_id', '');
    if (!unic_id) {
        unic_id = Lampa.Utils.uid(8).toLowerCase();
        Lampa.Storage.set('lampac_unic_id', unic_id);
    }

    function addHeaders() {
        return {
            'X-Application': YUMMY_PUBLIC_TOKEN,
            'Accept': 'application/json, image/avif, image/webp',
            'Lang': YUMMY_LANG
        };
    }

    function formatEpisodeNumber(episodeNumber) {
        return (episodeNumber < 10 ? '0' : '') + episodeNumber;
    }

    // --- КОМПОНЕНТ ПЕРЕГЛЯДУ ---
    var Network = Lampa.Reguest;

    function Component(object) {
        var network = new Network();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var files = new Lampa.Explorer(object);
        var filter = new Lampa.Filter(object);
        
        var sources = {};
        var balanser;
        var source;
        var filter_sources = [];
        var filter_find = { season: [], voice: [] };
        
        var _this = this;

        this.initialize = function() {
            this.loading(true);
            
            filter.onSearch = function(value) {
                Lampa.Activity.replace({ search: value, clarification: true, similar: true });
            };
            
            filter.onBack = function() { _this.start(); };
            filter.render().find('.selector').on('hover:enter', function() {});
            filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
            
            filter.onSelect = function(type, a, b) {
                if (type == 'filter') {
                    if (a.reset) {
                        _this.replaceChoice({ season: 0, voice: 0, voice_url: '', voice_name: '' });
                        setTimeout(function() {
                            Lampa.Select.close();
                            Lampa.Activity.replace({ clarification: 0, similar: 0 });
                        }, 10);
                    } else {
                        var url = filter_find[a.stype][b.index].url;
                        var choice = _this.getChoice();
                        if (a.stype == 'voice') {
                            choice.voice_name = filter_find.voice[b.index].title;
                            choice.voice_url = url;
                        }
                        choice[a.type] = b.index;
                        _this.saveChoice(choice);
                        _this.reset();
                        _this.request(url);
                        setTimeout(Lampa.Select.close, 10);
                    }
                } else if (type == 'sort') {
                    Lampa.Select.close();
                    object.lampac_custom_select = a.source;
                    _this.changeBalanser(source);
                }
            };
            
            if (filter.addButtonOnBackBar) filter.addButtonOnBackBar();
            filter.render().find('.filter--sort span').text(Lampa.Lang.translate('lampac_balanser'));
            
            scroll.body().addClass('list-torrent');
            files.appendFiles(scroll.render());
            files.appendHead(filter.render());
            scroll.minus(files.render().find('.explorer__files-head'));
            scroll.body().append(Lampa.Template.get('lampac_content_loading'));
            
            Lampa.Controller.enable('content');
            this.loading(false);

            // Якщо плагін викликано безпосередньо з посиланням
            if (object.url) {
                network.native(object.url, this.parse.bind(this), function() {
                    files.render().find('.torrent-filter').remove();
                    _this.empty();
                }, false, { dataType: 'text', headers: addHeaders() });
                return;
            }

            this.externalids().then(function() {
                return _this.createSource();
            }).then(function(json) {
                _this.search();
            }).catch(function(e) {
                _this.noConnectToServer(e);
            });
        };

        this.externalids = function() {
            return new Promise(function(resolve) {
                // YummyAnime шукає за назвою, тому зовнішні ID не обов'язкові, 
                // але залишимо для сумісності з кодом-основою
                resolve();
            });
        };

        this.createSource = function() {
            var _this = this;
            return new Promise(function(resolve) {
                // В YummyAnime одне джерело - сам YummyAnime
                sources['yummyanime'] = { name: 'YummyAnime', show: true };
                filter_sources = ['yummyanime'];
                balanser = 'yummyanime';
                Lampa.Storage.set('active_balanser', balanser);
                resolve();
            });
        };

        this.search = function() {
            this.filter({ source: filter_sources }, this.getChoice());
            this.find();
        };

        this.find = function() {
            var url = YUMMY_API_BASE + '/search?q=' + encodeURIComponent(object.search);
            this.request(url);
        };

        this.request = function(url) {
            var _this = this;
            network.native(url, function(str) {
                _this.parse(str);
            }, function() {
                _this.doesNotAnswer();
            }, false, { dataType: 'json', headers: addHeaders() });
        };

        this.parse = function(data) {
            this.activity.loader(false);
            
            // Обробка відповіді від YummyAnime API
            if (data && data.data && data.data.length > 0) {
                var items = data.data;
                var videos = items.filter(function(v) {
                    return v.videos && v.videos.length > 0;
                });

                if (videos.length > 0) {
                    this.display(videos);
                } else {
                    this.similars(items);
                }
            } else {
                this.empty();
            }
        };

        this.display = function(animeList) {
            var _this = this;
            var anime = animeList[0]; // Беремо перше знайдене аніме
            
            // Тут має бути логіка отримання посилань на серії.
            // Спрощена версія: просто показуємо знайдене аніме.
            var videos = [{
                title: anime.title,
                url: YUMMY_API_BASE + '/anime/' + anime.slug,
                method: 'play',
                qualitys: 'HD'
            }];

            this.draw(videos, {
                onEnter: function(item, html) {
                    _this.getFileUrl(item, function(json) {
                        if (json && json.url) {
                            var playlist = [];
                            var first = _this.toPlayElement(item);
                            first.url = json.url;
                            playlist.push(first);
                            if (first.url) {
                                Lampa.Player.play(first);
                                Lampa.Player.playlist(playlist);
                            }
                        }
                    }, true);
                }
            });
        };

        this.getFileUrl = function(file, call) {
            var _this = this;
            Lampa.Loading.start(function() {
                Lampa.Loading.stop();
                Lampa.Controller.toggle('content');
                network.clear();
            });
            
            // Тут має бути виклик до YummyAnime API для отримання прямого посилання на відео.
            // Поки що використовуємо спрощений варіант.
            call({ url: file.url, headers: addHeaders() });
        };

        this.toPlayElement = function(file) {
            return {
                title: file.title,
                url: file.url,
                quality: file.qualitys,
                voice_name: file.voice_name
            };
        };

        this.filter = function(filter_items, choice) {
            filter.set('sort', filter_sources.map(function(e) {
                return { title: sources[e].name, source: e, selected: e == balanser };
            }));
        };

        this.getChoice = function() {
            return { season: 0, voice: 0 };
        };

        this.saveChoice = function(choice) {};

        this.replaceChoice = function(choice) {};

        this.reset = function() {
            scroll.clear();
            scroll.body().append(Lampa.Template.get('lampac_content_loading'));
        };

        this.loading = function(status) {
            if (status) this.activity.loader(true);
            else {
                this.activity.loader(false);
                this.activity.toggle();
            }
        };

        this.draw = function(items, params) {
            scroll.clear();
            var _this = this;
            items.forEach(function(item) {
                var html = Lampa.Template.get('lampac_prestige_full', item);
                html.on('hover:enter', function() {
                    if (params.onEnter) params.onEnter(item, html);
                });
                scroll.append(html);
            });
            Lampa.Controller.enable('content');
        };

        this.empty = function() {
            scroll.clear();
            scroll.append('<div class="online-empty"><div class="online-empty__title">Нічого не знайдено</div></div>');
            this.loading(false);
        };

        this.noConnectToServer = function() {
            this.empty();
        };

        this.doesNotAnswer = function() {
            this.empty();
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
                back: this.back.bind(this)
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function() {
            return files.render();
        };

        this.back = function() {
            Lampa.Activity.backward();
        };

        this.destroy = function() {
            network.clear();
            files.destroy();
            scroll.destroy();
        };
    }

    // --- ІНІЦІАЛІЗАЦІЯ ПЛАГІНА ---
    function startPlugin() {
        if (window.yummyanime_plugin) return;
        window.yummyanime_plugin = true;

        // Додаємо локалізацію
        Lampa.Lang.add({
            lampac_watch: { uk: 'Дивитися онлайн' },
            lampac_balanser: { uk: 'Джерело' },
            title_online: { uk: 'Онлайн' },
            lampac_nolink: { uk: 'Не вдалося отримати посилання' }
        });

        // Додаємо кнопку на картку фільму
        Lampa.Listener.follow('full', function(e) {
            if (e.type == 'complited') {
                var btn = $('<div class="selector full-launch__button view--online yummyanime--button">' +
                           '<svg ...><span>#{title_online}</span></div>');
                btn.on('hover:enter', function() {
                    Lampa.Activity.push({
                        url: '',
                        title: Lampa.Lang.translate('title_online'),
                        component: 'yummyanime',
                        search: e.data.movie.title,
                        movie: e.data.movie,
                        page: 1
                    });
                });
                e.object.activity.render().find('.view--torrent').after(btn);
            }
        });

        // Реєструємо компонент
        Lampa.Component.add('yummyanime', Component);
    }

    if (!window.yummyanime_plugin) startPlugin();
})();
