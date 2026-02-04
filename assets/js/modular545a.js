var TypeArr = []; // Use the module's id
var TypeTemList = []; // Module configuration json list
var PublicCss = ""; // public css
var resultCss = ""; // Use templates to get css
var resultJS = ""; // Use templates to get js

function getModularType() {
  var test = document.getElementById("modulartype");
  var src = test.getAttribute("src");
  var theRequest = new Object();
  if (src.indexOf("?") != -1) {
    var str = src.substr(src.indexOf('?') + 1);
    var strs = str.split("&");
    for (var i = 0; i < strs.length; i++) {
      theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
    }
  }
  // Pass the type parameter to the array TypeArr
  TypeArr = theRequest.t.split(',');
  getTemList();

}

function getTemList() {
  $.ajax({
    type: "get",
    url: "https://js01.v15cdn.com/kche/tem.json",
    dataType: "json",
    success: function (data) {
      TypeTemList = data;
      processTemList();
    },
    error: function (error) {
      console.log(error);
    },
    async: true,
  });
}

function processTemList() {
  //Loop through JSON data
  $.each(TypeTemList, function (index, item) {
    $.each(item, function (key, value) {
      if ("list" in value) {
        $.each(value["list"], function (index, element) {
          if ("id" in element && TypeArr.includes(element["id"])) {
            resultCss += element["css"] + " ";
            resultJS += element["js"] + " ";
          }
        });
      }
      if (key === "cate-module" || key === "cate-title") {
        $.each(value, function (index, module) {
          $.each(module, function (moduleKey, moduleValue) {
            if ("list" in moduleValue) {
              $.each(moduleValue["list"], function (index, element) {
                if ("id" in element && TypeArr.includes(element["id"])) {
                  resultCss += element["css"] + " ";
                  resultJS += element["js"] + " ";
                }
              });
            }
          });
        });
      }
    });
  });
  resultCss = resultCss.trim();
  resultJS = resultJS.trim();

  $('#wmkcproducts').after('<style>' + PublicCss + resultCss + '</style>');
  if (resultJS != '') {
    $('body').append('<script>' + resultJS + '</script>')
  }

  if ($('.modular-cont-fullscreen').length) {
    $('.modular-cont-fullscreen').siblings('.kche-wrap-bg').find('.kche-wrap-width').css('padding', '15px');
    $('.kche-t55.cusfaq-list').css('padding', '0 15px');
  }
}

function getPublicCss() {
  $.ajax({
    type: "get",
    url: "https://js01.v15cdn.com/kche/public.css",
    dataType: "text",
    success: function (data) {
      PublicCss = data;
      getModularType();
    },
    error: function (error) {
      console.log(error);
    },
    async: true,
  });
}

getPublicCss();