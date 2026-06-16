(function () {
  var QQ_GROUP = "542370192";
  var QQ_KEY = "HDx406XUcnJ0K1QzTnA6Ut9H0hK6ilHO";
  var QQ_AUTH_KEY =
    "8ypo16nsc2xmAZLyroMolrPlNOLpbpaacr9AK33qVEVPYxdT5vrKOnBYhoq9L+B6";
  var QQ_IOS_AUTH_SIG =
    "jtRSEmCY4By8aAIKbSyrXqJiCMHTCd84qgxsWUXY0emkFGMq5NtWnfXiVNG+dKJJ";
  // Web fallback (PC + iOS Safari without QQ)
  var QQ_JOIN_URL_WEB =
    "https://qm.qq.com/cgi-bin/qm/qr?k=" +
    QQ_KEY +
    "&jump_from=webapi&authKey=" +
    encodeURIComponent(QQ_AUTH_KEY);
  // Android scheme: 手Q OpenSDK 协议（mqqopensdkapi）
  var QQ_JOIN_URL_ANDROID =
    "mqqopensdkapi://bizAgent/qm/qr?url=" +
    encodeURIComponent(
      "http://qm.qq.com/cgi-bin/qm/qr?from=app&p=android&jump_from=webapi&k=" +
        QQ_KEY
    );
  // iOS scheme: 手Q card scheme（mqqapi）
  var QQ_JOIN_URL_IOS =
    "mqqapi://card/show_pslcard?src_type=internal&version=1" +
    "&uin=" + encodeURIComponent(QQ_GROUP) +
    "&authSig=" + encodeURIComponent(QQ_IOS_AUTH_SIG) +
    "&card_type=group&source=external&jump_from=webapi";
  var LABEL = "添加QQ群";

  var ua = navigator.userAgent || "";
  function isAndroid() { return /android/i.test(ua); }
  function isIOS() { return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && "ontouchend" in document); }

  function pickJoinUrl() {
    if (isAndroid()) return QQ_JOIN_URL_ANDROID;
    if (isIOS()) return QQ_JOIN_URL_IOS;
    return QQ_JOIN_URL_WEB;
  }

  function buildButton() {
    var a = document.createElement("a");
    a.href = pickJoinUrl();
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className =
      "kira-community-dock-btn kira-community-dock-btn--icon mdui-ripple kira-community-dock-btn--qq";
    a.title = LABEL;
    a.setAttribute("aria-label", LABEL);
    a.style.color = "#ffffff";
    a.style.backgroundColor = "#12b7f5";
    a.style.position = "relative";

    var icon = document.createElement("i");
    icon.className = "kirafont icon-QQ";
    a.appendChild(icon);

    var tip = document.createElement("span");
    tip.className = "kira-community-dock-tip";
    tip.textContent = LABEL;
    a.appendChild(tip);

    // 移动端：先尝试 scheme 调起手Q，1.2s 仍在页面则回退到网页加群
    a.addEventListener("click", function (e) {
      if (!isAndroid() && !isIOS()) return; // 桌面走默认 href
      e.preventDefault();
      var schemeUrl = isAndroid() ? QQ_JOIN_URL_ANDROID : QQ_JOIN_URL_IOS;
      var fallbackTimer = setTimeout(function () {
        window.location.href = QQ_JOIN_URL_WEB;
      }, 1200);
      // 离开页面（成功调起手Q）则取消 fallback
      var cancel = function () {
        clearTimeout(fallbackTimer);
        document.removeEventListener("visibilitychange", cancel);
        window.removeEventListener("pagehide", cancel);
      };
      document.addEventListener("visibilitychange", cancel);
      window.addEventListener("pagehide", cancel);
      window.location.href = schemeUrl;
    });

    return a;
  }

  function inject() {
    var dock = document.querySelector(".kira-community-dock");
    if (!dock) return false;
    if (dock.querySelector(".kira-community-dock-btn--qq")) return true;
    dock.insertBefore(buildButton(), dock.firstChild);
    return true;
  }

  function init() {
    if (inject()) return;
    var observer = new MutationObserver(function () {
      if (inject()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () {
      observer.disconnect();
    }, 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
