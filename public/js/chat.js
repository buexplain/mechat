/**
 * cookie读写
 */
var cookie = {
    /**
     * 设置cookie
     */
    set: function (name,value,hours,path) {
        if(!arguments[2]) hours=1;
        if(!arguments[3]) path='/';
        var exp = new Date();exp.setTime(exp.getTime() + hours*60*60*1000);
        document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString()+";path="+path;
    },

    /**
     * 读取cookie
     */
    get: function (name) {
        var cookie_start = document.cookie.indexOf(name);
        var cookie_end = document.cookie.indexOf(";", cookie_start);
        return cookie_start == -1 ? '' : unescape(document.cookie.substring(cookie_start + name.length + 1, (cookie_end > cookie_start ? cookie_end : document.cookie.length)));
    }
};

/**
 * 聊天构造类
 */
function chat() {
    var _me        = ''; //当前对象的名称
    var _that      = this; //当前对象
    var _main      = null;
    var _textarea  = null;
    var _socket    = null;
    var _nickname  = '';
    var _nicknameK = '__nickname';
    var _smileImg  = [
        '1.jpg',
        '2.png',
        '3.jpg',
        '4.jpg',
        '5.jpg',
        '6.jpg',
        '7.jpg',
        '8.jpg',
        '9.jpg',
        '10.jpg',
        '11.jpg',
        '12.jpg',
        '13.jpg',
        '14.png',
        '15.jpg',
        '16.jpg',
        '17.jpg',
        '18.png',
        '19.jpg',
        '20.jpg',
        '21.jpg',
        '22.jpg',
        '23.jpg',
        '24.jpg'
    ];
    var _smileID   = '';
    var _smileURL  = '';

    /**
     * 弹出javascript输入框
     * @param  isWhile 是否强制获取一个输入
     */
    function _alertInput(isWhile) {
        var text = '';
        if(isWhile) {
            while(text==null || text.length == 0) {
                text = prompt("请输入昵称","");
                if(text != null && (text.length > 7 || text.length < 2)) {
                    alert('请输入长度在2~7个字符内的昵称');
                    text = null;
                }
            }
        }else{
            text = prompt("请输入昵称","");
            if(text != null && (text.length > 7 || text.length < 2)) {
                alert('请输入长度在2~7个字符内的昵称');
                text = null;
            }
        }

        return text;
    }

    /**
     * 将消息插入到消息容器
     */
    function _append(html) {
        var item = document.createElement('div');
        item.setAttribute('class','list-item');

        item.innerHTML = html;

        _main.appendChild(item);

        setTimeout(function() { //延迟滚动滚动条
            _main.scrollTop = _main.scrollHeight - _main.clientHeight;
        },300);
    }

    /**
     * 获取当前时间
     */
    function _getTime() {
        return new Date().toTimeString().substr(0, 8);
    }

    /**
     * 解析消息中的表情地址
     */
    function _parseSmile(s) {
        var reg = /\[.*?\]/g;
        return s.replace(reg, function(tmp) {
            var tmp = tmp.substr(1,tmp.length-2).split('_');

            var img = tmp[1];
            var type = tmp[0];

            var result = '';

            if(type == 'em') {
                result = '<img class="smile" src="'+_smileURL+img+'">';
            }

            return result;
        });
    }

    /**
     * 从剪切板中找到图片项
     */
    function _findImg(clipboardData) {
        var item = null;
        for(var i in clipboardData.items) {
            if(clipboardData.items[i].type && clipboardData.items[i].type.substr(0,5) == 'image') {
                item = clipboardData.items[i];
                break;
            }
        }
        return item;
    }

    /**
     * 从剪切板中读取图片
     */
    function _readerImg (item,callfunc) {
        var blob   = item.getAsFile();
        var reader = new FileReader();

        //设置读取完毕后回调
        reader.onload = function(e){
            callfunc(e.target.result);
        };

        //开始读取文件
        reader.readAsDataURL(blob);
    }

    /**
     * 获取当前对象的名称
     */
    this.myName = function() {
        if(_me.length > 0) return _me;
        for (var name in window) {
            if (window[name] === this) {
                _me = name;
                break;
            }
        }
        return _me;
    };

    /**
     * 获取昵称
     */
    this.getNickname = function() {
        if(_nickname.length == 0) {
            _nickname = cookie.get(_nicknameK);
        }

        if(_nickname.length == 0) {
            this.setNickname(1);
        }

        return _nickname;
    };

    /**
     * 设置昵称
     * @param isWhile 是否强制设置昵称
     */
    this.setNickname = function(isWhile) {
        var tmp = _alertInput(isWhile);
        if(tmp != null) {
            _nickname = tmp;
            cookie.set(_nicknameK,_nickname,24*360);
            if(!isWhile) {
                _socket.emit('rename', {nickname: _nickname});
            }
        }
    };

    /**
     * 创建标签库
     * @param  id  表情库容器id
     * @param  url 表情库url
     */
    this.createSmile = function(id,url) {
        _smileID  = id;
        _smileURL = url;
        var img = '';
        for(var i in _smileImg) {
            img += '<img onclick="'+this.myName()+'.insertSmile(\''+_smileImg[i]+'\')" src="'+_smileURL+_smileImg[i]+'">';
        }
        document.getElementById(_smileID).innerHTML = img;
    };

    /**
     * 插入表情到消息输入框
     */
    this.insertSmile = function(img) {
        _textarea.focus();
        _textarea.value = _textarea.value + '[em_'+img+']';
    };

    /**
     * 显示隐藏表情库
     * @param  act block=显示 none=隐藏 null=自动判断
     */
    this.showSmile = function(act) {
        var s = document.getElementById(_smileID);
        if(act) {
            s.style.display = act;
        }else{
            if(s.style.display == 'none') {
                s.style.display = 'block';
            }else{
                s.style.display = 'none';
            }
        }
    };

    /**
     * 清空消息容器
     */
    this.clearScreen = function() {
        _main.innerHTML = '';
    };

    /**
     * 插入系统消息到消息容器
     * @param  msg  消息
     */
    this.appendSysmsg = function(msg) {
        var html = '';
        html += '<div class="sys">';
        html += '    <span>'+msg+'</span>';
        html += '</div>';
        _append(html);
    };

    /**
     * 插入用户消息到消息容器
     * @param  nickname 昵称
     * @param  msg      消息
     * @param  isSelf   是否为自己的消息
     */
    this.appendUserMsg = function(nickname,msg,isSelf) {
        if(msg.substr(0,'data:image'.length) == 'data:image') {
            msg = '<img onclick="'+this.myName()+'.showImg(this)" src="'+msg+'">';
        }else{
            msg = _parseSmile(msg);
        }

        var html = '';
        html += '<div class="user-info">';
        html += '    <span class="nickname">'+nickname+'</span>';
        html += '    <span class="sendtime">'+_getTime()+'</span>';
        html += '</div>';
        html += '<div class="msg-body '+(isSelf ? 'self' : 'other')+'">';
        html += '    <i class="triangle-1"></i>';
        html += '    <i class="triangle-2"></i>';
        html += '    <span>'+msg+'</span>';
        html += '</div>';

        _append(html);
    };

    /**
     * 发送消息
     */
    this.send = function() {
        _textarea.focus();
        var val = _textarea.value;
        _textarea.value = '';
        if(val.length>0) {
            this.appendUserMsg(this.getNickname(),val,1);
            _socket.emit('message',{msg:val});
            this.showSmile('none');
        }
    };

    /**
     * 快捷键发送消息
     */
    this.shortcutSendMsg = function (event) {
        if(event.ctrlKey&&event.keyCode==13) {
            this.send();
        }
    };

    /**
     * 发送截图
     */
    this.sendImg = function(e) {
        var clipboardData = e.clipboardData;

        if(clipboardData) {

            var item  = _findImg(clipboardData);

            if(item) {
                _readerImg(item,function(result) {
                    _textarea.value = result;
                    _that.send();
                });
            }
        }
    };

    /**
     * 新开窗口显示截图
     */
    this.showImg = function(o) {
        window.open(o.src);
    };

    /**
     * 提示截图帮助
     */
    this.scissors = function() {
        alert("截图使用步骤：\n1、利用qq的快捷键 ctrl + alt + a 进行截图\n2、ctrl + v 粘贴到输入框，发送");
    };

    /**
     * 初始化
     * @param  url 连接地址
     */
    this.init = function(url) {
        /**
         * 消息容器
         */
        _main = document.getElementById('main');

        /**
         * 消息输入框
         */
        _textarea = document.getElementById("new-msg");

        //创建表情
        this.createSmile('smile-img','/img/smile/');

        /**
         * 监听粘贴事件
         */
        _textarea.addEventListener('paste', _that.sendImg);

        /**
         * 连接服务器
         */
        _socket = url ? io.connect(url) : io.connect();

        /**
         * 响应注册
         */
        _socket.on('connect',function(json) {
            //注册用户名
            _socket.emit('signin', {nickname: _that.getNickname()});
        });

        /**
         * 接收新的消息
         */
        _socket.on('message',function(json) {
            _that.appendUserMsg(json.nickname,json.msg);
        });

        /**
         * 接收系统消息
         */
        _socket.on('sysmsg',function(json) {
            _that.appendSysmsg(json.msg);
        });
    };
}