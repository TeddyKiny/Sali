/* header search */
function PSearchTop(){
    var t = $("#txtSearch"),
    e = t.val();
    return "" == e ? (t.css('border', '1px solid #F00'), t.on('input',
    function(){
        t.css('border', '')
    }), !1) : !(e.length <= 1) && !(e.indexOf("<") > -1 || e.indexOf(">") > -1) && (e = e.replace("/", "XieXian"), void(location.href = "http://" + document.domain + "/search/" + encodeURIComponent(e.replace(/\+/g, "((()))")) + ".html"))
}

/* Multi-type search */
function AllSearch() {
	var $input = $('#txtSearch'),
		keyword = $.trim($input.val()),
		type = $('#searchtype').val();
	if (keyword === '') {
		$input
			.css('border', '1px solid #F00')
			.off('input.ps-fix')
			.on('input.ps-fix', function () {
				$input.css('border', '');
			});
		return false;
	}
	if (keyword.length <= 1) return false;
	if (keyword.indexOf('<') > -1 || keyword.indexOf('>') > -1) return false;
	keyword = keyword.replace(/\//g, 'XieXian').replace(/\+/g, '((()))');
	/* Generated routing based on type */
	var path;
	switch (type) {
		case 'news':
			path = '/news/search/' + encodeURIComponent(keyword) + '.html';
			break;
		case 'info':
			path = '/info/search/' + encodeURIComponent(keyword) + '.html';
			break;
		case 'blog':
			path = '/blog/search/' + encodeURIComponent(keyword) + '.html';
			break;
		default: // products
			path = '/search/' + encodeURIComponent(keyword) + '.html';
	}
	/* 跳转 */
	window.location.href = window.location.protocol + '//' + window.location.host + path;
}

/* sidebar search */
function PSearchSidebar(){
    var t = $("#SidebarSearch"),
    e = t.val();
    return "" == e ? (t.css('border', '1px solid #F00'), t.on('input',
    function(){
        t.css('border', '')
    }), !1) : !(e.length <= 1) && !(e.indexOf("<") > -1 || e.indexOf(">") > -1) && (e = e.replace("/", "XieXian"), void(location.href = "http://" + document.domain + "/search/" + encodeURIComponent(e.replace(/\+/g, "((()))")) + ".html"))
}

/* email submitEmail */
function submitEmail(element){
    var e = $("#FootEmail").val();
    if ("" == e) return alert("Please enter a email "),
    $("#FootEmail").focus(),!1;
    if (!/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(e) && "" !== $.trim(e)) return alert("Please enter a valid email format"),
    $("#FootEmail").focus(),!1;
    var t = $("#FootEM_Name").length > 0 ? $("#FootEM_Name").val() : e;
    if (element) {
        element.disabled = true;
    }
    $.ajax({
        type: "POST",
        url: "/OutOpen/SubmitEmail",
        data: {
            email: $("#FootEmail").val(),
            name: t,
            pageUrl: document.URL
        },
        dataType: "jsonp",
        crossDomain: !0,
        jsonp: "callback",
        jsonpCallback: "result",
        error: function(e, t, a){
            setTimeout(function() {if (element) {element.disabled = false;}}, 2000);
            return alert("Submit failed, Please try again later!"),
            $("#FootEmail").val(""),
            !1
        },
        success: function(e){
            setTimeout(function() {if (element) {element.disabled = false;}}, 2000);
            alert("Submit successfully, we will contact you soon!"),
            $("#FootEmail").val("")
        },
        async: !1
    })
}

/* email, whatsapp, skype records */
$(function(){
    $("#txtSearch").keydown(function(e){
        13 == e.which && PSearchTop()
    });
    $(document).on("click", "#A_1,#A_2,#A_3,#A_4,#A_6,#A_9,#T9,#M9,#F9",function(){
        $.ajax({
            type: "POST",
            url: "/OutOpen/AddEmailRecord",
            data: {
                fromEmail: $(this).attr("href").replace("mailto:", ""),
                pathPage: document.URL,
                typeid: $(this).attr('id')
            },
            dataType: "jsonp",
            jsonp: "callback",
            crossDomain: !0,
            jsonpCallback: "result",
            error: function(){},
            success: function(e){},
            async: !1
        })
    });
    $(document).on("click", "#A_8,#T8,#M8,#F8",function(){
        var indexvalue = $(this).attr("href").indexOf("whatsapp");
        if (indexvalue >= 0){
            let vHref = $(this).attr("href");
            let tel = vHref.replace("https://api.whatsapp.com/send?l=en&phone=", "");
            tel = tel.replace("https://web.whatsapp.com/send?l=en&phone=", "");
            if (tel != null && tel != undefined){
                $.ajax({
                    type: "POST",
                    url: "/OutOpen/AddWhatsAppRecord",
                    data: {
                        fromtel: tel,
                        pathPage: document.URL,
                        typeid: $(this).attr('id')
                    },
                    dataType: "jsonp",
                    jsonp: "callback",
                    crossDomain: true,
                    jsonpCallback: "result",
                    error: function(){},
                    success: function(a){},
                    async: false
                });
            }
        }
    });
    $(document).on("click", "#A_7,#T7,#M7,#F7",function(){
        var indexvalue = $(this).attr("href").indexOf("skype");
        var teamsIndexValue = $(this).attr("href").indexOf("teams.");
        if (indexvalue >= 0 || teamsIndexValue >= 0){
            var tel = $(this).attr("href")
                .replace("skype:", "")
                .replace("?chat", "")
                .replace("https://teams.live.com/l/invite/", "");
            if (tel != null && tel != undefined){
                $.ajax({
                    type: "POST",
                    url: "/OutOpen/AddSkypeRecord",
                    data: {
                        fromtel: tel,
                        pathPage: document.URL,
                        typeid: $(this).attr('id')
                    },
                    dataType: "jsonp",
                    jsonp: "callback",
                    crossDomain: true,
                    jsonpCallback: "result",
                    error: function(){},
                    success: function(a){},
                    async: false
                });
            }
        }
    });
});


/* video delay 3 seconds display */
$(function(){
    setTimeout(function(){
        $("iframe[youtube-src]").each(function(){
            var youtubeurl = $(this).attr("youtube-src");
            $(this).attr("src", youtubeurl);
        })
    },
    3000)
});

/* showroom tab */
$(function(){
    $("#showroom-content>div").hide();
    $("#showroom-tabs a:first").attr("class", "active");
    $("#showroom-content>div:first").fadeIn();
    $('#showroom-tabs a').click(function(e){
        e.preventDefault();
        $("#showroom-content>div").hide();
        $("#showroom-tabs a").attr("class", "");
        $(this).attr("class", "active");
        $('#' + $(this).attr('title')).fadeIn();
    });
})

/* template wmkc-55 */
$('.wmkc-template-55 .wmkc-faq-item:not(:first-of-type) .wmkc-faq-tit').removeClass('active').next('.wmkc-faq-box').hide();
$('.wmkc-template-55').on('click', '.wmkc-faq-tit',
function(){
    $(this).parent().siblings().children('.wmkc-faq-tit').removeClass('active').next('.wmkc-faq-box').slideUp();
    $(this).toggleClass('active').next('.wmkc-faq-box').stop().slideToggle();
});

// Button jump wmkcfeedback
$(function () {
    var $trigger = $('a[href="#wmkcfeedback"]');
    var $target  = $('#wmkcfeedback');

    if ($trigger.length && $target.length) {
        $trigger.on('click', function (e) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: $target.offset().top - 160
            }, 500);
        });
    }
});
