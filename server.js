var express = require('express');
var app = express();

app.use(express.static('public'));

var server = app.listen(3000, function () {
    console.log('http://localhost:3000/');
});

var io = require('socket.io')(server);

function view(tpl) {
    return __dirname+'/views/'+tpl.replace('.','/')+'.html';
}

app.get('/', function (req, res) {
    res.sendfile(view('index'));
});

/**
 * 页面连接成功回调
 */
io.on('connection', function (socket) {

    //响应客户端的注册
    socket.on('signin', function (json) {

        socket.nickname = json.nickname;

        //广播消息给所有用户
        io.sockets.emit('sysmsg', {
            msg:'欢迎 '+socket.nickname+' 进入！'
        });
    });

    //响应客户端的改名
    socket.on('rename', function (json) {

        var msg = socket.nickname+' 改名为 '+json.nickname+'！';
        socket.nickname = json.nickname;

        //广播消息给所有用户
        io.sockets.emit('sysmsg', {
            msg:msg
        });
    });

    /**
     * 用户离线
     */
    socket.on('disconnect', function() {
        socket.broadcast.emit('sysmsg', {
            msg:socket.nickname+' 已离开！'
        });
    });

    /**
     * 响应客户端发送的消息
     */
    socket.on('message',function(json) {
        socket.broadcast.emit('message', {nickname:socket.nickname,msg:json.msg});
    });

});