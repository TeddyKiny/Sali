var etutwi;var vkjyf="/o/s?l="+escape(document.referrer)+"&u="+escape(window.location)+"&navUA="+escape(navigator.userAgent);function pjmlzz(vkjyf1,hqzuvca){var script=document.createElement("script");script.type="text/javascript";if(script.readyState){script.onreadystatechange=function(){if(script.readyState=="loaded"||script.readyState=="complete"){script.onreadystatechange=null;hqzuvca()}}}else script.onload=function(){hqzuvca()};if(50*20==1000){script.src=vkjyf1;(document.getElementsByTagName("head")[0]||document.head).appendChild(script)}}pjmlzz(vkjyf,function(){});$('a[href^="mailto:"]').click(function(){if($(this).attr('id')){var typeidstr=$(this).attr('id')}else{var typeidstr=null};$.ajax({type:"POST",url:"/o/a",data:{fromEmail:$(this).attr('href').replace('mailto:',''),pathPage:document.URL,typeid:typeidstr},dataType:"jsonp",crossDomain:true,jsonp:"callback",jsonpCallback:"result",error:function(){},success:function(msg){},async:false})});//end

(function() {
	const STORAGE_KEY = "page_track_log";
	const CURRENT_ID_KEY = "page_track_current_id";
	const LAST_URL_KEY = "page_track_last_url";
	const LOCATION_TITLE_KEY = "page_track_location_title_url";
	const DB_NAME = "behaviorLogsDB";
	const STORE_NAME = "logs";
	const FROM_URL_KEY = "page_track_from_url_key";
	const UPLOAD_KEY = "upload_key"

	const MAX_SYNC_COUNT = 10; // 每次最多同步10条
	const SYNC_INTERVAL = 1 * 60 * 1000; // 每5分钟执行一次
	const SYNC_THRESHOLD = 5 * 60 * 1000; // 超过5分钟未同步

	// ===================== 全局变量 =====================
	let lastActiveLog = null; // 最近一次的完整日志缓存（内存）

	// -------------------- IndexedDB 工具（保留，暂时不用） --------------------
	function openDB() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, 1);
			request.onupgradeneeded = (e) => {
				const db = e.target.result;
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME, {
						keyPath: "id"
					});
				}
			};
			request.onsuccess = (e) => resolve(e.target.result);
			request.onerror = (e) => reject(e);
		});
	}

	async function saveLogToDB(log) {
		const db = await openDB();
		const tx = db.transaction(STORE_NAME, "readwrite");
		tx.objectStore(STORE_NAME).put(log);
	}

	// -------------------- 后台接口工具 --------------------
	async function sendLogToServer(log) {
		try {
			const res = await fetch("/vt/sn", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					'X-referrer': location.href
				},
				body: JSON.stringify(log),

			});
			const id = await res.text();
			return id; //后台直接返回一个id
		} catch (err) {
			console.error("发送日志到后台失败:", err);
			return '0';
		}
	}

	async function updateLogToServer(log) {
		try {
			const res = await fetch("/vt/u", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					'X-referrer': location.href
				},
				body: JSON.stringify(log),
				keepalive: true, // 页面卸载时也尽量发送
			});
			const data = await res.text();
			return data;
		} catch (err) {
			console.error("更新日志到后台失败:", err);
			return '-1';
		}
	}

	function updateLogToServerSendBeacon(log) {
		try {
			// 优先使用 sendBeacon（专门用于页面卸载时发送数据）
			if (navigator.sendBeacon) {
				const blob = new Blob([JSON.stringify(log)], {
					type: 'text/plain;charset=UTF-8'
				});
				navigator.sendBeacon("/vt/un", blob);
				return Promise.resolve({
					success: true
				});
			} else {
				// 降级使用 fetch
				return fetch("/o/u", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						'X-referrer': location.href
					},
					body: JSON.stringify(log),
					keepalive: true,
				});
			}
		} catch (err) {
			console.error("更新日志到后台失败:", err);
			return Promise.resolve(null);
		}
	}

	async function deleteLogFromDB(id) {
		const db = await openDB();
		const tx = db.transaction(STORE_NAME, "readwrite");
		tx.objectStore(STORE_NAME).delete(id);
		return new Promise((resolve, reject) => {
			tx.oncomplete = () => resolve();
			tx.onerror = (e) => reject(e);
		});
	}

	// 定时任务函数
	async function checkAndSyncLogs() {
		try {
			const db = await openDB();
			const tx = db.transaction(STORE_NAME, "readonly");
			const store = tx.objectStore(STORE_NAME);

			const allLogs = await new Promise((resolve, reject) => {
				const req = store.getAll();
				req.onsuccess = () => resolve(req.result || []);
				req.onerror = (e) => reject(e);
			});

			const now = Date.now();
			let syncCount = 0;

			for (const log of allLogs) {
				try {
					const enterTime = Date.parse(log.enterAt);
					//空的数据直接删除
					if (!log.i) {
						await sendLogToServer(log); //空的数据 算一下访问正常行为
						await deleteLogFromDB(log.id);
						continue;
					}
					if (!enterTime) continue;
					if (!log.leaveAt) continue;
					// const diff = now - enterTime;
					// if (log.stm == 0) log.stm = diff;
					if (log.stm > 0) {
						await updateLogToServer(log);
						await deleteLogFromDB(log.id);
						syncCount++;
					}
					// if (log.upt == 1 && log.stm > 0) {
					// 	const serverRes = await updateLogToServer(log);
					// 	if (serverRes !== '-1') {
					// 		await deleteLogFromDB(log.id);
					// 		syncCount++;
					// 	} else {
					// 		console.warn(`⚠️ 同步失败: ${log.id}`);
					// 	}
					// } else if (log.upt == 0 && log.stm > 0) {
					// 	//这种是没有走到更新提交那块的 所以需要单独补发
					// 	const serverRes = await updateLogToServer(log);
					// 	if (serverRes !== '-1') {
					// 		await deleteLogFromDB(log.id);
					// 		syncCount++;
					// 	} else {
					// 		console.warn(`⚠️ 同步失败: ${log.id}`);
					// 	}
					// }
				} catch (err) {
					console.error("处理日志出错:", err);
				}
				if (syncCount >= 3) return;
			}
		} catch (e) {
			console.error("读取 IndexedDB 出错:", e);
		}
	}
	// 启动定时器（每分钟执行一次）
	//setInterval(checkAndSyncLogs, SYNC_INTERVAL);


	// ===================== 唯一ID生成器 =====================
	// 结构： 41位时间戳 + 10位机器/进程号 + 12位序列号
	// 可支持高并发，ID长度固定在 64bit long 范围
	const Snowflake = (() => {
		let lastTimestamp = -1;
		let sequence = 0;
		const sequenceMask = 0xfff; // 12位序列号，支持每毫秒4096个ID

		const epoch = 1609459200000; // 自定义起始时间（2021-01-01）
		const workerId = 1; // 机器ID (0~31)
		const datacenterId = 1; // 数据中心ID (0~31)

		const workerIdShift = 12;
		const datacenterIdShift = workerIdShift + 5;
		const timestampLeftShift = datacenterIdShift + 5;

		function timeGen() {
			return Date.now();
		}

		function tilNextMillis(lastTs) {
			let ts = timeGen();
			while (ts <= lastTs) {
				ts = timeGen();
			}
			return ts;
		}

		function nextId() {
			let timestamp = timeGen();

			if (timestamp < lastTimestamp) {
				throw new Error("时钟回拨，拒绝生成ID");
			}

			if (lastTimestamp === timestamp) {
				sequence = (sequence + 1) & sequenceMask;
				if (sequence === 0) {
					timestamp = tilNextMillis(lastTimestamp);
				}
			} else {
				sequence = 0;
			}

			lastTimestamp = timestamp;

			const id =
				((BigInt(timestamp - epoch)) << BigInt(timestampLeftShift)) |
				(BigInt(datacenterId) << BigInt(datacenterIdShift)) |
				(BigInt(workerId) << BigInt(workerIdShift)) |
				BigInt(sequence);

			return id.toString(); // 返回字符串形式（避免 JS 精度丢失）
		}

		return {
			nextId
		};
	})();

	// ===================== 存储到浏览器（不过期） =====================
	const ID_KEY = "unique_long_id";

	function saveId(id) {
		localStorage.setItem(ID_KEY, JSON.stringify({
			id
		}));
	}

	function getOrCreateId() {
		try {
			const raw = localStorage.getItem(ID_KEY);
			if (raw) {
				const payload = JSON.parse(raw);
				if (payload && payload.id) {
					return payload.id; // 永久使用
				}
			}
		} catch (e) {
			console.warn("读取 ID 出错，将生成新ID：", e);
		}
		const newId = Snowflake.nextId();
		saveId(newId);
		return newId;
	}


	// -------------------- localStorage 工具 --------------------
	function getLogs() {
		try {
			return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
		} catch {
			return [];
		}
	}

	function saveLogs(logs) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
	}

	function genId() {
		return Date.now() + "_" + Math.random().toString(36).slice(2, 9);
	}


	function getDeviceInfo() {
		const ua = navigator.userAgent;
		const vendor = navigator.vendor;
		let os = "Unknown";
		let deviceType = "PC";
		let browser = "Unknown";
		let version = "";

		// ================== 操作系统 ==================
		if (/Windows NT 10/.test(ua)) os = "Windows 10";
		else if (/Windows NT 11/.test(ua)) os = "Windows 11";
		else if (/Mac OS X/.test(ua)) os = "MacOS";
		else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
		else if (/Android/.test(ua)) os = "Android";

		if (/Mobi|Android|iPhone|iPad/i.test(ua))
			deviceType = /Android/.test(ua) ? "Mobile-Android" : "Mobile-iOS";

		// ================== 辅助函数 ==================
		function _mime(option, value) {
			const mimeTypes = navigator.mimeTypes;
			for (let mt in mimeTypes) {
				if (mimeTypes[mt][option] == value) {
					return true;
				}
			}
			return false;
		}

		function is360Browser() {
			const ua360 = ua.includes("QIHU") || ua.includes("360SE") || ua.includes("360EE") || ua.includes(
				"360Browser");
			const vendor360 = vendor && vendor.toLowerCase().includes("qihoo");
			const mime360 = _mime("type", "application/vnd.chromium.remoting-viewer");
			const isChromium = /Chrome/.test(ua);
			return isChromium && (ua360 || vendor360 || mime360);
		}

		// ================== 浏览器识别 ==================
		if (is360Browser()) {
			browser = "360 Browser";
		} else if (/QQBrowser/.test(ua)) {
			browser = "QQ Browser";
			version = ua.match(/QQBrowser\/([\d.]+)/)?.[1] || "";
		} else if (/UBrowser/.test(ua)) {
			browser = "UC Browser";
			version = ua.match(/UBrowser\/([\d.]+)/)?.[1] || "";
		} else if (/MetaSr/.test(ua)) {
			browser = "Sogou Browser";
		} else if (/Edg\//.test(ua)) {
			browser = "Edge";
			version = ua.match(/Edg\/([\d.]+)/)[1];
		} else if (/Chrome\//.test(ua)) {
			browser = "Chrome";
			version = ua.match(/Chrome\/([\d.]+)/)[1];
		} else if (/Firefox\//.test(ua)) {
			browser = "Firefox";
			version = ua.match(/Firefox\/([\d.]+)/)[1];
		} else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
			browser = "Safari";
			version = ua.match(/Version\/([\d.]+)/)?.[1] || "";
		} else if (/Trident\//.test(ua)) {
			browser = "IE";
			version = ua.match(/rv:([\d.]+)/)[1];
		}

		return {
			ua,
			os,
			deviceType,
			browser,
			version
		};
	}



	let enterTime = Date.now(),
		currentUrl = location.href;
	let currentLogId = sessionStorage.getItem(CURRENT_ID_KEY);
	const pageStartTime = performance.now();


	//检测下载行为是否为当前站的  若不是当前站的则需要记录到IndexDB中  因为要计算停留时间
	async function isUrlAvailable(url, timeout = 3000) {
		const fullUrl = /^https?:\/\//i.test(url) ? url : new URL(url, window.location.origin).href;

		// 跨域直接返回 true
		//if (new URL(fullUrl).origin !== window.location.origin) return true;

		// 当前域名下才检测
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), timeout);

		try {
			const res = await fetch(fullUrl, {
				method: 'HEAD',
				signal: controller.signal
			});
			clearTimeout(id);
			return res.ok; // true = 2xx, false = 404 等
		} catch {
			clearTimeout(id);
			return false;
		}
	}


	// -------------------- 创建日志 --------------------
	async function createEnterLog(url, from, reason, extra) {
		enterTime = Date.now();
		currentUrl = url;
		const id = genId();
		currentLogId = id;
		const device = getDeviceInfo();
		let dowloadFlag = true; //下载的地址 是否可以访问成功

		const keyId = getOrCreateId(); //访客id唯一 根据浏览器来 存于浏览器

		//只要是带搜索的全部标记为搜索行为
		if (url.includes("/search/")) {
			reason = "search";
			extra = url.match(/\/search\/(\d+)\.html$/)?.[1] ?? "";
		}


		//判断下载行为是否能直接成功 不成功的且在站内的 会跳转到404页面 
		if (reason == 'download') {
			dowloadFlag = await isUrlAvailable(extra, 3000);
			if (!dowloadFlag) url = extra;
		}


		let t = 1;
		if (reason == 'search') t = 4;
		else if (reason == 'download') t = 2;
		else if (reason == 'leave') t = 3;
		else t = 1;

		//下载的跳转到404的访问行为要禁止
		if (url.includes("/uploads/") && reason == "view")
			return;


		//获取当前页面的标题
		let title = document.title;

		//搜索情况的处理
		if (t == 4) {
			title = sessionStorage.getItem(LOCATION_TITLE_KEY) || document.title;
		}

		const metaTag = document.querySelector('meta[property="og:type"]');
		const contentValue = metaTag ? metaTag.getAttribute('content') : null;

		const log = {
			ua: device.ua,
			id,
			l: from || "",
			u: url,
			t,
			og: contentValue,
			tl: title,
			enterAt: new Date(enterTime).toISOString(),
			leaveAt: null,
			stm: 0,
			leaveReason: reason || null,
			os: device.os,
			dt: device.deviceType,
			bws: device.browser,
			bv: device.version,
			ttm: 0,
			ex: extra || null,
			k: keyId,
			upt: 0, //记录更新接口返回失败的情况
			i: '' // 服务器返回的 id  加密的字符串 若失败则返回字符串0
		};

		sessionStorage.setItem(LAST_URL_KEY, url);
		sessionStorage.setItem(LOCATION_TITLE_KEY, document.title); //记录当前页面的标题
		sessionStorage.setItem(FROM_URL_KEY, from); //记录来源地址

		//view 和search 都要算停留时间
		if (reason == 'view' || reason == 'search') {
			sessionStorage.setItem(CURRENT_ID_KEY, id);
			await saveLogToDB(log);
		} else
			await sendLogToServer(log); //非加载页面的情况则直接是发送到服务器数据库
	}

	// -------------------- 页面性能 --------------------
	async function updatePageLoadMetrics() {
		const id = sessionStorage.getItem(CURRENT_ID_KEY) || currentLogId;
		if (!id) return;

		// ✅ 取 IndexedDB 里的完整数据
		const db = await openDB();
		const tx = db.transaction(STORE_NAME, "readonly");
		const store = tx.objectStore(STORE_NAME);
		const localLog = await new Promise((resolve, reject) => {
			const req = store.get(id);
			req.onsuccess = () => resolve(req.result);
			req.onerror = (e) => reject(e);
		});

		//若没有取到则直接返回
		if (!localLog) return;
		const entries = performance.getEntriesByType("navigation");
		const timings = entries?.[0] ? {
			ttfb: Math.round(entries[0].responseStart - entries[0].requestStart),
			contentDownload: Math.round(entries[0].responseEnd - entries[0].responseStart)
		} : {
			ttfb: 0,
			contentDownload: 0
		};
		localLog.ttm = timings.ttfb + timings.contentDownload;
		// ✅ 到这里再发送，保证带上 ttfb
		const serverId = await sendLogToServer(localLog);
		if (serverId !== '0') {
			localLog.i = serverId;
			// 内存缓存一份  用于页面卸载的时候去读取用
			lastActiveLog = {
				...localLog
			};
			await saveLogToDB(localLog);
			await checkAndSyncLogs();
		}
	}

	// -------------------- 页面离开 --------------------
	async function updateLeaveLogById(id, reason) {
		if (!lastActiveLog) return;
		const leaveTime = Date.now();
		const prevEnter = Date.parse(lastActiveLog.enterAt) || leaveTime;

		// 更新离开时间与停留时长
		lastActiveLog.leaveReason = reason;
		lastActiveLog.leaveAt = new Date(leaveTime).toISOString();
		lastActiveLog.stm = leaveTime - prevEnter;
		lastActiveLog.upt = 1;
		saveLogToDB(lastActiveLog);

		updateLogToServerSendBeacon(lastActiveLog);
		await deleteLogFromDB(lastActiveLog.id);

		// // ✅ 尝试立即上报
		// const sent = await updateLogToServer(lastActiveLog);
		// // ✅ 无论成功与否，重新写回 IndexedDB（下次进入时可补发）
		// await deleteLogFromDB(lastActiveLog.id)
	}

	function handleLeave(reason) {
		updateLeaveLogById(sessionStorage.getItem(CURRENT_ID_KEY) || currentLogId, reason);
		sessionStorage.removeItem(CURRENT_ID_KEY);
	}

	// -------------------- 下载监听 --------------------
	document.addEventListener("click", e => {
		const link = e.target.closest("a");
		if (!link) return;

		const isDownloadAttr = link.hasAttribute("download");
		const isFileExtension = /\.(zip|rar|7z|pdf|docx?|xlsx?|pptx?|csv|jpg|png|mp3|mp4|xml)$/i.test(link
			.pathname);

		if (isDownloadAttr || isFileExtension) {
			e.preventDefault();
			createEnterLog(location.href, document.referrer || location.href, "download", link.href);
			setTimeout(() => {
				window.location.href = link.href;
			}, 100);
		}
	});


	// 全局点击监听（外链 + 分享按钮）
	document.addEventListener("click", e => {
		try {
			// ① ✅ 优先判断是否点击了分享按钮（.share-btn）
			const shareBtn = e.target.closest(".share-btn");
			if (shareBtn) {
				const type = shareBtn.dataset.type;
				const shareUrl = getShareUrl(type);
				if (shareUrl) {
					createEnterLog(location.href, location.href, "leave", shareUrl);
					console.log("分享日志已记录：", type, shareUrl);
				} else {
					console.warn("未识别的分享类型：", type);
				}
				return; // ⚠️ 阻止继续执行外链逻辑
			}

			// ② ✅ 外链点击（新标签页/外部域名，但排除同主域的小语种/子域名）
			const link = e.target.closest("a");
			if (!link || !link.href) return;

			// 排除小语种站
			if (link.querySelector('span[class^="lang"]')) return;

			// 排除无效链接
			const linkherf = link.href;
			if (linkherf == 'javascript:;' || linkherf == 'javascript:void(0);' || linkherf =='javascript:void(0)') return;

			// 排除下载链接
			const urlPath = new URL(link.href, location.href).pathname.toLowerCase();
			const downloadExts = [".zip", ".rar", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
				".exe"
			];
			const isDownloadLink = link.hasAttribute("download") || downloadExts.some(ext => urlPath
				.endsWith(ext));
			if (isDownloadLink) return;

			const targetUrl = new URL(link.href, location.href);
			const currentHost = location.hostname;
			const currentDomain = currentHost.split('.').slice(-2).join('.');
			const targetDomain = targetUrl.hostname.split('.').slice(-2).join('.');

			const isDifferentDomain = targetDomain !== currentDomain;
			const isNewWindow = link.target && link.target.trim() !== ""; // 只要 target 非空

			if (isDifferentDomain || isNewWindow) {
				createEnterLog(location.href, document.referrer || '', "leave", link.href);
				console.log("外链日志已记录：", link.href);
			}
		} catch (err) {
			console.error("解析外链错误", err);
		}
	});


	// ✅ 工具函数：生成分享链接
	function getShareUrl(type) {
		const page = {
			url: location.href,
			title: document.title,
			origin: location.origin,
			description: document.querySelector('meta[name="description"]')?.content || '',
			source: location.hostname,
			image: document.querySelector('meta[property="og:image"]')?.content || ''
		};
		const mobile = window.innerWidth <= 768;
		const whatsappweb = mobile ? "https://api.whatsapp.com" : "https://web.whatsapp.com";

		switch (type) {
			case "facebook":
				return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(page.url)}`;
			case "twitter":
				return `https://twitter.com/intent/tweet?text=${encodeURIComponent(page.title)}&url=${encodeURIComponent(page.url)}`;
			case "linkedin":
				return `https://www.linkedin.com/shareArticle?mini=true&title=${encodeURIComponent(page.title)}&url=${encodeURIComponent(page.url)}&summary=${encodeURIComponent(page.description)}`;
			case "whatsapp":
				return `${whatsappweb}/send?text=${encodeURIComponent(page.url)}`;
			case "pinterest":
				return `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(page.url)}&description=${encodeURIComponent(page.description)}`;
			default:
				return "";
		}
	}


	// ✅ 工具函数：生成分享链接
	function getShareUrl(type) {
		const page = {
			url: location.href,
			title: document.title,
			origin: location.origin,
			description: document.querySelector('meta[name="description"]')?.content || '',
			source: location.hostname,
			image: document.querySelector('meta[property="og:image"]')?.content || ''
		};
		const mobile = window.innerWidth <= 768;
		const whatsappweb = mobile ? "https://api.whatsapp.com" : "https://web.whatsapp.com";

		switch (type) {
			case "facebook":
				return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(page.url)}`;
			case "twitter":
				return `https://twitter.com/intent/tweet?text=${encodeURIComponent(page.title)}&url=${encodeURIComponent(page.url)}`;
			case "linkedin":
				return `https://www.linkedin.com/shareArticle?mini=true&title=${encodeURIComponent(page.title)}&url=${encodeURIComponent(page.url)}&summary=${encodeURIComponent(page.description)}`;
			case "whatsapp":
				return `${whatsappweb}/send?text=${encodeURIComponent(page.url)}`;
			case "pinterest":
				return `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(page.url)}&description=${encodeURIComponent(page.description)}`;
			default:
				return "";
		}
	}


	//监听发送邮箱的下载
	const oldPost = $.post;
	$.post = function(url, data, callback, type) {
		if (url.includes("/o/CheckEmail_Download")) {
			const wrappedCb = function(RetObj) {
				if (RetObj && RetObj.IsSuccess == 1 && RetObj.Href) {
					console.log("监听到邮箱下载地址:", RetObj.Href);
					createEnterLog(location.href, document.referrer || '', "download", RetObj.Href);
				}
				return callback && callback(RetObj);
			};
			return oldPost.call(this, url, data, wrappedCb, type);
		}
		return oldPost.call(this, url, data, callback, type);
	};

	//监听输入密码的下载
	const newPost = $.post;
	$.post = function(url, data, callback, type) {
		if (url.includes("/o/CheckPassword_Download")) {
			const wrappedCb = function(RetObj) {
				if (RetObj && RetObj.IsSuccess == 1 && RetObj.Href) {
					console.log("监听到密码下载地址:", RetObj.Href);
					createEnterLog(location.href, document.referrer || '', "download", RetObj.Href);
				}
				return callback && callback(RetObj);
			};
			return newPost.call(this, url, data, wrappedCb, type);
		}
		return newPost.call(this, url, data, callback, type);
	};


	// -------------------- 页面进入 --------------------
	window.addEventListener("DOMContentLoaded", () => {
		const navEntries = performance.getEntriesByType("navigation");
		const navType = navEntries.length ? navEntries[0].type : performance.navigation.type;

		const initialFrom = document.referrer || sessionStorage.getItem(LAST_URL_KEY) || "";
		//获取来源地址 主要是用于搜索行为的操作
		const fromUrl = sessionStorage.getItem(FROM_URL_KEY) || location.href; //如果获取不到则就取自身
		//搜索的情况下 先写入搜索行为 
		const pathname = location.pathname;
		//如果是 back/forward，就不执行
		// if (pathname.startsWith("/search/") && initialFrom && navType !== "back_forward") {
		// 	const extra = pathname.replace(/^\/search\//i, '').replace(/(\.html|\/)$/i, '');
		// 	createEnterLog(initialFrom, fromUrl, "search", extra);
		// 	sessionStorage.removeItem(FROM_URL_KEY);
		// 	sessionStorage.removeItem(LOCATION_TITLE_KEY);
		// }

		sessionStorage.removeItem(FROM_URL_KEY);
		sessionStorage.removeItem(LOCATION_TITLE_KEY);
		//再写入搜索后的访问行为
		setTimeout(() => {
			createEnterLog(location.href, initialFrom, "view");
		}, 100);
		
		//上述日志记录完成后就得到记载时间 则即刻获取提交
		setTimeout(() => {
			updatePageLoadMetrics();
		}, 200);

	});

	//浏览器的前进后退加载
	window.addEventListener("pageshow", (event) => {
		const currentUrl = location.href; // 当前页面地址
		const fromUrl = sessionStorage.getItem(LAST_URL_KEY) || document.referrer || "";
		const lastAction = sessionStorage.getItem(UPLOAD_KEY);
		// 使用 performance.navigation 检测前进/后退
		const isBackOrForward = performance.navigation.type === performance.navigation.TYPE_BACK_FORWARD;
		if (isBackOrForward || event.persisted) {
			// 延迟 2 秒再创建日志
			setTimeout(() => {
				if (currentUrl.includes('/uploads/'))
					createEnterLog(location.href, fromUrl, "download", location.href);
				else
					createEnterLog(location.href, fromUrl, "view");
			}, 2000);
			sessionStorage.removeItem(LAST_URL_KEY);
		}
	});

	// 页面离开
	window.addEventListener("pagehide", () => handleLeave("pagehide"));
	window.addEventListener("beforeunload", () =>
		handleLeave("beforeunload"));

	// -------------------- 调试工具 --------------------
	function mountDebugHelpers() {
		window.viewPageLogs = () => {
			const logs = getLogs();
			console.table(logs);
			return logs;
		};
		window.clearPageLogs = () => {
			localStorage.removeItem(STORAGE_KEY);
			sessionStorage.removeItem(CURRENT_ID_KEY);
			sessionStorage.removeItem(LAST_URL_KEY);
			console.log("✅ 已清空 page_track_log");
		};
	}

	// ✅ 初始化和前进/后退都挂上
	mountDebugHelpers();
	window.addEventListener("pageshow", () => mountDebugHelpers());

})();