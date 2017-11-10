
var app = (function(app) {
    app.utils = {
        // 获取url中的get参数
        getQueryString: function (name) { 
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
            var url = window.location.search.replace(/&amp;(amp;)?/g,"&");
            var r = url.substr(1).match(reg);
            if (r != null) { 
                return unescape(r[2]); 
            }
            return null;
        },

        //取随机整数 
        getRandom: function(a,b) {
            return Math.round(Math.random()*(b-a)+a);
        },

        // 图片预加载
        loadImages: function(sources, config){  
            var loadData = {
                sources: sources,
                images: sources instanceof Array ? [] : {},
                config: config || {},
                loadedImages: 0,
                totalImages: 0,
                countTotalImages: function() {
                    this.totalImages = 0;
                    for (var src in this.sources) {    
                        this.totalImages += 1;    
                    }
                    return this.totalImages;  
                },
                load: function(src) {
                    this.images[src] = new Image();
                    //当一张图片加载完成时执行    
                    var _this = this;
                    this.images[src].onload = function() {
                        _this.loadedImages += 1;
                        var progress = Math.floor(_this.loadedImages / _this.totalImages * 100);
                        if(_this.config.onProgress) {
                            _this.config.onProgress(progress);
                        }
                        if(_this.loadedImages >= _this.totalImages) {
                            if(_this.config.onComplete) {
                                _this.config.onComplete(_this.images);
                            }
                            if(_this.config instanceof Function) {
                                _this.config(_this.images);
                            }
                        }
                    };  

                    //把sources中的图片信息导入images数组  
                    this.images[src].src = this.sources[src];    
                }
            };  

            loadData.countTotalImages();

            if (!loadData.totalImages) {  
                if(loadData.config.onComplete) {
                    loadData.config.onComplete(loadData.images); 
                }
                if(loadData.config instanceof Function) {
                    loadData.config(loadData.images);
                }
            }else {
                for (var src in loadData.sources) { 
                    loadData.load(src);
                }
            } 
        }
    };
    app.api = {
        weixin: {
            user: {
                openid: "",
                nick: "",
                headUrl: ""
            },
            setConfig: function(callback) {
                $.ajax({
                    url:"http://news.gd.sina.com.cn/market/c/gd/wxjsapi/index.php",
                    data: {
                        url: location.href.split('#')[0]
                    },
                    dataType:"jsonp",
                    success:function(jsondata){
                        wx.config({
                            debug: false,
                            appId: jsondata.data.appId,
                            timestamp: jsondata.data.timestamp,
                            nonceStr: jsondata.data.nonceStr,
                            signature: jsondata.data.signature,
                            jsApiList: [
                                'onMenuShareTimeline', 'onMenuShareAppMessage','onMenuShareQQ'
                            ]
                        });
                        wx.ready(function () {
                            if(callback) {
                                callback();
                            }
                        });
                    }
                });
            },
            setShare: function(options) {
                wx.onMenuShareTimeline({
                    title: options.title, // 分享标题
                    link: options.link||location.href, // 分享链接
                    imgUrl: options.imgUrl, // 分享图标
                    success: function (res) {
                        if(options.callback) {
                            options.callback();
                        }
                    },
                    cancel: function (res) {

                    }
                });
                wx.onMenuShareAppMessage({
                    title: options.title, // 分享标题
                    desc: options.desc, // 分享描述
                    link: options.link||location.href, // 分享链接
                    imgUrl: options.imgUrl, // 分享图标
                    type: '', // 分享类型,music、video或link，不填默认为link
                    dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                    success: function () {
                        if(options.callback) {
                            options.callback();
                        }
                    },
                    cancel: function () {

                    }
                });
                wx.onMenuShareQQ({
                    title: options.title, // 分享标题
                    desc: options.desc, // 分享描述
                    link: options.link||location.href, // 分享链接
                    imgUrl: options.imgUrl, // 分享图标
                    success: function () { 
                        if(options.callback) {
                            options.callback();
                        }
                    },
                    cancel: function () { 
                       // 用户取消分享后执行的回调函数
                    }
                });
                wx.error(function(res){
                    //alert(JSON.stringify(res));
                });
            },
            getOpenid: function(callback) {
                if(app.utils.getQueryString("openid")){
                    this.user.openid = app.utils.getQueryString("openid");
                    localStorage.setItem("wx_openid", this.user.openid);
                } else if (localStorage.getItem("wx_openid") != null) {
                    this.user.openid = localStorage.getItem("wx_openid");
                } else {
                    if(app.utils.getQueryString("oid")){
                        window.location.href='http://interface.gd.sina.com.cn/gdif/gdwx/wxcode?oid='+app.utils.getQueryString("oid");
                    }else {
                        window.location.href='http://interface.gd.sina.com.cn/gdif/gdwx/wxcode';
                    }
                    return;
                }
                if(callback) {
                    callback();
                }
            },
            getUserInfo: function(callback){ //callback(data)
                var _this = this;
                $.ajax({
                    url:'http://interface.gd.sina.com.cn/gdif/gdwx/c_member/',
                    data : { openid : _this.user.openid},
                    type : 'get',
                    dataType : 'jsonp',
                    jsonp:'callback',
                    success: function(data) {
                        console.log(data);
                        if(data.error == 0) {
                            _this.user.nick = data.data.nickname;
                            _this.user.headUrl = data.data.headimgurl;
                            if(callback) {
                                callback();
                            }
                        }
                    },
                    error: function(error) {
                        console.log(error);
                    }
                });
            }
        }
    };
    app.musics = {
        bg: "bgMusic",
        others: [], 
        handler: function() {
            var _this = this;
            var bgMusic = document.getElementById(this.bg);
            var autoplay = true;
            // 控制音乐播放与暂停
            $(bgMusic).parent().on('touchstart', function() {
                autoplay = false;
                var $this = $(this);
                event.stopPropagation();
                if ($this.hasClass("animating")) {
                    $this.removeClass("animating");
                    bgMusic.pause();
                } else {
                    $this.addClass("animating");
                    bgMusic.play();
                }
            });
            $(document).one("touchstart", function() {
                if (_this.bg.paused && autoplay) {
                    _this.bg.play();
                }
                for(var i = 0; i < _this.others.length; i++) {
                    var other = document.getElementById(_this.others[i]);
                    other.play();
                    other.pause();
                }
            });
        }
    };

    app.preload = {
        sources: [
            
        ],
        onProgress: function(progress) {
            console.log(progress);
        },
        onComplete: function() {
            console.log("complete");
        },
        handler: function() {
            app.utils.loadImages(this.sources, {
                onProgress: this.onProgress,
                onComplete: this.onComplete
            });
        }
    };

    return app;
}(app || {}));


