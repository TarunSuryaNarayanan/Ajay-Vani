const API_BASE = '/api';

// State
let currentFontScale = 1.0;
let currentLang = 'en';
let auditLogsCache = [];
let heatmapsCache = [
  {
    districtName: 'Varanasi',
    state: 'Uttar Pradesh',
    odopProduct: 'Banarasi Silk & Handloom Crafts',
    odopSector: 'Apparel & Textile',
    activeMsmeUnits: 1420,
    monthlyVacancies: 380,
    topSkillsNeeded: ['Sewing Machine Operator', 'Handloom Weaving', 'Solar Assembly'],
    giaBudgetSanctionedInLakhs: 120,
    skillingBudgetInLakhs: 18,
    demandIntensity: '🔥 Critical Gap'
  },
  {
    districtName: 'Moradabad',
    state: 'Uttar Pradesh',
    odopProduct: 'Brassware & Metal Craft',
    odopSector: 'Handicrafts & Metallurgy',
    activeMsmeUnits: 2150,
    monthlyVacancies: 520,
    topSkillsNeeded: ['Metal Polishing', 'Electrical Appliances Technician', 'Solar PV'],
    giaBudgetSanctionedInLakhs: 150,
    skillingBudgetInLakhs: 22,
    demandIntensity: '🔥 Critical Gap'
  },
  {
    districtName: 'Jhansi',
    state: 'Uttar Pradesh (Bundelkhand)',
    odopProduct: 'Solar Power Equipment & Agro-Processing',
    odopSector: 'Renewable Energy & Farming',
    activeMsmeUnits: 890,
    monthlyVacancies: 310,
    topSkillsNeeded: ['Solar Pump Technician', 'Goat & Dairy Farmer', 'Rural Mason'],
    giaBudgetSanctionedInLakhs: 95,
    skillingBudgetInLakhs: 15,
    demandIntensity: '⚡ High Demand'
  },
  {
    districtName: 'Coimbatore',
    state: 'Tamil Nadu',
    odopProduct: 'Textile Machinery & Pumpsets',
    odopSector: 'Engineering & Textiles',
    activeMsmeUnits: 3400,
    monthlyVacancies: 840,
    topSkillsNeeded: ['Domestic Appliances Technician', 'Handset Repair', 'Industrial Electrician'],
    giaBudgetSanctionedInLakhs: 200,
    skillingBudgetInLakhs: 30,
    demandIntensity: '🔥 Critical Gap'
  },
  {
    districtName: 'Gorakhpur',
    state: 'Uttar Pradesh',
    odopProduct: 'Terracotta & Readymade Garments',
    odopSector: 'Handicrafts & Apparel',
    activeMsmeUnits: 1120,
    monthlyVacancies: 290,
    topSkillsNeeded: ['Sewing Machine Operator', 'Pottery & Craft', 'Mobile Repair'],
    giaBudgetSanctionedInLakhs: 110,
    skillingBudgetInLakhs: 16,
    demandIntensity: '🟢 Moderate Gap'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initAccessibility();
  initTabs();
  
  // Render Heatmap Table immediately on page load
  renderHeatmapSummary(heatmapsCache);
  renderHeatmapTable(heatmapsCache);
  
  loadPortalData();

  // Attach Event Listeners
  document.getElementById('districtSelect').addEventListener('change', filterHeatmapTable);
  document.getElementById('planDistrictSelect').addEventListener('change', loadPerspectivePlan);
  document.getElementById('btnGeneratePlan').addEventListener('click', downloadPerspectivePlanPDF);
  document.getElementById('btnRefreshLogs').addEventListener('click', loadAuditLogs);
});

// 1. ACCESSIBILITY CONTROLS (Font Scaling & Language)
function initAccessibility() {
  document.getElementById('fontInc').addEventListener('click', () => {
    if (currentFontScale < 1.3) {
      currentFontScale += 0.1;
      document.body.style.fontSize = `${15 * currentFontScale}px`;
    }
  });

  document.getElementById('fontDec').addEventListener('click', () => {
    if (currentFontScale > 0.8) {
      currentFontScale -= 0.1;
      document.body.style.fontSize = `${15 * currentFontScale}px`;
    }
  });

  document.getElementById('fontReset').addEventListener('click', () => {
    currentFontScale = 1.0;
    document.body.style.fontSize = '15px';
  });

  document.getElementById('langToggle').addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'hi' : 'en';
    document.getElementById('langText').innerText = currentLang === 'en' ? 'English / हिंदी' : 'हिंदी / English';
  });
}

