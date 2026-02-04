
var LoadLayIM = {
    B2BLayIMUrl:"",
	PlatFrom: "",

    WMKC_Visitor_Eamil: "",
    Pimg: "",
    Pname: "",
    Purl:"",
    cip: "",
    cCountry:"",
    ChatSign:"",
    cUname:"",
    cIco:"",
    reg: /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4})$/,
    isMin: false,
    isCheckEmail: false,
    AutoMsg: "",
    AutoHelpmsg:"",
    LoadJS: function (name, flag) {

        var Url = "/Content/kcim";

        if (flag) {

            Url = "";
        }
        var _element = document.createElement("script");
        _element.setAttribute("type", "text/javascript");
        _element.setAttribute("src", Url + name);
        document.body.appendChild(_element);
    },
    LoadCSS: function (name) {
        var _element = document.createElement("link");
        _element.setAttribute("rel", "stylesheet");
        _element.setAttribute("ttpe", "text/css");
        _element.setAttribute("href", "/Content/kcim" + name);
        document.getElementsByTagName("head")[0].appendChild(_element);

    },
    RandomWord: function (randomFlag, min, max) {

        var str = "",
            range = min,
            arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        if (randomFlag) {
            range = Math.round(Math.random() * (max - min)) + min;
        }
        for (var i = 0; i < range; i++) {
            pos = Math.round(Math.random() * (arr.length - 1));
            str += arr[pos];
        }
        return str;
    },
    OpenLayIM: function (UserId, UserName, UserImage, ChatId, ChatName, ChatImage, ChatSign, Msg,TipMsg, IsCheck) {
        thisObj= this;
        var func = function(){
             if (UserId.toString().indexOf('*') >= 1) {
                UserId = UserId.split('*')[0];
                thisObj.isMin = true;
            }
            else UserId = UserId;
    
            LoadLayIM.cUname = ChatName;
            LoadLayIM.cIco = ChatImage;
            LoadLayIM.ChatSign = ChatSign;
            LoadLayIM.isCheckEmail = IsCheck;
            LoadLayIM.AutoMsg = unescape(Msg);
    
            LoadLayIM.AutoHelpmsg = unescape(TipMsg);
    
            var _ip = LoadLayIM.cip;
    
            if (UserId == 0) {
                UserId = localStorage.getItem("WMKC_Visitor" + ChatId);
                if (UserId == null) {
                    var reg = new RegExp("[\\.\\:]","g");
                    UserId = _ip.replace(reg, "_") + ChatId;
    
                    var setemail=localStorage.getItem("WMKC_Visitor_Eamil" + ChatId);
    
    
                    if (setemail == null) {
                        UserName = LoadLayIM.cCountry + "(" + _ip + ")";
                    }
                    else {
                        var index = setemail.indexOf('@');
                        if (index > -1) {
                            UserName = setemail.slice(0, index) + "," + LoadLayIM.cCountry;
    
                        }
                    }
                    localStorage.setItem("WMKC_Visitor" + ChatId, UserId);
                }
    
    
                if (localStorage.getItem("WMKC_Visitor_Eamil"+ ChatId) == null) {
                    layui.use(['layer'], function () {
                        var btnobj = ['confirm', 'skip'];
    
                        if (LoadLayIM.isCheckEmail != "False") {
                            btnobj = ['confirm'];
                        }
    
                        layer.open({
                            title: 'Please enter your mailbox',
                            offset:'auto',
                            content: '<label class="layui-form-label" style="width:auto;">Email：</label><div class="layui-input-block" style="margin-left:80px;"><input type="text" id="emailInput" name="title" lay-verify="title" autocomplete="off" placeholder="please enter your mailbox." class="layui-input"><div class="error" style="display:none;"><span style="color:red;">*<span></div></div>',
                            btn: btnobj,
                            btn1: function (index, layero) {
                                $('.error span').html("Required.");
                                var email = $("#emailInput").val().trim();
    
                                    if ("" != email) {
                                        if (!LoadLayIM.reg.test(email)) {
                                            $('.error').show();
                                            $('.error span').html("Illegal mailbox.");
                                        }
                                        else {
                                            b2b_visitor_email = localStorage.getItem("WMKC_Visitor_Eamil" + ChatId);
                                            if (b2b_visitor_email == null) {
                                                localStorage.setItem("WMKC_Visitor_Eamil" + ChatId, $('#emailInput').val());
                                            }
    
    
                                            var arry = email.split('@');
    
                                            if (arry.length > 0) {
                                                UserName = arry[0] + "," + LoadLayIM.cCountry;
    
                                            }
    
    
                                            LoadLayIM.openChatBox(UserId, UserName, UserImage, ChatId, ChatName, ChatImage);
                                            layer.close(index);
                                        }
                                    }
                                    else {
                                        $('.error').show();
                                    }
    
                            },
                            btn2: function (index, layero) {
                                $('.error').hide();
                                LoadLayIM.openChatBox(UserId, UserName, UserImage, ChatId, ChatName, ChatImage);
                            },
                            cancel: function (index, layero) {
                                $('.error').hide();
                            }
    
                        });
                    });
                }
                else {
                    LoadLayIM.openChatBox(UserId, UserName, UserImage, ChatId, ChatName, ChatImage);
                }
    
            }
            else {
                LoadLayIM.openChatBox(UserId, UserName, UserImage, ChatId, ChatName, ChatImage);
            }
        } 

        if($.fn.jquery>'3'){ 
            $.getScript("https://code.jquery.com/jquery-migrate-3.4.0.min.js", function(){
                func();

            }).fail(function(){func()});
        }else{
            func();
        }
        
    },
    Init: function (platfrom) {

        var img = new Image();
        img.src = "/Content/kcim/lay/css/modules/layer/default/icon.png";

        this.PlatFrom = platfrom;
        if (platfrom === "mobile") {

            this.LoadJS("/js/emoji.js", false);
            this.LoadJS("/js/NIM_Web_NIM_v4.8.0.js", false);
            this.LoadJS("/lay/layui.js", false);
            this.LoadJS("/lay/lay/modules/jquery.js", false);
            this.LoadJS("/js/Super_im_lay.js?t=2018073098", false);
            this.LoadCSS("/lay/css/layui.mobile.css");
        }
        else {
            this.LoadJS("/js/emoji.js", false);
            this.LoadJS("/js/NIM_Web_NIM_v4.8.0.js", false);
            this.LoadJS("/lay/layui.js", false);
            this.LoadJS("/lay/lay/modules/jquery.js", false);
            this.LoadJS("/js/Super_im_lay.js?t=2018073098", false);
            this.LoadCSS("/lay/css/layui.css");
        }

        var metatags = $("meta");
        for (var i = 0; i < metatags.length; i++) {
            if (metatags[i].getAttribute("property") == "og:image") {
                LoadLayIM.Pimg = metatags[i].getAttribute("content");
            }
            else if (metatags[i].getAttribute("property") == "og:title") {
                LoadLayIM.Pname = metatags[i].getAttribute("content");
            }
            else if (metatags[i].getAttribute("property") == "og:url") {
                LoadLayIM.Purl = metatags[i].getAttribute("content");
            }
        }

        //var m_img = $("meta[property=og:image]");
        //LoadLayIM.Pimg = m_img.attr("content");

        //var m_title = $("meta[property=og:title]");
        //LoadLayIM.Pname = m_title.attr("content");

        //var m_url = $("meta[property=og:url]");
        //LoadLayIM.Purl = m_url.attr("content");

        $.ajax({
            type: "get",
            url: this.B2BLayIMUrl + "/OutOpen/GetRealIP",
            data: null,
            success: function (data) {
                var jsonobj = eval(data);
                LoadLayIM.cip = jsonobj.cip;
                LoadLayIM.cCountry = jsonobj.cname;
            },
            error: function()
            {
                LoadLayIM.cip = "empty";
                LoadLayIM.cCountry = "empty";
            }
        });


    },

    gobalChat: function (userId, loginName, headImage) {
        var id = localStorage.getItem("WMKC_Visitor" + userId);
        if (id != "" && id != null) {
            id = "wmkc_prod_" + id;

            var local = layui.data('layim')[id] || {};
            var friends = local.chatlog = local.chatlog || {};
            layui.each(friends, function (index, item) {
                var index = item.length - 1;
                var friend = item[index];
                var chatname = typeof (friend.chatname) != "undefined" ? friend.chatname : friend.username;
                var chatimg = typeof (friend.chatimg) != "undefined" ? friend.chatimg : friend.avatar;

                LoadLayIM.OpenLayIM(localStorage.getItem("WMKC_Visitor" + userId) + '*', loginName, headImage, userId, chatname, chatimg, friend.chatsign, LoadLayIM.AutoMsg, LoadLayIM.AutoHelpmsg, LoadLayIM.isCheckEmail);
            });
        }
},    