// 微信分享
app.api.weixin.setConfig(function() {
    app.api.weixin.setShare({
        // callback: "", //分享成功回调
        link: "", //分享链接
        title: "", //分享标题
        desc: "", //分享描述
        imgUrl: "" //分享图标
    });
});

// 微信身份认证
// app.api.weixin.getOpenid(function() {
//     console.log(app.api.weixin.user.openid);
//     app.api.weixin.getUserInfo(function() {
//         console.log(app.api.weixin.user);
//     });
// });

// 图片预加载
// app.utils.loadImages(['images/1.png'], function() {
//     app.preload.handler();
// });
app.preload.handler();

// 音乐播放处理
// app.musics.handler();

app.merge = function() {
    function Game(config) {
        this.id = config.id;
        this.x = config.x ? config.x : 0;
        this.y = config.y ? config.y : 0;
        this.width = config.width ? config.width : window.innerWidth;
        this.height = config.height ? config.height : window.innerHeight;
        this.showFPS = config.showFPS ? true : false;
        this.sourceData = config.sourceData || "";
        this.model = config.model || "";
        this.controller = config.controller || "";
        this.loadProgress = config.loadProgress || "";
        this.paused = true;
        this.stage = new createjs.Stage(this.id);
        this.stage.canvas.width = this.width;
        this.stage.canvas.height = this.height;
        this.sources = "";
        this.objects = {};
        this.score = 0;
    }
    Game.prototype = {
        constructor: Game,
        preload: function(callback) {
            var _this = this;
            this.sources = new createjs.LoadQueue(false);
            this.sources.addEventListener('progress', function(event) {
                var progress = Math.floor(event.progress*100);
                if(_this.loadProgress) {
                    _this.loadProgress(progress);
                }
            });
            this.sources.addEventListener('error', function(event) {
                console.log(event);
            });
            this.sources.addEventListener('complete', function(event) {
                callback && callback();
            });
            this.sources.loadManifest(this.sourceData);
        },
        init: function(param) {
            var _this = this; 
            if(param) {
                if(param instanceof Function) {
                    var callback = param;
                }else {
                    if(param.model) {
                        this.model = param.model;
                    }
                    if(param.controller) {
                        this.controller = param.controller;
                    }
                    if(param.callback) {
                        var callback = param.callback;
                    }
                }
            }        
            if(!this.sources) {
                this.preload(function(){
                    _this.render();
                    callback && callback();
                });
            }else {
                this.render();
                callback && callback();
            }
            createjs.Touch.enable(this.stage);
        },
        render: function() {
            if(this.model) {
                this.addObjects(this.model);
            }
            if(this.controller) {
                this.controller();
            }
            if(this.showFPS) {
                this.setFPS();
            }
            this.stage.update();
        },
        addObject: function(objectData, parent) {
            var id = objectData.id;
            var type = objectData.type;
            var object = "";
            if(objectData.object){
                object = objectData.object;
            }else if(objectData.spriteData){
                var spriteData = {};
                spriteData.images = [];
                for(var j = 0; j < objectData.spriteData.images.length; j++) {
                    spriteData.images.push(this.sources.getResult(objectData.spriteData.images[j]));
                }
                spriteData.frames = objectData.spriteData.frames;
                spriteData.animations = objectData.spriteData.animations;
       
                var spriteSheet = new createjs.SpriteSheet(spriteData);
                object = new createjs.Sprite(spriteSheet);
            }else if(objectData.shapeData){
                object = new createjs.Shape();
                for(var method in objectData.shapeData) {
                    var param = objectData.shapeData[method]; 
                    var arr = [];
                    if(param instanceof Array) {
                        arr = param;
                    }else {
                        arr.push(param);
                    }
                    object.graphics[method].apply(object.graphics, arr);
                }
            }else if(objectData.textData){
                object = new createjs.Text(objectData.textData.text, objectData.textData.font, objectData.textData.color);
            }else if(objectData.image){
                var image = this.sources.getResult(objectData.image);
                object = new createjs.Bitmap(image);
            }else {
                object = new createjs.Container();
            }
            if(objectData.data) {
                for(var key in objectData.data) {
                    object[key] = objectData.data[key];
                }
            }
            
            object.objectId = id;
            if(type) {
                object.type = type;
            }
            if(parent) {
                parent.addChild(object);
            }else if(objectData.parent || typeof objectData.parent == "undefined") {
                var parent =  this.objects[objectData.parent] || this.stage;
                parent.addChild(object);
            }           
            if(objectData.children) {
                for(var i = 0; i < objectData.children.length; i++) {
                    var child = objectData.children[i];
                    // child.parent = id;
                    this.addObject(child, object);
                }
            }
            if(id) {
                this.objects[id] = object;
            }
            
            return object;
        },  
        addObjects: function(objectDataArr) {
            var objects = [];
            for(var i = 0; i < objectDataArr.length; i++) {
                objects.push(this.addObject(objectDataArr[i]));
            }
            return objects;
        },
        getBounds: function() {
            return {x: this.x, y: this.y, width: this.width, height: this.height}
        },
        start: function() {
            var _this = this;
            this.paused = false;
            createjs.Ticker.timingMode = createjs.Ticker.RAF;
            createjs.Ticker.setFPS(60);
            createjs.Ticker.addEventListener("tick", this._handleTick = function(event) {
                if(!_this.paused) {
                    _this.stage.update();
                }
            });
        },
        pause: function() {
            this.paused = true;
        },
        resume: function() {
            this.paused = false;
        },
        stop: function() {
            this.paused = true;
            createjs.Ticker.removeEventListener("tick", this._handleTick);
        },
        reset: function() {
            this.stage.removeAllChildren();
            this.objects = {};
            this.score = 0;
        },
        restart: function() {
            this.stop();
            this.reset();
            this.init();
            this.start();
        },
        setFPS: function() {
            var _this = this;
            this._fpsText = this.addObject({
                id: "fpsText",
                type: "Text",
                textData: {
                    text: "",
                    font: "Bold 20px Arial",
                    color: "#f00"
                },
                data: {
                    x: 0,
                    y: this.height - 24
                }
            });
            this._fpsText.addEventListener("tick", function() {
                _this._fpsText.text = Math.round(createjs.Ticker.getMeasuredFPS()) + "fps";
            });
        },
        utils: {
            getRandom: function(a,b){
                return Math.floor(Math.random()*(b-a)+a);
            }
        }
    };
    var game = new Game({
        id: 'picture',
        width: 190,
        height: 150
    });
    game.sourceData = [
        {src: "assets/images/main.jpg", id: "bg_sky"}
    ];
    game.model = [{
        id: "bg_sky",
        image: "bg_sky"
    },{
        id: "text",
        textData: {
            text: "hello",
            font: "Bold 20px Arial",
            color: "#f00"
        },
        data: {
            x: 0,
            y: this.height - 24
        }
    }];
    game.preload(function() {
        game.init(function() {
            // console.dir(game.objects);
            // game.utils.consoleLog(game.stage);
            // game.start();
            var src = game.stage.canvas.toDataURL("image/png", 1);
            window.location.href = src;
        });
    });
}