// 2. TAB NAVIGATION LOGIC
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');

      if (targetId === 'tabAuditLogs') loadAuditLogs();
      if (targetId === 'tabPerspectivePlan') loadPerspectivePlan();
      if (targetId === 'tabPipeline') renderPipeline();
    });
  });
}

// 3. LOAD PORTAL DATA FROM BACKEND APIs
async function loadPortalData() {
  try {
    // Fetch KPIs
    const kpiRes = await fetch(`${API_BASE}/admin/kpis`);
    const kpiData = await kpiRes.json();
    if (kpiData.success) {
      document.getElementById('kpiSurveyed').innerText = kpiData.kpis.totalBeneficiariesSurveyed.toLocaleString();
      document.getElementById('kpiSanctioned').innerText = `₹${kpiData.kpis.totalGiaBudgetSanctionedInLakhs}.00 Lakhs`;
      document.getElementById('kpiPlacement').innerText = `${kpiData.kpis.verifiedPlacementRate}%`;
      document.getElementById('kpiPlans').innerText = `${kpiData.kpis.districtPerspectivePlansCount} Zilas`;
    }

    // Fetch Heatmaps
    const mapRes = await fetch(`${API_BASE}/admin/heatmaps`);
    const mapData = await mapRes.json();
    if (mapData.success && mapData.districts && mapData.districts.length > 0) {
      heatmapsCache = mapData.districts;
      renderHeatmapSummary(heatmapsCache);
      renderHeatmapTable(heatmapsCache);
    }

    // Fetch Initial Logs
    loadAuditLogs();

  } catch (err) {
    console.warn('API Notice (Operating with In-Memory Portal Fallback):', err.message);
  }
}

// 4. RENDER DISTRICT HEATMAP SUMMARY BAR & TABLE
function renderHeatmapSummary(districts) {
  const summaryBox = document.getElementById('heatmapSummaryRow');
  if (!summaryBox) return;

  const totalMSME = districts.reduce((sum, d) => sum + (d.activeMsmeUnits || 0), 0);
  const totalVacancies = districts.reduce((sum, d) => sum + (d.monthlyVacancies || 0), 0);
  const totalSkillingBudget = districts.reduce((sum, d) => sum + (d.skillingBudgetInLakhs || 0), 0);

  summaryBox.innerHTML = `
    <div class="heatmap-stat-box">
      <div class="heatmap-stat-val">${districts.length} Districts</div>
      <div class="heatmap-stat-lbl">Mapped in Heatmap</div>
    </div>
    <div class="heatmap-stat-box">
      <div class="heatmap-stat-val">${totalMSME.toLocaleString()} Units</div>
      <div class="heatmap-stat-lbl">Registered MSMEs</div>
    </div>
    <div class="heatmap-stat-box">
      <div class="heatmap-stat-val" style="color:#059669">${totalVacancies.toLocaleString()} Openings/Mo</div>
      <div class="heatmap-stat-lbl">Monthly Job Demand</div>
    </div>
    <div class="heatmap-stat-box">
      <div class="heatmap-stat-val" style="color:#2563EB">₹${totalSkillingBudget}.00 Lakhs</div>
      <div class="heatmap-stat-lbl">GIA Skilling Budget (15%)</div>
    </div>
  `;
}