openChatBox: function(UserId, UserName, UserImage, ChatId, ChatName, ChatImage) {
    var _ip = LoadLayIM.cip;
    var _region = LoadLayIM.cCountry;

        $.ajax({
            type: "get",
            url: this.B2BLayIMUrl + "/OutOpen/GetImSign",
            data: { UserId: UserId },
            success: function(data) {
                SuperIm.Init({
                    appKey: data.AppKey,
                    uid: UserId,
                    unixTime: data.UnixTime,
                    checkSum: data.CheckSum,
                    lang: "en",
                    name: UserName,
                    avatar: UserImage,
                    ip: _ip,
                    region: _region,
                    isMin: LoadLayIM.isMin,
                    platfrom: LoadLayIM.PlatFrom,
                    autoReply: LoadLayIM.AutoMsg,
                    autoTip:LoadLayIM.AutoHelpmsg,
                    chat: {
                        name: ChatName,
                        open_id: "wmkc_prod_" + ChatId,
                        avatar: ChatImage,
                        sign: LoadLayIM.ChatSign
                    },
                    onImConnected: function (e) {

                        if (null == localStorage.getItem("WMKC_Visitor_First" + ChatId)) {
							var info = "Website users come from: " + _region + ",IP: " + _ip;                            
                            SuperIm.sendMsg("wmkc_prod_" + ChatId, info);

                            localStorage.setItem("WMKC_Visitor_First" + ChatId, true);
                            if (localStorage.getItem("WMKC_Visitor_Eamil" + ChatId) != "" && localStorage.getItem("WMKC_Visitor_Eamil" + ChatId) != null && localStorage.getItem("WMKC_Visitor_Eamil" + ChatId) != "null")
                            {
                                SuperIm.sendMsg("wmkc_prod_" + ChatId, localStorage.getItem("WMKC_Visitor_Eamil" + ChatId));
								
                                $.get("/OutOpen/SaveIMInquery", { uid: ChatId, bid: encodeURI(UserId), country: encodeURI(LoadLayIM.cCountry), emailaddress: encodeURI(localStorage.getItem("WMKC_Visitor_Eamil" + ChatId)), ipaddress: encodeURI(LoadLayIM.cip) }, function (data) { });
                            }
                           
                        }

                        if (null != LoadLayIM.Pname && "" != LoadLayIM.Pname) {
                            var info = LoadLayIM.Pname + " " + LoadLayIM.Purl;
                            SuperIm.sendMsg("wmkc_prod_" + ChatId, info);
                        }
                    }
                });
            }
        });
    }
}