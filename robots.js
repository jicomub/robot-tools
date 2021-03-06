/*
  *** 用法 ****
var robot = require('@/robots/robots.js');

//  
param = { dir, file, arguments  onMessage:(){}, menuOnly}

 
//强制停止机器人
robot.start(param); 
robot.showMenu();
robot.stop();
robot.exec(function(){...});

*/
var ROBOT = {};
(function() {
    // #ifndef APP-PLUS
    return;
    //#endif 
    var robot;
    robot = global.robot = uni.requireNativePlugin('Robot');
    robot.init(plus.runtime.appid, (msg) => {
        console.log("[init] -> " + msg);
        if (msg != 'fail') {
            return; //good
        }
        uni.showModal({
            title: '提示',
            content: 'App认证失败',
        });
    });
    ROBOT = {
        robot: robot,
        isready: false,
        permission: () => {},
        start: () => {},
        stop: () => {},
    };
})();; //
ROBOT.start = function(obj) {
    var that = this;
    console.log(obj.arguments);
    obj.arguments.__vue_keys = keys4back(obj.vue);
    // #ifndef APP-PLUS
    return; //非手机环境
    // #endif
    var _entry = obj.file;
    if (_entry.endsWith('.js')) {
        _entry = _entry.substr(0, _entry.length - 3);
    }
    obj.arguments._entry = _entry;
    var dir = 'static/robots/';
    if (!dir.startsWith('/')) { //非绝对路径，
        dir = plus.io.convertLocalFileSystemURL(dir);
    }
    this.robot.setJsDir(dir);
    this.robot.setJsFile('index.js');
    this.robot.setJsArguments(JSON.stringify(obj.arguments));
    this.robot.setJsCallback(function(data) {
        var rlt = that.vueCallback(data);
        that.robot.setVueValue(rlt);
        return rlt;
    });
    this.robot.startMenu();
    if (obj.startAtMenu == true) {
        var nothing_; //not start
    } else {
        this.robot.start();
    }
    this.params = obj;
    return this;
}
ROBOT.showMenu = function(obj) {
    obj.startAtMenu = true; //只显示菜单，不执行
    obj.arguments.startAtMenu = true;
    this.start(obj);
    uni.showToast({
        icon: 'none',
        title: '请从悬浮机器人处启动',
        duration: 2000
    });
}
ROBOT.exec = function(fun) {
    var code = fun.toString();
    if (typeof(fun) == 'function') {
        code = "(" + code + ")();"
    }
    code += "; var __f__=function(tag, msg, file){ console.log(msg)}";
    console.log(code);
    this.robot.exec(code);
}
ROBOT.permission = function() {
    console.log(" robot.permission: ");
    var b = this.robot.permission();
}
ROBOT.stop = function() {
    // #ifndef APP-PLUS
    return; //非手机环境
    //#endif
    if (this.robot == null) {
        return;
    }
    this.robot.stop();
}
String.prototype.replaceAll = function(s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}
ROBOT.vueCallback = function(data) {
    //console.log(JSON.stringify(data));
    var obj = this.params;
    var js = JSON.parse(data);
    var error = js.error;
    if (error != undefined && error.indexOf('permission') > -1) {
        //---that.permission();
        js.status = "error"
        //data = JSON.stringify(js)
        return;
    }
    if (!js.__prop) {
        if (obj.onMessage != undefined) {
            return obj.onMessage(js);
        }
    }
    if (js.__prop) { //属性访问，函数调用
        if (js.__type == 'function') { //直接调用
            var new_args = [];
            var args = (js.__arguments);
            for (var k in args) {
                new_args.push(args[k]);
            }
            return obj.vue[js.__prop].apply(null, new_args);
        } else if (js.__type == 'set') {
            //console.log(js.__arguments);
            try {
                return obj.vue[js.__prop] = js.__arguments["0"];
            } catch (e) {
                return obj.vue[js.__prop] = js.__arguments
            }
        } else if (js.__type == 'get') {
            return obj.vue[js.__prop];
        }
    }
}

function keys4back(obj) {
    var list = {};
    for (var key in obj) {
        var type = typeof(obj[key]);
        if (type == 'object') {
            // expode(obj[k], tab+"  ");
        }
        if (!key.startsWith("_") && !key.startsWith("$")) {
            if (type == 'function') {
                list[key] = type;
            } else {
                list[key] = type;
            }
        }
    }
    return list;
}
module.exports = ROBOT;