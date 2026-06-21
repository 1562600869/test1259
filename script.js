(function () {
  const INITIAL_ANGLE_DEG = 15;
  const TRAIL_DURATION_MS = 5000;
  const SCALE_PX_PER_M = 200;
  const BOB_RADIUS = 18;
  const PIVOT_Y_OFFSET = 45;

  const canvas = document.getElementById("pendulumCanvas");
  const ctx = canvas.getContext("2d");

  const lengthSlider = document.getElementById("lengthSlider");
  const gravitySlider = document.getElementById("gravitySlider");
  const lengthValue = document.getElementById("lengthValue");
  const gravityValue = document.getElementById("gravityValue");
  const angleValueEl = document.getElementById("angleValue");
  const angVelValueEl = document.getElementById("angVelValue");
  const periodValueEl = document.getElementById("periodValue");
  const elapsedValueEl = document.getElementById("elapsedValue");
  const presetButtons = document.querySelectorAll(".preset-btn");

  const state = {
    L: parseFloat(lengthSlider.value),
    g: parseFloat(gravitySlider.value),
    theta0: (INITIAL_ANGLE_DEG * Math.PI) / 180,
    startTime: performance.now(),
    trail: [],
  };

  function resetAnimation() {
    state.startTime = performance.now();
    state.trail = [];
  }

  function updateParameters() {
    state.L = parseFloat(lengthSlider.value);
    state.g = parseFloat(gravitySlider.value);
    lengthValue.textContent = state.L.toFixed(2);
    gravityValue.textContent = state.g.toFixed(2);
    resetAnimation();
  }

  lengthSlider.addEventListener("input", updateParameters);
  gravitySlider.addEventListener("input", updateParameters);

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const l = parseFloat(btn.dataset.l);
      const g = parseFloat(btn.dataset.g);
      const clampedL = Math.max(0.1, Math.min(2.0, l));
      const clampedG = Math.max(1, Math.min(20, g));
      lengthSlider.value = clampedL;
      gravitySlider.value = clampedG;
      updateParameters();
    });
  });

  function getPhysics(elapsedSec) {
    const omega = Math.sqrt(state.g / state.L);
    const theta = state.theta0 * Math.cos(omega * elapsedSec);
    const angVel = -state.theta0 * omega * Math.sin(omega * elapsedSec);
    const period = (2 * Math.PI) / omega;
    return { theta, angVel, period, omega };
  }

  function getPivot() {
    return { x: canvas.width / 2, y: PIVOT_Y_OFFSET };
  }

  function getBobPosition(theta) {
    const pivot = getPivot();
    const ropePx = state.L * SCALE_PX_PER_M;
    const x = pivot.x + ropePx * Math.sin(theta);
    const y = pivot.y + ropePx * Math.cos(theta);
    return { x, y };
  }

  function drawBackgroundGrid() {
    const pivot = getPivot();
    ctx.strokeStyle = "#eef2f5";
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#cbd5e1";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(pivot.x, canvas.height - 10);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawPivotMount() {
    const pivot = getPivot();
    const mountWidth = 120;
    const mountHeight = 10;

    ctx.fillStyle = "#475569";
    ctx.fillRect(
      pivot.x - mountWidth / 2,
      pivot.y - mountHeight - 6,
      mountWidth,
      mountHeight
    );
    ctx.fillStyle = "#64748b";
    for (let i = -4; i <= 4; i++) {
      const bx = pivot.x + i * 13;
      ctx.fillRect(bx - 3, pivot.y - mountHeight - 10, 6, 4);
    }

    ctx.beginPath();
    ctx.arc(pivot.x, pivot.y, 6, 0, Math.PI * 2);
    const pivotGrad = ctx.createRadialGradient(
      pivot.x - 2,
      pivot.y - 2,
      0,
      pivot.x,
      pivot.y,
      6
    );
    pivotGrad.addColorStop(0, "#94a3b8");
    pivotGrad.addColorStop(1, "#334155");
    ctx.fillStyle = pivotGrad;
    ctx.fill();
  }

  function drawRope(theta) {
    const pivot = getPivot();
    const bob = getBobPosition(theta);

    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(bob.x, bob.y);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function drawBob(theta) {
    const bob = getBobPosition(theta);
    const r = BOB_RADIUS;

    ctx.beginPath();
    ctx.ellipse(bob.x + 3, bob.y + 5, r, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fill();

    const grad = ctx.createRadialGradient(
      bob.x - r * 0.4,
      bob.y - r * 0.4,
      0,
      bob.x,
      bob.y,
      r
    );
    grad.addColorStop(0, "#fca5a5");
    grad.addColorStop(0.5, "#ef4444");
    grad.addColorStop(1, "#991b1b");

    ctx.beginPath();
    ctx.arc(bob.x, bob.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(bob.x - r * 0.35, bob.y - r * 0.35, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fill();
  }

  function drawAngleArc(theta) {
    const pivot = getPivot();
    const arcR = 50;
    const startAngle = Math.PI / 2;
    const endAngle = Math.PI / 2 - theta;

    ctx.beginPath();
    if (theta >= 0) {
      ctx.arc(pivot.x, pivot.y, arcR, endAngle, startAngle, true);
    } else {
      ctx.arc(pivot.x, pivot.y, arcR, startAngle, endAngle, false);
    }
    ctx.strokeStyle = "rgba(42,82,152,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const labelAngle = (startAngle + endAngle) / 2;
    const labelR = arcR + 18;
    const lx = pivot.x + labelR * Math.cos(labelAngle);
    const ly = pivot.y + labelR * Math.sin(labelAngle);
    ctx.fillStyle = "#2a5298";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const deg = (theta * 180) / Math.PI;
    ctx.fillText(deg.toFixed(1) + "°", lx, ly);
  }

  function updateTrail(now, bobPos) {
    state.trail.push({ t: now, x: bobPos.x, y: bobPos.y });
    const cutoff = now - TRAIL_DURATION_MS;
    while (state.trail.length > 0 && state.trail[0].t < cutoff) {
      state.trail.shift();
    }
  }

  function drawTrail() {
    if (state.trail.length < 2) return;
    const now = performance.now();
    const pivot = getPivot();
    const centerY = canvas.height - 60;
    const centerX = pivot.x;
    const scaleY = 0.28;

    ctx.save();
    ctx.beginPath();
    ctx.rect(10, centerY - 55, canvas.width - 20, 80);
    ctx.clip();

    ctx.strokeStyle = "rgba(100,116,139,0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(10, centerY);
    ctx.lineTo(canvas.width - 10, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    const earliest = state.trail[0].t;
    const oldestValid = now - TRAIL_DURATION_MS;
    for (let i = 0; i < state.trail.length; i++) {
      const pt = state.trail[i];
      if (pt.t < oldestValid) continue;
      const xNorm = centerX + (pt.x - centerX);
      const y = centerY - (pt.y - pivot.y) * scaleY;
      if (i === 0 || pt.t === earliest) {
        ctx.moveTo(xNorm, y);
      } else {
        ctx.lineTo(xNorm, y);
      }
    }

    const grad = ctx.createLinearGradient(10, 0, canvas.width - 10, 0);
    grad.addColorStop(0, "rgba(239,68,68,0)");
    grad.addColorStop(0.3, "rgba(239,68,68,0.35)");
    grad.addColorStop(1, "rgba(239,68,68,0.95)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#475569";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("⬇ 摆球轨迹（最近 5 秒）", 14, centerY - 52);
  }

  function drawTrailLabel() {
    // placeholder
  }

  function updateDataDisplay(theta, angVel, period, elapsedSec) {
    const deg = (theta * 180) / Math.PI;
    angleValueEl.textContent = deg.toFixed(2) + "°";
    angVelValueEl.textContent = angVel.toFixed(3) + " rad/s";
    periodValueEl.textContent = period.toFixed(3) + " s";
    elapsedValueEl.textContent = elapsedSec.toFixed(2) + " s";
  }

  function render() {
    const now = performance.now();
    const elapsedSec = (now - state.startTime) / 1000;

    const { theta, angVel, period } = getPhysics(elapsedSec);
    const bobPos = getBobPosition(theta);

    updateTrail(now, bobPos);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundGrid();
    drawTrail();
    drawAngleArc(theta);
    drawRope(theta);
    drawPivotMount();
    drawBob(theta);

    updateDataDisplay(theta, angVel, period, elapsedSec);

    requestAnimationFrame(render);
  }

  updateParameters();
  requestAnimationFrame(render);
})();