function renderHeatmapTable(districts) {
  const tbody = document.getElementById('heatmapTableBody');
  if (!tbody) return;

  if (!districts || districts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No district heatmap data found.</td></tr>`;
    return;
  }

  tbody.innerHTML = districts.map(d => {
    const intensityBadge = (d.monthlyVacancies > 400) 
      ? '<span class="badge badge-red"><i class="fa-solid fa-fire"></i> Critical Gap</span>' 
      : (d.monthlyVacancies > 300) 
        ? '<span class="badge badge-gold"><i class="fa-solid fa-bolt"></i> High Demand</span>' 
        : '<span class="badge badge-green"><i class="fa-solid fa-check"></i> Moderate Gap</span>';

    const meterFillClass = (d.monthlyVacancies > 400) ? 'fill-high' : (d.monthlyVacancies > 300) ? 'fill-med' : 'fill-opt';

    return `
      <tr>
        <td><strong>${d.districtName}</strong><br><small style="color:#64748B">${d.state}</small></td>
        <td><span class="badge badge-blue">${d.odopSector}</span><br><strong>${d.odopProduct}</strong></td>
        <td>
          ${intensityBadge}
          <div class="demand-meter"><div class="demand-fill ${meterFillClass}"></div></div>
        </td>
        <td>
          <strong>${d.activeMsmeUnits.toLocaleString()} Units</strong><br>
          <span style="color:#059669; font-size:12px; font-weight:700;"><i class="fa-solid fa-briefcase"></i> ${d.monthlyVacancies} Openings/Mo</span>
        </td>
        <td>
          ${(d.topSkillsNeeded || []).map(s => `<span class="badge badge-gold" style="margin:2px">${s}</span>`).join('')}
        </td>
        <td>₹${d.skillingBudgetInLakhs}.00 L <br><small style="color:#64748B">(GIA 15% Rule)</small></td>
        <td>
          <button class="btn btn-secondary" onclick="viewDistrictPlan('${d.districtName}')">
            <i class="fa-solid fa-eye"></i> View Plan
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterHeatmapTable() {
  const selected = document.getElementById('districtSelect').value;
  if (selected === 'all') {
    renderHeatmapSummary(heatmapsCache);
    renderHeatmapTable(heatmapsCache);
  } else {
    const filtered = heatmapsCache.filter(d => d.districtName.toLowerCase().includes(selected.toLowerCase()));
    renderHeatmapSummary(filtered);
    renderHeatmapTable(filtered);
  }
}

// 5. LOAD & RENDER LIVE VOICE AUDIT LOGS
async function loadAuditLogs() {
  try {
    const res = await fetch(`${API_BASE}/admin/audit-logs`);
    const data = await res.json();
    if (data.success) {
      auditLogsCache = data.auditLogs;
      renderAuditLogs(auditLogsCache);
      renderPipeline();
    }
  } catch (err) {
    console.warn('Failed to load audit logs:', err.message);
  }
}

function renderAuditLogs(logs) {
  const container = document.getElementById('auditFeedContainer');
  if (!logs || logs.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:20px;">No voice profiles recorded yet.</p>';
    return;
  }

  container.innerHTML = logs.map(l => `
    <div class="audit-card">
      <div class="audit-card-header">
        <div class="beneficiary-name"><i class="fa-solid fa-user"></i> ${l.name} (${l.district}, ${l.state})</div>
        <span class="badge badge-purple"><i class="fa-solid fa-language"></i> ${l.dialect || 'Regional Dialect'}</span>
      </div>
      <div class="transcript-quote">
        "${l.transcript}"
      </div>
      <div class="audit-details-grid">
        <div><strong>Extracted Skill:</strong> ${l.extractedProfile?.traditionalOccupation || 'General Skilled Work'}</div>
        <div><strong>NSQF Code:</strong> <span class="badge badge-blue">${l.recommendedNSQF?.qpCode}</span> - ${l.recommendedNSQF?.roleName}</div>
        <div><strong>ODOP Demand Alignment:</strong> <span class="badge badge-green">${l.localMarketDemand?.odopSector} (${l.localMarketDemand?.feasibilityScore}% Match)</span></div>
        <div><strong>Placement Status:</strong> <span class="badge badge-gold">${l.placementStatus}</span></div>
      </div>
      <div style="margin-top: 10px; display:flex; justify-content:space-between; align-items:center;">
        <button class="audio-play-btn" onclick="playAudioResponse('${l.extractedProfile?.friendlyAudioResponse || l.transcript}')">
          <i class="fa-solid fa-play"></i> Replay AI Response
        </button>
        <small style="color:#94A3B8">${new Date(l.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
      </div>
    </div>
  `).join('');
}

// 6. PERSPECTIVE PLAN GENERATOR & PDF VIEW
async function loadPerspectivePlan() {
  const dist = document.getElementById('planDistrictSelect').value;
  try {
    const res = await fetch(`${API_BASE}/admin/perspective-plan?district=${dist}`);
    const data = await res.json();
    if (data.success) {
      renderPerspectivePlanPreview(data.perspectivePlan);
    }
  } catch (err) {
    console.warn('Failed to load perspective plan preview:', err.message);
  }
}

function viewDistrictPlan(districtName) {
  document.querySelector('.tab-btn[data-tab="tabPerspectivePlan"]').click();
  document.getElementById('planDistrictSelect').value = districtName;
  loadPerspectivePlan();
}

function renderPerspectivePlanPreview(plan) {
  const container = document.getElementById('planPreviewContainer');
  container.innerHTML = `
    <div class="plan-header-box">
      <h2>${plan.schemeName}</h2>
      <h3>${plan.component}</h3>
      <p style="font-size:12px; color:#64748B">${plan.ministry}</p>
      <h4>OFFICIAL DISTRICT GIA PERSPECTIVE PLAN — ${plan.districtName.toUpperCase()} (${plan.state})</h4>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:20px; font-size:13px;">
      <div style="background:#F8FAFC; padding:12px; border-radius:6px; border:1px solid #E2E8F0;">
        <strong>Sanctioned GIA Budget:</strong><br><span style="font-size:18px; font-weight:700; color:#0B2545;">₹${plan.sanctionedGiaBudgetLakhs}.00 Lakhs</span>
      </div>
      <div style="background:#F0FDF4; padding:12px; border-radius:6px; border:1px solid #BBF7D0;">
        <strong>Skilling Budget Allocation (Min 10%):</strong><br><span style="font-size:18px; font-weight:700; color:#059669;">₹${plan.skillingBudgetAllocationLakhs}.00 Lakhs</span>
      </div>
      <div style="background:#FEF3C7; padding:12px; border-radius:6px; border:1px solid #FDE68A;">
        <strong>Mandatory Placement Target:</strong><br><span style="font-size:18px; font-weight:700; color:#D97706;">≥${plan.mandatoryPlacementTargetPercent}%</span>
      </div>
      <div style="background:#EFF6FF; padding:12px; border-radius:6px; border:1px solid #BFDBFE;">
        <strong>ODOP Priority Sector:</strong><br><span style="font-size:14px; font-weight:700; color:#1E40AF;">${plan.odopSector}</span>
      </div>
    </div>

    <h4 style="color:#0B2545; margin-bottom:8px;">Top Demanded NSQF Qualification Packs for Skilling:</h4>
    <ul style="margin-left:20px; font-size:13px; margin-bottom:20px;">
      ${plan.topRecommendedNSQFRoles.map(r => `<li><strong>${r.role}</strong> (QP Code: <code>${r.qpCode}</code>) — Estimated Annual Demand: ${r.demandCount} candidates</li>`).join('')}
    </ul>

    <h4 style="color:#0B2545; margin-bottom:8px;">Beneficiary Profiles Surveyed via Voice AI (${plan.beneficiaryList.length} Sample Profiles):</h4>
    <div class="table-responsive">
      <table class="govt-table">
        <thead>
          <tr>
            <th>Profile ID</th>
            <th>Name & Dialect</th>
            <th>Aspirated Skill</th>
            <th>Matched NSQF Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${plan.beneficiaryList.map(b => `
            <tr>
              <td><code>${(b._id || '').substring(0, 8)}</code></td>
              <td>${b.name}<br><small style="color:#64748B">${b.dialect}</small></td>
              <td>${b.extractedProfile?.traditionalOccupation || 'General Work'}</td>
              <td><span class="badge badge-blue">${b.recommendedNSQF?.qpCode}</span> ${b.recommendedNSQF?.roleName}</td>
              <td><span class="badge badge-green">${b.placementStatus}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function downloadPerspectivePlanPDF() {
  const dist = document.getElementById('planDistrictSelect').value;
  alert(`✅ Official GIA District Perspective Plan PDF for ${dist} District generated successfully! Triggering download...`);
  window.print();
}

// 7. PIPELINE KANBAN RENDERER
function renderPipeline() {
  const container = document.getElementById('pipelineContainer');
  const statuses = ['Voice Onboarded', 'NSQF Skilled', 'GIA Subsidy Disbursed', 'Verified Job Placed'];

  container.innerHTML = statuses.map(status => {
    const items = auditLogsCache.filter(b => b.placementStatus === status);
    return `
      <div class="pipeline-col">
        <div class="pipeline-col-header">
          <span>${status}</span>
          <span class="badge badge-blue">${items.length}</span>
        </div>
        ${items.map(item => `
          <div class="pipeline-card">
            <strong>${item.name}</strong> (${item.district})<br>
            <span style="color:#64748B">Skill: ${item.extractedProfile?.traditionalOccupation || 'General Skilled Work'}</span><br>
            <span class="badge badge-gold" style="margin-top:4px">${item.recommendedNSQF?.qpCode}</span>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
}

// PLAY AUDIO RESPONSE VIA NATIVE WEB SPEECH SYNTHESIS FOR AUDIT LOG REPLAY
function playAudioResponse(text) {
  if ('speechSynthesis' in window && text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.pitch = 1.0;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } else {
    alert(`AI Audio Speech Output: "${text}"`);
  }
}
