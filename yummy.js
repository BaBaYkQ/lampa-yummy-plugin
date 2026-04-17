Lampa.Api.sources.yummy = {
    title: 'YummyAnime',

    search: function (object, params) {
        const q = object.title || '';

        Lampa.Network.get(
            'https://api.yani.tv/anime/search?query=' + encodeURIComponent(q),

            function (r) {
                try {
                    const j = JSON.parse(r);
                    const items = j.response || [];

                    params.success(items.map(i => ({
                        title: i.title,
                        id: i.id
                    })));

                } catch (e) {
                    params.error();
                }
            },

            params.error
        );
    },

    // 🔥 ОЦЕ ГОЛОВНЕ — НЕ PLAYER, А MEDIA SOURCE
    tv: function (item, params) {

        Lampa.Network.get(
            `https://api.yani.tv/anime/${item.id}?include_videos=true`,

            function (r) {
                try {
                    const j = JSON.parse(r);
                    const anime = j.response;
                    const vids = anime.videos || [];

                    const episodes = vids.map(v => ({
                        title: 'Серія ' + v.episode,
                        file: v.stream_url
                    }));

                    // 🔥 ВАЖЛИВО: НЕ Lampa.Player.play()
                    params.success({
                        title: anime.title,
                        episodes: episodes
                    });

                } catch (e) {
                    params.error();
                }
            },

            params.error
        );
    }
};
