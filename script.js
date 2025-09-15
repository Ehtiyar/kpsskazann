(function () {
	const STORAGE_KEY = 'studyTracker_v3';
	const SUBJECTS = ['paragraf','matematik','tarih','vatandaşlık','coğrafya'];
	const SUBJECT_LABEL = {
		paragraf: 'Paragraf', matematik: 'Matematik', tarih: 'Tarih',
		'vatandaşlık': 'Vatandaşlık', coğrafya: 'Coğrafya'
	};

	const els = {
		monthSelect: document.getElementById('monthSelect'),
		yearSelect: document.getElementById('yearSelect'),
		todayBtn: document.getElementById('todayBtn'),
		exportBtn: document.getElementById('exportBtn'),
		importInput: document.getElementById('importInput'),
		resetBtn: document.getElementById('resetBtn'),
		leftBody: document.getElementById('leftBody'),
		rightBody: document.getElementById('rightBody'),
		leftStats: document.getElementById('leftStats'),
		rightStats: document.getElementById('rightStats'),
		leftTarget: document.getElementById('leftTarget'),
		rightTarget: document.getElementById('rightTarget'),
		leftLegend: document.getElementById('leftLegend'),
		rightLegend: document.getElementById('rightLegend'),
	};

	const state = {
		currentMonth: null,
		currentYear: null,
		data: loadData()
	};

	initMonthYearSelectors();
	wireTopbar();

	// Targets UI init
	els.leftTarget.value = String(state.data.targets.left);
	els.rightTarget.value = String(state.data.targets.right);
	updateLegends();

	const today = new Date();
	state.currentMonth = today.getMonth();
	state.currentYear = today.getFullYear();
	els.monthSelect.value = state.currentMonth;
	els.yearSelect.value = state.currentYear;

	render();
	scrollToToday();

	function defaultEntry() {
		const subjects = {}; SUBJECTS.forEach(s => subjects[s] = 0);
		return { subjects, done: false };
	}
	function defaultData() {
		return {
			names: { left: 'Betül', right: 'Enes' },
			targets: { left: 30, right: 30 },
			days: {}
		};
	}
	function loadData() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return defaultData();
			const parsed = JSON.parse(raw);
			const base = defaultData();
			const out = { ...base, ...parsed };
			out.targets = {
				left: Number((parsed.targets?.left) ?? base.targets.left),
				right: Number((parsed.targets?.right) ?? base.targets.right)
			};
			out.days = { ...(parsed.days || {}) };
			Object.keys(out.days).forEach(k=>{
				['left','right'].forEach(side=>{
					if (!out.days[k][side]) out.days[k][side] = defaultEntry();
					const subj = { ...defaultEntry().subjects, ...(out.days[k][side].subjects || {}) };
					out.days[k][side] = { subjects: subj, done: Boolean(out.days[k][side].done) };
				});
			});
			return out;
		} catch { return defaultData(); }
	}
	function saveData() {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
	}

	function initMonthYearSelectors() {
		els.monthSelect.innerHTML = '';
		for (let m = 0; m < 12; m++) {
			const opt = document.createElement('option');
			opt.value = String(m);
			opt.textContent = new Date(2000, m, 1).toLocaleString('tr-TR', { month: 'long' });
			els.monthSelect.appendChild(opt);
		}
		els.yearSelect.innerHTML = '';
		const yNow = new Date().getFullYear();
		for (let y = yNow; y <= yNow + 1; y++) {
			const opt = document.createElement('option');
			opt.value = String(y);
			opt.textContent = String(y);
			els.yearSelect.appendChild(opt);
		}
	}
	function wireTopbar() {
		els.monthSelect.addEventListener('change', () => {
			state.currentMonth = Number(els.monthSelect.value); render();
		});
		els.yearSelect.addEventListener('change', () => {
			state.currentYear = Number(els.yearSelect.value); render();
		});
		els.todayBtn.addEventListener('click', () => {
			const t = new Date();
			state.currentMonth = t.getMonth();
			state.currentYear = t.getFullYear();
			els.monthSelect.value = state.currentMonth;
			els.yearSelect.value = state.currentYear;
			render(); scrollToToday();
		});
		els.exportBtn.addEventListener('click', () => {
			const blob = new Blob([JSON.stringify(state.data, null, 2)], { type:'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url; a.download = `takip-${new Date().toISOString().slice(0,10)}.json`;
			document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
		});
		els.importInput.addEventListener('change', async (e) => {
			const file = e.target.files?.[0]; if (!file) return;
			try{
				const json = JSON.parse(await file.text());
				if (!json || typeof json !== 'object') throw new Error();
				state.data = json;
				// normalize minimal
				if (!state.data.targets) state.data.targets = { left:30, right:30 };
				saveData();
				els.leftTarget.value = String(state.data.targets.left);
				els.rightTarget.value = String(state.data.targets.right);
				updateLegends();
				render(); alert('İçe aktarıldı.');
			} catch{ alert('Dosya geçersiz.'); }
			e.target.value = '';
		});
		els.resetBtn.addEventListener('click', () => {
			if (!confirm('Tüm verileri sıfırlamak istiyor musunuz?')) return;
			localStorage.removeItem(STORAGE_KEY);
			state.data = defaultData();
			els.leftTarget.value = String(state.data.targets.left);
			els.rightTarget.value = String(state.data.targets.right);
			updateLegends();
			render();
		});
		els.leftTarget.addEventListener('input', () => {
			const v = Math.max(1, Number(els.leftTarget.value) || 1);
			state.data.targets.left = v; saveData(); updateLegends(); render();
		});
		els.rightTarget.addEventListener('input', () => {
			const v = Math.max(1, Number(els.rightTarget.value) || 1);
			state.data.targets.right = v; saveData(); updateLegends(); render();
		});
	}
	function updateLegends() {
		els.leftLegend.textContent = `${state.data.targets.left}+ Paragraf = otomatik ✓`;
		els.rightLegend.textContent = `${state.data.targets.right}+ Paragraf = otomatik ✓`;
	}

	function formatDateKey(d) {
		const y = d.getFullYear();
		const m = String(d.getMonth()+1).padStart(2,'0');
		const day = String(d.getDate()).padStart(2,'0');
		return `${y}-${m}-${day}`;
	}
	function isToday(d) {
		const t = new Date();
		return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
	}

	function render() {
		els.leftBody.innerHTML = '';
		els.rightBody.innerHTML = '';

		const last = new Date(state.currentYear, state.currentMonth + 1, 0);
		for (let day = 1; day <= last.getDate(); day++) {
			const d = new Date(state.currentYear, state.currentMonth, day);
			const key = formatDateKey(d);
			const leftRow = buildRow(d, key, 'left');
			const rightRow = buildRow(d, key, 'right');
			if (isToday(d)) { leftRow.classList.add('today'); rightRow.classList.add('today'); }
			els.leftBody.appendChild(leftRow);
			els.rightBody.appendChild(rightRow);
		}
		updateStats();
	}

	function buildRow(dateObj, key, side) {
		const tr = document.createElement('tr');

		const tdDay = document.createElement('td');
		tdDay.className = 'day';
		tdDay.textContent = `${String(dateObj.getDate()).padStart(2,'0')} ${dateObj.toLocaleString('tr-TR',{weekday:'short'})}`;
		tr.appendChild(tdDay);

		const entry = ensureEntry(key, side);
		SUBJECTS.forEach(subj => {
			const td = document.createElement('td');
			const input = document.createElement('input');
			input.type = 'number'; input.min = '0'; input.step = '1';
			input.placeholder = SUBJECT_LABEL[subj];
			input.className = 'num';
			input.value = entry.subjects[subj] ? String(entry.subjects[subj]) : '';
			input.addEventListener('input', () => {
				entry.subjects[subj] = Math.max(0, Number(input.value) || 0);
				entry.done = isDoneByTarget(entry, side);
				setEntry(key, side, entry);
				updateRowDoneState(tr, entry, side);
				updateStatsThrottled();
			});
			td.appendChild(input);
			tr.appendChild(td);
		});

		const tdCheck = document.createElement('td');
		tdCheck.className = 'checkCell';
		const chk = document.createElement('input');
		chk.type = 'checkbox'; chk.className = 'check'; chk.disabled = true;
		const badge = document.createElement('span');
		badge.className = 'badge'; badge.textContent = 'Hedef ✓';
		tdCheck.appendChild(chk); tdCheck.appendChild(badge);
		tr.appendChild(tdCheck);

		updateRowDoneState(tr, entry, side);
		return tr;
	}

	function isDoneByTarget(entry, side) {
		const target = side === 'left' ? state.data.targets.left : state.data.targets.right;
		return (entry.subjects.paragraf || 0) >= target;
	}
	function updateRowDoneState(tr, entry, side) {
		const chk = tr.querySelector('.check');
		const badge = tr.querySelector('.badge');
		const ok = isDoneByTarget(entry, side);
		chk.checked = ok;
		badge.classList.toggle('show', ok);
	}

	function ensureEntry(key, side) {
		if (!state.data.days[key]) state.data.days[key] = {};
		if (!state.data.days[key][side]) state.data.days[key][side] = defaultEntry();
		SUBJECTS.forEach(s => {
			if (typeof state.data.days[key][side].subjects[s] !== 'number')
				state.data.days[key][side].subjects[s] = 0;
		});
		return state.data.days[key][side];
	}
	function setEntry(key, side, entry) {
		state.data.days[key][side] = entry; saveData();
	}

	function monthKeys(year, month) {
		const out = [];
		const last = new Date(year, month + 1, 0);
		for (let d = 1; d <= last.getDate(); d++) out.push(formatDateKey(new Date(year, month, d)));
		return out;
	}

	function aggregate(keys, side) {
		const totals = { paragraf:0, matematik:0, 'tarih':0, 'vatandaşlık':0, 'coğrafya':0 };
		let daysTargetOk = 0, daysAny = 0;
		const target = side === 'left' ? state.data.targets.left : state.data.targets.right;
		keys.forEach(k=>{
			const e = state.data.days[k]?.[side];
			if (!e) return;
			let any = false;
			SUBJECTS.forEach(s=>{
				const v = Number(e.subjects?.[s]||0);
				totals[s]+=v; if (v>0) any = true;
			});
			if ((e.subjects?.paragraf||0) >= target) daysTargetOk++;
			if (any) daysAny++;
		});
		return { totals, daysTargetOk, daysAny, target };
	}

	function updateStats() {
		const keys = monthKeys(state.currentYear, state.currentMonth);
		const L = aggregate(keys, 'left');
		const R = aggregate(keys, 'right');
		els.leftStats.innerHTML = statHtml('Betül', L);
		els.rightStats.innerHTML = statHtml('Enes', R);
	}
	let tmr=null;
	function updateStatsThrottled(){ clearTimeout(tmr); tmr=setTimeout(updateStats,180); }

	function statHtml(name, s) {
		return `
			<strong>${name}</strong>
			<div>Paragraf toplam: <strong>${s.totals.paragraf}</strong> (Hedef: <strong>${s.target}</strong>)</div>
			<div>Matematik toplam: <strong>${s.totals.matematik}</strong></div>
			<div>Tarih toplam: <strong>${s.totals.tarih}</strong></div>
			<div>Vatandaşlık toplam: <strong>${s.totals['vatandaşlık']}</strong></div>
			<div>Coğrafya toplam: <strong>${s.totals.coğrafya}</strong></div>
			<hr style="border:none;border-top:1px solid #1e2b44;margin:8px 0;">
			<div>Hedefi karşılanan gün: <strong>${s.daysTargetOk}</strong></div>
			<div>Çalışılan gün sayısı: <strong>${s.daysAny}</strong></div>
		`;
	}

	function scrollToToday() {
		const idx = new Date().getDate()-1;
		const row = els.leftBody.querySelectorAll('tr')[idx];
		if (row) row.scrollIntoView({behavior:'smooth', block:'center'});
	}
})();